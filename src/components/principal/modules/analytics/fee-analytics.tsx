'use client'

import { IndianRupee, Wallet, TrendingUp, Users } from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { GlassCard } from '@/components/shared/ui'
import { ChartCard, DualArea, Donut, RadialGauge, ProgressBar } from '@/components/shared/charts'
import { OpenChartSection } from '../shared/open-chart-section'
import { feeAnalytics } from '@/lib/mock/finance'
import { formatINR } from '@/lib/format'

export function FeeAnalytics() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Collected" value={feeAnalytics.totalCollected} format={(n) => formatINR(n, true)} icon={<IndianRupee className="h-5 w-5" />} trend={14.2} accent="emerald" delay={0} />
        <KpiCard label="Pending Dues" value={feeAnalytics.pendingDues} format={(n) => formatINR(n, true)} icon={<Wallet className="h-5 w-5" />} trend={-4.2} accent="rose" delay={0.05} />
        <KpiCard label="Collected (Month)" value={feeAnalytics.collectedThisMonth} format={(n) => formatINR(n, true)} icon={<TrendingUp className="h-5 w-5" />} trend={8.6} accent="amber" delay={0.1} />
        <KpiCard label="Pending Count" value={feeAnalytics.pendingCount} icon={<Users className="h-5 w-5" />} trendLabel="Students with dues" accent="violet" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Collection vs Pending — OPEN, no card border */}
        <OpenChartSection
          className="lg:col-span-2"
          title="Collection vs Pending"
          subtitle="Monthly · Current FY"
        >
          <DualArea data={feeAnalytics.monthly} xKey="month" keys={[{ key: 'collected', color: 'oklch(0.55 0.14 162)', name: 'Collected' }, { key: 'pending', color: 'oklch(0.62 0.2 25)', name: 'Pending' }]} height={220} showArea={false} />
        </OpenChartSection>

        <GlassCard className="p-3 sm:p-4 lg:p-5 flex flex-col items-center justify-center">
          <h3 className="font-semibold text-sm mb-1 self-start">Collection Rate</h3>
          <p className="text-xs text-muted-foreground mb-3 self-start">Target: 95%</p>
          <RadialGauge value={feeAnalytics.collectionRate} label="collected" size={180} color="oklch(0.65 0.16 75)" />
          <div className="w-full mt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Collected</span>
              <span className="font-semibold text-emerald-600">{formatINR(feeAnalytics.totalCollected, true)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Pending</span>
              <span className="font-semibold text-rose-600">{formatINR(feeAnalytics.pendingDues, true)}</span>
            </div>
            <ProgressBar value={feeAnalytics.collectionRate} color="oklch(0.65 0.16 75)" />
          </div>
        </GlassCard>
      </div>

      <ChartCard title="Fee Collection by Category" subtitle="Distribution across fee components" height={300}>
        <Donut data={feeAnalytics.byCategory} centerValue={`${feeAnalytics.byCategory.length}`} centerLabel="Categories" height={300} />
      </ChartCard>
    </div>
  )
}
