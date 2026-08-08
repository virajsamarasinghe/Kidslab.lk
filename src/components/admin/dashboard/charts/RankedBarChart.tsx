"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer, ChartTooltip, type ChartConfig,
} from "@/components/ui/chart";
import { chartTooltip } from "./tooltip";

const barChartConfig = {
  count: { label: "Students", color: "var(--color-chart-3)" },
} satisfies ChartConfig;

/** Horizontal bar chart used for both the Top Cities and Top Courses breakdowns. */
export default function RankedBarChart({
  data,
  categoryKey,
  categoryWidth = 80,
  fill = "var(--color-count)",
}: {
  data: Array<Record<string, string | number>>;
  categoryKey: string;
  categoryWidth?: number;
  fill?: string;
}) {
  return (
    <ChartContainer config={barChartConfig} className="h-[200px] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey={categoryKey}
          tickLine={false}
          axisLine={false}
          width={categoryWidth}
          fontSize={11}
        />
        <ChartTooltip content={chartTooltip({ indicator: "line" })} />
        <Bar dataKey="count" fill={fill} radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
