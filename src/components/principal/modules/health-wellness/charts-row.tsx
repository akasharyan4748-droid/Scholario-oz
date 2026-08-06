'use client'

import { ChartCard, AreaTrend, Donut } from '@/components/shared/charts'
import { healthStats } from '@/lib/mock/health'

// Charts row — Infirmary Visits Trend (lg:col-span-2) + BMI Distribution donut.
export function ChartsRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <ChartCard title="Infirmary Visits Trend" subtitle="Monthly visits (last 6 months)" className="lg:col-span-2">
        <AreaTrend data={healthStats.monthlyTrend} xKey="month" yKey="visits" color="oklch(0.62 0.2 25)" height={250} gradientId="healthGrad" />
      </ChartCard>
      <ChartCard title="BMI Distribution" subtitle="School-wide health overview">
        <Donut data={healthStats.bmiDistribution} centerValue={`${Math.round((healthStats.bmiDistribution[0].value / healthStats.totalStudents) * 100)}%`} centerLabel="normal" height={250} />
      </ChartCard>
    </div>
  )
}
