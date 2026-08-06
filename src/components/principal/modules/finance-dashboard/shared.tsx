'use client'

import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { ProgressBar } from '@/components/shared/charts'
import { cn } from '@/lib/utils'
import { formatINR } from '@/lib/format'
import { A, E } from './data'

/* Hero stat — the three big numbers (Total Revenue, Total Expenses, Net
   Surplus) on the emerald hero banner. */
export function HeroStat({ icon, label, value, trend, tone = 'default' }: { icon: React.ReactNode; label: string; value: number; trend: string; tone?: 'default' | 'good' | 'warn' }) {
  return (
    <div>
      <p className="text-emerald-50/80 text-[11px] font-medium flex items-center gap-1.5 mb-1.5">{icon}{label}</p>
      <p className="font-display text-2xl sm:text-3xl font-extrabold tabular-nums">
        <AnimatedCounter value={value} format={(n) => formatINR(n, true)} />
      </p>
      <p className={cn('text-[11px] mt-0.5 flex items-center gap-1', tone === 'warn' ? 'text-amber-100/80' : 'text-emerald-50/70')}>{trend}</p>
    </div>
  )
}

/* Ratio row — one financial-health ratio (label, value, target, hint).
   `invert` is used when a lower value is better (e.g. debt/equity). */
export function RatioRow({ label, value, suffix, target, good, hint, invert }: { label: string; value: number; suffix: string; target: number; good: boolean; hint: string; invert?: boolean }) {
  const pct = invert ? Math.min(100, (target / Math.max(value, 0.01)) * 100) : Math.min(100, (value / target) * 100)
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium">{label}</span>
          {good ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <AlertTriangle className="h-3 w-3 text-amber-500" />}
        </div>
        <span className="font-display text-sm font-bold tabular-nums">{value.toFixed(2)}{suffix}</span>
      </div>
      <ProgressBar value={pct} color={good ? E : A} height={5} />
      <p className="text-[9px] text-muted-foreground mt-0.5">{hint}</p>
    </div>
  )
}

/* Section label — small uppercase header used inside the P&L / Balance /
   Cashflow statements to delimit Revenue / Expenses / Assets / etc. */
export function SectionLabel({ icon, color, label }: { icon: React.ReactNode; color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <span className={color}>{icon}</span>
      <p className={cn('text-[10px] font-semibold uppercase tracking-wider', color)}>{label}</p>
    </div>
  )
}
