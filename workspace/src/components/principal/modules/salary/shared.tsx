'use client'

// Reusable presentational components shared across the Salary & Payroll module.

import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatINR } from '@/lib/format'

type Accent = 'emerald' | 'rose'

const ACCENT = {
  emerald: {
    title: 'text-emerald-600 dark:text-emerald-400',
    totalBg: 'bg-emerald-500/5',
    totalBorder: 'border-emerald-500/20',
    amount: '',
    prefix: '',
  },
  rose: {
    title: 'text-rose-600 dark:text-rose-400',
    totalBg: 'bg-rose-500/5',
    totalBorder: 'border-rose-500/20',
    amount: 'text-rose-600 dark:text-rose-400',
    prefix: '- ',
  },
} as const

/** Small info tile used in the payslip header grid. */
export function InfoTile({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2.5">
      <p className="text-muted-foreground text-[10px]">{label}</p>
      <p className={`font-semibold text-sm ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

/**
 * Renders an earnings or deductions section inside the payslip Sheet.
 * Items are listed with a coloured footer total. Reused for both columns to
 * keep the slip layout DRY.
 */
export function SlipSection({
  title,
  accent,
  items,
  totalLabel,
  totalAmount,
}: {
  title: string
  accent: Accent
  items: { name: string; amount: number }[]
  totalLabel: string
  totalAmount: number
}) {
  const a = ACCENT[accent]
  return (
    <div>
      <p className={`text-[11px] font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5 ${a.title}`}>
        {accent === 'emerald' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {title}
      </p>
      <div className="rounded-xl border border-border overflow-hidden">
        {items.map((e, i) => (
          <div
            key={e.name}
            className={`flex justify-between items-center p-3 text-sm ${i !== items.length - 1 ? 'border-b border-border/50' : ''}`}
          >
            <span className="text-muted-foreground">{e.name}</span>
            <span className={`font-medium ${a.amount}`}>
              {a.prefix}
              {formatINR(e.amount)}
            </span>
          </div>
        ))}
        <div className={`flex justify-between items-center p-3 ${a.totalBg} border-t ${a.totalBorder}`}>
          <span className="font-semibold text-sm">{totalLabel}</span>
          <span className={`font-display font-bold ${a.title}`}>
            {a.prefix}
            {formatINR(totalAmount)}
          </span>
        </div>
      </div>
    </div>
  )
}
