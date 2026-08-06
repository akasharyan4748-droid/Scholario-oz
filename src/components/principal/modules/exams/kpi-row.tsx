'use client'

// Top KPI row: Total Exams · Scheduled · Ongoing · Results Declared.

import {
  FileText, Calendar, Clock, CheckCircle2,
} from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { exams, examAnalytics } from '@/lib/mock/academics'
import { school } from '@/lib/mock/school'

export function ExamsKpiRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard
        label="Total Exams"
        value={exams.length}
        icon={<FileText className="h-5 w-5" />}
        trendLabel={`Academic year ${school.academicYear}`}
        accent="emerald"
        delay={0}
      />
      <KpiCard
        label="Scheduled"
        value={exams.filter((e) => e.status === 'Scheduled').length}
        icon={<Calendar className="h-5 w-5" />}
        trendLabel="Upcoming this term"
        accent="cyan"
        delay={0.05}
      />
      <KpiCard
        label="Ongoing"
        value={exams.filter((e) => e.status === 'Ongoing').length}
        icon={<Clock className="h-5 w-5" />}
        trendLabel="In progress now"
        accent="amber"
        delay={0.1}
      />
      <KpiCard
        label="Results Declared"
        value={exams.filter((e) => e.status === 'Result Declared').length}
        icon={<CheckCircle2 className="h-5 w-5" />}
        trendLabel={`${examAnalytics.passPercentage}% pass rate · across all exams`}
        accent="rose"
        delay={0.15}
      />
    </div>
  )
}
