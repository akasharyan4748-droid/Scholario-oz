'use client'

import { useStudentsStore } from '@/lib/store/students-store'
import { useFeeStore } from '@/lib/store/fee-store'
import { DEMO_STUDENT_ID } from '../applications/student'
import { homeworks, assignments, exams } from '@/lib/mock/academics'
import { attendancePct } from './data'
import { WelcomeBanner } from './welcome-banner'
import { KpiGrid } from './kpi-grid'
import { SmartUpNext } from './smart-up-next'
import { LearningInsights } from './learning-insights'
import { PerformanceTrend } from './performance-trend'
import { StudyStreak } from './study-streak'
import { TodayClasses } from './today-classes'
import { HomeworkSection } from './homework-section'
import { ChartsRow } from './charts-row'
import { ExamsResults } from './exams-results'
import { AnnouncementsTransport } from './announcements-transport'
import { ClassResponsibilityBanner } from './class-responsibility-banner'

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
  const upcomingExams = exams.filter((e) => e.status === 'Scheduled').slice(0, 2)
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

      <SmartUpNext onNavigate={onNavigate} />

      <LearningInsights />

      <PerformanceTrend />

      <StudyStreak />

      <TodayClasses />

      <HomeworkSection
        pendingHomework={pendingHomework}
        dueAssignments={dueAssignments}
        libraryId={libraryId}
      />

      <ChartsRow />

      <ExamsResults upcomingExams={upcomingExams} />

      <AnnouncementsTransport transportId={student.transportRoute ?? undefined} onNavigate={onNavigate} />
    </div>
  )
}
