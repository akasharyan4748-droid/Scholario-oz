'use client'

/**
 * FinanceOverviewSection — Principal's financial command center landing view.
 *
 * (FC-1: Revenue vs Expenses opened up — OpenChartSection, no card border,
 *  smooth thin dual line, no area fill, height 200. Composition/ranking charts
 *  — Expense Breakdown, Budget vs Actual, Quarterly Performance — stay in
 *  FinancePanel since they benefit from the card.)
 *
 * Layout:
 *   - KPI cards (Revenue, Expenses, Net Surplus, Cash Available)
 *   - Revenue vs Expenses (OPEN dual-line chart)
 *   - Expense Breakdown (horizontal bars, panel)
 *   - Budget vs Actual (comparison table, panel)
 *   - Financial Health (ratios + overall status, panel)
 *   - Cash Position (cash in / out / closing, panel)
 *   - Quarterly Performance (grouped bars, panel)
 *   - Receivables / Payables / Needs Attention (3-col panels)
 *   - Recent Financial Activity (panel)
 */

import { motion } from 'framer-motion'
import {
  Wallet, TrendingUp, TrendingDown, Banknote, ShieldCheck, ArrowRight,
  AlertCircle, Receipt, ArrowDownRight, ArrowUpRight, Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFinanceData, formatINRCompact } from '@/lib/store/finance-store'
import { formatINR, formatDate, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CHART_PALETTE } from '@/components/shared/premium-charts'
import { FinancePanel, FinanceStat, HealthStatusBadge,
  FinanceEmptyState, severityAccent, severityColor,
} from './finance-shared'
import { SummaryCard, SummaryCardGrid } from '../shared/summary-card'
import { OpenChartSection } from '../shared/open-chart-section'
import {
  DualAreaChart, HorizontalBars, GroupedBars, ProgressBar,
} from './finance-charts'
import { toast } from 'sonner'

interface Props {
  data: ReturnType<typeof useFinanceData>
  onNavigate: (tab: 'overview' | 'statements' | 'reports') => void
  /** Optional cross-module jump (AppShell nav keys — 'fees', 'salary').
   *  Falls back to an honest toast when the shell can't navigate. */
  onModuleNavigate?: (moduleKey: string) => void
}

export function FinanceOverviewSection({ data, onNavigate, onModuleNavigate }: Props) {
  const jumpTo = (moduleKey: string, label: string) => {
    if (onModuleNavigate) onModuleNavigate(moduleKey)
    else toast.info(`Navigate to ${label}`, { description: 'Open it from the sidebar' })
  }

  // Alert actions land somewhere real: finance tabs jump inside the shell,
  // module keys jump across the app, anything else keeps an honest toast.
  const handleAlertAction = (alert: { action?: string; actionModule?: string }) => {
    if (!alert.action) return
    if (alert.actionModule === 'overview' || alert.actionModule === 'statements' || alert.actionModule === 'reports') {
      onNavigate(alert.actionModule)
    } else if (alert.actionModule) {
      jumpTo(alert.actionModule, alert.action)
    } else {
      toast.info(alert.action)
    }
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards — Academics canonical SummaryCard pattern */}
      <SummaryCardGrid columns={4}>
        <SummaryCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Total Revenue"
          value={formatINRCompact(data.totalRevenue)}
          sub={`${data.period.label}`}
          tone="emerald"
          delay={0}
          sparkline={data.monthlyTrend.map((m) => m.revenue)}
          trend="up"
        />
        <SummaryCard
          icon={<TrendingDown className="h-4 w-4" />}
          label="Total Expenses"
          value={formatINRCompact(data.totalExpenses)}
          tone="rose"
          delay={0.05}
          sparkline={data.monthlyTrend.map((m) => m.expense)}
          trend="up"
        />
        <SummaryCard
          icon={<Wallet className="h-4 w-4" />}
          label="Net Surplus"
          value={formatINRCompact(data.netSurplus)}
          sub={`${data.surplusMargin}% margin`}
          tone="cyan"
          delay={0.1}
          sparkline={data.monthlyTrend.map((m) => m.revenue - m.expense)}
          trend="up"
        />
        <SummaryCard
          icon={<Banknote className="h-4 w-4" />}
          label="Cash Available"
          value={formatINRCompact(data.cashAvailable)}
          sub={`${data.reserveCoverage} months reserve`}
          tone="violet"
          delay={0.15}
          sparkline={data.monthlyTrend.map((m) => m.revenue)}
          trend="neutral"
        />
      </SummaryCardGrid>

      {/* Revenue vs Expenses + Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <OpenChartSection
          className="lg:col-span-2"
          title="Revenue vs Expenses"
          subtitle="monthly financial movement"
          action={
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: CHART_PALETTE[0] }} /> Revenue</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: CHART_PALETTE[1] }} /> Expenses</span>
            </div>
          }
        >
          <DualAreaChart data={data.monthlyTrend} height={200} primaryColor={CHART_PALETTE[0]} secondaryColor={CHART_PALETTE[1]} showArea={false} />
        </OpenChartSection>

        <FinancePanel
          title="Expense Breakdown"
          action={<Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => onNavigate('reports')}>Reports <ArrowRight className="h-3 w-3" /></Button>}
        >
          <HorizontalBars
            data={data.expenseBreakdown.slice(0, 7).map((e) => ({
              label: e.name,
              value: e.value,
              color: e.color,
            }))}
            formatValue={(n) => formatINR(n, true)}
          />
        </FinancePanel>
      </div>

      {/* Budget vs Actual + Financial Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <FinancePanel
          className="lg:col-span-2"
          title="Budget vs Actual"
          subtitle={`${data.budgetUtilization}% utilized · ${formatINRCompact(data.totalActual)} of ${formatINRCompact(data.totalBudget)}`}
          action={
            <div className="flex items-center gap-2">
              <span className={cn('text-[10px] font-semibold tabular-nums',
                data.totalVariance >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                {data.totalVariance >= 0 ? '+' : ''}{formatINRCompact(data.totalVariance)}
              </span>
            </div>
          }
        >
          <div className="space-y-2">
            <ProgressBar value={data.budgetUtilization} max={100} />
            <div className="rounded-md border border-border/40 divide-y divide-border/30">
              {data.budgetData.map((b) => {
                const variance = b.budget - b.actual
                const utilization = b.budget > 0 ? Math.round((b.actual / b.budget) * 100) : 0
                const isOver = variance < 0
                return (
                  <div key={b.category} className="flex items-center gap-3 px-2.5 py-1.5 text-[11px]">
                    <div className="w-20 shrink-0 font-medium truncate">{b.category}</div>
                    <div className="flex-1 min-w-0">
                      <ProgressBar value={utilization} max={100} />
                    </div>
                    <div className="text-right tabular-nums w-16">{formatINR(b.actual, true)}</div>
                    <div className="text-right tabular-nums w-16 text-muted-foreground">{formatINR(b.budget, true)}</div>
                    <div className={cn('text-right tabular-nums font-semibold w-14',
                      isOver ? 'text-rose-600' : 'text-emerald-600')}>
                      {variance >= 0 ? '-' : '+'}{formatINR(Math.abs(variance), true)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </FinancePanel>

        <FinancePanel
          title="Financial Health"
          action={<HealthStatusBadge status={data.overallHealth as 'Healthy' | 'Watch' | 'Attention'} />}
        >
          <div className="space-y-1.5">
            {data.healthMetrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between rounded-md hover:bg-muted/30 px-2 py-1.5 transition-colors"
              >
                <div>
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  <p className={cn('text-xs font-bold tabular-nums', severityColor(m.severity as 'healthy' | 'watch' | 'attention'))}>{m.value}</p>
                </div>
                <span className={cn('text-[9px] font-semibold', severityColor(m.severity as 'healthy' | 'watch' | 'attention'))}>{m.status}</span>
              </motion.div>
            ))}
          </div>
        </FinancePanel>
      </div>

      {/* Cash Position + Quarterly Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <FinancePanel
          title="Cash Position"
          action={<Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => onNavigate('statements')}>Statement <ArrowRight className="h-3 w-3" /></Button>}
        >
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <FinanceStat label="Opening Cash" value={formatINR(data.openingCash, true)} />
              <FinanceStat label="Closing Cash" value={formatINR(data.closingCash, true)} accent="emerald" />
              <FinanceStat label="Cash In" value={formatINR(data.operatingNet + data.financingNet, true)} accent="emerald" />
              <FinanceStat label="Cash Out" value={formatINR(Math.abs(data.investingNet), true)} accent="rose" />
            </div>
            <div className="rounded-md bg-emerald-500/5 border border-emerald-500/20 px-2.5 py-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Monthly Expense</span>
                <span className="font-bold tabular-nums">{formatINR(data.monthlyOperatingExpense, true)}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] mt-0.5">
                <span className="text-muted-foreground">Reserve Coverage</span>
                <span className="font-bold tabular-nums text-emerald-600">{data.reserveCoverage} months</span>
              </div>
            </div>
          </div>
        </FinancePanel>

        <FinancePanel
          className="lg:col-span-2"
          title="Quarterly Performance"
          action={
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500/80" /> Revenue</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-rose-500/80" /> Expenses</span>
            </div>
          }
        >
          <GroupedBars data={data.quarterly} height={160} />
        </FinancePanel>
      </div>

      {/* Receivables + Payables + Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Receivables */}
        <FinancePanel
          title="Receivables"
          action={<Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => jumpTo('fees', 'Fee Management')}>View <ArrowRight className="h-3 w-3" /></Button>}
        >
          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-muted-foreground">Outstanding Fees</p>
              <p className="text-lg font-bold tabular-nums text-rose-600">{formatINR(data.feeOutstanding, true)}</p>
              <p className="text-[10px] text-muted-foreground">{data.receivableStudentCount} students</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
              <FinanceStat label="Fee Revenue" value={formatINR(data.feeRevenue, true)} accent="emerald" />
              <FinanceStat label="Collection Rate" value={`${data.feeCollectionRate}%`} accent="emerald" />
            </div>
            {/* Fee-plan session health — live from Fee Structures (spec B) */}
            <button
              type="button"
              onClick={() => jumpTo('fees', 'Fee Management — Fee Structures')}
              className="w-full flex items-center justify-between rounded-md border border-border/50 bg-muted/30 px-2 py-1.5 hover:bg-muted/50 transition-colors text-left"
            >
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Layers className="h-3 w-3" /> Fee plans · {data.structureSession.session}
              </span>
              <span className={cn('text-[10px] font-bold tabular-nums',
                data.structureSession.published === data.structureSession.total
                  ? 'text-emerald-600' : 'text-amber-600')}>
                {data.structureSession.published}/{data.structureSession.total} published
              </span>
            </button>
          </div>
        </FinancePanel>

        {/* Payables */}
        <FinancePanel
          title="Upcoming Obligations"
        >
          <div className="space-y-1.5">
            {data.upcomingObligations.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-md hover:bg-muted/30 px-2 py-1.5 transition-colors">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium truncate">{o.title}</p>
                  <p className="text-[9px] text-muted-foreground">{o.due}</p>
                </div>
                <span className={cn('text-[11px] font-bold tabular-nums',
                  o.severity === 'warning' ? 'text-amber-600' : 'text-foreground')}>
                  {formatINR(o.amount, true)}
                </span>
              </div>
            ))}
          </div>
        </FinancePanel>

        {/* Needs Attention */}
        <FinancePanel
          title="Needs Attention"
          subtitle={`${data.alerts.length} alerts`}
        >
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {data.alerts.length > 0 ? data.alerts.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-2 rounded-md border border-border/40 px-2 py-1.5"
              >
                <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md ring-1', severityAccent(alert.severity))}>
                  <AlertCircle className="h-3 w-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold truncate">{alert.title}</p>
                  <p className="text-[9px] text-muted-foreground">{alert.description}</p>
                  {alert.action && (
                    <button
                      onClick={() => handleAlertAction(alert)}
                      className="text-[9px] text-primary font-semibold mt-0.5 hover:underline"
                    >
                      {alert.action} →
                    </button>
                  )}
                </div>
              </motion.div>
            )) : (
              <FinanceEmptyState icon={<ShieldCheck className="h-5 w-5" />} title="All clear" description="No alerts to review." />
            )}
          </div>
        </FinancePanel>
      </div>

      {/* Recent Financial Activity */}
      <FinancePanel
        title="Recent Financial Activity"
        action={<Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => onNavigate('reports')}>Reports <ArrowRight className="h-3 w-3" /></Button>}
      >
        <div className="space-y-1.5">
          {data.recentActivity.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-2 rounded-md hover:bg-muted/30 px-1.5 py-1.5 transition-colors"
            >
              <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1',
                a.type === 'income' ? 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20' :
                a.type === 'expense' ? 'bg-rose-500/10 text-rose-600 ring-rose-500/20' :
                a.type === 'payroll' ? 'bg-amber-500/10 text-amber-600 ring-amber-500/20' :
                'bg-sky-500/10 text-sky-600 ring-sky-500/20')}>
                {a.type === 'income' ? <ArrowUpRight className="h-3 w-3" /> :
                 a.type === 'expense' ? <ArrowDownRight className="h-3 w-3" /> :
                 a.type === 'payroll' ? <Wallet className="h-3 w-3" /> :
                 <Receipt className="h-3 w-3" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium truncate">{a.description}</p>
                <p className="text-[9px] text-muted-foreground">{formatRelativeTime(a.date)} · {a.status}</p>
              </div>
              {a.amount > 0 && (
                <div className="text-right shrink-0">
                  <p className={cn('text-xs font-bold tabular-nums',
                    a.type === 'income' ? 'text-emerald-600' :
                    a.type === 'expense' ? 'text-rose-600' : 'text-foreground')}>
                    {a.type === 'expense' ? '-' : a.type === 'income' ? '+' : ''}{formatINR(a.amount, true)}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
          {data.recentActivity.length === 0 && (
            <FinanceEmptyState icon={<Receipt className="h-5 w-5" />} title="No activity yet" description="Financial activity will appear here." />
          )}
        </div>
      </FinancePanel>

      {/* Quick navigation to Fee Management & Payroll — REAL cross-module jumps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => jumpTo('fees', 'Fee Management')}
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-3.5 text-left hover:border-emerald-500/40 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/20">
                <Wallet className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold">Fee Management</p>
                <p className="text-[10px] text-muted-foreground">{formatINRCompact(data.feeRevenue)} collected · {data.feeCollectionRate}% rate</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        <button
          onClick={() => jumpTo('salary', 'Salary & Payroll')}
          className="rounded-xl border border-violet-500/20 bg-violet-500/[0.03] p-3.5 text-left hover:border-violet-500/40 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500/20">
                <Receipt className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold">Salary & Payroll</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {data.payrollOutstanding > 0
                    ? <><span className="text-rose-600 font-semibold">{formatINRCompact(data.payrollOutstanding)}</span> unpaid · {formatINRCompact(data.payrollPendingReceipts)} receipts pending</>
                    : <>{formatINRCompact(data.payrollPaidSession)} paid · payroll clear</>}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
          </div>
        </button>
      </div>
    </div>
  )
}
