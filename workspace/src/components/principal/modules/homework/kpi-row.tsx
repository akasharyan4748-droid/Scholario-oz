'use client'

import { Clock, CheckCircle2, FileText, TrendingUp } from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'

interface Props {
  metrics: {
    activeCount: number
    totalSubs: number
    totalCapacity: number
    avgCompletion: number
    pendingReview: number
  }
}

export function HomeworkKpiRow({ metrics }: Props) {
  const { activeCount, totalSubs, totalCapacity, avgCompletion, pendingReview } = metrics
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard
        label="Active Homework"
        value={activeCount}
        icon={<Clock className="h-5 w-5" />}
        trend={4.2}
        trendLabel="Across all classes"
        accent="amber"
        delay={0}
      />
      <KpiCard
        label="Total Submissions"
        value={totalSubs}
        icon={<CheckCircle2 className="h-5 w-5" />}
        trend={8.6}
        trendLabel={`Of ${totalCapacity} assigned`}
        accent="emerald"
        delay={0.05}
      />
      <KpiCard
        label="Avg Completion"
        value={avgCompletion}
        suffix="%"
        icon={<TrendingUp className="h-5 w-5" />}
        trend={2.1}
        trendLabel="School-wide average"
        accent="cyan"
        delay={0.1}
      />
      <KpiCard
        label="Pending Review"
        value={pendingReview}
        icon={<FileText className="h-5 w-5" />}
        trendLabel="Awaiting submission"
        accent="rose"
        delay={0.15}
      />
    </div>
  )
}
