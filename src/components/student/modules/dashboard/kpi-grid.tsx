'use client'

/**
 * KpiGrid — REAL metrics only (spec §13/§14): attendance (canonical
 * records), latest exam score (canonical results store), flashcards due
 * (server aggregate) and fees pending (the same fee engine as the Fees
 * module). The former mock-driven "Pending Homework" KPI is gone with
 * Classwork (spec §1) — a dashboard must never manufacture numbers.
 */

import {
  CalendarCheck, Layers, Award, IndianRupee,
} from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { formatINR } from '@/lib/format'
import { useMyResults } from '@/lib/store/student-results-store'
import { useAttendanceSnapshot } from './data'

interface KpiGridProps {
  attendancePct: number
  /** Real due count from the server (null = still loading → hidden). */
  dueFlashcards: number | null
  feePending: number
}

export function KpiGrid({ attendancePct, dueFlashcards, feePending }: KpiGridProps) {
  // STU-ATT — sparkline + week delta derive from the canonical records.
  const attendance = useAttendanceSnapshot()
  // STU-RES — latest published result from the canonical results store
  // (the SAME source the Results module reads — one result source).
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
      {dueFlashcards !== null && (
        <KpiCard
          label="Flashcards Due"
          value={dueFlashcards}
          icon={<Layers className="h-5 w-5" />}
          trendLabel={dueFlashcards > 0 ? 'Ready for review' : 'All caught up'}
          accent={dueFlashcards > 0 ? 'violet' : 'emerald'}
          delay={0.1}
        />
      )}
      <KpiCard
        label="Fees Pending"
        value={feePending}
        format={(n) => formatINR(n, true)}
        icon={<IndianRupee className="h-5 w-5" />}
        trendLabel={feePending > 0 ? 'Balance due this session' : 'All fees paid'}
        accent={feePending > 0 ? 'amber' : 'emerald'}
        delay={0.15}
      />
    </div>
  )
}
