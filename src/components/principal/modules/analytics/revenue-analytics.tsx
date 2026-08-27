'use client'

import { TrendingUp, Wallet, IndianRupee, Activity } from 'lucide-react'
import { motion } from 'framer-motion'
import { KpiCard } from '@/components/shared/kpi-card'
import { GlassCard } from '@/components/shared/ui'
import { ChartCard, DualArea, Donut, ProgressBar } from '@/components/shared/charts'
import { OpenChartSection } from '../shared/open-chart-section'
import { revenueAnalytics } from '@/lib/mock/finance'
import { formatINR } from '@/lib/format'
import { expenseBreakdown } from './data'

export function RevenueAnalytics() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Revenue" value={revenueAnalytics.totalRevenue} format={(n) => formatINR(n, true)} icon={<TrendingUp className="h-5 w-5" />} trend={16.4} accent="emerald" delay={0} />
        <KpiCard label="Total Expenses" value={revenueAnalytics.expenses} format={(n) => formatINR(n, true)} icon={<Wallet className="h-5 w-5" />} trend={4.8} accent="rose" delay={0.05} />
        <KpiCard label="Net Surplus" value={revenueAnalytics.netSurplus} format={(n) => formatINR(n, true)} icon={<IndianRupee className="h-5 w-5" />} trend={28.4} accent="amber" delay={0.1} />
        <KpiCard label="Margin" value={42.7} suffix="%" decimals={1} icon={<Activity className="h-5 w-5" />} trend={3.6} accent="violet" delay={0.15} />
      </div>

      {/* Revenue vs Expenses — OPEN, no card border */}
      <OpenChartSection
        title="Revenue vs Expenses"
        subtitle="Monthly · Apr · Recent"
      >
        <DualArea data={revenueAnalytics.monthly} xKey="month" keys={[{ key: 'revenue', color: 'oklch(0.55 0.14 162)', name: 'Revenue' }, { key: 'expense', color: 'oklch(0.62 0.2 25)', name: 'Expenses' }]} height={220} showArea={false} />
      </OpenChartSection>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <ChartCard title="Expense Breakdown" subtitle="By category · Annual" height={300}>
          <Donut data={expenseBreakdown} centerValue={`${formatINR(revenueAnalytics.expenses, true)}`} centerLabel="Total" height={300} />
        </ChartCard>

        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-1">Net Surplus Trend</h3>
          <p className="text-xs text-muted-foreground mb-4">Monthly net (Revenue − Expenses)</p>
          <div className="space-y-2.5">
            {revenueAnalytics.monthly.map((m, i) => {
              const net = m.revenue - m.expense
              const pct = (net / 20000000) * 100
              return (
                <motion.div
                  key={m.month}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="space-y-1"
                >
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{m.month}</span>
                    <span className="text-emerald-600 font-semibold">{formatINR(net, true)}</span>
                  </div>
                  <ProgressBar value={pct} color="oklch(0.55 0.14 162)" height={6} />
                </motion.div>
              )
            })}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
