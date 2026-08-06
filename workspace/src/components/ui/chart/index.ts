"use client"

// Barrel for the chart module.
// Re-exports the public surface of the original `src/components/ui/chart.tsx`
// (353 lines) which has been split into context/chart-style/chart-container/
// chart-tooltip/chart-legend for the ≤300-line file rule.

export type { ChartConfig } from "./context"
export { ChartContainer } from "./chart-container"
export { ChartStyle } from "./chart-style"
export { ChartTooltip, ChartTooltipContent } from "./chart-tooltip"
export { ChartLegend, ChartLegendContent } from "./chart-legend"
