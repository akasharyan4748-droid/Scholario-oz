'use client'

import { useStudentsStore } from '@/lib/store/students-store'
import { useFeeStore } from '@/lib/store/fee-store'
import { DEMO_STUDENT_ID } from '../applications/student'
import { homeworks, assignments } from '@/lib/mock/academics'
import { attendancePct } from './data'
import { WelcomeBanner } from './welcome-banner'
import { KpiGrid } from './kpi-grid'
import { SmartUpNext } from './smart-up-next'
import { StudyStreak } from './study-streak'
import { TodayClasses } from './today-classes'
import { HomeworkSection } from './homework-section'
import { ChartsRow } from './charts-row'
import { SchoolNotices } from './school-notices'
import { ClassResponsibilityBanner } from './class-responsibility-banner'

/**
 * StudentDashboard — a DAILY COMMAND CENTER, not a report (final
 * simplification pass). Flow: TODAY (focus queue, timetable, homework,
 * KPIs) → PROGRESS (trend charts, streak) → NOTICES.
 *
 * Removed in the simplification pass: LearningInsights (hardcoded
 * duplicates of the KPI row), PerformanceTrend (hardcoded weekly bars
 * duplicating ChartsRow), ExamsResults (Results module + KPI already
 * cover it), and the transport card (Transport module owns that data).
 */
export function StudentDashboard({ onNavigate }: { onNavigate: (key: string) => void }) {
  // STU-B — canonical identity (one roster, every role).
  const student = useStudentsStore((st) => st.students.find((x) => x.id === DEMO_STUDENT_ID))
  // STU-F — fee pending derives LIVE from the ONE fee ledger (same source
  // as the Fees module), not the roster's static feePaid snapshot: a payment
  // made anywhere updates the KPI immediately.
  const ledgerPaid = useFeeStore((s) =>
    s.transactions
      .filter((t) => t.studentId === DEMO_STUDENT_ID && t.status === 'Success')
      .reduce((sum, t) => sum + t.amount, 0),
  )
  const feePending = Math.max(0, (student?.feeTotal ?? 0) - ledgerPaid)
  const pendingHomework = homeworks.filter((h) => h.status === 'Active').slice(0, 3)
  const dueAssignments = assignments.filter((a) => a.status === 'Pending').slice(0, 2)
  // Display identities derived from the roster number (same convention as Profile).
  const libraryId = student ? `LIB-${1000 + Number(student.id.replace('STU-', ''))}` : '—'

  if (!student) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading dashboard" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <WelcomeBanner student={student} />

      {/* Class Captain / Monitor responsibility strip (only while active) */}
      <ClassResponsibilityBanner onNavigate={onNavigate} />

      <KpiGrid
        attendancePct={attendancePct}
        pendingHomeworkCount={pendingHomework.length}
        feePending={feePending}
      />

      {/* ── TODAY: what to focus on right now ─────────────────────────── */}
      <SmartUpNext onNavigate={onNavigate} />

      <TodayClasses />

      <HomeworkSection
        pendingHomework={pendingHomework}
        dueAssignments={dueAssignments}
        libraryId={libraryId}
      />

      {/* ── PROGRESS: how you're trending ─────────────────────────────── */}
      <ChartsRow />

      <StudyStreak />

      {/* ── NOTICES: what the school wants you to know ────────────────── */}
      <SchoolNotices onNavigate={onNavigate} />
    </div>
  )
}
