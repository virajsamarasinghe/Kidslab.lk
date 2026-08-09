import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { parseBody } from "@/lib/validate";
import { enforceRateLimit, clientIp } from "@/lib/rate-limit";
import { getAccountUser } from "@/lib/account";
import Course from "@/models/Course";
import Payment from "@/models/Payment";
import {
  appUrl,
  checkoutUrl,
  formatAmount,
  generateCheckoutHash,
  isPayHereConfigured,
  merchantId,
  newOrderId,
} from "@/lib/payhere";

const CURRENCY = "LKR";

// No `email` field by design — see the handler.
const InitiateSchema = z.object({
  courseId: z.string().min(1),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80).default(""),
  phone: z.string().trim().min(6).max(20),
  address: z.string().trim().max(200).default(""),
  city: z.string().trim().max(80).default(""),
});

/**
 * Signs a PayHere checkout for a course and records it as a pending payment.
 *
 * Two things are deliberately taken from the server rather than the request:
 *
 * - **The price**, from the Course document. It's part of the signed hash, so
 *   trusting a client-supplied number would let anyone set their own price.
 * - **The payer's email**, from the Clerk session. It's the key the webhook
 *   later uses to grant enrolment and send the receipt, so accepting it from
 *   the body would let anyone buy a course "as" somebody else — attaching the
 *   enrolment to a stranger's account.
 *
 * That second point is why sign-in is required here at all.
 */
export async function POST(req: NextRequest) {
  if (!isPayHereConfigured()) {
    return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
  }

  const limited = await enforceRateLimit("payment-initiate", clientIp(req), 20, 60 * 60);
  if (limited) return limited;

  const account = await getAccountUser();
  if (!account) {
    return NextResponse.json({ error: "Please sign in to continue" }, { status: 401 });
  }

  const parsed = await parseBody(req, InitiateSchema);
  if (parsed instanceof NextResponse) return parsed;

  await connectDB();

  const course = await Course.findById(parsed.courseId).lean();
  if (!course || !course.isActive) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  if (!course.price || course.price <= 0) {
    return NextResponse.json({ error: "This course has no price set" }, { status: 400 });
  }
  if (course.maxStudents > 0 && course.enrolledCount >= course.maxStudents) {
    return NextResponse.json({ error: "This course is full" }, { status: 409 });
  }

  const email = account.email;
  const orderId = newOrderId();
  const amount = course.price;

  await Payment.create({
    orderId,
    userId: account._id,
    courseId: course._id,
    itemName: course.title,
    amount,
    currency: CURRENCY,
    status: "pending",
    payerName: `${parsed.firstName} ${parsed.lastName}`.trim(),
    payerEmail: email,
    payerPhone: parsed.phone,
  });

  const base = appUrl();

  // Field names are PayHere's, posted verbatim by the client form. `hash`
  // covers merchant_id + order_id + amount + currency, so those four are the
  // ones a tampered form can't change.
  const fields: Record<string, string> = {
    merchant_id: merchantId(),
    return_url: `${base}/payment/success?order_id=${encodeURIComponent(orderId)}`,
    cancel_url: `${base}/payment/cancel?order_id=${encodeURIComponent(orderId)}`,
    notify_url: `${base}/api/payments/notify`,
    order_id: orderId,
    items: course.title,
    currency: CURRENCY,
    amount: formatAmount(amount),
    first_name: parsed.firstName,
    last_name: parsed.lastName,
    email,
    phone: parsed.phone,
    address: parsed.address,
    city: parsed.city,
    country: "Sri Lanka",
    hash: generateCheckoutHash({ orderId, amount, currency: CURRENCY }),
  };

  return NextResponse.json({ checkoutUrl: checkoutUrl(), orderId, fields }, { status: 201 });
}
