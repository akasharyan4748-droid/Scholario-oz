'use client'

/**
 * FeesCollectionsSection — operational collection view.
 *
 * - Today / This Week / This Month / Academic Year tiles
 * - Payment mode distribution (mini donut)
 * - Recent payments table
 * - Quick collect action
 */

import { motion } from 'framer-motion'
import {
  Calendar, CalendarDays, CalendarRange, CalendarClock, Banknote, Plus, ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFeeData, type PaymentMode } from '@/lib/store/fee-store'
import { formatINR, formatDate, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { FeePanel, FeeEmptyState, ModeIcon, modeAccent, FeeStatusBadge } from './fees-shared'
import { MiniDonut, MiniBars } from './fees-charts'

interface Props {
  data: ReturnType<typeof useFeeData>
  onCollect: () => void
}

const MODE_COLORS: Record<PaymentMode, string> = {
  UPI: 'oklch(0.55 0.14 162)',
  Card: 'oklch(0.65 0.16 75)',
  'Net Banking': 'oklch(0.7 0.15 200)',
  Cash: 'oklch(0.62 0.2 25)',
  Cheque: 'oklch(0.6 0.18 300)',
  'Bank Transfer': 'oklch(0.65 0.14 250)',
}

export function FeesCollectionsSection({ data, onCollect }: Props) {
  const { analytics, transactions } = data
  const today = new Date().toISOString().split('T')[0]
  const todayTxns = transactions.filter((t) => t.date === today && t.status === 'Success')
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7)
  const weekTxns = transactions.filter((t) => new Date(t.date) >= weekStart && t.status === 'Success')
  const monthStart = new Date(); monthStart.setMonth(monthStart.getMonth() - 1)
  const monthTxns = transactions.filter((t) => new Date(t.date) >= monthStart && t.status === 'Success')
  const yearTxns = transactions.filter((t) => t.status === 'Success')

  // Payment mode distribution
  const modeMap = new Map<PaymentMode, number>()
  yearTxns.forEach((t) => modeMap.set(t.mode, (modeMap.get(t.mode) ?? 0) + t.amount))
  const modeData = Array.from(modeMap.entries()).map(([mode, value]) => ({
    name: mode,
    value,
    color: MODE_COLORS[mode],
  })).sort((a, b) => b.value - a.value)

  // Top collection days (last 30)
  const last30 = new Date(); last30.setDate(last30.getDate() - 30)
  const dayMap = new Map<string, number>()
  transactions.filter((t) => new Date(t.date) >= last30 && t.status === 'Success').forEach((t) => {
    dayMap.set(t.date, (dayMap.get(t.date) ?? 0) + t.amount)
  })
  const dayBars = Array.from(dayMap.entries())
    .map(([date, value]) => ({ label: formatDate(date).split(' ')[0], value, secondary: 0 }))
    .slice(-15)

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Collection tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <CollectionTile
          icon={<Calendar className="h-4 w-4" />}
          label="Today"
          value={analytics.todayCollection}
          count={todayTxns.length}
          delay={0}
        />
        <CollectionTile
          icon={<CalendarRange className="h-4 w-4" />}
          label="This Week"
          value={analytics.weekCollection}
          count={weekTxns.length}
          delay={0.05}
        />
        <CollectionTile
          icon={<CalendarDays className="h-4 w-4" />}
          label="This Month"
          value={analytics.monthCollection}
          count={monthTxns.length}
          delay={0.1}
        />
        <CollectionTile
          icon={<CalendarClock className="h-4 w-4" />}
          label="Academic Year"
          value={analytics.yearCollection}
          count={yearTxns.length}
          delay={0.15}
        />
      </div>

      {/* Quick collect banner */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-3 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shrink-0">
            <Banknote className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Collect a Payment</p>
            <p className="text-[10px] text-muted-foreground">Find student, enter amount, choose mode — receipt generated automatically.</p>
          </div>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white" onClick={onCollect}>
          <Plus className="h-3.5 w-3.5" /> Collect
        </Button>
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <FeePanel title="Payment Mode Mix" subtitle="distribution by collected amount (academic year)">
          {modeData.length > 0 ? (
            <MiniDonut data={modeData} centerLabel="Collected" centerValue={formatINR(analytics.totalCollected, true)} />
          ) : (
            <FeeEmptyState icon={<Banknote className="h-5 w-5" />} title="No payments yet" />
          )}
        </FeePanel>

        <FeePanel title="Daily Collection (last 15 days)" subtitle="successful payments per day">
          {dayBars.length > 0 ? (
            <MiniBars data={dayBars} format={(n) => formatINR(n, true)} height={140} />
          ) : (
            <FeeEmptyState icon={<Calendar className="h-5 w-5" />} title="No recent collections" />
          )}
        </FeePanel>
      </div>

      {/* Recent payments table */}
      <FeePanel
        title="Recent Payments"
        subtitle={`${transactions.filter((t) => t.status === 'Success').length} successful payments this academic year`}
        action={<Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1">View All <ArrowRight className="h-3 w-3" /></Button>}
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto max-h-[28rem]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_0_hsl(var(--border))]">
              <tr>
                <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Receipt</th>
                <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Student</th>
                <th className="text-right px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Amount</th>
                <th className="text-center px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Mode</th>
                <th className="text-center px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 15).map((t) => (
                <tr key={t.id} className="border-t border-border/30 hover:bg-muted/20 even:bg-muted/10">
                  <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground whitespace-nowrap">{t.receiptNo}</td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-[11px]">{t.studentName}</p>
                    <p className="text-[9px] text-muted-foreground font-mono">{t.admissionNo} · {t.className}</p>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold text-emerald-600">{formatINR(t.amount)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ring-1', modeAccent(t.mode))}>
                      <ModeIcon mode={t.mode} className="h-2.5 w-2.5" />
                      {t.mode}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center"><FeeStatusBadge status={t.status} /></td>
                  <td className="px-3 py-2 text-muted-foreground text-[10px] whitespace-nowrap">{formatRelativeTime(t.date)}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">No transactions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </FeePanel>
    </div>
  )
}

function CollectionTile({ icon, label, value, count, delay }: { icon: React.ReactNode; label: string; value: number; count: number; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl border border-border bg-card p-3"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">{label}</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">{icon}</span>
      </div>
      <p className="font-display text-xl font-bold tabular-nums">{formatINR(value, true)}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{count} {count === 1 ? 'payment' : 'payments'}</p>
    </motion.div>
  )
}
