'use client'

/**
 * StudentDashboard — a DAILY COMMAND CENTER, not a report.
 * Flow: TODAY (focus queue, timetable, continue learning, KPIs)
 * → PROGRESS (trend charts) → NOTICES.
 *
 * Learning Experience 2.0 (spec §51): the dashboard surfaces ONE real
 * learning element (Continue Learning, from the server aggregate) and the
 * real Flashcards-due KPI — it does NOT duplicate Learning. Classwork /
 * Homework exposure is gone (spec §1); the fake StudyStreak gamification
 * is gone (spec §13/§63 — the UI must never manufacture performance).
 */

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useStudentsStore } from '@/lib/store/students-store'
import { computeAccount, useFeeStore } from '@/lib/store/fee-store'
import { DEMO_STUDENT_ID } from '../applications/student'
import { apiFetch } from '../learning/api'
import type { LearningOverview } from '../learning/types'
import { useAttendanceSnapshot } from './data'
import { WelcomeBanner } from './welcome-banner'
import { KpiGrid } from './kpi-grid'
import { SmartUpNext } from './smart-up-next'
import { TodayClasses } from './today-classes'
import { ChartsRow } from './charts-row'
import { SchoolNotices } from './school-notices'
import { ClassResponsibilityBanner } from './class-responsibility-banner'

export function StudentDashboard({ onNavigate }: { onNavigate: (key: string) => void }) {
  // STU-B — canonical identity (one roster, every role).
  const student = useStudentsStore((st) => st.students.find((x) => x.id === DEMO_STUDENT_ID))
  // STU-F — the fee KPI derives LIVE from the SAME engine the Fees module
  // reads (computeAccount over the ONE fee ledger — structure, concessions,
  // late-fee rule included). The stale roster feeTotal snapshot is gone:
  // dashboard and Fees can never disagree again.
  const transactions = useFeeStore((s) => s.transactions)
  const lateFeeRule = useFeeStore((s) => s.lateFeeRule)
  const additionalCharges = useFeeStore((s) => s.additionalCharges)
  const concessions = useFeeStore((s) => s.concessions)
  const optionalHeadApplicability = useFeeStore((s) => s.optionalHeadApplicability)
  const feeAccount = useMemo(
    () => (student
      ? computeAccount(student, transactions, lateFeeRule, additionalCharges, concessions, optionalHeadApplicability)
      : null),
    [student, transactions, lateFeeRule, additionalCharges, concessions, optionalHeadApplicability],
  )
  const feePending = feeAccount?.totalDue ?? 0
  // STU-ATT — attendance KPI derives LIVE from the canonical attendance
  // records (same source as the Attendance module): a teacher's correction
  // updates this number on the next render.
  const attendance = useAttendanceSnapshot()

  // L2D (spec §51) — ONE aggregate powers the dashboard's learning
  // surface: Continue Learning + the real Flashcards-due count. It fails
  // silently (the dashboard is not Learning) and hides its sections.
  const [overview, setOverview] = useState<LearningOverview | null>(null)
  useEffect(() => {
    let cancelled = false
    apiFetch<LearningOverview>('/api/student/learning/overview')
      .then((d) => { if (!cancelled) setOverview(d) })
      .catch(() => { /* dashboard learning sections simply stay hidden */ })
    return () => { cancelled = true }
  }, [])

  if (!student) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading dashboard" />
      </div>
    )
  }

  const continueCard = overview?.continueLearning ?? null

  return (
    <div className="space-y-6">
      <WelcomeBanner student={student} />

      {/* Class Captain / Monitor responsibility strip (only while active) */}
      <ClassResponsibilityBanner onNavigate={onNavigate} />

      <KpiGrid
        attendancePct={attendance.pct}
        dueFlashcards={overview?.counts.dueFlashcards ?? null}
        feePending={feePending}
      />

      {/* ── TODAY: what to focus on right now ─────────────────────────── */}
      <SmartUpNext onNavigate={onNavigate} continueLearning={continueCard} />

      <TodayClasses />

      {/* ── ONE real learning surface (spec §51) — hidden without data ── */}
      {overview === null ? (
        <Skeleton className="h-24 rounded-xl" aria-label="Loading learning" />
      ) : continueCard ? (
        <section
          aria-label="Continue learning"
          className="flex flex-col gap-3 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Sparkles className="h-4.5 w-4.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Continue Learning
              </p>
              <p className="truncate text-sm font-semibold">{continueCard.title}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {continueCard.subjectName ?? 'Learning'}
                {continueCard.lastOpenedAt
                  ? ` · opened ${new Date(continueCard.lastOpenedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                  : ''}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => onNavigate('learning')} className={cn('h-8 shrink-0 gap-1.5')}>
            Continue <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </section>
      ) : null}

      {/* ── PROGRESS: how you're trending ─────────────────────────────── */}
      <ChartsRow />

      {/* ── NOTICES: what the school wants you to know ────────────────── */}
      <SchoolNotices onNavigate={onNavigate} />
    </div>
  )
}
