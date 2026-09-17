'use client'

/**
 * AccountHero — the student's financial position at a glance (§4/§5).
 *
 * The BALANCE is the most important actionable figure — it leads. The
 * hero is NOT four equal cards: one soft amber zone carries the balance,
 * progress and next due; a quiet metric column carries total/paid. The
 * financial status is a real derived state (§5 — never a static label),
 * and status is never colour-alone (icon + label, §31).
 *
 *   ● PARTIALLY PAID                                  ← status banner
 *   BALANCE DUE ₹5,450          Total ₹10,200         ← amber = actionable
 *   ████░░░░ 47% paid           Paid ₹4,750 (emerald) ← progress + paid
 *   Next due 10 Oct · ₹750                            ← one reminder only
 *   [Pay Now] [View statement]
 */

import { motion } from 'framer-motion'
import {
  CalendarClock, ChevronRight, IndianRupee, Landmark, ReceiptText, ShieldCheck, TrendingUp, Wallet,
} from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { StudentFeeAccount } from '@/lib/store/fee-store'
import { feeStatusToken, nextDueLabel, type NextDue } from './fee-status'

interface AccountHeroProps {
  account: StudentFeeAccount
  nextDue: NextDue | null
  /** Count of this student's payments sitting in verification. */
  underVerification: number
  onlineEnabled: boolean
  onPay: () => void
  onViewStatement: () => void
}

export function AccountHero({ account, nextDue, underVerification, onlineEnabled, onPay, onViewStatement }: AccountHeroProps) {
  const token = feeStatusToken(account.status)
  const StatusIcon = token.icon
  const pct = account.netPayable > 0 ? Math.min(100, Math.round((account.paid / account.netPayable) * 100)) : 0

  return (
    <GlassCard hover={false} className="on-card overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr]">
        {/* ── Left zone — the actionable position (soft amber, §37) ── */}
        <div className="relative bg-amber-500/[0.045] p-5 sm:p-6 lg:border-r lg:border-border/70">
          {/* Status banner (§5 — database-driven state) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold', token.chip)}>
              <StatusIcon className="h-3 w-3" aria-hidden />
              {token.label}
            </span>
            {underVerification > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/[0.08] px-2.5 py-1 text-[11px] font-medium text-sky-700 dark:text-sky-400">
                <ReceiptText className="h-3 w-3" aria-hidden />
                {underVerification} payment{underVerification === 1 ? '' : 's'} under verification
              </span>
            )}
          </div>

          {/* The balance — THE actionable figure */}
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Balance Due{account.lateFee > 0 ? ' · includes late fee' : ''}
            </p>
            <div className="mt-1 flex items-baseline gap-2.5">
              <p className="font-display text-[2.35rem] leading-none font-extrabold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
                {formatINR(account.totalDue)}
              </p>
              {account.lateFee > 0 && (
                <span className="text-xs font-medium text-rose-600 dark:text-rose-400 tabular-nums">
                  + {formatINR(account.lateFee)} late fee
                </span>
              )}
            </div>
            {account.concession > 0 && (
              <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
                After {formatINR(account.concession)} concession on {formatINR(account.totalApplicable)}
              </p>
            )}
          </div>

          {/* Payment progress — honest, monotonic */}
          <div className="mt-4">
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-foreground/[0.07]"
              role="progressbar"
              aria-label="Fee payment progress"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600"
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] tabular-nums">
              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                {formatINR(account.paid)} paid
              </span>
              <span className="text-muted-foreground">{pct}% of {formatINR(account.netPayable)}</span>
            </div>
          </div>

          {/* DUE NEXT — one reminder, never spam (§17) */}
          {nextDue && (
            <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/60 px-3 py-2.5">
              <CalendarClock
                className={cn(
                  'h-4 w-4 shrink-0',
                  nextDue.kind === 'overdue' ? 'text-rose-500' : nextDue.kind === 'grace' ? 'text-amber-500' : 'text-muted-foreground',
                )}
                aria-hidden
              />
              <p className="min-w-0 flex-1 text-xs tabular-nums">
                <span className="font-semibold text-foreground">Next: {formatINR(nextDue.amount)}</span>{' '}
                <span className="text-muted-foreground">· {nextDueLabel(nextDue)}</span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {account.outstanding + account.lateFee > 0 && onlineEnabled && (
              <Button
                onClick={onPay}
                className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                data-testid="fees-pay-now"
              >
                <Wallet className="h-3.5 w-3.5" aria-hidden /> Pay Now
              </Button>
            )}
            {account.outstanding + account.lateFee > 0 && !onlineEnabled && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                Pay at the school office
              </span>
            )}
            <Button variant="outline" size="sm" onClick={onViewStatement} className="h-8 gap-1.5">
              <ReceiptText className="h-3.5 w-3.5" aria-hidden /> View statement
            </Button>
          </div>
        </div>

        {/* ── Right zone — quiet metric column (neutral + accents) ── */}
        <div className="grid grid-cols-2 gap-px bg-border/60 lg:grid-cols-1">
          <HeroMetric
            label="Total for the year"
            value={formatINR(account.totalApplicable)}
            hint={`${formatINR(account.coreExpected)} recurring${account.examExpected > 0 ? ` · ${formatINR(account.examExpected)} exam fees` : ''}`}
            icon={<IndianRupee className="h-4 w-4" aria-hidden />}
            iconClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          />
          <HeroMetric
            label="Paid"
            value={formatINR(account.paid)}
            hint={account.lastPaymentDate ? `Last payment ${account.lastPaymentDate}` : 'No payments yet'}
            icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
            iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <HeroMetric
            label="Late fee"
            value={account.lateFee > 0 ? formatINR(account.lateFee) : '—'}
            hint={account.lateFee > 0 ? `${account.daysOverdue} day${account.daysOverdue === 1 ? '' : 's'} past due` : 'None charged'}
            icon={<TrendingUp className={cn('h-4 w-4', account.lateFee > 0 && 'hidden')} aria-hidden />}
            iconClass={account.lateFee > 0 ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-muted/60 text-muted-foreground'}
            valueClass={account.lateFee > 0 ? 'text-rose-600 dark:text-rose-400' : undefined}
          />
          {account.additional.charges.length > 0 && (
            <HeroMetric
              label="Additional charges"
              value={formatINR(account.additional.outstanding)}
              hint={`${account.additional.charges.length} activ${account.additional.charges.length === 1 ? 'e' : 'e'} · paid separately`}
              icon={<ChevronRight className="h-4 w-4" aria-hidden />}
              iconClass="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
            />
          )}
        </div>
      </div>

      {/* ── Quiet provenance line — the ledger is explainable (§44) ── */}
      <div className="flex items-center gap-2 border-t border-border/70 bg-muted/20 px-5 py-2.5">
        <Landmark className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-[11px] text-muted-foreground">
          Figures from the school fee ledger · reconciled to the rupee · receipts issued by the school office
        </p>
      </div>
    </GlassCard>
  )
}

function HeroMetric({ label, value, hint, icon, iconClass, valueClass }: {
  label: string
  value: string
  hint: string
  icon: React.ReactNode
  iconClass: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center gap-3 bg-card px-4 py-3.5 sm:px-5">
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', iconClass)} aria-hidden>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
        <p className={cn('font-display text-base font-bold tabular-nums text-foreground', valueClass)}>{value}</p>
        <p className="truncate text-[10px] text-muted-foreground tabular-nums">{hint}</p>
      </div>
    </div>
  )
}
