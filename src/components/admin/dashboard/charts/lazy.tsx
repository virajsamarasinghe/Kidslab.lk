"use client";

import dynamic from "next/dynamic";

/**
 * Recharts is ~150 kB of client JS and its `ResponsiveContainer` renders nothing
 * until it has measured the DOM, so server-rendering the charts buys no paint —
 * it only delays hydration of the parts that *do* have real HTML (KPIs, tables,
 * the pipeline funnel). Loading them on the client after first paint keeps the
 * initial route chunk small and the dashboard interactive sooner.
 */
function ChartFallback({ height }: { height: number }) {
  return (
    <div className="w-full animate-pulse rounded-lg bg-slate-50" style={{ height }} />
  );
}

export const LazySignupTrendChart = dynamic(() => import("./SignupTrendChart"), {
  ssr: false,
  loading: () => <ChartFallback height={220} />,
});

export const LazyStatusDonut = dynamic(() => import("./StatusDonut"), {
  ssr: false,
  loading: () => <ChartFallback height={160} />,
});

export const LazyRankedBarChart = dynamic(() => import("./RankedBarChart"), {
  ssr: false,
  loading: () => <ChartFallback height={200} />,
});

export const LazyRevenueTrendChart = dynamic(() => import("./RevenueTrendChart"), {
  ssr: false,
  loading: () => <ChartFallback height={220} />,
});
