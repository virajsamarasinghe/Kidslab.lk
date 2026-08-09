import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRevenueStats } from "@/lib/revenue-stats";
import { LazyRevenueTrendChart } from "./charts/lazy";

function money(amount: number, currency: string) {
  return `${currency} ${Math.round(amount).toLocaleString("en-LK")}`;
}

export function RevenueSectionSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="pcb-card border-slate-100 shadow-sm overflow-hidden">
            <CardContent className="relative px-5 py-4">
              <span className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full bg-slate-100" />
              <div className="pl-3.5">
                <span className="block h-3 w-24 rounded bg-slate-100 animate-pulse" />
                <span className="block h-8 w-28 rounded-md bg-slate-100 animate-pulse mt-3" />
                <span className="block h-3 w-20 rounded bg-slate-100 animate-pulse mt-2.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <Card className="pcb-card border-slate-100 shadow-sm xl:col-span-2">
          <CardContent className="py-5">
            <div className="h-[220px] rounded-lg bg-slate-50 animate-pulse" />
          </CardContent>
        </Card>
        <Card className="pcb-card border-slate-100 shadow-sm">
          <CardContent className="py-5">
            <div className="h-[220px] rounded-lg bg-slate-50 animate-pulse" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

interface Tile {
  label: string;
  value: string;
  hint: string;
  accent: string;
  delta?: number;
}

/**
 * Income overview.
 *
 * Every figure here counts settled payments only — a pending or failed attempt
 * is never revenue. Where PayHere's fee is known the net is shown beside the
 * gross, explicitly labelled with how much of the total it covers, rather than
 * presenting a partially-synced net as if it were the whole picture.
 */
export default async function RevenueSection() {
  const stats = await getRevenueStats();
  const { currency } = stats;

  const netIsPartial = stats.netCoverage > 0 && stats.netCoverage < stats.successCount;
  const netKnown = stats.netCoverage > 0;

  const tiles: Tile[] = [
    {
      label: "Total Revenue",
      value: money(stats.grossRevenue, currency),
      hint: `${stats.successCount} settled payment${stats.successCount !== 1 ? "s" : ""}`,
      accent: "#16a34a",
    },
    {
      label: "This Month",
      value: money(stats.revenueThisMonth, currency),
      hint: `${money(stats.revenueLastMonth, currency)} last month`,
      accent: "var(--brand-navy)",
      delta: stats.monthlyGrowth,
    },
    {
      label: "Average Order",
      value: money(stats.averageOrderValue, currency),
      hint: "per successful payment",
      accent: "var(--brand-blue)",
    },
    {
      label: netKnown ? "Net After Fees" : "Payment Success",
      value: netKnown ? money(stats.netRevenue, currency) : `${stats.successRate}%`,
      hint: netKnown
        ? `${money(stats.totalFees, currency)} in PayHere fees`
        : `${stats.failedCount} failed of ${stats.successCount + stats.failedCount} attempts`,
      accent: "var(--brand-red)",
    },
  ];

  return (
    <>
      {stats.unfulfilledCount > 0 && (
        <Link
          href="/admin/payments"
          className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 transition-colors hover:bg-amber-100"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-semibold text-amber-800">
              {stats.unfulfilledCount} paid{" "}
              {stats.unfulfilledCount === 1 ? "order needs" : "orders need"} fulfilment
            </p>
            <p className="mt-0.5 text-amber-700">
              Money received but enrolment incomplete — review in Payments.
            </p>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {tiles.map((tile) => (
          <Card key={tile.label} className="pcb-card border-slate-100 shadow-sm overflow-hidden">
            <CardContent className="relative px-5 py-4">
              <span
                className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full"
                style={{ backgroundColor: tile.accent }}
              />
              <div className="pl-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  {tile.label}
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-[24px] leading-none font-extrabold text-slate-900 tabular-nums tracking-tight">
                    {tile.value}
                  </span>
                  {tile.delta !== undefined && (
                    <span
                      className={`flex items-center gap-0.5 text-[11px] font-semibold ${
                        tile.delta >= 0 ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      {tile.delta >= 0 ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {Math.abs(tile.delta)}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-2">{tile.hint}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {netIsPartial && (
        <p className="mb-6 flex items-start gap-2 text-xs text-slate-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Net figures cover {stats.netCoverage} of {stats.successCount} payments — PayHere
          reports its fee only after settlement, so recent payments are counted gross until
          the reconciliation job syncs them.
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <Card className="pcb-card border-slate-100 shadow-sm xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Revenue — Last 30 Days
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              {money(stats.revenueThisMonth, currency)} this month
            </p>
          </CardHeader>
          <CardContent className="pb-4">
            <LazyRevenueTrendChart data={stats.revenueTrend} />
          </CardContent>
        </Card>

        <Card className="pcb-card border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Top Courses by Revenue
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">All-time settled payments</p>
          </CardHeader>
          <CardContent className="pb-4">
            {stats.topCoursesByRevenue.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-400">No payments yet</p>
            ) : (
              <ul className="space-y-3">
                {stats.topCoursesByRevenue.map((c) => {
                  const share =
                    stats.grossRevenue > 0
                      ? Math.round((c.revenue / stats.grossRevenue) * 100)
                      : 0;
                  return (
                    <li key={c.course}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate font-medium text-slate-700">{c.course}</span>
                        <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                          {money(c.revenue, currency)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${share}%`, backgroundColor: "var(--brand-red)" }}
                          />
                        </div>
                        <span className="w-16 shrink-0 text-right text-[11px] text-slate-400">
                          {c.count} sale{c.count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
