'use client'

/**
 * FeesOverviewSection — the Fee Management landing view: the school's
 * financial position at a glance (INSIGHTS).
 *
 * Executive financial view — "what is happening and what needs attention":
 *
 *   1. Four KPI cards (Total Expected · Collected · Outstanding ·
 *      Students With Dues — the Principal's four questions)
 *   2. Collection Trend (open chart, flat on the page — Attendance
 *      chart architecture, honest ₹0-anchored currency axis)
 *   3. Outstanding Dues + Needs Attention (who owes, who's urgent)
 *   4. Recent Payments + Payment Modes (concise activity summary — the
 *      complete history lives in the Transactions section)
 *   5. Outstanding Aging (compact buckets)
 *   6. Class-wise Collection (stream-aware, top classes)
 *
 * Fee-structure CONFIGURATION status intentionally lives in the Fee
 * Structures tab, not here — this page is financial performance only.
 *
 * All numbers derive from useFeeData() — the same single calculation path
 * the Payments page, Transactions ledger, and Student Accounts consume.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet, CheckCircle2, AlertCircle, Users, ArrowRight,
  CheckCheck, Banknote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFeeData } from '@/lib/store/fee-store'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SummaryCard, SummaryCardGrid } from '../shared/summary-card'
import { FeeStatusBadge, FeeEmptyState, ModeIcon, modeAccent } from './fees-shared'
import { MiniAreaChart, MiniBars, FEES_CHART_PALETTE } from './fees-charts'
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

export function FeesOverviewSection({ data, onNavigate }: Props) {
  const { analytics, accounts, transactions } = data

  // Top outstanding + urgent dues (derived from the same accounts).
  const topDues = useMemo(
    () => [...accounts].filter((a) => a.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding).slice(0, 5),
    [accounts],
  )

  // Classes with students carrying dues.
  const classesWithDues = useMemo(
    () => new Set(accounts.filter((a) => a.outstanding > 0).map((a) => a.classId)).size,
    [accounts],
  )

  // Class-wise — top 6 by outstanding, stream-aware labels.
  const topClasses = useMemo(
    () => analytics.classWise.filter((c) => c.outstanding > 0).slice(0, 6),
    [analytics.classWise],
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

  // Payment mode mix — share of successfully collected amount (analytical
  // summary; compact rows, not a chart).
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

  return (
    <div className="space-y-6">
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
          sub={`${analytics.pendingCount} students with dues`}
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

      {/* 1b — Collection by Category (flat border-left strip, no boxes).
          Core school fees, examination fees and additional charges are
          reported SEPARATELY — never one mixed number. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        {(() => {
          const ct = analytics.categoryTotals
          const rows = [
            { label: 'Regular School Fees', collected: ct.core.collected, accent: 'border-emerald-500/40' },
            { label: 'Examination Fees', collected: ct.exam.collected, accent: 'border-orange-500/40' },
            { label: 'Additional Charges', collected: ct.additional.collected, accent: 'border-violet-500/40' },
            { label: 'Total Collected', collected: ct.core.collected + ct.exam.collected + ct.additional.collected, accent: 'border-foreground/20' },
          ]
          return rows.map((r) => (
            <div key={r.label} className={`border-l-2 ${r.accent} pl-3`}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{r.label}</p>
              <p className="text-base font-bold tabular-nums text-foreground leading-tight mt-0.5">
                {formatINR(r.collected, true)}
              </p>
            </div>
          ))
        })()}
      </div>

      {/* 2 — Collection Trend (open chart directly on the page).
          ONE legend — here in the section header, colored to exactly match
          the chart's series. The chart itself renders none. */}
      <section>
        <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Collection Trend</h3>
            <p className="text-[11px] text-muted-foreground">monthly collection this academic year</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: FEES_CHART_PALETTE.collected }} /> Collected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: FEES_CHART_PALETTE.pending }} /> Pending
            </span>
          </div>
        </div>
        {analytics.monthly.some((m) => m.collected > 0 || m.pending > 0) ? (
          <MiniAreaChart data={analytics.monthly} height={170} format={(n) => formatINR(n, true)} showArea />
        ) : (
          <p className="text-xs text-muted-foreground py-8 text-center">No collections yet — record a payment to see the trend.</p>
        )}
      </section>

      {/* 3 — Outstanding Dues + Needs Attention (two columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Outstanding Dues</h3>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => onNavigate('accounts')}>
              View Students <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          {topDues.length > 0 ? (
            <div className="divide-y divide-border">
              {topDues.map((a, i) => (
                <motion.button
                  key={a.studentId}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => onNavigate('accounts')}
                  className="w-full flex items-center gap-2 py-2.5 px-1.5 rounded-md hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{a.studentName}</p>
                    <p className="text-[10px] text-muted-foreground">{classDisplayName(a.className, a.classId)} · {a.section}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold tabular-nums text-rose-600">{formatINR(a.outstanding, true)}</p>
                    <FeeStatusBadge status={a.status} />
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <FeeEmptyState
              icon={<CheckCheck className="h-5 w-5" />}
              title="All student accounts are clear."
              description="No outstanding dues to follow up on right now."
            />
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Needs Attention</h3>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => onNavigate('accounts')}>
              View All <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="divide-y divide-border">
            {analytics.urgentActions.slice(0, 5).map((a, i) => (
              <motion.button
                key={a.studentId}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onNavigate('accounts')}
                className="w-full flex items-center gap-2.5 py-2.5 px-1.5 rounded-md hover:bg-muted/30 transition-colors text-left"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20 text-[10px] font-semibold tabular-nums">
                  {a.daysOverdue}d
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{a.studentName}</p>
                  <p className="text-[10px] text-muted-foreground">{classDisplayName(a.className, a.classId)} · {a.admissionNo}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold tabular-nums text-rose-600">{formatINR(a.totalDue, true)}</p>
                  <FeeStatusBadge status={a.status} />
                </div>
              </motion.button>
            ))}
            {analytics.urgentActions.length === 0 && (
              <FeeEmptyState icon={<CheckCircle2 className="h-5 w-5" />} title="All fees are paid" description="No dues to follow up on." />
            )}
          </div>
        </section>
      </div>

      {/* 4 — Recent Payments + Payment Modes (concise activity summary).
          Recent Payments is a SUMMARY only — "View All Transactions" goes to
          the authoritative ledger. Payment Modes is the analytical mix. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Recent Payments</h3>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => onNavigate('transactions')}>
              View All Transactions <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          {recentPayments.length > 0 ? (
            <div className="divide-y divide-border">
              {recentPayments.map((t, i) => (
                <motion.button
                  key={t.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => onNavigate('transactions')}
                  className="w-full flex items-center gap-3 py-2.5 px-1.5 text-left hover:bg-muted/30 rounded-md transition-colors"
                >
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md ring-1', modeAccent(t.mode))}>
                    <ModeIcon mode={t.mode} className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{t.studentName}</p>
                    <p className="text-[10px] text-muted-foreground">{t.className} · {formatDate(t.date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold tabular-nums text-emerald-600">{formatINR(t.amount, true)}</p>
                    <p className="text-[9px] text-muted-foreground font-mono">{t.receiptNo}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <FeeEmptyState
              icon={<Banknote className="h-5 w-5" />}
              title="No payments recorded yet."
              description="Successful payments will appear here as they come in."
            />
          )}
        </section>

        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Payment Modes</h3>
            <span className="text-[10px] text-muted-foreground">share of collected</span>
          </div>
          {modeMix.length > 0 ? (
            <div className="space-y-2.5">
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
            <FeeEmptyState icon={<Wallet className="h-5 w-5" />} title="No payments yet." />
          )}
        </section>
      </div>

      {/* 5 — Outstanding Aging (compact horizontal buckets) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Outstanding Aging</h3>
            <p className="text-[11px] text-muted-foreground">students by overdue period</p>
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            Outstanding {formatINR(analytics.totalOutstanding, true)}
            {analytics.totalLateFee > 0 && <> · Late fee {formatINR(analytics.totalLateFee, true)}</>}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Due Soon', value: analytics.aging.dueSoon, cls: 'text-amber-600' },
            { label: '1–7 days', value: analytics.aging['1-7'], cls: 'text-amber-600' },
            { label: '8–30 days', value: analytics.aging['8-30'], cls: 'text-orange-600' },
            { label: '31–60 days', value: analytics.aging['31-60'], cls: 'text-rose-600' },
            { label: '60+ days', value: analytics.aging['60+'], cls: 'text-rose-700' },
          ].map((a, i) => (
            <motion.button
              key={a.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i }}
              onClick={() => onNavigate('accounts')}
              disabled={a.value === 0}
              className={cn(
                'text-left border-l-2 pl-3 py-1 transition-colors',
                a.value > 0 ? 'border-border hover:border-emerald-500/40 cursor-pointer' : 'border-border/40 opacity-60 cursor-default',
              )}
            >
              <p className={cn('text-xl font-bold tabular-nums leading-none', a.value > 0 ? a.cls : 'text-muted-foreground')}>
                {a.value}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">{a.label}</p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* 6 — Class-wise Collection (stream-aware) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Class-wise Collection</h3>
            <p className="text-[11px] text-muted-foreground">top classes by outstanding</p>
          </div>
          <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => onNavigate('accounts')}>
            View All <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
        <MiniBars
          data={topClasses.map((c) => ({
            label: `${classDisplayName(c.className, c.classId)} (${c.students})`,
            value: c.outstanding,
            secondary: c.collected,
            color: c.collectionRate >= 75 ? 'oklch(0.55 0.14 162)' : c.collectionRate >= 50 ? 'oklch(0.65 0.16 75)' : 'oklch(0.62 0.2 25)',
          }))}
          formatValue={(n) => formatINR(n, true)}
          height={140}
          showSecondary
        />
        <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-foreground/60" /> Outstanding</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/30" /> Collected</span>
        </div>
      </section>
    </div>
  )
}

