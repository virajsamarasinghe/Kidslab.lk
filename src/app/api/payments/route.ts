import { NextRequest, NextResponse } from "next/server";
import type { QueryFilter } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireCapability } from "@/lib/auth";
import Payment, { type IPayment } from "@/models/Payment";
import type { PaymentStatus } from "@/lib/payhere";
import { escapeRegex } from "@/lib/utils";

const STATUSES: PaymentStatus[] = ["pending", "success", "failed", "canceled", "chargedback"];

/** Narrows an arbitrary query-string value to a real status, or nothing. */
function parseStatus(value: string): PaymentStatus | null {
  return (STATUSES as string[]).includes(value) ? (value as PaymentStatus) : null;
}

/**
 * Payment list for the admin dashboard.
 *
 * Without this, nobody at the academy can answer "did this parent actually
 * pay?" without a Mongo shell — and the failure cases that matter most
 * (payments whose fulfilment errored) would be invisible entirely.
 */
export async function GET(req: NextRequest) {
  const session = await requireCapability("dashboard:read");
  if (session instanceof NextResponse) return session;

  await connectDB();

  const search = req.nextUrl.searchParams.get("search") ?? "";
  // Validated against the known set rather than passed through — an unchecked
  // value here goes straight into a Mongo query.
  const status = parseStatus(req.nextUrl.searchParams.get("status") ?? "");
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "20")));

  const query: QueryFilter<IPayment> = {};
  if (status) query.status = status;
  if (search) {
    const re = { $regex: escapeRegex(search), $options: "i" };
    query.$or = [{ orderId: re }, { payerEmail: re }, { payerName: re }, { itemName: re }];
  }

  // `rawNotification` is excluded: it holds the card holder name and masked
  // card number PayHere echoes back, which a list view has no need for.
  const [payments, total, totals] = await Promise.all([
    Payment.find(query)
      .select("-rawNotification")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Payment.countDocuments(query),
    // Revenue counts only settled money, so a pending or failed attempt never
    // inflates the figure on the page.
    Payment.aggregate<{ _id: null; revenue: number; count: number }>([
      { $match: { status: "success" } },
      { $group: { _id: null, revenue: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
  ]);

  const needsAttention = await Payment.countDocuments({
    status: "success",
    fulfilledAt: { $exists: false },
  });

  return NextResponse.json({
    payments: payments.map((p) => ({
      ...p,
      _id: String(p._id),
      userId: p.userId ? String(p.userId) : null,
      courseId: p.courseId ? String(p.courseId) : null,
    })),
    total,
    revenue: totals[0]?.revenue ?? 0,
    successCount: totals[0]?.count ?? 0,
    /** Paid but not yet enrolled — the queue the reconciliation sweep retries. */
    needsAttention,
  });
}
