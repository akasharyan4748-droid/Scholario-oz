'use client'

/**
 * Student design kit — the SINGLE import surface for Student modules.
 *
 * Goal (SCHOLARIO-OS premium redesign): the Student role must look like
 * the SAME product as the Principal role. The Principal shell's shared
 * primitives (Panel, SummaryCard, SegmentedTabs …) are the gold standard,
 * so this kit re-exports them under a student-local path and adds the few
 * student-specific building blocks (module page wrapper, metric tiles,
 * definition grids, empty states).
 *
 * Rules:
 *   - Student modules import containers/tabs/KPI cards from HERE, never
 *     re-implement them.
 *   - The visual language stays flat + tinted (rounded-xl border bg-card),
 *     emerald primary with violet/amber/rose/sky semantic accents.
 */

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ── Re-exported Principal gold-standard primitives ────────────────────
export { Panel, PanelGrid } from '@/components/principal/modules/shared/panel'
export { SummaryCard, SummaryCardGrid, type SummaryTone } from '@/components/principal/modules/shared/summary-card'
export { SegmentedTabs, type SegmentedTab } from '@/components/principal/modules/shared/segmented-tabs'

// ── Page wrapper ───────────────────────────────────────────────────────

/**
 * StudentPage — standard module root. Every student module renders inside
 * one of these: PageTransition entrance + the canonical vertical rhythm
 * (space-y-4, matching Principal modules).
 */
export function StudentPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn('space-y-4', className)}
    >
      {children}
    </motion.div>
  )
}

// ── Section label (TODAY / PROGRESS … dashboard group headers) ─────────

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn(
      'text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest font-mono',
      className,
    )}>
      {children}
    </h2>
  )
}

// ── Metric tile (profile "4 tiles" pattern from Principal profiles) ────

const METRIC_TONES = {
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
} as const

export type MetricTone = keyof typeof METRIC_TONES

export function MetricTile({
  label, value, sub, icon, tone = 'emerald', onClick,
}: {
  label: string
  value: ReactNode
  sub?: string
  icon?: ReactNode
  tone?: MetricTone
  onClick?: () => void
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-tight">
          {label}
        </span>
        {icon && (
          <span className={cn('flex h-6 w-6 items-center justify-center rounded-md', METRIC_TONES[tone])}>
            {icon}
          </span>
        )}
      </div>
      <p className={cn('mt-1.5 font-display text-xl sm:text-2xl font-extrabold tabular-nums leading-tight truncate', METRIC_TONES[tone])}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</p>}
    </>
  )
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick() } : undefined}
      className={cn(
        'rounded-xl border border-border bg-card p-3.5 transition-all duration-200',
        onClick && 'cursor-pointer hover:border-border hover:shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 active:scale-[0.98]',
      )}
    >
      {inner}
    </div>
  )
}

export function MetricGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-2.5', className)}>{children}</div>
}

// ── Definition grid (Principal drawer pattern) ─────────────────────────

export function DefRow({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">{label}</span>
      <span className={cn('text-xs font-medium truncate', mono && 'font-mono')} title={typeof value === 'string' ? value : undefined}>
        {value}
      </span>
    </div>
  )
}

export function DefGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3', className)}>{children}</div>
}

// ── Empty state (FeeEmptyState recipe — premium, intentional) ──────────

export function StudentEmptyState({
  icon, title, description, action, className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 py-10 text-center', className)}>
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold">{title}</p>
      {description && <p className="text-xs text-muted-foreground/70 max-w-xs">{description}</p>}
      {action && <div className="mt-1.5">{action}</div>}
    </div>
  )
}

// ── Accent icon chip (consistent tinted icon containers) ───────────────

export function IconChip({ icon, tone = 'emerald', size = 'md' }: {
  icon: ReactNode
  tone?: MetricTone
  size?: 'sm' | 'md'
}) {
  return (
    <span className={cn(
      'flex items-center justify-center rounded-lg shrink-0',
      size === 'sm' ? 'h-7 w-7' : 'h-9 w-9',
      METRIC_TONES[tone],
    )}>
      {icon}
    </span>
  )
}
