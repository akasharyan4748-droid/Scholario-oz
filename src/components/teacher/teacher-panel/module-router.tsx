'use client'

import { TeacherDashboard } from '../modules/dashboard'
import { TimetableModule } from '../modules/timetable'
import { AttendanceModule } from '../modules/attendance'
import { PersonalAttendance } from '../modules/personal-attendance'
import { HomeworkModule } from '../modules/homework'
import { AssignmentsModule } from '../modules/assignments'
import { MarksEntryModule } from '../modules/marks'
import { StudentsModule } from '../modules/students'
import { TeacherAnalyticsModule } from '../modules/analytics'
import { CommunicationModule } from '../modules/communication'
import { LessonPlannerModule } from '../modules/lesson-planner'
import { PTMSchedulerModule } from '../modules/ptm-scheduler'
import { PerformanceReviewsModule } from '../modules/performance-reviews'
import { TeacherResourceLibraryModule } from '../modules/resource-library'
import { StudentBehaviorModule } from '../modules/student-behavior'
import { ParentConnectModule } from '../modules/parent-connect'
import { MentoringModule } from '../modules/mentoring'
import { ExamProctoringModule } from '../modules/exam-proctoring'
import { ClassroomResourcesModule } from '../modules/classroom-resources'

interface ModuleRouterProps {
  active: string
  onNavigate: (key: string) => void
}

export function ModuleRouter({ active, onNavigate }: ModuleRouterProps) {
  return (
    <>
      {active === 'dashboard' && <TeacherDashboard onNavigate={onNavigate} />}
      {active === 'timetable' && <TimetableModule />}
      {active === 'classroom' && <ClassroomResourcesModule />}
      {active === 'my-attendance' && <PersonalAttendance />}
      {active === 'attendance' && <AttendanceModule />}
      {active === 'lesson-planner' && <LessonPlannerModule />}
      {active === 'homework' && <HomeworkModule />}
      {active === 'assignments' && <AssignmentsModule />}
      {active === 'marks' && <MarksEntryModule />}
      {active === 'proctoring' && <ExamProctoringModule />}
      {active === 'students' && <StudentsModule />}
      {active === 'resources' && <TeacherResourceLibraryModule />}
      {active === 'ptm' && <PTMSchedulerModule />}
      {active === 'behavior' && <StudentBehaviorModule />}
      {active === 'parent-connect' && <ParentConnectModule />}
      {active === 'mentoring' && <MentoringModule />}
      {active === 'analytics' && <TeacherAnalyticsModule />}
      {active === 'communication' && <CommunicationModule />}
      {active === 'reviews' && <PerformanceReviewsModule />}
    </>
  )
}
