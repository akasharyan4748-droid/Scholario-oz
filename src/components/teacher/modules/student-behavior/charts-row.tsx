'use client'

import { ChartCard, DualArea, Donut } from '@/components/shared/charts'
import { behaviorStats } from '@/lib/mock/behavior'

export function BehaviorCharts() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <ChartCard title="Behavior Trend" subtitle="Monthly positive vs concerns" className="lg:col-span-2">
        <DualArea data={behaviorStats.monthlyTrend} xKey="month" keys={[{ key: 'positive', color: 'oklch(0.55 0.14 162)', name: 'Positive' }, { key: 'concern', color: 'oklch(0.65 0.16 75)', name: 'Concerns' }]} height={240} />
      </ChartCard>
      <ChartCard title="Category Breakdown" subtitle="All records this term">
        <Donut data={behaviorStats.categoryBreakdown} centerValue={`${behaviorStats.totalRecords}`} centerLabel="records" height={240} />
      </ChartCard>
    </div>
  )
}
