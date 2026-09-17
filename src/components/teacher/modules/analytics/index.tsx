'use client'

import { StatusBadge } from '@/components/shared/ui'
import { ModuleToolbar } from '../../teacher-panel/module-toolbar'
import { KpiRow } from './kpi-row'
import { ChartsRow1 } from './charts-row-1'
import { ChartsRow2 } from './charts-row-2'
import { StudentGrowth } from './student-growth'
import { TopPerformers } from './top-performers'
import { InsightsRow } from './insights-row'
import { SubjectTable } from './subject-table'

export function TeacherAnalyticsModule() {
  return (
    <div className="space-y-5">
      <ModuleToolbar
        context="Class 2-A · performance insights & growth metrics"
        action={<StatusBadge status="Last 6 weeks" variant="neutral" />}
      />

      <KpiRow />

      <ChartsRow1 />

      <ChartsRow2 />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StudentGrowth />
        <TopPerformers />
      </div>

      <InsightsRow />

      <SubjectTable />
    </div>
  )
}
