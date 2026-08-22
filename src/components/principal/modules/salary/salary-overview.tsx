'use client'

/**
 * SalaryOverviewSection — landing view for Salary & Payroll.
 *
 * - KPI cards (Monthly Payroll, Net Payable, Deductions, Pending)
 * - Payroll Trend (smooth area chart)
 * - Earnings vs Deductions (clean donut)
 * - Department Payroll Cost (horizontal bars)
 * - Exceptions / Needs Attention
 */

import { motion } from 'framer-motion'
import {
  Wallet, CheckCircle2, AlertCircle, Clock, TrendingUp,
  ArrowRight, Users, ArrowDownRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSalaryData } from '@/lib/store/salary-store'
import { formatINR, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SalaryPanel, SalaryEmptyState } from './salary-shared'
import { SummaryCard, SummaryCardGrid } from '../shared/summary-card'
import { MiniAreaChart, MiniDonut, MiniBars } from '../fees/fees-charts'
import type { SalaryTab } from './salary-shared'

interface Props {
  data: ReturnType<typeof useSalaryData>
  onNavigate: (tab: SalaryTab) => void
}

export function SalaryOverviewSection({ data, onNavigate }: Props) {
  const { analytics, audit } = data

  return (
    <div className="space-y-4">
      {/* KPI Cards — Academics canonical SummaryCard pattern */}
      <SummaryCardGrid columns={4}>
        <SummaryCard
          icon={<Wallet className="h-4 w-4" />}
          label="Monthly Payroll"
          value={formatINR(analytics.monthlyPayroll, true)}
          sub={`${analytics.employeeCount} employees`}
          tone="sky"
          delay={0}
          onClick={() => onNavigate('payroll')}
        />
        <SummaryCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Net Payable"
          value={formatINR(analytics.netPayable, true)}
          sub="after deductions"
          tone="emerald"
          delay={0.05}
          onClick={() => onNavigate('payroll')}
        />
        <SummaryCard
          icon={<ArrowDownRight className="h-4 w-4" />}
          label="Deductions"
          value={formatINR(analytics.totalDeductions, true)}
          sub="PF · Tax · Insurance"
          tone="rose"
          delay={0.1}
          onClick={() => onNavigate('reports')}
        />
        <SummaryCard
          icon={<Clock className="h-4 w-4" />}
          label="Needs Attention"
          value={String(analytics.exceptions.length + analytics.pendingAdjustments)}
          sub={`${analytics.pendingAdjustments} pending`}
          tone="amber"
          delay={0.15}
          onClick={() => onNavigate('adjustments')}
        />
      </SummaryCardGrid>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Payroll Trend (larger) */}
        <SalaryPanel
          className="lg:col-span-2"
          title="Payroll Trend"
          action={<Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => onNavigate('history')}>History <ArrowRight className="h-3 w-3" /></Button>}
        >
          {analytics.monthly.some((m) => m.amount > 0) ? (
            <MiniAreaChart
              data={analytics.monthly.map((m) => ({ month: m.month, collected: m.amount }))}
              height={140}
              format={(n) => formatINR(n, true)}
            />
          ) : (
            <SalaryEmptyState icon={<TrendingUp className="h-5 w-5" />} title="No payroll history yet" description="Run your first payroll to see the trend." />
          )}
        </SalaryPanel>

        {/* Earnings vs Deductions donut */}
        <SalaryPanel
          title="Earnings vs Deductions"
          subtitle="this month"
        >
          <MiniDonut
            data={analytics.earningsVsDeductions}
            centerLabel="Net Pay"
            centerValue={formatINR(analytics.netPayable, true)}
          />
        </SalaryPanel>
      </div>

      {/* Department + Exceptions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Department Payroll Cost */}
        <SalaryPanel
          className="lg:col-span-2"
          title="Department Payroll Cost"
          action={<Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => onNavigate('reports')}>Reports <ArrowRight className="h-3 w-3" /></Button>}
        >
          <MiniBars
            data={analytics.departmentWise.slice(0, 6).map((d) => ({
              label: `${d.department} (${d.count})`,
              value: d.payroll,
              color: 'oklch(0.55 0.14 162)',
            }))}
            formatValue={(n) => formatINR(n, true)}
            height={140}
          />
        </SalaryPanel>

        {/* Exceptions / Needs Attention */}
        <SalaryPanel
          title="Needs Attention"
          subtitle={`${analytics.exceptions.length} items to review`}
          action={<Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => onNavigate('adjustments')}>All <ArrowRight className="h-3 w-3" /></Button>}
        >
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
            {analytics.exceptions.slice(0, 5).map((ex, i) => (
              <motion.div
                key={`${ex.employeeId}-${ex.type}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-2 rounded-md hover:bg-muted/30 px-1.5 py-1.5 transition-colors"
              >
                <div className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-1',
                  ex.severity === 'critical' ? 'bg-rose-500/10 text-rose-600 ring-rose-500/20' :
                  ex.severity === 'warning' ? 'bg-amber-500/10 text-amber-600 ring-amber-500/20' :
                  'bg-sky-500/10 text-sky-600 ring-sky-500/20',
                )}>
                  !
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold truncate">{ex.employeeName}</p>
                  <p className="text-[9px] text-muted-foreground">{ex.description}</p>
                </div>
              </motion.div>
            ))}
            {analytics.exceptions.length === 0 && (
              <SalaryEmptyState icon={<CheckCircle2 className="h-5 w-5" />} title="All clear" description="No exceptions to review." />
            )}
          </div>
        </SalaryPanel>
      </div>

      {/* Recent activity */}
      <SalaryPanel
        title="Recent Activity"
        action={<Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => onNavigate('history')}>All <ArrowRight className="h-3 w-3" /></Button>}
      >
        <div className="space-y-1.5">
          {audit.slice(0, 6).map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-2 rounded-md hover:bg-muted/30 px-1.5 py-1.5 transition-colors"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sky-500/10 text-sky-600">
                <Users className="h-3 w-3" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium truncate">{a.description}</p>
                <p className="text-[9px] text-muted-foreground">{formatRelativeTime(a.timestamp)} · by {a.actor}</p>
              </div>
            </motion.div>
          ))}
          {audit.length === 0 && (
            <SalaryEmptyState icon={<Users className="h-5 w-5" />} title="No activity yet" />
          )}
        </div>
      </SalaryPanel>
    </div>
  )
}
