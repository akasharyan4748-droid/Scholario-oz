'use client'

// KPI row for the Assignments module: 4 KpiCards summarizing total / pending /
// graded counts and the average score across graded assignments.

import { ClipboardList, Clock, CheckCircle2, Award } from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { assignments } from '@/lib/mock/academics'
import { avgScore, PENDING_SUBS } from './data'

export function AssignmentsKpiRow() {
  const totalAssignments = assignments.length
  const graded = assignments.filter((a) => a.status === 'Graded').length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard
        label="Total Assignments"
        value={totalAssignments}
        icon={<ClipboardList className="h-5 w-5" />}
        trend={3.4}
        trendLabel="Active this term"
        accent="emerald"
        delay={0}
      />
      <KpiCard
        label="Pending Submissions"
        value={PENDING_SUBS}
        icon={<Clock className="h-5 w-5" />}
        trendLabel="Awaiting student submission"
        accent="amber"
        delay={0.05}
      />
      <KpiCard
        label="Graded"
        value={graded}
        icon={<CheckCircle2 className="h-5 w-5" />}
        trend={6.2}
        trendLabel="Evaluation complete"
        accent="cyan"
        delay={0.1}
      />
      <KpiCard
        label="Avg Score"
        value={avgScore}
        suffix="%"
        icon={<Award className="h-5 w-5" />}
        trend={2.8}
        trendLabel="Across graded assignments"
        accent="rose"
        delay={0.15}
      />
    </div>
  )
}
