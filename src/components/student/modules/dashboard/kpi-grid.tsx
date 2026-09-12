'use client'

import {
  CalendarCheck, BookOpen, Award, IndianRupee,
} from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { formatINR } from '@/lib/format'
import { homeworks } from '@/lib/mock/academics'
import { useMyResults } from '@/lib/store/student-results-store'
import { useAttendanceSnapshot } from './data'

interface KpiGridProps {
  attendancePct: number
  pendingHomeworkCount: number
  feePending: number
}

export function KpiGrid({ attendancePct, pendingHomeworkCount, feePending }: KpiGridProps) {
  // STU-ATT — sparkline + week delta derive from the canonical records.
  const attendance = useAttendanceSnapshot()
  // STU-RES — latest published result from the canonical results store
  // (the SAME source the Results module reads — one result source, §34).
  const results = useMyResults()
  const latest = results.latest
  const prevPct = results.trend.length >= 2 ? results.trend[results.trend.length - 2].pct : null
  const lastExamDelta = latest && prevPct != null ? Math.round((latest.totals.pct - prevPct) * 10) / 10 : undefined
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard
        label="Attendance"
        value={attendancePct}
        suffix="%"
        icon={<CalendarCheck className="h-5 w-5" />}
        trend={attendance.weekDelta ?? undefined}
        trendLabel={attendance.weekDelta !== null ? 'vs last week' : 'Building your record'}
        accent="emerald"
        sparkline={attendance.trend.length >= 2 ? attendance.trend : undefined}
        sparkKey="v"
        delay={0}
      />
      <KpiCard
        label="Last Exam Score"
        value={latest ? latest.totals.pct : 0}
        suffix="%"
        decimals={1}
        icon={<Award className="h-5 w-5" />}
        trend={lastExamDelta}
        trendLabel={latest ? latest.assessment.name : 'Awaiting results'}
        accent="emerald"
        delay={0.05}
      />
      <KpiCard
        label="Pending Homework"
        value={pendingHomeworkCount}
        icon={<BookOpen className="h-5 w-5" />}
        trendLabel={`of ${homeworks.length} assigned`}
        accent="amber"
        delay={0.1}
      />
      <KpiCard
        label="Fees Pending"
        value={feePending}
        format={(n) => formatINR(n, true)}
        icon={<IndianRupee className="h-5 w-5" />}
        trendLabel="Pay before 15 Dec"
        accent="rose"
        delay={0.15}
      />
    </div>
  )
}
