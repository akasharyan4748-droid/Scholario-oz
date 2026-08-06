'use client'

import { ChartCard, BarTrend, Donut } from '@/components/shared/charts'
import { StatusBadge } from '@/components/shared/ui'
import { completionByClass, subjectDistribution } from './data'

interface Props {
  totalHomework: number
  avgCompletion: number
}

export function HomeworkAnalytics({ totalHomework, avgCompletion }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <ChartCard
        title="Completion Rate by Class"
        subtitle="Submission rate · last 7 days"
        className="lg:col-span-2"
        action={<StatusBadge status={`${avgCompletion}% avg`} variant="success" dot />}
      >
        <BarTrend
          data={completionByClass}
          xKey="name"
          yKey="rate"
          color="oklch(0.55 0.14 162)"
          height={260}
        />
      </ChartCard>

      <ChartCard title="Subject Distribution" subtitle="Active homework by subject">
        <Donut
          data={subjectDistribution}
          centerValue={`${totalHomework}`}
          centerLabel="Active HW"
          height={260}
        />
      </ChartCard>
    </div>
  )
}
