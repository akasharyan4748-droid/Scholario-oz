'use client'

/**
 * PaymentsSection — the OPERATIONS page of Fee Management.
 *
 *   Payments is for ACTIONS. Transactions is for HISTORY. Overview is for INSIGHTS.
 *
 * Contents (flat, no nested sub-views):
 *   1. Benchmark header row — title block ("Payments" + "<Month Year> ·
 *      collections & verification") LEFT, the primary white-outline
 *      "Collect Fee" CTA RIGHT (opens the existing collection wizard:
 *      student → amount → mode → receipt). Same design language as Salary
 *      & Payroll → Payments' "Record Payment" button — one ERP system.
 *   2. Collection activity — Today / This Week / This Month as three
 *      micro-stat TILES (Salary benchmark recipe). Operational feedback that
 *      collections are landing right now — not analytics. The Today tile
 *      carries an amber accent ring while money has landed today (else muted).
 *   3. Additional Charges Panel — event-based collections (tour, workshop…)
 *      created INDEPENDENTLY of the annual fee structures + their live
 *      collection progress (→ fees-additional-charges).
 *   4. Cash Verification Panel — the verification queue with rich context +
 *      decision actions; shows an all-clear slim row when there is nothing
 *      pending anywhere (→ fees-approvals, which reads analytics directly).
 *
 * What deliberately does NOT live here: financial KPIs, the collection trend,
 * payment-mode analytics, recent-payments summaries (→ Overview) and the
 * complete transaction ledger (→ Transactions).
 */

import { motion } from 'framer-motion'
import { Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFeeData } from '@/lib/store/fee-store'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { FeesVerificationQueue } from '../fees-approvals'
import { FeesAdditionalCharges } from '../fees-additional-charges'

interface Props {
  data: ReturnType<typeof useFeeData>
  onCollect: () => void
}

export function PaymentsSection({ data, onCollect }: Props) {
  const { analytics } = data

  // Human month label for the subtitle ("October 2025") — purely presentational.
  const monthLabel = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })

  // Operational snapshot — successful collections landing right now
  // (same source as the ledger; successful transactions only).
  const activity = [
    { label: 'Today', value: analytics.todayCollection, hint: 'since midnight', accent: analytics.todayCollection > 0 },
    { label: 'This Week', value: analytics.weekCollection, hint: 'rolling 7 days', accent: false },
    { label: 'This Month', value: analytics.monthCollection, hint: 'rolling 30 days', accent: false },
  ]

  return (
    <div className="space-y-4">
      {/* 1 — Page purpose + primary action (benchmark toolbar) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-foreground">Payments</h2>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {monthLabel} · collections &amp; verification
          </p>
        </div>
        {/* Primary action — same treatment as Salary & Payroll → Payments'
            "Record Payment" (white outline, subtle border, Wallet icon,
            identical height/typography/radius): one shared enterprise
            design system across money modules. */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[11px] gap-1 shrink-0"
          onClick={onCollect}
        >
          <Wallet className="h-3 w-3" /> Collect Fee
        </Button>
      </div>

      {/* 2 — Collection activity tiles (micro-stat recipe; amber ring marks a
          live today — replaces the legacy border-left strip styling) */}
      <div className="grid grid-cols-3 gap-3">
        {activity.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className={cn(
              'rounded-lg bg-muted/40 px-2.5 py-1.5',
              s.accent && 'ring-1 ring-amber-500/40',
            )}
          >
            <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">{s.label}</p>
            <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5">
              {formatINR(s.value, true)}
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5 truncate hidden sm:block">{s.hint}</p>
          </motion.div>
        ))}
      </div>

      {/* 3 — Additional Charges (event-based collections, tracked separately
          from the annual fee structures) */}
      <FeesAdditionalCharges data={data} />

      {/* 4 — Verification queue (operations block, not a nested page;
          renders its own all-clear slim row when nothing is pending) */}
      <FeesVerificationQueue data={data} />
    </div>
  )
}
