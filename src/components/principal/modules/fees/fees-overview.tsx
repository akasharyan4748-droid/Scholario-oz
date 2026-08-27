'use client'

/**
 * FeesOverviewSection — the Fee Management landing view: a FINANCIAL
 * COMMAND CENTRE. The Principal grasps the school's position in seconds:
 *
 *   1. Four KPI cards (Total Expected · Collected · Outstanding ·
 *      Students With Dues) — clickable, wired to Accounts/Transactions.
 *   2. Collection Trend (Panel, compact ~180px chart) + Breakdown
 *      (expected obligation by fee head, thin CSS bars) side by side.
 *   3. Outstanding Dues + Needs Attention — one two-column grid of
 *      ACTIONABLE panels: avatar rows with amount + overdue chip; every
 *      row navigates to Student Accounts. (Replaces the former dues +
 *      attention duplicate sections and the aging bucket strip.)
 *   4. Recent Payments (summary only — full history in Transactions)
 *      + Payment Modes mix.
 *
 * REMOVED from this view: aging buckets, class-wise bar chart, and the
 * old category strip — redundant with the panels above. Fee-structure
 * CONFIGURATION status lives in the Fee Structures tab, not here.
 *
 * All numbers derive from useFeeData() — the same single calculation path
 * the Payments page, Transactions ledger, and Student Accounts consume.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet, CheckCircle2, AlertCircle, Users, ArrowRight, CheckCheck, Banknote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFeeData, CURRENT_ACADEMIC_YEAR } from '@/lib/store/fee-store'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SummaryCard, SummaryCardGrid } from '../shared/summary-card'
import { Panel } from '../shared/panel'
import { FeeEmptyState, ModeIcon, modeAccent } from './fees-shared'
import { MiniAreaChart, FEES_CHART_PALETTE } from './fees-charts'
import type { FeeTab } from './fees-shared'

interface Props {
  data: ReturnType<typeof useFeeData>
  onNavigate: (tab: FeeTab) => void
}

/** Stream-aware display: classWise rows key by classId (C14-PCM…) while
 *  className collapses streams — re-attach so 11 PCM ≠ 11 PCB rows. */
function classDisplayName(className: string, classId: string): string {
  const m = /^(C1[45])-(PCM|PCB|PCMB)$/.exec(classId || '')
  if (m) {
    const base = className.replace(/\s*—\s*Science.*$/, '')
    return `${base} (${m[2]})`
  }
  return className
}

/** Avatar initials for student rows ("Aarav Sharma" → "AS"). */
function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => (p[0] ?? '').toUpperCase()).join('')
}

/** Minimal days-overdue chip (spec chip recipe: emerald/amber/rose/slate tints).
 *  Escalation: Due soon → slate · ≤30d → amber · >30d → rose. */
function OverdueChip({ days }: { days: number }) {
  const tone =
    days <= 0 ? 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
      : days <= 30 ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
        : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap', tone)}>
      {days <= 0 ? 'Due soon' : `${days}d overdue`}
    </span>
  )
}

export function FeesOverviewSection({ data, onNavigate }: Props) {
  const { analytics, accounts, transactions } = data

  // Session label read from the ledger itself (honest — never hardcoded).
  const yearLabel = useMemo(() => {
    const years = new Set(transactions.map((t) => t.academicYear).filter(Boolean))
    return Array.from(years)[0] ?? CURRENT_ACADEMIC_YEAR
  }, [transactions])

  // Largest outstanding balances — the collection worklist (max 25 kept,
  // scroll cap shows ~5 at a time).
  const topDues = useMemo(
    () => [...accounts].filter((a) => a.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding).slice(0, 25),
    [accounts],
  )

  // Classes with students carrying dues (KPI sub-line).
  const classesWithDues = useMemo(
    () => new Set(accounts.filter((a) => a.outstanding > 0).map((a) => a.classId)).size,
    [accounts],
  )

  // Recent successful payments — a concise activity SUMMARY (the complete
  // authoritative history lives in the Transactions section).
  const recentPayments = useMemo(
    () =>
      [...transactions]
        .filter((t) => t.status === 'Success')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6),
    [transactions],
  )

  // Payment mode mix — share of successfully collected amount.
  const modeMix = useMemo(() => {
    const totals = new Map<string, number>()
    let sum = 0
    for (const t of transactions) {
      if (t.status !== 'Success') continue
      totals.set(t.mode, (totals.get(t.mode) ?? 0) + t.amount)
      sum += t.amount
    }
    return Array.from(totals.entries())
      .map(([mode, value]) => ({ mode, value, pct: sum > 0 ? Math.round((value / sum) * 100) : 0 }))
      .sort((a, b) => b.value - a.value)
  }, [transactions])

  // Breakdown — expected obligation per fee head (store pre-sorts desc).
  const categories = analytics.byCategory
  const catTotal = useMemo(() => categories.reduce((sum, c) => sum + c.value, 0), [categories])
  const catMax = categories[0]?.value ?? 0
  const visibleCategories = categories.slice(0, 6)
  const hiddenCategories = Math.max(0, categories.length - visibleCategories.length)

  const trendHasData = analytics.monthly.some((m) => m.collected > 0 || m.pending > 0)

  /* Shared row anatomy — avatar + identity + right-aligned amount/chip. */
  const listPanelBtnClass =
    'w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left focus:outline-none focus-visible:bg-muted/40'

  return (
    <div className="space-y-4">
      {/* 1 — KPI cards: the Principal's four questions */}
      <SummaryCardGrid columns={4}>
        <SummaryCard
          icon={<Wallet className="h-4 w-4" />}
          label="Total Expected"
          value={formatINR(analytics.totalExpected, true)}
          sub={`${accounts.length} students`}
          tone="slate"
          delay={0}
        />
        <SummaryCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Collected"
          value={formatINR(analytics.totalCollected, true)}
          sub={`${analytics.collectionRate}% collected`}
          tone="emerald"
          delay={0.05}
          onClick={() => onNavigate('transactions')}
        />
        <SummaryCard
          icon={<AlertCircle className="h-4 w-4" />}
          label="Outstanding"
          value={formatINR(analytics.totalOutstanding, true)}
          sub={
            analytics.totalLateFee > 0
              ? `incl. ${formatINR(analytics.totalLateFee, true)} late fee`
              : `${analytics.overdueCount} overdue`
          }
          tone="rose"
          delay={0.1}
          onClick={() => onNavigate('accounts')}
        />
        <SummaryCard
          icon={<Users className="h-4 w-4" />}
          label="Students With Dues"
          value={analytics.pendingCount}
          sub={`across ${classesWithDues} classes`}
          tone="amber"
          delay={0.15}
          onClick={() => onNavigate('accounts')}
        />
      </SummaryCardGrid>

      {/* 2 — Collection Trend + Breakdown (one command-centre row).
          ONE legend — Panel action slot, colored to exactly match the
          chart's series; the chart itself renders none. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 min-w-0">
          <Panel
            title="Collection Trend"
            subtitle={`${yearLabel} · collected vs pending`}
            className="h-full"
            action={
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: FEES_CHART_PALETTE.collected }} /> Collected
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: FEES_CHART_PALETTE.pending }} /> Pending
                </span>
              </div>
            }
          >
            {trendHasData ? (
              <MiniAreaChart data={analytics.monthly} height={180} format={(n) => formatINR(n, true)} showArea />
            ) : (
              <p className="text-xs text-muted-foreground py-10 text-center">No collections yet — record a payment to see the trend.</p>
            )}
          </Panel>
        </div>

        {/* Expected obligation per fee head — honest policy view (bars are
            relative to the largest head, share % is of total expected). */}
        <Panel title="Breakdown" subtitle={`${yearLabel} · expected by fee head`} className="h-full" bodyClassName="p-0">
          {visibleCategories.length > 0 ? (
            <div className="divide-y divide-border py-1">
              {visibleCategories.map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span aria-hidden className="h-2 w-2 rounded-full shrink-0" style={{ background: c.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        {catTotal > 0 ? Math.round((c.value / catTotal) * 100) : 0}% of expected
                      </p>
                    </div>
                    <span className="text-xs font-semibold tabular-nums shrink-0">{formatINR(c.value, true)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${catMax > 0 ? Math.max(3, Math.round((c.value / catMax) * 100)) : 0}%` }}
                      transition={{ duration: 0.5, delay: i * 0.06 }}
                      className="h-full rounded-full"
                      style={{ background: c.color }}
                    />
                  </div>
                </motion.div>
              ))}
              {hiddenCategories > 0 && (
                <p className="px-4 py-2 text-[10px] text-muted-foreground">+{hiddenCategories} more heads</p>
              )}
            </div>
          ) : (
            <div className="py-6">
              <FeeEmptyState icon={<Wallet className="h-5 w-5" />} title="No fee heads configured." description="Set up fee structures to see the breakdown." />
            </div>
          )}
        </Panel>
      </div>

      {/* 3 — Outstanding Dues + Needs Attention (merged actionable pair).
          Every row navigates to Student Accounts; chips carry the aging
          signal inline so no separate buckets section is needed. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel
          title="Outstanding Dues"
          subtitle={`${topDues.length} student${topDues.length === 1 ? '' : 's'} · largest balances`}
          className="h-full"
          action={
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5" onClick={() => onNavigate('accounts')}>
              View accounts <ArrowRight className="h-3 w-3" />
            </Button>
          }
          bodyClassName="p-0"
        >
          {topDues.length > 0 ? (
            <div className="divide-y divide-border max-h-72 overflow-y-auto custom-scrollbar py-1">
              {topDues.map((a, i) => (
                <motion.button
                  key={a.studentId}
                  type="button"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => onNavigate('accounts')}
                  aria-label={`Open fee account for ${a.studentName}, outstanding ${formatINR(a.outstanding, true)}`}
                  className={listPanelBtnClass}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-500/10 ring-1 ring-slate-500/20 text-[9px] font-semibold text-slate-600 dark:text-slate-300">
                    {initialsOf(a.studentName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{a.studentName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {classDisplayName(a.className, a.classId)} · {a.section} · {a.admissionNo}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className="text-xs font-bold tabular-nums text-rose-600 dark:text-rose-400">{formatINR(a.outstanding, true)}</span>
                    <OverdueChip days={a.daysOverdue} />
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="py-6">
              <FeeEmptyState
                icon={<CheckCheck className="h-5 w-5" />}
                title="All student accounts are clear."
                description="No outstanding dues to follow up on right now."
              />
            </div>
          )}
        </Panel>

        <Panel
          title="Needs Attention"
          subtitle={`${analytics.urgentActions.length} urgent · oldest overdue first`}
          className="h-full"
          action={
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5" onClick={() => onNavigate('accounts')}>
              Follow up <ArrowRight className="h-3 w-3" />
            </Button>
          }
          bodyClassName="p-0"
        >
          <div className="divide-y divide-border max-h-72 overflow-y-auto custom-scrollbar py-1">
            {analytics.urgentActions.map((a, i) => (
              <motion.button
                key={a.studentId}
                type="button"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onNavigate('accounts')}
                aria-label={`Follow up on ${a.studentName}, ${a.daysOverdue > 0 ? `${a.daysOverdue} days overdue` : 'due soon'}, total due ${formatINR(a.totalDue, true)}`}
                className={listPanelBtnClass}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500/10 ring-1 ring-rose-500/20 text-[9px] font-semibold text-rose-600 dark:text-rose-300 tabular-nums">
                  {initialsOf(a.studentName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{a.studentName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {classDisplayName(a.className, a.classId)} · {a.section} · {a.admissionNo}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span className="text-xs font-bold tabular-nums text-rose-600 dark:text-rose-400">{formatINR(a.totalDue, true)}</span>
                  <OverdueChip days={a.daysOverdue} />
                </div>
              </motion.button>
            ))}
            {analytics.urgentActions.length === 0 && (
              <div className="py-6">
                <FeeEmptyState icon={<CheckCircle2 className="h-5 w-5" />} title="All fees are paid." description="No dues to follow up on." />
              </div>
            )}
          </div>
        </Panel>
      </div>

      {/* 4 — Recent Payments + Payment Modes (concise activity summary).
          Recent Payments is a SUMMARY only — "All transactions" goes to the
          authoritative ledger. Payment Modes is the analytical mix. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 min-w-0">
          <Panel
            title="Recent Payments"
            subtitle="latest collections across all counters"
            className="h-full"
            action={
              <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5" onClick={() => onNavigate('transactions')}>
                All transactions <ArrowRight className="h-3 w-3" />
              </Button>
            }
            bodyClassName="p-0"
          >
            {recentPayments.length > 0 ? (
              <div className="divide-y divide-border max-h-72 overflow-y-auto custom-scrollbar py-1">
                {recentPayments.map((t, i) => (
                  <motion.button
                    key={t.id}
                    type="button"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => onNavigate('transactions')}
                    aria-label={`View transaction for ${t.studentName}, ${formatINR(t.amount, true)} via ${t.mode}`}
                    className={listPanelBtnClass}
                  >
                    <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md ring-1', modeAccent(t.mode))}>
                      <ModeIcon mode={t.mode} className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate">{t.studentName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{t.className} · {formatDate(t.date)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatINR(t.amount, true)}</p>
                      <p className="text-[9px] text-muted-foreground font-mono">{t.receiptNo}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="py-6">
                <FeeEmptyState
                  icon={<Banknote className="h-5 w-5" />}
                  title="No payments recorded yet."
                  description="Successful payments will appear here as they come in."
                />
              </div>
            )}
          </Panel>
        </div>

        <Panel title="Payment Modes" subtitle="share of collected" className="h-full" bodyClassName="pt-1">
          {modeMix.length > 0 ? (
            <div className="space-y-2">
              {modeMix.map((m, i) => (
                <motion.div
                  key={m.mode}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <ModeIcon mode={m.mode as never} className="h-3 w-3 text-muted-foreground" />
                      {m.mode}
                    </span>
                    <span className="text-muted-foreground tabular-nums">{m.pct}% · {formatINR(m.value, true)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(2, m.pct)}%` }}
                      transition={{ duration: 0.5, delay: i * 0.06 }}
                      className="h-full rounded-full bg-emerald-500/80"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-6">
              <FeeEmptyState icon={<Wallet className="h-5 w-5" />} title="No payments yet." />
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
