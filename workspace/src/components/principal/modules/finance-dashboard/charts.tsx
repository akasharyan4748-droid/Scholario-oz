'use client'

import { Gauge } from 'lucide-react'
import { ChartCard, DualArea, Donut, BarTrend, GroupedBar } from '@/components/shared/charts'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { financeStats } from '@/lib/mock/finance-dashboard'
import { formatINR } from '@/lib/format'
import { A, E, R, V } from './data'
import { RatioRow } from './shared'

// ChartsRow1 — Revenue vs Expenses dual area (lg:col-span-2) + Expense
// Breakdown donut. The status badge shows the surplus margin percentage.
export function ChartsRow1() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
      <ChartCard
        title="Revenue vs Expenses"
        subtitle="Monthly · AY 2025-26"
        className="lg:col-span-2"
        action={<StatusBadge status={`+${financeStats.netSurplusMargin}% margin`} variant="success" dot />}
      >
        <DualArea
          data={financeStats.monthlyRevenue}
          xKey="month"
          keys={[
            { key: 'revenue', color: E, name: 'Revenue' },
            { key: 'expense', color: R, name: 'Expenses' },
          ]}
          height={260}
        />
      </ChartCard>
      <ChartCard title="Expense Breakdown" subtitle="By category · annual">
        <Donut
          data={financeStats.expenseBreakdown}
          centerValue={formatINR(financeStats.totalExpenses, true)}
          centerLabel="expenses"
          height={260}
        />
      </ChartCard>
    </div>
  )
}

// ChartsRow2 — Quarterly Revenue vs Expense grouped bar (lg:col-span-2) +
// Quarterly Surplus bar trend. Both charts use compact INR label formats.
export function ChartsRow2() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
      <ChartCard
        title="Quarterly Revenue vs Expense"
        subtitle="Side-by-side comparison"
        className="lg:col-span-2"
        action={<StatusBadge status="4 quarters" variant="info" />}
      >
        <GroupedBar
          data={financeStats.quarterlyRevExp}
          xKey="quarter"
          series={[
            { key: 'revenue', name: 'Revenue', color: E },
            { key: 'expense', name: 'Expense', color: R },
          ]}
          height={260}
          labelFormat={(v) => formatINR(v, true)}
        />
      </ChartCard>
      <ChartCard title="Quarterly Surplus" subtitle="Net profit by quarter" action={<StatusBadge status="+18.6M Q4" variant="success" dot />}>
        <BarTrend
          data={financeStats.quarterlySurplus}
          xKey="quarter"
          yKey="surplus"
          color={E}
          height={260}
          showLabels
          labelFormat={(v) => formatINR(v, true)}
        />
      </ChartCard>
    </div>
  )
}

// BudgetVsActualRow — Budget vs Actual grouped bar (lg:col-span-2) + the
// Financial Health ratios card showing 5 auto-calculated ratios (Current
// Ratio, Debt-to-Equity, Surplus Margin, Operating Efficiency, Reserve
// Coverage). Each ratio uses a RatioRow with a good/warn icon.
export function BudgetVsActualRow() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
      <ChartCard
        title="Budget vs Actual"
        subtitle="FY 2025-26 · by category"
        className="lg:col-span-2"
        action={<StatusBadge status="On track" variant="success" dot />}
      >
        <GroupedBar
          data={financeStats.budgetVsActual}
          xKey="category"
          series={[
            { key: 'budget', name: 'Budget', color: V },
            { key: 'actual', name: 'Actual', color: E },
          ]}
          height={260}
          labelFormat={(v) => formatINR(v, true)}
        />
      </ChartCard>

      {/* Financial ratios */}
      <GlassCard className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Gauge className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm">Financial Health</h3>
            <p className="text-[10px] text-muted-foreground">Key ratios · auto-calculated</p>
          </div>
        </div>
        <div className="space-y-3.5">
          <RatioRow label="Current Ratio" value={financeStats.ratios.currentRatio} suffix="×" target={2} good={financeStats.ratios.currentRatio >= 2} hint="assets / liabilities" />
          <RatioRow label="Debt to Equity" value={financeStats.ratios.debtToEquity} suffix="×" target={0.5} good={financeStats.ratios.debtToEquity <= 0.5} hint="low leverage" invert />
          <RatioRow label="Surplus Margin" value={financeStats.ratios.surplusMargin} suffix="%" target={30} good={financeStats.ratios.surplusMargin >= 30} hint="net / revenue" />
          <RatioRow label="Operating Efficiency" value={financeStats.ratios.operatingEfficiency} suffix="%" target={70} good={financeStats.ratios.operatingEfficiency <= 70} hint="expense / revenue" invert />
          <RatioRow label="Reserve Coverage" value={financeStats.ratios.reserveCoverage} suffix=" mo" target={3} good={financeStats.ratios.reserveCoverage >= 3} hint="cash / monthly expense" />
        </div>
      </GlassCard>
    </div>
  )
}
