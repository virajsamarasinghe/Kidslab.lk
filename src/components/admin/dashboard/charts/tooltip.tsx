"use client";

import { ChartTooltipContent } from "@/components/ui/chart";

type TooltipContentComponentProps = React.ComponentProps<typeof ChartTooltipContent>;

/**
 * Recharts hands its `content` render prop the full tooltip state, whose shape
 * overlaps imperfectly with `ChartTooltipContent`'s div-based props — so the
 * handoff is narrowed here once instead of being re-cast in every chart.
 */
export function chartTooltip(options: Partial<TooltipContentComponentProps> = {}) {
  return function TooltipRenderer(props: unknown) {
    return <ChartTooltipContent {...(props as TooltipContentComponentProps)} {...options} />;
  };
}
