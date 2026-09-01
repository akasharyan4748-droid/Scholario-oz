'use client'

import { BarChart3 } from 'lucide-react'
import { SectionHeading, StatusBadge } from '@/components/shared/ui'
import { homeworks } from '@/lib/mock/academics'
import { KpiRow } from './kpi-row'
import { ChartsRow1 } from './charts-row-1'
import { ChartsRow2 } from './charts-row-2'
import { StudentGrowth } from './student-growth'
import { TopPerformers } from './top-performers'
import { InsightsRow } from './insights-row'
import { SubjectTable } from './subject-table'

export function TeacherAnalyticsModule() {
  const myHomeworks = homeworks.filter((h) => h.assignedBy === 'Rohan Mehta')
  const avgSubmission = myHomeworks.reduce((a, h) => a + (h.submissions / h.total) * 100, 0) / myHomeworks.length

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Analytics"
        subtitle="Class 2-A · Performance insights & growth metrics"
        icon={<BarChart3 className="h-5 w-5" />}
        action={<StatusBadge status="Last 6 weeks" variant="neutral" />}
      />

      <KpiRow avgSubmission={avgSubmission} />

      <ChartsRow1 />

      <ChartsRow2 avgSubmission={avgSubmission} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StudentGrowth />
        <TopPerformers />
      </div>

      <InsightsRow />

      <SubjectTable />
    </div>
  )
}
