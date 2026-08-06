'use client'

import { CalendarCheck, BookOpen, ClipboardList, FileText } from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'

interface TeacherKpiCardsProps {
  activeHomeworksCount: number
  upcomingExamsCount: number
}

export function TeacherKpiCards({ activeHomeworksCount, upcomingExamsCount }: TeacherKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard label="Attendance Pending" value={1} icon={<CalendarCheck className="h-5 w-5" />} trendLabel="Class 2-A · today" accent="amber" delay={0} />
      <KpiCard label="Homework to Review" value={activeHomeworksCount} icon={<BookOpen className="h-5 w-5" />} trend={12} trendLabel="4 submissions today" accent="emerald" delay={0.05} />
      <KpiCard label="Assignments to Grade" value={9} icon={<ClipboardList className="h-5 w-5" />} trendLabel="2 due this week" accent="violet" delay={0.1} />
      <KpiCard label="Upcoming Exams" value={upcomingExamsCount} icon={<FileText className="h-5 w-5" />} trendLabel="Pre-Board in 12 days" accent="rose" delay={0.15} />
    </div>
  )
}
