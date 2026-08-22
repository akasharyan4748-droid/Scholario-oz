'use client'

import {
  AreaTrendChart as RawAreaTrend,
  DonutChart,
  PieChart,
  RadialProgress,
  GroupedBarChart,
  HorizontalBarChart,
  ProgressBar,
} from '@/components/shared/premium-charts'

// MiniAreaChart: adapts { month, collected, pending } → { label, primary, secondary }
export function MiniAreaChart({ data, height = 140, format }: { data: any[]; height?: number; format?: (n: number) => string }) {
  return <RawAreaTrend data={data} height={height} formatValue={format} labelKey="month" primaryKey="collected" secondaryKey="pending" primaryLabel="Collected" secondaryLabel="Pending" />
}

// MiniDonut: direct passthrough (premium animated donut with gradient segments + pop-out hover)
export { DonutChart as MiniDonut }

// MiniPie: full pie variant (no center hole), same data model as MiniDonut
export { PieChart as MiniPie }

// MiniRadial: direct passthrough (animated counter, optional ticks + completion glow)
export { RadialProgress as MiniRadial }

// MiniBars: direct passthrough
export { HorizontalBarChart as MiniBars }

// GroupedBars: direct passthrough
export { GroupedBarChart as GroupedBars }

// ProgressBar: direct passthrough
export { ProgressBar }
