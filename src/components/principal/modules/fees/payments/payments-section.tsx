'use client'

/**
 * PaymentsSection — the OPERATIONS page of Fee Management.
 *
 *   Payments is for ACTIONS. Transactions is for HISTORY. Overview is for INSIGHTS.
 *
 * Contents (flat, no nested sub-views — PAY-REWORK-1 spec §8):
 *   1. Compact payment summary — Today / Week / Month collection tiles LEFT,
 *      the primary "Collect Fee" CTA RIGHT (opens the collection wizard).
 *   2. Recent Payments — current / actionable payment activity: every row
 *      scans student · class · amount · method · collector · status · date ·
 *      reference · receipt availability; contextual bulk receipt actions
 *      (print / download) appear only while a selection exists
 *      (→ payments/recent-payments).
 *   3. Additional Charges Panel — event-based collections (tour, workshop…)
 *      created INDEPENDENTLY of the annual fee structures + their live
 *      collection progress (→ fees-additional-charges).
 *   4. Cash Verification Panel — the verification queue with rich context +
 *      decision actions; shows an all-clear slim row when there is nothing
 *      pending anywhere (→ fees-approvals, which reads analytics directly).
 *
 * What deliberately does NOT live here: financial KPIs, the collection trend,
 * payment-mode analytics (→ Overview) and the complete transaction ledger
 * (→ Transactions) — a payment settles there once its receipt is issued.
 */

import { motion } from 'framer-motion'
import { Wallet } from "lucide-react"
import { Button } from '@/components/ui/button'
import { useFeeData } from '@/lib/store/fee-store'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { FeesVerificationQueue } from '../fees-approvals'
import { FeesAdditionalCharges } from '../fees-additional-charges'
import { RecentPayments } from './recent-payments'

interface Props {
  data: ReturnType<typeof useFeeData>
  onCollect: () => void
  onOpenTransactions?: () => void
}

export function PaymentsSection({ data, onCollect, onOpenTransactions }: Props) {
  const { analytics } = data

  // Operational snapshot — successful collections landing right now
  // (same source as the ledger; successful transactions only).
  const activity = [
    { label: 'Today', value: analytics.todayCollection, hint: 'since midnight', accent: analytics.todayCollection > 0 },
    { label: 'This Week', value: analytics.weekCollection, hint: 'rolling 7 days', accent: false },
    { label: 'This Month', value: analytics.monthCollection, hint: 'rolling 30 days', accent: false },
  ]

  return (
    <div className="space-y-4">
      {/* 1 — Collection activity + primary action. The "Payments" tab
          already establishes context, so no page heading — the page opens
          straight into live figures with Collect Fee at the right. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid grid-cols-3 gap-3 flex-1 min-w-[280px] max-w-xl">
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
        {/* Primary action — same treatment as Salary & Payroll → Payments'
            "Record Payment" (white outline, subtle border, Wallet icon,
            identical height/typography/radius): one shared enterprise
            design system across money modules. */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px] gap-1"
            onClick={onCollect}
          >
            <Wallet className="h-3 w-3" /> Collect Fee
          </Button>
        </div>
      </div>

      {/* 2 — Recent / Active Payments (current actionable activity +
          contextual bulk receipt actions) */}
      <RecentPayments data={data} onOpenTransactions={onOpenTransactions} />

      {/* 3 — Additional Charges (event-based collections, tracked separately
          from the annual fee structures) */}
      <FeesAdditionalCharges data={data} />

      {/* 4 — Verification queue (operations block, not a nested page;
          renders its own all-clear slim row when nothing is pending) */}
      <FeesVerificationQueue data={data} />
    </div>
  )
}
