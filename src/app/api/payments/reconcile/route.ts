import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { connectDB } from "@/lib/mongodb";
import Payment from "@/models/Payment";
import { canTransition, formatAmount, type PaymentStatus } from "@/lib/payhere";
import { isRetrievalConfigured, mapRetrievalStatus, retrievePayments } from "@/lib/payhere-api";
import { fulfilPayment } from "@/lib/payment-fulfilment";

/**
 * Reconciliation sweep — the backstop for a webhook that never arrived.
 *
 * Without this, a lost `notify_url` call is unrecoverable and invisible: the
 * customer is charged, the order sits `pending` forever, and nobody finds out
 * until they complain. Here we ask PayHere directly what happened to any order
 * that has been pending too long, and separately retry any payment that is
 * known-successful but whose fulfilment failed part-way.
 *
 * Meant to be run on a schedule (Vercel Cron or equivalent) and protected by a
 * shared secret, since it is otherwise an unauthenticated endpoint that talks
 * to PayHere and grants course access.
 */

/** Grace period before a pending order is considered stuck rather than in-flight. */
const STALE_AFTER_MS = 15 * 60 * 1000;
/** Stop chasing orders that were abandoned days ago. */
const GIVE_UP_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
/** Bounded so one run can't exceed the platform's function timeout. */
const MAX_PER_RUN = 25;

function isAuthorised(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  // Vercel Cron sends the secret as a bearer token; allow a plain header too
  // for manual runs and other schedulers.
  const provided =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    req.headers.get("x-cron-secret") ??
    "";

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const now = Date.now();
  const results = {
    checked: 0,
    updated: 0,
    refulfilled: 0,
    settlementsSynced: 0,
    errors: [] as string[],
  };

  // ── 1. Retry fulfilment for payments already known to have succeeded ──
  //
  // These need no PayHere call: the status is settled, only the enrolment or
  // receipt failed. Runs even when the Retrieval API isn't configured.
  const unfulfilled = await Payment.find({
    status: "success",
    fulfilledAt: { $exists: false },
  })
    .select("orderId")
    .limit(MAX_PER_RUN)
    .lean();

  for (const p of unfulfilled) {
    try {
      const outcome = await fulfilPayment(p.orderId);
      if (outcome === "fulfilled") results.refulfilled++;
    } catch (err) {
      results.errors.push(`${p.orderId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ── 2. Ask PayHere about orders stuck pending ──
  if (!isRetrievalConfigured()) {
    return NextResponse.json({
      ...results,
      note: "Retrieval API not configured — pending orders were not checked",
    });
  }

  const stale = await Payment.find({
    status: "pending",
    createdAt: {
      $lt: new Date(now - STALE_AFTER_MS),
      $gt: new Date(now - GIVE_UP_AFTER_MS),
    },
  })
    .limit(MAX_PER_RUN)
    .sort({ createdAt: 1 });

  for (const payment of stale) {
    results.checked++;
    try {
      const retrieved = await retrievePayments(payment.orderId);
      // No record at PayHere means the customer never got as far as paying.
      if (retrieved.length === 0) continue;

      const match = retrieved.find((r) => mapRetrievalStatus(r.status) !== null);
      if (!match) continue;

      const mapped = mapRetrievalStatus(match.status) as PaymentStatus;

      // The same amount check the webhook applies — a payment for the wrong
      // amount must not silently grant a course.
      if (
        formatAmount(match.amount) !== formatAmount(payment.amount) ||
        match.currency !== payment.currency
      ) {
        results.errors.push(
          `${payment.orderId}: amount mismatch (PayHere ${match.currency} ${match.amount})`
        );
        continue;
      }

      if (!canTransition(payment.status as PaymentStatus, mapped)) continue;

      payment.status = mapped;
      payment.paymentId = match.paymentId;
      payment.method = match.method;
      payment.statusMessage = `Reconciled from PayHere (${match.status})`;
      await payment.save();
      results.updated++;

      console.warn(
        `[payhere] reconciled ${payment.orderId} to ${mapped} — the webhook never arrived`
      );

      if (mapped === "success") {
        await fulfilPayment(payment.orderId);
        results.refulfilled++;
      }
    } catch (err) {
      results.errors.push(
        `${payment.orderId}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // ── 3. Backfill settlement figures for successful payments ──
  //
  // PayHere's webhook reports only the gross amount charged; its own fee, and
  // therefore what actually reaches the bank, is available solely from the
  // Retrieval API. Without this pass the dashboard could show revenue but not
  // income, which is the number that matters to the business.
  const needsSettlement = await Payment.find({
    status: "success",
    settlementSyncedAt: { $exists: false },
    // Fees are only final once PayHere has settled; asking too early just
    // returns nothing and burns an API call.
    createdAt: { $lt: new Date(now - STALE_AFTER_MS) },
  })
    .select("orderId")
    .sort({ createdAt: -1 })
    .limit(MAX_PER_RUN);

  for (const payment of needsSettlement) {
    try {
      const retrieved = await retrievePayments(payment.orderId);
      const match = retrieved.find((r) => r.net !== null || r.fee !== null);
      if (!match) continue;

      await Payment.updateOne(
        { _id: payment._id },
        {
          $set: {
            feeAmount: match.fee ?? undefined,
            netAmount: match.net ?? undefined,
            settlementSyncedAt: new Date(),
          },
        }
      );
      results.settlementsSynced++;
    } catch (err) {
      results.errors.push(
        `${payment.orderId} (settlement): ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return NextResponse.json(results);
}
