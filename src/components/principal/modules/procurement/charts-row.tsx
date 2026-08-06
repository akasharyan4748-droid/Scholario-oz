'use client'

import { ChartCard, AreaTrend, Donut } from '@/components/shared/charts'
import { procurementStats } from '@/lib/mock/procurement'
import { formatINR } from '@/lib/format'

export function ChartsRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <ChartCard title="Monthly Spend Trend" subtitle="Procurement expenditure" className="lg:col-span-2">
        <AreaTrend data={procurementStats.monthlySpendTrend} xKey="month" yKey="amount" color="oklch(0.55 0.14 162)" height={240} gradientId="procGrad" />
      </ChartCard>
      <ChartCard title="Spend by Category" subtitle="YTD distribution">
        <Donut data={procurementStats.spendByCategory} centerValue={formatINR(procurementStats.ytdSpend, true)} centerLabel="YTD spend" height={240} />
      </ChartCard>
    </div>
  )
}
