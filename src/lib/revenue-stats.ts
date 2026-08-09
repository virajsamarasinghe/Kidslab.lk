import { cache } from "react";
import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import Payment from "@/models/Payment";
import { ADMIN_STATS_TAG } from "@/lib/dashboard-stats";

/**
 * Income metrics for the admin dashboard.
 *
 * Two deliberate rules run through all of it:
 *
 * - **Only settled money counts.** Every figure filters on `status: "success"`,
 *   so a pending or failed attempt never inflates revenue. A dashboard that
 *   counts attempts as income is worse than no dashboard.
 * - **Gross and net are kept separate and never mixed.** `amount` is what the
 *   customer was charged; PayHere's fee comes back only from the Retrieval API,
 *   so net is known for a *subset* of payments. Averaging a partially-known net
 *   into a total would quietly understate income, so `netRevenue` is reported
 *   alongside the count it covers and the UI labels it as partial.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const TREND_DAYS = 30;

export interface RevenueStats {
  /** All-time settled revenue, before PayHere's fee. */
  grossRevenue: number;
  /** Net of PayHere's fee — only over payments whose settlement is known. */
  netRevenue: number;
  /** How many successful payments the net figure covers, of `successCount`. */
  netCoverage: number;
  /** Total PayHere fees over that same covered subset. */
  totalFees: number;

  currency: string;
  successCount: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  /** Percentage change month on month; 0 when there's no prior month to compare. */
  monthlyGrowth: number;
  averageOrderValue: number;

  /** Settled payments as a share of all completed attempts (excludes pending). */
  successRate: number;
  pendingCount: number;
  failedCount: number;
  chargedbackCount: number;
  /** Paid but not yet enrolled — the queue the reconciliation sweep retries. */
  unfulfilledCount: number;

  revenueTrend: Array<{ date: string; revenue: number }>;
  topCoursesByRevenue: Array<{ course: string; revenue: number; count: number }>;
}

function percentChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

async function computeRevenueStats(): Promise<RevenueStats> {
  await connectDB();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const trendStart = new Date(now.getTime() - (TREND_DAYS - 1) * DAY_MS);
  trendStart.setHours(0, 0, 0, 0);

  const [
    totals,
    settlement,
    byStatus,
    thisMonth,
    lastMonth,
    trendRaw,
    topCourses,
    unfulfilledCount,
    currencyRow,
  ] = await Promise.all([
    Payment.aggregate<{ revenue: number; count: number }>([
      { $match: { status: "success" } },
      { $group: { _id: null, revenue: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),

    // Restricted to records the sweep has actually filled in, so an unsynced
    // payment doesn't read as "net equals zero".
    Payment.aggregate<{ net: number; fee: number; count: number }>([
      { $match: { status: "success", netAmount: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: null,
          net: { $sum: "$netAmount" },
          fee: { $sum: { $ifNull: ["$feeAmount", 0] } },
          count: { $sum: 1 },
        },
      },
    ]),

    Payment.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),

    Payment.aggregate<{ revenue: number }>([
      { $match: { status: "success", createdAt: { $gte: monthStart } } },
      { $group: { _id: null, revenue: { $sum: "$amount" } } },
    ]),

    Payment.aggregate<{ revenue: number }>([
      {
        $match: {
          status: "success",
          createdAt: { $gte: lastMonthStart, $lt: monthStart },
        },
      },
      { $group: { _id: null, revenue: { $sum: "$amount" } } },
    ]),

    Payment.aggregate<{ _id: string; revenue: number }>([
      { $match: { status: "success", createdAt: { $gte: trendStart } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$amount" },
        },
      },
    ]),

    Payment.aggregate<{ _id: string; revenue: number; count: number }>([
      { $match: { status: "success" } },
      {
        $group: {
          _id: { $ifNull: ["$itemName", "Unknown"] },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),

    Payment.countDocuments({ status: "success", fulfilledAt: { $exists: false } }),

    Payment.findOne({ status: "success" }).select("currency").lean(),
  ]);

  const counts = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
  const successCount = totals[0]?.count ?? 0;
  const failedCount = (counts.failed ?? 0) + (counts.canceled ?? 0);
  const chargedbackCount = counts.chargedback ?? 0;

  // Pending attempts are excluded from the denominator: they haven't finished,
  // so counting them as failures would drag the rate down for no reason.
  const completedAttempts = successCount + failedCount + chargedbackCount;

  // Zero-fill the trend so a day with no sales plots as 0 rather than being
  // dropped, which would otherwise distort the line's shape.
  const byDate = new Map(trendRaw.map((d) => [d._id, d.revenue]));
  const revenueTrend = Array.from({ length: TREND_DAYS }, (_, i) => {
    const day = new Date(trendStart.getTime() + i * DAY_MS);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    return {
      date: day.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      revenue: byDate.get(key) ?? 0,
    };
  });

  const grossRevenue = totals[0]?.revenue ?? 0;
  const revenueThisMonth = thisMonth[0]?.revenue ?? 0;
  const revenueLastMonth = lastMonth[0]?.revenue ?? 0;

  return {
    grossRevenue,
    netRevenue: settlement[0]?.net ?? 0,
    netCoverage: settlement[0]?.count ?? 0,
    totalFees: settlement[0]?.fee ?? 0,
    currency: currencyRow?.currency ?? "LKR",
    successCount,
    revenueThisMonth,
    revenueLastMonth,
    monthlyGrowth: percentChange(revenueThisMonth, revenueLastMonth),
    averageOrderValue: successCount > 0 ? grossRevenue / successCount : 0,
    successRate:
      completedAttempts > 0 ? Math.round((successCount / completedAttempts) * 100) : 0,
    pendingCount: counts.pending ?? 0,
    failedCount,
    chargedbackCount,
    unfulfilledCount,
    revenueTrend,
    topCoursesByRevenue: topCourses.map((c) => ({
      course: c._id,
      revenue: c.revenue,
      count: c.count,
    })),
  };
}

/**
 * Cached on the same tag as the rest of the dashboard, so the Refresh button
 * clears revenue along with everything else. The `cache()` wrapper collapses
 * the several independently-streamed sections that need these figures into one
 * lookup per request.
 */
export const getRevenueStats = cache(
  unstable_cache(computeRevenueStats, ["admin-revenue-stats"], {
    revalidate: 60,
    tags: [ADMIN_STATS_TAG],
  })
);
