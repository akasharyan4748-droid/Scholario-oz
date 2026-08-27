'use client'

// Evaluation analytics row: submission rate by subject (BarTrend) and grade
// distribution (Donut with average score as the center value).

import { StatusBadge } from '@/components/shared/ui'
import { ChartCard, BarTrend, Donut } from '@/components/shared/charts'
import { avgScore, gradeDistribution, submissionRateBySubject } from './data'

export function AssignmentsAnalyticsRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <ChartCard
        title="Submission Rate by Subject"
        subtitle="Avg across all assignments"
        className="lg:col-span-2"
        action={
          <StatusBadge
            status={`${Math.round(submissionRateBySubject.reduce((a, s) => a + s.rate, 0) / submissionRateBySubject.length)}%`}
            variant="success"
            dot
          />
        }
      >
        <BarTrend
          data={submissionRateBySubject}
          xKey="name"
          yKey="rate"
          color="oklch(0.55 0.14 162)"
          height={260}
        />
      </ChartCard>

      <ChartCard title="Grade Distribution" subtitle="All graded assignments">
        <Donut
          data={gradeDistribution}
          centerValue={`${avgScore}%`}
          centerLabel="Avg score"
          height={260}
        />
      </ChartCard>
    </div>
  )
}
