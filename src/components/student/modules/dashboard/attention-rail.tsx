'use client'

/**
 * AttentionRail (SD-3 · PHASE 11/12/19) — the slim "needs your action"
 * column beside the academic snapshot. Compact, contextual rows only:
 *
 *   · Messages  unread count + who wrote (never a giant Messages card)
 *   · Fees      outstanding + due date (or an honest "all dues cleared")
 *   · Transport pickup window + route (ONLY when an assignment exists)
 *
 * Every row navigates to its module. Rows without real data disappear.
 */

import { motion } from 'framer-motion'
import { MessageCircle, IndianRupee, Bus, ArrowUpRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatINR } from '@/lib/format'
import { dueLabel } from './data'
import type { DashboardData } from './types'

export function AttentionRail({ data, onNavigate }: {
  data: DashboardData
  onNavigate: (key: string) => void
}) {
  const rows: React.ReactNode[] = []
  let i = 0

  // ── Messages (PHASE 11: a small contextual indicator, that's all) ──
  const { unreadCount, recentSenders } = data.messages
  if (unreadCount > 0) {
    rows.push(
      <Row
        key="messages"
        i={i++}
        icon={<MessageCircle className="h-4 w-4" aria-hidden />}
        tint="emerald"
        title={`${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`}
        line={recentSenders.length ? `from ${recentSenders.join(', ')}` : 'from your teachers'}
        badge={unreadCount > 9 ? '9+' : String(unreadCount)}
        onClick={() => onNavigate('messages')}
      />,
    )
  }

  // ── Fees (PHASE 12: shown when relevant; never a giant card) ───────
  if (data.fees.outstanding > 0) {
    const d = data.fees.nearestDue ? dueLabel(data.fees.nearestDue) : ''
    rows.push(
      <Row
        key="fees"
        i={i++}
        icon={<IndianRupee className="h-4 w-4" aria-hidden />}
        tint={data.fees.nearestDue && dueIsSoon(data.fees.nearestDue) ? 'rose' : 'amber'}
        title={`${formatINR(data.fees.outstanding, true)} due`}
        line={d || `${data.fees.items.length} pending item${data.fees.items.length === 1 ? '' : 's'}`}
        onClick={() => onNavigate('fees')}
      />,
    )
  } else if (data.fees.items.length === 0 && data.fees.nearestDue === null) {
    // The fee ledger is genuinely settled — one quiet, small line.
    rows.push(
      <div
        key="fees-clear"
        className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-3 py-2.5"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">All dues cleared</p>
          <p className="text-[10px] text-muted-foreground">Nothing pending this term</p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('fees')}
          className="shrink-0 text-[10px] font-semibold text-muted-foreground hover:text-primary hover:underline"
        >
          Receipts
        </button>
      </div>,
    )
  }

  // ── Transport context (PHASE 19: only with an assignment) ─────────
  if (data.transport.assigned) {
    rows.push(
      <Row
        key="transport"
        i={i++}
        icon={<Bus className="h-4 w-4" aria-hidden />}
        tint="sky"
        title={data.transport.routeName ?? 'School transport'}
        line={data.transport.pickupWindow ? `Pickup ${data.transport.pickupWindow}` : 'Assigned route'}
        onClick={() => onNavigate('bus')}
      />,
    )
  }

  if (rows.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Needs your attention"
      className="flex flex-col gap-2.5"
    >
      {rows}
    </motion.section>
  )
}

function dueIsSoon(iso: string): boolean {
  const d = (new Date(iso).getTime() - Date.now()) / 86_400_000
  return !Number.isNaN(d) && d <= 7
}

function Row({ icon, tint, title, line, badge, onClick, i }: {
  icon: React.ReactNode
  tint: 'emerald' | 'amber' | 'rose' | 'sky'
  title: string
  line: string
  badge?: string
  onClick: () => void
  i: number
}) {
  const tints = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  } as const
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 + i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className="group flex w-full items-center gap-2.5 rounded-xl border border-border/80 bg-card px-3 py-2.5 text-left shadow-2xs transition-all hover:border-primary/30 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', tints[tint])}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold">{title}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{line}</span>
      </span>
      {badge && (
        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground tabular-nums">
          {badge}
        </span>
      )}
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
    </motion.button>
  )
}
