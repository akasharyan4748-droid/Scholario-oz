'use client'

import { useMemo } from 'react'
import { useStudentsStore } from '@/lib/store/students-store'
import { computeAccount, useFeeStore } from '@/lib/store/fee-store'
import { DEMO_STUDENT_ID } from '../applications/student'
import { homeworks, assignments } from '@/lib/mock/academics'
import { useAttendanceSnapshot } from './data'
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
        attendancePct={attendance.pct}
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
