import bcrypt from "bcryptjs";
import { revalidateTag } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { ADMIN_STATS_TAG } from "@/lib/dashboard-stats";
import Payment, { type IPayment } from "@/models/Payment";
import Course from "@/models/Course";
import User from "@/models/User";
import { sendPaymentReceiptEmail } from "@/lib/brevo";

/**
 * Granting what a successful payment bought: an account, a seat on the course,
 * and a receipt.
 *
 * Shared by the PayHere webhook and the reconciliation sweep, so a payment
 * confirmed by either route is fulfilled identically.
 *
 * The design constraint is that money has already changed hands by the time
 * anything here runs. Failing halfway must therefore be *recoverable*, not
 * merely logged: every step is idempotent and the work stays claimable until
 * it genuinely completes.
 */

/**
 * How long one attempt may hold the work before another may retry it.
 *
 * Long enough that a slow SMTP handshake isn't treated as a death, short
 * enough that a crashed serverless invocation is retried on the next sweep.
 */
const LEASE_MS = 5 * 60 * 1000;

/** Reasons `fulfilPayment` did nothing, for the caller's logs. */
export type FulfilmentOutcome = "fulfilled" | "already-fulfilled" | "leased" | "not-payable";

/**
 * Fulfils a payment exactly once, retrying safely after a partial failure.
 *
 * The claim is a lease rather than a permanent flag. Marking the work done
 * *before* doing it — the obvious idempotency trick — means a crash between
 * the two leaves a charged customer with no enrolment and nothing to retry
 * from. Here `fulfilledAt` is written only after every step has succeeded, so
 * an interrupted attempt simply becomes claimable again once its lease
 * expires.
 */
export async function fulfilPayment(orderId: string): Promise<FulfilmentOutcome> {
  await connectDB();

  const now = new Date();
  const leaseExpiredBefore = new Date(now.getTime() - LEASE_MS);

  // One atomic claim decides the winner. Concurrent webhook retries and the
  // reconciliation sweep race here deliberately; only one gets the document.
  const claimed = await Payment.findOneAndUpdate(
    {
      orderId,
      status: "success",
      fulfilledAt: { $exists: false },
      $or: [
        { fulfilmentStartedAt: { $exists: false } },
        { fulfilmentStartedAt: { $lte: leaseExpiredBefore } },
      ],
    },
    { $set: { fulfilmentStartedAt: now }, $inc: { fulfilmentAttempts: 1 } },
    { new: true }
  );

  if (!claimed) {
    const existing = await Payment.findOne({ orderId }).select("status fulfilledAt").lean();
    if (!existing || existing.status !== "success") return "not-payable";
    return existing.fulfilledAt ? "already-fulfilled" : "leased";
  }

  try {
    await grantEnrolment(claimed);
    await sendReceiptOnce(claimed);

    await Payment.updateOne(
      { orderId },
      { $set: { fulfilledAt: new Date() }, $unset: { fulfilmentError: "" } }
    );

    // Revenue and enrolment counts on the dashboard are cached for a minute;
    // drop them now so a sale shows up immediately rather than on the next TTL.
    try {
      // `{ expire: 0 }` drops the entry rather than serving it stale while it
      // revalidates — matching the dashboard's Refresh button.
      revalidateTag(ADMIN_STATS_TAG, { expire: 0 });
    } catch {
      // Not always callable outside a request scope (e.g. the cron sweep).
      // Cache freshness is never worth failing a completed fulfilment over.
    }

    return "fulfilled";
  } catch (err) {
    // Record why, and leave `fulfilledAt` unset so the next sweep retries once
    // the lease lapses.
    await Payment.updateOne(
      { orderId },
      { $set: { fulfilmentError: err instanceof Error ? err.message : String(err) } }
    );
    throw err;
  }
}

/**
 * Attaches the payer to an account and the account to the course.
 *
 * Idempotent throughout: re-running after a partial failure must not create a
 * second user or inflate the seat count.
 */
async function grantEnrolment(payment: IPayment) {
  const course = payment.courseId ? await Course.findById(payment.courseId) : null;

  let userId = payment.userId;
  if (!userId && payment.payerEmail) {
    const existing = await User.findOne({ email: payment.payerEmail }).select("_id");
    if (existing) {
      userId = existing._id;
    } else {
      // Checkout requires sign-in, so this is a fallback for a payment whose
      // account was deleted mid-flight rather than the normal path.
      const autoPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-6).toUpperCase() +
        "!";
      const created = await User.create({
        name: payment.payerName || payment.payerEmail,
        email: payment.payerEmail,
        password: await bcrypt.hash(autoPassword, 10),
        phone: payment.payerPhone ?? "",
        interestedCourse: course?.title ?? payment.itemName,
      });
      userId = created._id;
    }
    await Payment.updateOne({ _id: payment._id }, { $set: { userId } });
  }

  if (userId && course) {
    // $addToSet makes the enrolment itself idempotent, and the seat count is
    // incremented only when the set actually changed — so a retry that finds
    // the course already added doesn't consume a second seat.
    const result = await User.updateOne(
      { _id: userId },
      { $addToSet: { enrolledCourses: course._id } }
    );
    if (result.modifiedCount > 0) {
      await Course.updateOne({ _id: course._id }, { $inc: { enrolledCount: 1 } });
    }
  }
}

/**
 * Sends the receipt at most once across every retry.
 *
 * Claimed by an atomic conditional update rather than a read-then-write, so
 * two concurrent attempts can't both decide the receipt is unsent. The marker
 * is set *before* sending: a duplicate receipt is a worse customer experience
 * than a missing one, and a genuinely failed send is visible in the logs and
 * recoverable by hand.
 */
async function sendReceiptOnce(payment: IPayment) {
  if (!payment.payerEmail) return;

  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, receiptSentAt: { $exists: false } },
    { $set: { receiptSentAt: new Date() } }
  );
  if (!claimed) return;

  const course = payment.courseId ? await Course.findById(payment.courseId).select("title") : null;

  await sendPaymentReceiptEmail({
    name: payment.payerName || "there",
    email: payment.payerEmail,
    orderId: payment.orderId,
    itemName: course?.title ?? payment.itemName,
    amount: payment.amount,
    currency: payment.currency,
    paymentId: payment.paymentId,
    method: payment.method,
  });
}
