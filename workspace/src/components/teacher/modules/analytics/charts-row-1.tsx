'use client'

import { ChartCard } from '@/components/shared/charts'
import { DualArea, BarTrend } from '@/components/shared/charts'
import { StatusBadge } from '@/components/shared/ui'
import { classTrend, subjectAverages } from './data'

export function ChartsRow1() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <ChartCard
        title="Class Performance Trend"
        subtitle="Mathematics vs Science · last 5 months"
        className="lg:col-span-2"
        action={<StatusBadge status="+10% growth" variant="success" dot />}
      >
        <DualArea
          data={classTrend}
          xKey="name"
          keys={[
            { key: 'math', color: 'oklch(0.6 0.18 300)', name: 'Mathematics' },
            { key: 'sci', color: 'oklch(0.65 0.16 75)', name: 'Science' },
          ]}
          height={280}
        />
      </ChartCard>

      <ChartCard title="Subject Averages" subtitle="Class 2-A · UT3 results">
        <BarTrend data={subjectAverages} xKey="subject" yKey="avg" color="oklch(0.55 0.14 162)" height={280} />
      </ChartCard>
    </div>
  )
}
