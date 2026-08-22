'use client'

import { AreaTrendChart as RawAreaTrend, DonutChart, HorizontalBarChart, GroupedBarChart, ProgressBar } from '@/components/shared/premium-charts'

// DualAreaChart: adapts { month, revenue, expense } → { label, primary, secondary }
// Optional primaryColor/secondaryColor let callers wire legend dots to the
// exact same CHART_PALETTE tokens the chart internals render with.
export function DualAreaChart({ data, height = 180, format, primaryColor, secondaryColor }: { data: any[]; height?: number; format?: (n: number) => string; primaryColor?: string; secondaryColor?: string }) {
  return <RawAreaTrend data={data} height={height} formatValue={format} labelKey="month" primaryKey="revenue" secondaryKey="expense" primaryLabel="Revenue" secondaryLabel="Expenses" primaryColor={primaryColor} secondaryColor={secondaryColor} />
}

// HorizontalBars: direct passthrough
export { HorizontalBarChart as HorizontalBars }

// GroupedBars: adapts { quarter, revenue, expense } → { label, primary, secondary }
export function GroupedBars({ data, height = 160, format }: { data: any[]; height?: number; format?: (n: number) => string }) {
  return <GroupedBarChart data={data} height={height} formatValue={format} labelKey="quarter" primaryKey="revenue" secondaryKey="expense" primaryLabel="Revenue" secondaryLabel="Expenses" />
}

// FinanceDonut: direct passthrough
export { DonutChart as FinanceDonut }

// ProgressBar: direct passthrough
export { ProgressBar }
