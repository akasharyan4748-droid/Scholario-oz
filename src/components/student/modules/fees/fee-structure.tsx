'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { FileText, Receipt, BadgePercent, AlertTriangle, CalendarPlus } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { StudentFeeAccount } from '@/lib/store/fee-store'

/**
 * FeeStructure — what the balance is made of, from the SCHOOL'S OWN
 * configuration: every line is a real charge the fee engine derived from
 * the class's fee structure (frequency-expanded), an approved concession,
 * the late-fee rule, or an event-based additional charge.
 *
 * No per-head "paid" splits are shown — that allocation lives inside the
 * engine's chronological waterfall and is NOT public account data; the
 * honest summary row (Applicable → Concession → Net → Paid → Outstanding)
 * carries the money truth instead.
 */
export function FeeStructure({ acct }: { acct: StudentFeeAccount }) {
  // Group the engine's charge entries by line item — one row per
  // configured head / charge, exactly as the school configured it.
  const rows = useMemo(() => {
    const map = new Map<string, { label: string; total: number; kind: 'core' | 'exam' | 'additional' }>()
    for (const e of acct.ledger) {
      if (e.entryType === 'core' || e.entryType === 'exam' || e.entryType === 'additional') {
        const prev = map.get(e.feeHead)
        if (prev) prev.total += e.charge
        else map.set(e.feeHead, { label: e.feeHead, total: e.charge, kind: e.entryType })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [acct.ledger])

  const lateFeeEntry = acct.ledger.find((e) => e.entryType === 'late-fee')

  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" /> What you&apos;re billed for
        </h3>
        <span className="text-[11px] text-muted-foreground">School-configured structure</span>
      </div>

      <div className="divide-y divide-border">
        {rows.map((r, i) => (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center justify-between gap-3 py-2.5"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                  r.kind === 'core' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                  r.kind === 'exam' && 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
                  r.kind === 'additional' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                )}
                aria-hidden
              >
                {r.kind === 'exam' ? <Receipt className="h-3.5 w-3.5" /> : r.kind === 'additional' ? <CalendarPlus className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.label}</p>
                <p className="text-[10px] text-muted-foreground/80">
                  {r.kind === 'core' ? 'Recurring fee' : r.kind === 'exam' ? 'Examination fee' : 'Event-based charge'}
                </p>
              </div>
            </div>
            <p className="text-sm font-semibold tabular-nums shrink-0">{formatINR(r.total)}</p>
          </motion.div>
        ))}

        {acct.concession > 0 && (
          <div className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" aria-hidden>
                <BadgePercent className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">Concession</p>
                <p className="text-[10px] text-muted-foreground/80">Approved reduction on applicable fees</p>
              </div>
            </div>
            <p className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">−{formatINR(acct.concession)}</p>
          </div>
        )}

        {lateFeeEntry && lateFeeEntry.charge > 0 && (
          <div className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400" aria-hidden>
                <AlertTriangle className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">Late fee accrued</p>
                <p className="text-[10px] text-muted-foreground/80">Per the school&apos;s late-fee policy</p>
              </div>
            </div>
            <p className="text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400 shrink-0">{formatINR(lateFeeEntry.charge)}</p>
          </div>
        )}
      </div>

      {/* The money truth — one honest waterfall */}
      <div className="mt-4 rounded-xl border border-border bg-muted/25 p-3.5 space-y-1.5 text-xs">
        <SummaryRow label="Applicable this session" value={formatINR(acct.totalApplicable)} />
        {acct.concession > 0 && <SummaryRow label="Concession" value={`−${formatINR(acct.concession)}`} tone="emerald" />}
        <SummaryRow label="Net payable" value={formatINR(acct.netPayable)} medium />
        <SummaryRow label="Paid" value={formatINR(acct.paid)} tone="emerald" />
        <div className="border-t border-dashed border-border pt-1.5 mt-1.5">
          <SummaryRow
            label={acct.totalDue > 0 ? 'Balance due' : 'Balance due'}
            value={formatINR(acct.totalDue)}
            medium
            tone={acct.totalDue > 0 ? (acct.status === 'Overdue' ? 'rose' : 'amber') : 'emerald'}
          />
        </div>
        {acct.additional.outstanding > 0 && (
          <p className="text-[10px] text-muted-foreground pt-1">
            Separately, {formatINR(acct.additional.outstanding)} is outstanding on event-based charges (tours, activities).
          </p>
        )}
      </div>
    </GlassCard>
  )
}

function SummaryRow({ label, value, medium, tone }: {
  label: string
  value: string
  medium?: boolean
  tone?: 'emerald' | 'amber' | 'rose'
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn('text-muted-foreground', medium && 'font-semibold text-foreground')}>{label}</span>
      <span
        className={cn(
          'tabular-nums',
          medium ? 'font-bold' : 'font-medium',
          tone === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
          tone === 'amber' && 'text-amber-600 dark:text-amber-400',
          tone === 'rose' && 'text-rose-600 dark:text-rose-400',
        )}
      >
        {value}
      </span>
    </div>
  )
}
