'use client'

import { TeacherDashboard } from '../modules/dashboard'
import { AttendanceModule } from '../modules/attendance'
import { PersonalAttendance } from '../modules/personal-attendance'
import { MyTimetableModule } from '../modules/my-timetable'
import { MarksEntryModule } from '../modules/marks'
import { StudentsModule } from '../modules/students'
import { TeacherAnalyticsModule } from '../modules/analytics'
import { CommunicationModule } from '../modules/communication'
import { LessonPlannerModule } from '../modules/lesson-planner'
import { StudentBehaviorModule } from '../modules/student-behavior'
import { ExamProctoringModule } from '../modules/exam-proctoring'
import { ApplicationReviewsModule } from '../modules/applications'
import { TeacherSettingsModule } from '../modules/settings'

interface ModuleRouterProps {
  active: string
  onNavigate: (key: string) => void
}

export function ModuleRouter({ active, onNavigate }: ModuleRouterProps) {
  return (
    <>
      {active === 'dashboard' && <TeacherDashboard onNavigate={onNavigate} />}
      {active === 'my-attendance' && <PersonalAttendance />}
      {active === 'my-timetable' && <MyTimetableModule />}
      {active === 'attendance' && <AttendanceModule />}
      {active === 'lesson-planner' && <LessonPlannerModule />}
      {active === 'marks' && <MarksEntryModule />}
      {active === 'proctoring' && <ExamProctoringModule />}
      {active === 'students' && <StudentsModule />}
      {active === 'app-reviews' && <ApplicationReviewsModule />}
      {active === 'behavior' && <StudentBehaviorModule onNavigate={onNavigate} />}
      {active === 'analytics' && <TeacherAnalyticsModule onNavigate={onNavigate} />}
      {active === 'settings' && <TeacherSettingsModule />}
      {active === 'communication' && <CommunicationModule onNavigate={onNavigate} />}
    </>
  )
}
