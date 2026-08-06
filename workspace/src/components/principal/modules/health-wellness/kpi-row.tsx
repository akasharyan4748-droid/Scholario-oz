'use client'

import { CheckCircle2, Activity, Syringe, Stethoscope } from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { healthStats } from '@/lib/mock/health'

// 4-tile KPI strip — Healthy / Monitoring / Vaccination Rate / Infirmary Today.
export function KpiRow() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard label="Healthy Students" value={healthStats.healthyCount} icon={<CheckCircle2 className="h-5 w-5" />} accent="emerald" trend={2.4} trendLabel={`${Math.round((healthStats.healthyCount / healthStats.totalStudents) * 100)}% of school`} delay={0} />
      <KpiCard label="Under Monitoring" value={healthStats.monitoringCount} icon={<Activity className="h-5 w-5" />} accent="amber" trendLabel="chronic conditions" delay={0.05} />
      <KpiCard label="Vaccination Rate" value={healthStats.vaccinationRate} suffix="%" icon={<Syringe className="h-5 w-5" />} accent="violet" trend={4.2} trendLabel="this year" delay={0.1} />
      <KpiCard label="Infirmary Today" value={healthStats.infirmaryVisitsToday} icon={<Stethoscope className="h-5 w-5" />} accent="rose" trendLabel={`${healthStats.infirmaryVisitsMonth} this month`} delay={0.15} />
    </div>
  )
}
