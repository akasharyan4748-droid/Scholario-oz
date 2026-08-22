'use client'

import { AreaTrendChart as RawAreaTrend, DonutChart, RadialProgress, GroupedBarChart, HorizontalBarChart, ProgressBar } from '@/components/shared/premium-charts'

// MiniAreaChart: adapts { month, collected, pending } → { label, primary, secondary }
export function MiniAreaChart({ data, height = 140, format }: { data: any[]; height?: number; format?: (n: number) => string }) {
  return <RawAreaTrend data={data} height={height} formatValue={format} labelKey="month" primaryKey="collected" secondaryKey="pending" primaryLabel="Collected" secondaryLabel="Pending" />
}

// MiniDonut: direct passthrough
export { DonutChart as MiniDonut }

// MiniRadial: direct passthrough
export { RadialProgress as MiniRadial }

// MiniBars: direct passthrough
export { HorizontalBarChart as MiniBars }

// GroupedBars: direct passthrough
export { GroupedBarChart as GroupedBars }

// ProgressBar: direct passthrough
export { ProgressBar }
