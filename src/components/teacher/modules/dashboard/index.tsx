'use client'

import { useAuth } from '@/lib/store/auth-store'
import { homeworks, exams } from '@/lib/mock/academics'
import { todaySchedule } from '@/lib/mock/academics'
import { WelcomeBanner } from './welcome-banner'
import { TeacherKpiCards } from './kpi-cards'
import { ClassHealthAlerts } from './class-health-alerts'
import { QuickInsights } from './quick-insights'
import { WeeklyPerformance } from './weekly-performance'
import { TodayClasses } from './today-classes'
import { QuickActions, NoticeBoard } from './quick-actions'
import { PendingReviews } from './pending-reviews'
import { CalendarWidget, AttendanceGauge, RecentActivity } from './widgets'
import { StudentSnapshot } from './student-snapshot'

interface DashboardProps {
  onNavigate: (key: string) => void
}

export function TeacherDashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth()
  const myHomeworks = homeworks.filter((h) => h.assignedBy === 'Rohan Mehta')
  const upcomingExams = exams.filter((e) => e.status === 'Scheduled')
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const teachingPeriods = todaySchedule.filter((p) => p.teacher === 'Rohan Mehta')
  const activeHomeworksCount = myHomeworks.filter((h) => h.status === 'Active').length

  return (
    <div className="space-y-6">
      <WelcomeBanner
        userName={user?.name}
        today={today}
        teachingPeriodsCount={teachingPeriods.length}
        activeHomeworksCount={activeHomeworksCount}
      />

      <TeacherKpiCards
        activeHomeworksCount={activeHomeworksCount}
        upcomingExamsCount={upcomingExams.length}
      />

      <ClassHealthAlerts onNavigate={onNavigate} />

      <QuickInsights />

      <WeeklyPerformance />

      <TodayClasses onNavigate={onNavigate} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <QuickActions onNavigate={onNavigate} />
        <NoticeBoard onNavigate={onNavigate} />
      </div>

      <PendingReviews onNavigate={onNavigate} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <CalendarWidget />
        <AttendanceGauge />
        <RecentActivity />
      </div>

      <StudentSnapshot onNavigate={onNavigate} />
    </div>
  )
}
