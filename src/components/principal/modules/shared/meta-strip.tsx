'use client'

/**
 * Compact meta strip — replaces oversized KpiCard grids.
 *
 * Pattern from Apple/Linear/Stripe: a single bordered row of inline
 * stats with subtle dividers, no per-card backgrounds, no gradients,
 * no decorative sparklines, no oversized icons.
 *
 * Use this everywhere KpiCard grids appeared.
 */

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface MetaItem {
  label: string
  value: string | number
  hint?: string
  /** Optional accent: emerald for positive, rose for negative, amber for warning */
  tone?: 'default' | 'positive' | 'warning' | 'negative'
  icon?: ReactNode
}

const toneClasses: Record<NonNullable<MetaItem['tone']>, string> = {
  default: 'text-foreground',
  positive: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  negative: 'text-rose-600 dark:text-rose-400',
}

export function MetaStrip({
  items,
  columns,
  className,
}: {
  items: MetaItem[]
  /** defaults to responsive 2/4/4/8 */
  columns?: 2 | 3 | 4 | 6 | 8
  className?: string
}) {
  const cols = columns ?? Math.min(8, Math.max(2, items.length)) as 2 | 3 | 4 | 6 | 8
  const colClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
    6: 'grid-cols-3 sm:grid-cols-6',
    8: 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-8',
  }[cols]

  return (
    <div className={cn('grid gap-px bg-border/60 rounded-lg overflow-hidden border border-border/60', colClass, className)}>
      {items.map((item, i) => (
        <div key={i} className="bg-card px-3.5 py-2.5 min-w-0">
          <div className="flex items-center gap-1.5">
            {item.icon && <span className="text-muted-foreground shrink-0">{item.icon}</span>}
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{item.label}</p>
          </div>
          <p className={cn('text-base sm:text-lg font-semibold tabular-nums leading-tight mt-0.5 truncate', toneClasses[item.tone ?? 'default'])}>
            {item.value}
          </p>
          {item.hint && (
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{item.hint}</p>
          )}
        </div>
      ))}
    </div>
  )
}
