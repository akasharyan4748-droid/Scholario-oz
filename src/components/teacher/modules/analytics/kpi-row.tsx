'use client'

import { TrendingUp, CalendarCheck, Users, Award } from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'

export function KpiRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard label="Class Average" value={88} suffix="%" icon={<TrendingUp className="h-5 w-5" />} trend={5.2} trendLabel="Mathematics · UT3" accent="emerald" delay={0} />
      <KpiCard label="Attendance Rate" value={95.4} suffix="%" decimals={1} icon={<CalendarCheck className="h-5 w-5" />} trend={1.2} trendLabel="This week" accent="amber" delay={0.05} />
      <KpiCard label="Students Assessed" value={6} icon={<Users className="h-5 w-5" />} trendLabel="Mid-Term · all subjects" accent="violet" delay={0.1} />
      <KpiCard label="Top Scorer" value={96.7} suffix="%" decimals={1} icon={<Award className="h-5 w-5" />} trendLabel="Myra Iyer · Roll #10" accent="rose" delay={0.15} />
    </div>
  )
}
