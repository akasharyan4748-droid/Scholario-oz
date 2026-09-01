'use client'

import { Award, TrendingUp, GraduationCap, Activity } from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { GlassCard } from '@/components/shared/ui'
import { ChartCard, BarTrend, Donut, RadialGauge } from '@/components/shared/charts'
import { examAnalytics } from '@/lib/mock/academics'
import { classComparison } from './data'

export function PerformanceAnalytics() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <KpiCard label="Pass Percentage" value={examAnalytics.passPercentage} suffix="%" decimals={1} icon={<Award className="h-5 w-5" />} trend={1.6} accent="emerald" delay={0} />
        <KpiCard label="Distinctions" value={examAnalytics.distinction} icon={<TrendingUp className="h-5 w-5" />} trendLabel="A+ grade holders" accent="amber" delay={0.05} />
        <KpiCard label="First Class" value={examAnalytics.firstClass} icon={<GraduationCap className="h-5 w-5" />} trendLabel="A / B+ holders" accent="violet" delay={0.1} />
        <KpiCard label="Avg Score" value={examAnalytics.averageScore} suffix="%" decimals={1} icon={<Activity className="h-5 w-5" />} trend={3.2} accent="cyan" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <ChartCard title="Subject-wise Average" subtitle="Unit Test 3 · Class 1–10" className="lg:col-span-2" height={300}>
          <BarTrend data={examAnalytics.subjectPerformance.map((s) => ({ name: s.subject.length > 8 ? s.subject.slice(0, 7) + '…' : s.subject, value: s.avg }))} xKey="name" yKey="value" color="oklch(0.6 0.18 300)" height={300} />
        </ChartCard>

        <GlassCard className="p-3 sm:p-4 lg:p-5 flex flex-col items-center justify-center">
          <h3 className="font-semibold text-sm mb-1 self-start">Pass Rate</h3>
          <p className="text-xs text-muted-foreground mb-3 self-start">All classes · UT3</p>
          <RadialGauge value={examAnalytics.passPercentage} label="passed" size={180} color="oklch(0.55 0.14 162)" />
          <div className="w-full mt-4 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-xl bg-emerald-500/10 py-2">
              <p className="font-display text-base font-bold text-emerald-600">{examAnalytics.passPercentage}%</p>
              <p className="text-[10px] text-muted-foreground">Passed</p>
            </div>
            <div className="rounded-xl bg-rose-500/10 py-2">
              <p className="font-display text-base font-bold text-rose-600">{(100 - examAnalytics.passPercentage).toFixed(1)}%</p>
              <p className="text-[10px] text-muted-foreground">Failed</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <ChartCard title="Grade Distribution" subtitle="School-wide · UT3" height={300}>
          <Donut data={examAnalytics.gradeDistribution.map((g) => ({ name: g.grade, value: g.count, color: g.color }))} centerValue={`${examAnalytics.distinction + examAnalytics.firstClass}`} centerLabel="A+ / A" height={300} />
        </ChartCard>

        <ChartCard title="Class Comparison" subtitle="Average score by section" height={300}>
          <BarTrend data={classComparison} xKey="name" yKey="avg" color="oklch(0.7 0.15 200)" height={300} />
        </ChartCard>
      </div>
    </div>
  )
}
