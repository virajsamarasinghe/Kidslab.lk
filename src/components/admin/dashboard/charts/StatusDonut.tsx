"use client";

import { PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer, ChartTooltip, type ChartConfig,
} from "@/components/ui/chart";
import { chartTooltip } from "./tooltip";

const statusChartConfig = {
  active: { label: "Active", color: "#16a34a" },
  inactive: { label: "Inactive", color: "var(--color-chart-2)" },
} satisfies ChartConfig;

export default function StatusDonut({
  activeUsers,
  inactiveUsers,
}: {
  activeUsers: number;
  inactiveUsers: number;
}) {
  const data = [
    { name: "active", label: "Active", value: activeUsers, fill: "#16a34a" },
    { name: "inactive", label: "Inactive", value: inactiveUsers, fill: "var(--color-chart-2)" },
  ];

  return (
    <ChartContainer config={statusChartConfig} className="h-[160px] w-full">
      <PieChart>
        <ChartTooltip content={chartTooltip({ hideLabel: true, nameKey: "name" })} />
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} strokeWidth={2}>
          {data.map(d => (
            <Cell key={d.name} fill={d.fill} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
