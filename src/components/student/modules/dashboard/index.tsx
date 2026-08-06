'use client'

import { getStudentById } from '@/lib/mock/students'
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

export function StudentDashboard({ onNavigate }: { onNavigate: (key: string) => void }) {
  const student = getStudentById('STU-2024-018')!
  const pendingHomework = homeworks.filter((h) => h.status === 'Active').slice(0, 3)
  const dueAssignments = assignments.filter((a) => a.status === 'Pending').slice(0, 2)
  const upcomingExams = exams.filter((e) => e.status === 'Scheduled').slice(0, 2)

  return (
    <div className="space-y-6">
      <WelcomeBanner student={student} />

      <KpiGrid
        attendancePct={attendancePct}
        pendingHomeworkCount={pendingHomework.length}
        feePending={student.feeTotal - student.feePaid}
      />

      <SmartUpNext onNavigate={onNavigate} />

      <LearningInsights />

      <PerformanceTrend />

      <StudyStreak />

      <TodayClasses />

      <HomeworkSection
        pendingHomework={pendingHomework}
        dueAssignments={dueAssignments}
        libraryId={student.libraryId}
      />

      <ChartsRow />

      <ExamsResults upcomingExams={upcomingExams} />

      <AnnouncementsTransport transportId={student.transportId} />
    </div>
  )
}
