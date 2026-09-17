'use client'

import { StatusBadge } from '@/components/shared/ui'
import { ChartCard, AreaTrend, BarTrend } from '@/components/shared/charts'
import { useMyResults, pctOf } from '@/lib/store/student-results-store'
import { useAttendanceSnapshot } from './data'
import { Sun } from 'lucide-react'

export function ChartsRow() {
  // STU-ATT — the trend curve is the honest weekly aggregation of the
  // canonical attendance records (no synthetic pre-window history).
  const attendance = useAttendanceSnapshot()
  // STU-RES — subject mix from the SAME canonical results store the
  // Results module reads (one result source, §34).
  const results = useMyResults()
  const latest = results.latest

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <ChartCard
        title="My Attendance Trend"
        subtitle={attendance.trend.length >= 2 ? `Weekly · ${attendance.total} school days recorded` : 'From your attendance records'}
        className="lg:col-span-2"
        action={<StatusBadge status={`${attendance.pct}% overall`} variant="success" dot />}
      >
        {attendance.trend.length >= 2 ? (
          <AreaTrend data={attendance.trend} xKey="name" yKey="v" color="oklch(0.55 0.14 162)" height={260} gradientId="attGrad" />
        ) : (
          <div className="flex h-[260px] flex-col items-center justify-center text-center">
            <Sun className="mb-2 h-6 w-6 text-muted-foreground/40" aria-hidden />
            <p className="text-xs text-muted-foreground">
              Your week-by-week trend appears once at least two weeks of attendance are recorded.
            </p>
          </div>
        )}
      </ChartCard>

      <ChartCard
        title="Subject Performance"
        subtitle={latest ? `${latest.assessment.name} — percentage by subject` : 'Latest published assessment'}
      >
        {latest ? (
          <BarTrend
            data={latest.result.subjects.map((s) => ({
              name: s.subject.length > 7 ? s.subject.slice(0, 4) + '…' : s.subject,
              value: Math.round(pctOf(s.obtained, s.maxMarks) * 10) / 10,
            }))}
            xKey="name"
            yKey="value"
            color="oklch(0.55 0.14 162)"
            height={260}
          />
        ) : (
          <div className="flex h-[260px] flex-col items-center justify-center text-center">
            <Sun className="mb-2 h-6 w-6 text-muted-foreground/40" aria-hidden />
            <p className="text-xs text-muted-foreground">Subject performance appears once your first result is published.</p>
          </div>
        )}
      </ChartCard>
    </div>
  )
}
