'use client'

/**
 * PaymentsSection — the OPERATIONS page of Fee Management.
 *
 *   Payments is for ACTIONS. Transactions is for HISTORY. Overview is for INSIGHTS.
 *
 * Contents (flat, no nested sub-views):
 *   1. Page header + the primary action: Collect Payment (opens the existing
 *      collection wizard — student → amount → mode → receipt)
 *   2. Collection activity strip (Today / This Week / This Month) — operational
 *      feedback that collections are landing, not analytics
 *   3. Additional Charges — event-based collections (tour, workshop…)
 *      created INDEPENDENTLY of the annual fee structures + their live
 *      collection progress
 *   4. Payments Awaiting Verification — the cash verification queue (rich
 *      context + decision actions; business logic unchanged)
 *
 * What deliberately does NOT live here: financial KPIs, the collection trend,
 * payment-mode analytics, recent-payments summaries (→ Overview) and the
 * complete transaction ledger (→ Transactions).
 */

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFeeData } from '@/lib/store/fee-store'
import { formatINR } from '@/lib/format'
import { FeesVerificationQueue } from '../fees-approvals'
import { FeesAdditionalCharges } from '../fees-additional-charges'

interface Props {
  data: ReturnType<typeof useFeeData>
  onCollect: () => void
}

export function PaymentsSection({ data, onCollect }: Props) {
  const { analytics } = data

  // Operational snapshot — successful collections landing right now
  // (same source as the ledger; successful transactions only).
  const activity = [
    { label: 'Today', value: analytics.todayCollection, hint: 'since midnight' },
    { label: 'This Week', value: analytics.weekCollection, hint: 'rolling 7 days' },
    { label: 'This Month', value: analytics.monthCollection, hint: 'rolling 30 days' },
  ]

  return (
    <div className="space-y-6">
      {/* 1 — Page purpose + primary action */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Payments</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Collect payments and verify cash collections submitted by teachers.
          </p>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={onCollect}
        >
          <Plus className="h-3.5 w-3.5" /> Collect Payment
        </Button>
      </div>

      {/* 2 — Collection activity strip (flat border-left stats, no boxes) */}
      <div className="grid grid-cols-3 gap-4 sm:gap-6">
        {activity.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="border-l-2 border-emerald-500/40 pl-3"
          >
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{s.label}</p>
            <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5">
              {formatINR(s.value, true)}
            </p>
            <p className="text-[9px] text-muted-foreground hidden sm:block">{s.hint}</p>
          </motion.div>
        ))}
      </div>

      {/* 3 — Additional Charges (event-based collections, tracked separately
          from the annual fee structures) */}
      <FeesAdditionalCharges data={data} />

      {/* 4 — Verification queue (operations block, not a nested page) */}
      <FeesVerificationQueue data={data} />
    </div>
  )
}
