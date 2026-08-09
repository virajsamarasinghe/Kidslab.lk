import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Payment from "@/models/Payment";
import { fulfilPayment } from "@/lib/payment-fulfilment";
import {
  PAYHERE_STATUS,
  canTransition,
  formatAmount,
  verifyNotification,
  type PayHereNotification,
  type PaymentStatus,
} from "@/lib/payhere";

/**
 * PayHere's server-to-server payment notification (`notify_url`).
 *
 * This is the primary source of payment status; the reconciliation sweep in
 * `/api/payments/reconcile` is the backstop for when it never arrives. The
 * browser's `return_url` trip proves nothing — anyone can open the success
 * page — so nothing is ever marked paid from there.
 *
 * The endpoint is public and unauthenticated by necessity (PayHere's servers
 * call it, carrying no session), so the `md5sig` check is the whole of its
 * security, backed by the replay guard in `canTransition`.
 */
export async function POST(req: NextRequest) {
  let notification: PayHereNotification;
  let raw: Record<string, string>;

  try {
    // PayHere posts `application/x-www-form-urlencoded`, not JSON.
    const form = await req.formData();
    raw = Object.fromEntries(
      Array.from(form.entries()).map(([k, v]) => [k, String(v)])
    );
    notification = raw as unknown as PayHereNotification;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { order_id: orderId, status_code: statusCode } = notification;
  if (!orderId || !statusCode) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (notification.merchant_id !== process.env.PAYHERE_MERCHANT_ID) {
    console.warn("[payhere] notification for a different merchant", orderId);
    return NextResponse.json({ error: "Unknown merchant" }, { status: 403 });
  }

  if (!verifyNotification(notification)) {
    console.warn("[payhere] signature verification failed", orderId);
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  await connectDB();

  const payment = await Payment.findOne({ orderId });
  if (!payment) {
    console.warn("[payhere] notification for unknown order", orderId);
    return NextResponse.json({ error: "Unknown order" }, { status: 404 });
  }

  // The signature proves PayHere sent this, not that it matches what we asked
  // for. Comparing against our own stored figures catches an order somehow
  // paid for an amount other than the course price.
  const amountMatches =
    notification.payhere_amount === formatAmount(payment.amount) &&
    notification.payhere_currency === payment.currency;

  const reported: PaymentStatus = amountMatches
    ? (PAYHERE_STATUS[statusCode] ?? "failed")
    : "failed";

  if (!amountMatches) {
    console.error(
      "[payhere] amount/currency mismatch",
      orderId,
      `expected ${payment.currency} ${formatAmount(payment.amount)}`,
      `got ${notification.payhere_currency} ${notification.payhere_amount}`
    );
  }

  const current = payment.status as PaymentStatus;

  if (!canTransition(current, reported)) {
    // A validly signed but superseded notification — almost certainly a replay
    // of an earlier state. Answer 200 so PayHere stops retrying it.
    console.warn(
      `[payhere] ignoring ${reported} notification for ${orderId}: already ${current}`
    );
    return NextResponse.json({ received: true, ignored: true });
  }

  payment.status = reported;
  payment.paymentId = notification.payment_id ?? "";
  payment.statusCode = statusCode;
  payment.statusMessage = notification.status_message ?? "";
  payment.method = notification.method ?? "";
  payment.rawNotification = raw;
  await payment.save();

  if (reported === "success") {
    try {
      // Idempotent and safely retryable — see `fulfilPayment`. PayHere retries
      // notifications, and the reconciliation sweep may race this.
      await fulfilPayment(orderId);
    } catch (err) {
      // Don't fail the webhook. The money is taken and the payment record is
      // correct; the sweep retries fulfilment once the lease lapses.
      console.error("[payhere] fulfilment failed for", orderId, err);
    }
  }

  // PayHere only needs a 200; a non-2xx just earns a retry.
  return NextResponse.json({ received: true });
}
