'use client'

/**
 * FeesOverviewSection — the default landing view for Fee Management.
 *
 * Layout:
 *   - Premium KPI cards (4 clickable cards)
 *   - Two-column charts: Collection Trend + Fee Head Distribution
 *   - Two-column: Outstanding Aging + Class-wise Collection
 *   - Recent Collections + Needs Attention
 */

import { motion } from 'framer-motion'
import {
  Wallet, CheckCircle2, AlertCircle, Clock, TrendingUp,
  ArrowRight, Banknote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFeeData } from '@/lib/store/fee-store'
import { formatINR, formatDate, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { FeeKpiCard, FeePanel, FeeStatusBadge, FeeEmptyState, ModeIcon, modeAccent } from './fees-shared'
import { MiniAreaChart, MiniDonut, MiniBars } from './fees-charts'
import type { FeeTab } from './fees-shared'

interface Props {
  data: ReturnType<typeof useFeeData>
  onNavigate: (tab: FeeTab) => void
}

export function FeesOverviewSection({ data, onNavigate }: Props) {
  const { analytics } = data

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <FeeKpiCard
          icon={<Wallet className="h-4 w-4" />}
          label="Total Expected"
          value={formatINR(analytics.totalExpected, true)}
          sub={`${data.accounts.length} students`}
          accent="emerald"
          delay={0}
          onClick={() => onNavigate('structures')}
        />
        <FeeKpiCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Collected"
          value={formatINR(analytics.totalCollected, true)}
          sub={`${analytics.collectionRate}% collected`}
          accent="emerald"
          delay={0.05}
          onClick={() => onNavigate('collections')}
        />
        <FeeKpiCard
          icon={<AlertCircle className="h-4 w-4" />}
          label="Outstanding"
          value={formatINR(analytics.totalOutstanding, true)}
          sub={`${analytics.pendingCount} students with dues`}
          accent="rose"
          delay={0.1}
          onClick={() => onNavigate('dues')}
        />
        <FeeKpiCard
          icon={<Clock className="h-4 w-4" />}
          label="Pending Verification"
          value={String(analytics.pendingCashRequests + analytics.pendingVerification)}
          sub={`${analytics.pendingCashRequests} cash · ${analytics.pendingVerification} payments`}
          accent="amber"
          delay={0.15}
          onClick={() => onNavigate('approvals')}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Collection Trend (larger) */}
        <FeePanel
          className="lg:col-span-2"
          title="Collection Trend"
          subtitle="monthly collection this academic year"
          action={<Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => onNavigate('collections')}>Collections <ArrowRight className="h-3 w-3" /></Button>}
        >
          {analytics.monthly.some((m) => m.collected > 0) ? (
            <MiniAreaChart data={analytics.monthly} height={140} />
          ) : (
            <FeeEmptyState icon={<TrendingUp className="h-5 w-5" />} title="No collections yet" description="Record a payment to see the trend." />
          )}
        </FeePanel>

        {/* Fee Head Distribution donut */}
        <FeePanel
          title="Fee Head Distribution"
          subtitle="expected revenue by head"
        >
          <MiniDonut
            data={analytics.byCategory}
            centerLabel="Expected"
            centerValue={formatINR(analytics.byCategory.reduce((s, c) => s + c.value, 0), true)}
          />
        </FeePanel>
      </div>

      {/* Aging + Class-wise */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Outstanding Aging */}
        <FeePanel
          title="Outstanding Aging"
          subtitle="students by overdue period"
          action={<Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => onNavigate('dues')}>Dues <ArrowRight className="h-3 w-3" /></Button>}
        >
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { label: 'Due Soon', value: analytics.aging.dueSoon, color: 'text-amber-600', bg: 'bg-amber-500/10' },
              { label: '1–7d', value: analytics.aging['1-7'], color: 'text-amber-600', bg: 'bg-amber-500/10' },
              { label: '8–30d', value: analytics.aging['8-30'], color: 'text-orange-600', bg: 'bg-orange-500/10' },
              { label: '31–60d', value: analytics.aging['31-60'], color: 'text-rose-600', bg: 'bg-rose-500/10' },
              { label: '60+d', value: analytics.aging['60+'], color: 'text-rose-700', bg: 'bg-rose-500/15' },
            ].map((a) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={cn('text-center p-2 rounded-md', a.bg)}
              >
                <p className={cn('text-base font-bold tabular-nums', a.color)}>{a.value}</p>
                <p className="text-[8px] text-muted-foreground mt-0.5 font-medium">{a.label}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border/40">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-muted-foreground">Outstanding</span>
              <span className="font-bold tabular-nums">{formatINR(analytics.totalOutstanding, true)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Late Fee</span>
              <span className="font-bold tabular-nums text-amber-600">{formatINR(analytics.totalLateFee, true)}</span>
            </div>
          </div>
        </FeePanel>

        {/* Class-wise Top Performers */}
        <FeePanel
          className="lg:col-span-2"
          title="Class-wise Collection"
          subtitle="top classes by outstanding"
          action={<Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => onNavigate('reports')}>Reports <ArrowRight className="h-3 w-3" /></Button>}
        >
          <MiniBars
            data={analytics.classWise.slice(0, 6).map((c) => ({
              label: `${c.className} (${c.students})`,
              value: c.outstanding,
              secondary: c.collected,
              color: c.collectionRate >= 75 ? 'oklch(0.55 0.14 162)' : c.collectionRate >= 50 ? 'oklch(0.65 0.16 75)' : 'oklch(0.62 0.2 25)',
            }))}
            format={(n) => formatINR(n, true)}
            height={140}
            showSecondary
          />
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/40 text-[9px] text-muted-foreground">
            <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-foreground/60" /> Outstanding</div>
            <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/30" /> Collected</div>
          </div>
        </FeePanel>
      </div>

      {/* Recent Collections + Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Recent Collections */}
        <FeePanel
          title="Recent Collections"
          subtitle="last 5 payments"
          action={<Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => onNavigate('transactions')}>All <ArrowRight className="h-3 w-3" /></Button>}
        >
          <div className="space-y-1.5">
            {analytics.recentCollections.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-2 rounded-md hover:bg-muted/30 px-1.5 py-1.5 transition-colors"
              >
                <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1', modeAccent(t.mode))}>
                  <ModeIcon mode={t.mode} className="h-3 w-3" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold truncate">{t.studentName}</p>
                  <p className="text-[9px] text-muted-foreground font-mono">{t.receiptNo} · {formatRelativeTime(t.date)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold tabular-nums text-emerald-600">{formatINR(t.amount, true)}</p>
                  <FeeStatusBadge status={t.status} />
                </div>
              </motion.div>
            ))}
            {analytics.recentCollections.length === 0 && (
              <FeeEmptyState icon={<Banknote className="h-5 w-5" />} title="No payments yet" description="Recorded payments will appear here." />
            )}
          </div>
        </FeePanel>

        {/* Urgent Dues */}
        <FeePanel
          title="Needs Attention"
          subtitle="oldest and largest dues"
          action={<Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => onNavigate('dues')}>All <ArrowRight className="h-3 w-3" /></Button>}
        >
          <div className="space-y-1.5">
            {analytics.urgentActions.map((a, i) => (
              <motion.button
                key={a.studentId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="w-full flex items-center gap-2 rounded-md hover:bg-muted/30 px-1.5 py-1.5 transition-colors text-left"
                onClick={() => onNavigate('dues')}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20 text-[10px] font-semibold tabular-nums">
                  {a.daysOverdue}d
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold truncate">{a.studentName}</p>
                  <p className="text-[9px] text-muted-foreground font-mono">{a.admissionNo} · {a.className}-{a.section}</p>
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
        </FeePanel>
      </div>
    </div>
  )
}
