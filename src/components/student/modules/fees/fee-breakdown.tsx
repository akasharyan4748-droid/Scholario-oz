'use client'

/**
 * fees/fee-breakdown — FEE BREAKDOWN (FEES-R §6–7).
 *
 * A clean expandable section showing EXACTLY what the annual fee is made
 * of. Every line is derived live from the school's configured class fee
 * structure filtered through the same applicability gate the fee engine
 * uses (see derive.ts) — no hardcoded heads or amounts.
 *
 * Concession honesty (§7): when the real concession value is zero the
 * card says "None applied" instead of dressing a ₹0 line up as a
 * discount. Optional heads the student has not opted into are omitted
 * entirely — never shown as ₹0 charges.
 *
 * Installments (§8): deliberately absent — the ledger defines no term
 * instalment schedule for this student, so none is fabricated.
 */

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BadgePercent, Check, ChevronDown, Layers } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatINR } from '@/lib/format'
import type { ConcessionPosition, FeeHeadLine } from './derive'

interface FeeBreakdownProps {
  heads: FeeHeadLine[]
  /** Per-head paid allocation from the real Success transactions. */
  paidByHead: Map<string, number>
  concession: ConcessionPosition
  /** Ledger total (students-store feeTotal). */
  totalFee: number
}

export function FeeBreakdown({ heads, paidByHead, concession, totalFee }: FeeBreakdownProps) {
  const [open, setOpen] = useState(true)
  const subtotal = heads.reduce((sum, h) => sum + h.annual, 0)

  return (
    <GlassCard className="p-4 sm:p-5" data-testid="fee-breakdown">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden>
            <Layers className="h-3.5 w-3.5" />
          </span>
          Fee breakdown
        </h3>
        <div className="flex items-center gap-2">
          {heads.length > 0 && (
            <span className="text-xs font-semibold tabular-nums text-foreground">{formatINR(subtotal)}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="fee-breakdown-body"
            className="h-10 w-10 p-0 text-muted-foreground hover:text-foreground"
            aria-label={open ? 'Collapse fee breakdown' : 'Expand fee breakdown'}
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden />
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="fee-breakdown-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4">
              {heads.length === 0 ? (
                /* Honest empty state — no configured structure on the ledger. */
                <p className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-3 text-xs text-muted-foreground">
                  No fee structure is configured for your class on the ledger. The totals above still reflect your
                  school fee account — the office can confirm the head-wise composition.
                </p>
              ) : (
                <>
                  <ul className="space-y-3.5" aria-label="Annual fee heads">
                    {heads.map((h) => {
                      const paid = paidByHead.get(h.id) ?? 0
                      const remaining = Math.max(0, h.annual - paid)
                      const pct = h.annual > 0 ? Math.round((paid / h.annual) * 100) : 0
                      return (
                        <li key={h.id}>
                          <div className="flex items-baseline justify-between gap-3">
                            <p className="text-sm font-medium text-foreground">{h.name}</p>
                            <p className="text-sm font-semibold tabular-nums text-foreground">{formatINR(h.annual)}</p>
                          </div>
                          <div className="mt-0.5 flex items-center justify-between gap-3">
                            <p className="text-[10px] text-muted-foreground">{h.frequencyContext}</p>
                            {remaining === 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                <Check className="h-3 w-3" aria-hidden /> Paid
                                <span className="sr-only">— this head is fully paid</span>
                              </span>
                            ) : paid > 0 ? (
                              <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 tabular-nums">
                                {formatINR(paid)} paid · {formatINR(remaining)} left
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-muted-foreground">Unpaid</span>
                            )}
                          </div>
                          <ProgressBar
                            value={pct}
                            color={pct === 100 ? 'oklch(0.62 0.15 155)' : 'oklch(0.72 0.15 70)'}
                            height={4}
                            className="mt-1.5"
                          />
                        </li>
                      )
                    })}
                  </ul>

                  <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Subtotal — annual heads</span>
                      <span className="font-semibold tabular-nums text-foreground">{formatINR(subtotal)}</span>
                    </div>
                    {concession.amount > 0 && concession.label ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                            <BadgePercent className="h-3 w-3" aria-hidden /> Concession — {concession.label}
                          </span>
                          <span className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">−{formatINR(concession.amount)}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-border pt-1.5">
                          <span className="font-semibold text-foreground">Total payable</span>
                          <span className="font-display font-bold tabular-nums text-foreground">{formatINR(Math.max(0, subtotal - concession.amount))}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Concession</span>
                        <span className="text-muted-foreground">None applied</span>
                      </div>
                    )}
                    <p className="pt-1 text-[10px] text-muted-foreground/80">
                      Heads and amounts come from your school's configured fee structure — per-head paid status is derived from the ledger's confirmed payments.
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}
