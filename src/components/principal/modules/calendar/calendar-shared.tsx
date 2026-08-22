'use client'

/**
 * calendar-shared — Shared primitives for the Calendar workspace.
 *
 * Mirrors the LibPanel / TptPanel / InvPanel pattern so the Calendar
 * module visually matches the other 7 Operations modules:
 *   - CalPanel: rounded card container with optional header + action
 *   - CalPill: compact semantic pill
 *   - CalTypeDot: tiny colored dot for an event type (matches filter chips)
 *   - CalTypeBadge: type label with leading dot
 *   - CalEmptyState
 *   - CAL_GLOBAL_STYLES for prefers-reduced-motion
 *
 * NO indigo/blue. Emerald / amber / rose / cyan / violet only.
 */

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { TYPE_COLORS } from './data'
import type { CalendarEvent } from '@/lib/store/calendar-store'

// ─── Accent map (soft tinted backgrounds) ────────────────────────────

const ACCENT_MAP: Record<
  string,
  { bg: string; ring: string; hover: string; cardBg: string; cardBorder: string }
> = {
  emerald: {
    bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    ring: 'ring-emerald-500/20',
    hover: 'hover:shadow-emerald-500/20',
    cardBg: 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06]',
    cardBorder: 'border-emerald-500/20',
  },
  rose: {
    bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    ring: 'ring-rose-500/20',
    hover: 'hover:shadow-rose-500/20',
    cardBg: 'bg-rose-500/[0.04] dark:bg-rose-500/[0.06]',
    cardBorder: 'border-rose-500/20',
  },
  amber: {
    bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    ring: 'ring-amber-500/20',
    hover: 'hover:shadow-amber-500/20',
    cardBg: 'bg-amber-500/[0.04] dark:bg-amber-500/[0.06]',
    cardBorder: 'border-amber-500/20',
  },
  cyan: {
    bg: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
    ring: 'ring-cyan-500/20',
    hover: 'hover:shadow-cyan-500/20',
    cardBg: 'bg-cyan-500/[0.04] dark:bg-cyan-500/[0.06]',
    cardBorder: 'border-cyan-500/20',
  },
  violet: {
    bg: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
    ring: 'ring-violet-500/20',
    hover: 'hover:shadow-violet-500/20',
    cardBg: 'bg-violet-500/[0.04] dark:bg-violet-500/[0.06]',
    cardBorder: 'border-violet-500/20',
  },
}

export type CalAccent = keyof typeof ACCENT_MAP

// ─── CalPanel (rounded card container) ───────────────────────────────

interface PanelProps {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}

export function CalPanel({ title, subtitle, action, children, className, bodyClassName }: PanelProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/60 bg-muted/20">
          <div className="min-w-0">
            {title && <p className="text-xs font-semibold tracking-tight">{title}</p>}
            {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn('p-3', bodyClassName)}>{children}</div>
    </div>
  )
}

// ─── CalPill ─────────────────────────────────────────────────────────

export function CalPill({
  children,
  accent,
  className,
}: {
  children: React.ReactNode
  accent?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap',
        accent,
        className,
      )}
    >
      {children}
    </span>
  )
}

// ─── CalTypeDot — tiny colored dot for an event type ─────────────────

export function CalTypeDot({ type, className }: { type: string; className?: string }) {
  return (
    <span
      className={cn('inline-block h-2 w-2 rounded-full', className)}
      style={{ background: TYPE_COLORS[type] ?? TYPE_COLORS.General }}
      aria-hidden
    />
  )
}

// ─── CalTypeBadge — type label with leading dot ──────────────────────

const TYPE_LABEL_ACCENT: Record<string, string> = {
  Exam: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  Event: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Holiday: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Meeting: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  Competition: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  Cultural: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  General: 'bg-muted text-muted-foreground',
}

export function CalTypeBadge({ type, className }: { type: string; className?: string }) {
  const accent = TYPE_LABEL_ACCENT[type] ?? TYPE_LABEL_ACCENT.General
  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold', accent, className)}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: TYPE_COLORS[type] ?? TYPE_COLORS.General }} />
      {type}
    </span>
  )
}

// ─── CalSourcePill — small "user-added" / "school" / "exam" tag ───────

const SOURCE_LABEL: Record<CalendarEvent['source'], { label: string; accent: string }> = {
  school: { label: 'School', accent: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  holiday: { label: 'Holiday', accent: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  exam: { label: 'Exam', accent: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' },
  user: { label: 'User', accent: 'bg-violet-500/10 text-violet-700 dark:text-violet-300' },
}

export function CalSourcePill({ source }: { source: CalendarEvent['source'] }) {
  if (source === 'school') return null // school events are the default, no tag
  const s = SOURCE_LABEL[source]
  return <CalPill accent={s.accent}>{s.label}</CalPill>
}

// ─── CalEmptyState ───────────────────────────────────────────────────

export function CalEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60 mb-3">
        {icon}
      </div>
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </motion.div>
  )
}

// ─── Reduced-motion styles ───────────────────────────────────────────

export const CAL_GLOBAL_STYLES = `
@media (prefers-reduced-motion: reduce) {
  .calendar-shell * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`
