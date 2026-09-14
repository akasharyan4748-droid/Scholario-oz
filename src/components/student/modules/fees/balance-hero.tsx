'use client'

import { motion } from 'framer-motion'
import { IndianRupee, CheckCircle2, ShieldCheck, AlertTriangle, Wallet } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { ProgressBar } from '@/components/shared/charts'
import { Button } from '@/components/ui/button'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { StudentFeeAccount } from '@/lib/store/fee-store'

/**
 * BalanceHero — the balance-first financial overview.
 *
 * The BALANCE DUE is the strongest number on the page (that's the question
 * a student/guardian opens Fees to answer), with the session progress as
 * its counterweight. Every figure comes from computeAccount — the same
 * engine the school's finance office reads. Colour discipline:
 *   emerald = paid / settled · amber = due · rose = overdue ·
 *   violet = action (the Pay button).
 */
export function BalanceHero({ acct, lateFeeRule, onPay, canPayOnline }: {
  acct: StudentFeeAccount
  lateFeeRule: { enabled: boolean; amountPerMonth: number; gracePeriodDays: number; maxLateFee: number }
  onPay: () => void
  canPayOnline: boolean
}) {
  const totalDue = acct.totalDue
  const overdue = acct.status === 'Overdue'
  const paidPct = acct.netPayable > 0 ? Math.min(100, Math.round((acct.paid / acct.netPayable) * 100)) : 100
  // The balance number's semantic colour — due-amount amber unless the
  // account is genuinely overdue (rose) or settled (emerald).
  const balanceTone = totalDue <= 0
    ? 'text-emerald-600 dark:text-emerald-400'
    : overdue
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-amber-600 dark:text-amber-400'
  const statusVariant = totalDue <= 0 ? 'success' : overdue ? 'danger' : 'warning'
  const statusLabel = totalDue <= 0 ? 'All paid' : acct.status

  return (
    <GlassCard className="p-4 sm:p-5 lg:p-6 relative overflow-hidden">
      <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-amber-500/10 blur-3xl" aria-hidden />
      <div className="relative">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Balance Due
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {acct.className} · {acct.studentName} · {acct.admissionNo}
            </p>
          </div>
          <StatusBadge status={statusLabel} variant={statusVariant} dot />
        </div>

        <div className="mt-4 flex items-baseline gap-3 flex-wrap">
          <p className={cn('font-display text-4xl sm:text-5xl font-extrabold tabular-nums tracking-tight', balanceTone)}>
            {totalDue > 0 ? (
              <AnimatedCounter value={totalDue} format={(n) => formatINR(n)} />
            ) : (
              formatINR(0)
            )}
          </p>
          {totalDue > 0 && (
            <span className="text-sm text-muted-foreground">of {formatINR(acct.netPayable)} payable</span>
          )}
        </div>

        {/* Session progress — the counterweight to the balance */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Session progress · {acct.paid > 0 ? `${formatINR(acct.paid)} paid` : 'no payments yet'}</span>
            <span className={cn('font-semibold', paidPct >= 100 ? 'text-emerald-600 dark:text-emerald-400' : '')}>{paidPct}%</span>
          </div>
          <ProgressBar value={paidPct} color={paidPct >= 100 ? 'oklch(0.55 0.14 162)' : 'oklch(0.65 0.16 75)'} height={10} />
        </div>

        {/* Real derived facts — nothing fabricated:
            · concession line only when a real approved concession exists
            · late-fee line only when the school's rule is actually enabled */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {acct.concession > 0 ? (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Concession applied
              </p>
              <p className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                −{formatINR(acct.concession)}
              </p>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                On {formatINR(acct.totalApplicable)} applicable
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <p className="text-[11px] text-muted-foreground">Applicable this session</p>
              <p className="font-display text-lg font-bold mt-0.5">{formatINR(acct.totalApplicable)}</p>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                {acct.examExpected > 0 ? 'Recurring + examination fees' : 'Recurring fees only'}
              </p>
            </div>
          )}
          {lateFeeRule.enabled ? (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" /> Late fee policy
              </p>
              <p className="font-display text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {formatINR(lateFeeRule.amountPerMonth)} / month
              </p>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                {acct.lateFee > 0
                  ? `${formatINR(acct.lateFee)} accrued on this account`
                  : `After ${lateFeeRule.gracePeriodDays}-day grace · capped at ${formatINR(lateFeeRule.maxLateFee)}`}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <p className="text-[11px] text-muted-foreground">Late fee</p>
              <p className="font-display text-lg font-bold mt-0.5 text-muted-foreground">Not charged</p>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5">School policy — no late fee configured</p>
            </div>
          )}
        </div>

        {totalDue > 0 && (
          <motion.div layout className="mt-5">
            {canPayOnline ? (
              <Button
                onClick={onPay}
                className="w-full h-11 gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md"
              >
                <Wallet className="h-4 w-4" /> Pay {formatINR(totalDue)} Online
              </Button>
            ) : (
              <div className="rounded-xl border border-border bg-muted/30 p-3.5 flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  To settle this balance, please contact the school office — online payment isn&apos;t available right now.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </GlassCard>
  )
}
