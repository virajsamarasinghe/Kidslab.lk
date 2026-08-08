"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer, ChartTooltip, type ChartConfig,
} from "@/components/ui/chart";
import { chartTooltip } from "./tooltip";

const signupChartConfig = {
  signups: { label: "New Students", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

export default function SignupTrendChart({
  data,
}: {
  data: Array<{ date: string; signups: number }>;
}) {
  return (
    <ChartContainer config={signupChartConfig} className="h-[220px] w-full">
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="signupsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-signups)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-signups)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} width={28} fontSize={11} allowDecimals={false} />
        <ChartTooltip content={chartTooltip({ indicator: "dot" })} />
        <Area
          type="monotone"
          dataKey="signups"
          stroke="var(--color-signups)"
          fill="url(#signupsFill)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
