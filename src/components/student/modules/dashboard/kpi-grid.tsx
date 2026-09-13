'use client'

import {
  CalendarCheck, Award, IndianRupee, Layers,
} from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { formatINR } from '@/lib/format'
import { useStudentLearningStore, dueStatsOf } from '@/lib/store/student-learning-store'
import { useMyResults } from '@/lib/store/student-results-store'
import { useAttendanceSnapshot } from './data'

interface KpiGridProps {
  attendancePct: number
  feePending: number
}

export function KpiGrid({ attendancePct, feePending }: KpiGridProps) {
  // STU-ATT — sparkline + week delta derive from the canonical records.
  const attendance = useAttendanceSnapshot()
  // STU-RES — latest published result from the canonical results store
  // (the SAME source the Results module reads — one result source, §34).
  const results = useMyResults()
  const latest = results.latest
  const prevPct = results.trend.length >= 2 ? results.trend[results.trend.length - 2].pct : null
  const lastExamDelta = latest && prevPct != null ? Math.round((latest.totals.pct - prevPct) * 10) / 10 : undefined
  // LEARNING-OS — the flashcards-due KPI is the real due count from the
  // learning store's scheduling engine (replaces the retired homework KPI).
  const cards = useStudentLearningStore((s) => s.cards)
  const due = dueStatsOf(cards)
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
        label="Flashcards Due"
        value={due.due}
        icon={<Layers className="h-5 w-5" />}
        trendLabel={due.due > 0 ? 'Ready for review' : 'You’re all caught up'}
        accent="violet"
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
