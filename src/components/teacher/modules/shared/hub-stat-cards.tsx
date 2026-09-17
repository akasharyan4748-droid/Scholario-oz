'use client'

/**
 * hub-stat-cards — the shared summary-card system for the Teacher Hub
 * modules (Parent Connect / Student Behavior).
 *
 * Visual recipe copied VERBATIM from "My Attendance" (personal-attendance.tsx),
 * the documented design benchmark:
 *   rounded-xl border p-3 sm:p-4 · tinted 500/5 background · hover border 500/40
 *   label text-[10px] uppercase font-bold tracking-wider
 *   bare Lucide icon h-3.5 w-3.5 top-right (no chip)
 *   value font-display text-2xl sm:text-3xl font-bold tabular-nums
 *   context text-[10px] text-muted-foreground mt-1
 *   framer-motion entrance (opacity/y, 0.05 stagger, respects reduced motion)
 * No shadows, no icon containers, no giant cards.
 */

import { motion, useReducedMotion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type HubStatTone = 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'slate'

export interface HubStat {
  key: string
  label: string
  value: string | number | null
  /** small supporting context line under the value */
  context?: string
  icon: LucideIcon
  tone?: HubStatTone
}

const TONES: Record<HubStatTone, { text: string; bg: string; border: string }> = {
  emerald: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/5',
    border: 'border-border hover:border-emerald-500/40',
  },
  amber: {
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/5',
    border: 'border-border hover:border-amber-500/40',
  },
  rose: {
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/5',
    border: 'border-border hover:border-rose-500/40',
  },
  sky: {
    text: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-500/5',
    border: 'border-border hover:border-sky-500/40',
  },
  violet: {
    text: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500/5',
    border: 'border-border hover:border-violet-500/40',
  },
  slate: {
    text: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-muted/40',
    border: 'border-border hover:border-muted-foreground/30',
  },
}

export function HubStatCards({ stats, loading }: { stats: HubStat[]; loading?: boolean }) {
  const reduce = useReducedMotion()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat, i) => {
        const tone = TONES[stat.tone ?? 'slate']
        const Icon = stat.icon
        if (loading) {
          return <HubStatCardSkeleton key={stat.key} />
        }
        return (
          <motion.div
            key={stat.key}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className={cn('rounded-xl border p-3 sm:p-4', tone.bg, tone.border)}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground truncate">
                {stat.label}
              </span>
              <Icon className={cn('h-3.5 w-3.5 shrink-0', tone.text)} aria-hidden="true" />
            </div>
            <p
              className={cn(
                'font-display text-2xl sm:text-3xl font-bold tabular-nums tracking-tight',
                tone.text,
              )}
            >
              {stat.value ?? '—'}
            </p>
            {stat.context && (
              <p className="text-[10px] text-muted-foreground mt-1 truncate">{stat.context}</p>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

export function HubStatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3 sm:p-4 animate-pulse">
      <div className="flex items-center justify-between mb-1.5">
        <div className="h-2.5 w-20 rounded bg-muted" />
        <div className="h-3.5 w-3.5 rounded bg-muted" />
      </div>
      <div className="h-8 w-14 rounded bg-muted mt-0.5" />
      <div className="h-2.5 w-24 rounded bg-muted mt-2" />
    </div>
  )
}

/** Full-module loading skeleton: toolbar line + 4 stat cards + content block. */
export function HubModuleSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-3 w-40 rounded bg-muted animate-pulse" />
        <div className="h-8 w-32 rounded-lg bg-muted animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <HubStatCardSkeleton key={i} />
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card h-64 animate-pulse" />
    </div>
  )
}

/**
 * HubEmptyState — the shared purposeful empty state (spec §9): calm icon,
 * one honest title line, one hint line, optional action. Never a giant white
 * box, never "Couldn't load".
 */
export function HubEmptyState({
  icon: Icon,
  title,
  hint,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  hint?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center px-6 py-12', className)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted/60 mb-3">
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1 max-w-sm">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** Inline error block for an isolated section (spec §10 — page stays usable). */
export function HubSectionError({
  message,
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-2.5">
      <p className="text-xs text-rose-600 dark:text-rose-400 truncate">
        {message || 'This section could not load.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted/50 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  )
}
