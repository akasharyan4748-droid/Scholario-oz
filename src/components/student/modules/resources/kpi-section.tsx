'use client'

import { Library, Bookmark, CheckCircle2, Clock } from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { resourceStats } from '@/lib/mock/resources'

interface KpiSectionProps {
  bookmarkedCount: number
  completedCount: number
  completionRate: number
}

export function KpiSection({ bookmarkedCount, completedCount, completionRate }: KpiSectionProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard label="Total Resources" value={resourceStats.total} icon={<Library className="h-5 w-5" />} accent="violet" trendLabel="across 8 subjects" delay={0} />
      <KpiCard label="Bookmarked" value={bookmarkedCount} icon={<Bookmark className="h-5 w-5" />} accent="amber" trendLabel="your collection" delay={0.05} />
      <KpiCard label="Completed" value={completedCount} icon={<CheckCircle2 className="h-5 w-5" />} accent="emerald" trend={15} trendLabel={`${completionRate}% done`} delay={0.1} />
      <KpiCard label="Hours Learned" value={resourceStats.hoursLearned} suffix="h" icon={<Clock className="h-5 w-5" />} accent="cyan" trend={8} trendLabel="this month" delay={0.15} />
    </div>
  )
}
