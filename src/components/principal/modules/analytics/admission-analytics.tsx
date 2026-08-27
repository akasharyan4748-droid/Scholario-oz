'use client'

import { Users, UserPlus, TrendingUp, GraduationCap } from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartCard, AreaTrend, Donut, BarTrend } from '@/components/shared/charts'
import { OpenChartSection } from '../shared/open-chart-section'
import { studentStats } from '@/lib/mock/students'
import { admissionsMonthly, admissionGender } from './data'

export function AdmissionAnalytics() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Students" value={studentStats.total} icon={<Users className="h-5 w-5" />} trend={2.4} accent="emerald" delay={0} />
        <KpiCard label="This Month" value={studentStats.newThisMonth} icon={<UserPlus className="h-5 w-5" />} trend={18.4} accent="amber" delay={0.05} />
        <KpiCard label="This Year" value={studentStats.newThisYear} icon={<TrendingUp className="h-5 w-5" />} trend={12.6} accent="violet" delay={0.1} />
        <KpiCard label="Boys / Girls" value={studentStats.boys} suffix={` / ${studentStats.girls}`} icon={<GraduationCap className="h-5 w-5" />} trendLabel="Gender ratio 52:48" accent="cyan" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Monthly Admissions Trend — OPEN, no card border */}
        <OpenChartSection
          className="lg:col-span-2"
          title="Monthly Admissions Trend"
          subtitle="Apr · Recent"
        >
          <AreaTrend data={admissionsMonthly} xKey="name" yKey="value" color="oklch(0.65 0.16 75)" height={220} gradientId="admArea" showArea={false} />
        </OpenChartSection>

        <ChartCard title="Gender Distribution" subtitle="School-wide" height={300}>
          <Donut data={admissionGender} centerValue={`${studentStats.total}`} centerLabel="Students" height={300} />
        </ChartCard>
      </div>

      <ChartCard title="Admissions by Class" subtitle="Current academic year" height={300}>
        <BarTrend data={studentStats.byClass.map((c) => ({ name: c.class.length > 12 ? c.class.slice(0, 11) + '…' : c.class, value: c.count }))} xKey="name" yKey="value" color="oklch(0.55 0.14 162)" height={300} />
      </ChartCard>
    </div>
  )
}
