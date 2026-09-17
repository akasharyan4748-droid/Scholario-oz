'use client'

import { ChartCard, AreaTrend, Donut } from '@/components/shared/charts'
import { OpenChartSection } from '../shared/open-chart-section'
import { procurementStats } from '@/lib/mock/procurement'
import { formatINR } from '@/lib/format'

export function ChartsRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Monthly Spend Trend — OPEN, no card border */}
      <OpenChartSection
        className="lg:col-span-2"
        title="Monthly Spend Trend"
        subtitle="Procurement expenditure"
      >
        <AreaTrend data={procurementStats.monthlySpendTrend} xKey="month" yKey="amount" color="oklch(0.55 0.14 162)" height={200} gradientId="procGrad" showArea={false} />
      </OpenChartSection>
      <ChartCard title="Spend by Category" subtitle="YTD distribution">
        <Donut data={procurementStats.spendByCategory} centerValue={formatINR(procurementStats.ytdSpend, true)} centerLabel="YTD spend" height={240} />
      </ChartCard>
    </div>
  )
}
