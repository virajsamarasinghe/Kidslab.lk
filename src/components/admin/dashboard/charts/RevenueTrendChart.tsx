"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer, ChartTooltip, type ChartConfig,
} from "@/components/ui/chart";
import { chartTooltip } from "./tooltip";

const revenueChartConfig = {
  revenue: { label: "Revenue", color: "var(--color-chart-2)" },
} satisfies ChartConfig;

/**
 * Daily settled revenue over the last 30 days.
 *
 * Ticks are abbreviated (`25k`) rather than shown in full: LKR amounts run to
 * five or six digits, and unabbreviated labels would either overlap or force
 * the axis so wide it eats the plot area.
 */
function abbreviate(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

export default function RevenueTrendChart({
  data,
}: {
  data: Array<{ date: string; revenue: number }>;
}) {
  return (
    <ChartContainer config={revenueChartConfig} className="h-[220px] w-full">
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={11}
          // 30 labels won't fit; every fifth keeps the axis readable.
          interval={4}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={38}
          fontSize={11}
          tickFormatter={abbreviate}
        />
        <ChartTooltip content={chartTooltip({ indicator: "dot" })} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-revenue)"
          fill="url(#revenueFill)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
