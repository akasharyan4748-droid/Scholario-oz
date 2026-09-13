'use client'

import { useStudentsStore } from '@/lib/store/students-store'
import { useFeeStore } from '@/lib/store/fee-store'
import { DEMO_STUDENT_ID } from '../applications/student'
import { useAttendanceSnapshot } from './data'
import { WelcomeBanner } from './welcome-banner'
import { KpiGrid } from './kpi-grid'
import { SmartUpNext } from './smart-up-next'
import { StudyStreak } from './study-streak'
import { TodayClasses } from './today-classes'
import { StudyBrief } from './study-brief'
import { ChartsRow } from './charts-row'
import { SchoolNotices } from './school-notices'
import { ClassResponsibilityBanner } from './class-responsibility-banner'

/**
 * StudentDashboard — a DAILY COMMAND CENTER, not a report (final
 * simplification pass). Flow: TODAY (focus queue, timetable, study
 * brief, KPIs) → PROGRESS (trend charts, streak) → NOTICES.
 *
 * With the Classwork decommission (Learning OS spec §1), the homework/
 * assignment surfaces were replaced by the Learning OS equivalents:
 * Smart Up Next + StudyBrief derive from the student-learning store.
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
  // STU-ATT — attendance KPI derives LIVE from the canonical attendance
  // records (same source as the Attendance module): a teacher's correction
  // updates this number on the next render.
  const attendance = useAttendanceSnapshot()

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
        feePending={feePending}
      />

      {/* ── TODAY: what to focus on right now ─────────────────────────── */}
      <SmartUpNext onNavigate={onNavigate} />

      <TodayClasses />

      <StudyBrief onNavigate={onNavigate} />

      {/* ── PROGRESS: how you're trending ─────────────────────────────── */}
      <ChartsRow />

      <StudyStreak />

      {/* ── NOTICES: what the school wants you to know ────────────────── */}
      <SchoolNotices onNavigate={onNavigate} />
    </div>
  )
}
