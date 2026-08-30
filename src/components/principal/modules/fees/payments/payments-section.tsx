'use client'

/**
 * PaymentsSection — the OPERATIONS page of Fee Management.
 *
 *   Payments is for ACTIONS. Transactions is for HISTORY. Overview is for INSIGHTS.
 *
 * Contents (flat, no nested sub-views — PAY-REWORK-1 spec §8 + final §3/§4):
 *   1. Compact payment summary — Today / Week / Month collection tiles in
 *      the SAME micro-stat recipe as the Transactions summary strip and the
 *      Overview cards (muted chip, 9px uppercase label, bold tabular value,
 *      quiet sub line) — no bulky treatment — with the primary "Collect Fee"
 *      CTA RIGHT (opens the collection wizard).
 *   2. Recent Payments — NEW / ACTIONABLE payment activity: every row
 *      scans student · class · amount · method · collector · status · date ·
 *      reference · receipt availability; contextual bulk receipt actions
 *      (print / download) appear only while a selection exists. A payment
 *      leaves this list the moment its receipt is printed or downloaded —
 *      it settles into Transactions (never deleted)
 *      (→ payments/recent-payments).
 *   3. Additional Collections — READ-ONLY payment status per existing
 *      event-based collection (expected · collected · students/payments ·
 *      progress). Creation/recording lives in Applications & Forms
 *      (→ fees-additional-charges).
 *   4. Cash Verification — the compact verification TABLE with decision
 *      actions; shows an all-clear slim row when there is nothing pending
 *      anywhere (→ fees-approvals). Gateway-confirmed payments never
 *      appear here — they are recorded Paid automatically.
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

/** Payment summary tile — the exact Overview/Transactions micro-stat recipe
 *  (spec §4: compact · clean · lightweight · consistent spacing). */
function PaymentStatTile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={cn('rounded-lg bg-muted/40 px-2.5 py-1.5', accent && 'ring-1 ring-amber-500/40')}>
      <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5">
        {value}
      </p>
      {sub && <p className="text-[9px] text-muted-foreground mt-0.5 truncate hidden sm:block">{sub}</p>}
    </div>
  )
}

export function PaymentsSection({ data, onCollect, onOpenTransactions }: Props) {
  const { analytics } = data

  // Operational snapshot — successful collections landing right now
  // (same source as the ledger; successful transactions only).
  const activity = [
    { label: 'Today', value: analytics.todayCollection, sub: 'since midnight', accent: analytics.todayCollection > 0 },
    { label: 'This Week', value: analytics.weekCollection, sub: 'rolling 7 days', accent: false },
    { label: 'This Month', value: analytics.monthCollection, sub: 'rolling 30 days', accent: false },
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
            >
              <PaymentStatTile label={s.label} value={formatINR(s.value, true)} sub={s.sub} accent={s.accent} />
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

      {/* 3 — Additional Collections (read-only status per collection) */}
      <FeesAdditionalCharges data={data} />

      {/* 4 — Verification queue (compact table; renders its own all-clear
          slim row when nothing is pending) */}
      <FeesVerificationQueue data={data} />
    </div>
  )
}
