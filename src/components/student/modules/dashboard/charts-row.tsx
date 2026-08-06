'use client'

import { StatusBadge } from '@/components/shared/ui'
import { ChartCard, AreaTrend, BarTrend } from '@/components/shared/charts'
import { examResults } from '@/lib/mock/academics'
import { attendancePct, attendanceTrend } from './data'

export function ChartsRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <ChartCard
        title="My Attendance Trend"
        subtitle="Last 6 months"
        className="lg:col-span-2"
        action={<StatusBadge status={`${attendancePct}% avg`} variant="success" dot />}
      >
        <AreaTrend data={attendanceTrend} xKey="name" yKey="v" color="oklch(0.6 0.18 300)" height={260} gradientId="attGrad" />
      </ChartCard>

      <ChartCard title="Subject Performance" subtitle="Unit Test 3 — by subject">
        <BarTrend
          data={examResults.studentResults.map((s) => ({ name: s.subject.length > 7 ? s.subject.slice(0, 4) + '…' : s.subject, value: s.obtained }))}
          xKey="name"
          yKey="value"
          color="oklch(0.65 0.16 75)"
          height={260}
        />
      </ChartCard>
    </div>
  )
}
