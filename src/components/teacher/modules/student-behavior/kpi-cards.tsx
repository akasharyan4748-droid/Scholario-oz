'use client'

import { AlertTriangle, Shield, Star, ThumbsUp } from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { behaviorStats } from '@/lib/mock/behavior'

export function BehaviorKpis() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard label="Positive This Month" value={behaviorStats.positiveThisMonth} icon={<ThumbsUp className="h-5 w-5" />} accent="emerald" trend={12} trendLabel="vs last month" delay={0} />
      <KpiCard label="Open Concerns" value={behaviorStats.concernsThisMonth} icon={<AlertTriangle className="h-5 w-5" />} accent="amber" trend={-8} trendLabel="needs attention" delay={0.05} />
      <KpiCard label="Incidents" value={behaviorStats.incidentsThisMonth} icon={<Shield className="h-5 w-5" />} accent="rose" trend={-25} trendLabel="resolved quickly" delay={0.1} />
      <KpiCard label="Avg Class Conduct" value={behaviorStats.avgClassConduct} suffix="/100" icon={<Star className="h-5 w-5" />} accent="violet" trend={2.4} trendLabel="improving trend" delay={0.15} />
    </div>
  )
}
