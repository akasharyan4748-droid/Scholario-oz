'use client'

/**
 * Student Mentoring (TH-FE-3) — shared config maps + pure helpers.
 *
 * All labels come from the canonical teacher-hub-types contract; this file
 * only adds the calm visual recipes (badge/chip tones) and date helpers the
 * four tabs + dialogs share. NO mock data, NO fabricated values.
 */

import type {
  FollowUpPriority,
  GoalStatus,
  MenteeStatus,
  SessionType,
  SupportType,
} from '@/lib/teacher-hub-types'
import {
  GOAL_STATUS_LABELS,
  MENTEE_STATUS_LABELS,
  SESSION_TYPE_LABELS,
  SUPPORT_TYPE_LABELS,
} from '@/lib/teacher-hub-types'
import { formatDate } from '@/lib/format'

// ─── Button recipes (the house toolbar styles, verbatim) ─────────────

/** Primary toolbar action — exact ModuleToolbar recipe. */
export const PRIMARY_ACTION =
  'flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90'
/** Ghost toolbar action — exact ModuleToolbar recipe. */
export const GHOST_ACTION =
  'flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold transition-colors hover:bg-muted/50'
/** Compact primary for tab headers / sheet quick actions. */
export const PRIMARY_SM =
  'flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90'
/** Compact ghost for tab headers / sheet quick actions. */
export const GHOST_SM =
  'flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground'

// ─── Mentee status (On Track / Watch / Needs Support / Critical) ─────

export const MENTEE_STATUS_STYLES: Record<MenteeStatus, { badge: string; dot: string }> = {
  'on-track': {
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  watch: {
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    dot: 'bg-amber-500',
  },
  'needs-support': {
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    dot: 'bg-rose-400',
  },
  critical: {
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    dot: 'bg-rose-500',
  },
}

export const MENTEE_STATUS_OPTIONS: { value: MenteeStatus; label: string }[] = (
  Object.keys(MENTEE_STATUS_LABELS) as MenteeStatus[]
).map((value) => ({ value, label: MENTEE_STATUS_LABELS[value] }))

// ─── Goal status ─────────────────────────────────────────────────────

export const GOAL_STATUS_STYLES: Record<GoalStatus, { badge: string; filled?: boolean }> = {
  'not-started': { badge: 'bg-muted text-muted-foreground border-border' },
  'in-progress': {
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  },
  'on-track': {
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  achieved: {
    badge: 'bg-emerald-600 border-emerald-600 text-white',
    filled: true,
  },
  paused: {
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
}

export const GOAL_STATUS_OPTIONS: { value: GoalStatus; label: string }[] = (
  Object.keys(GOAL_STATUS_LABELS) as GoalStatus[]
).map((value) => ({ value, label: GOAL_STATUS_LABELS[value] }))

// ─── Session type chips (subtle, calm) ───────────────────────────────

const SESSION_TYPE_TONES: Record<string, string> = {
  academic: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  wellbeing: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  attendance: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  career: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  'personal-development':
    'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  general: 'bg-muted text-muted-foreground border-border',
}

/** "personal-development" → "Personal Development" (unknown keys stay readable). */
function prettifyKey(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/**
 * Session type chip metadata. The union labels come from the contract; the
 * DB column is a free string, so unknown values (e.g. legacy "social" rows)
 * fall back to a prettified label on the calm general tone — never a crash.
 */
export function sessionTypeMeta(type: SessionType | string): { label: string; chip: string } {
  const tone = SESSION_TYPE_TONES[type]
  const label = SESSION_TYPE_LABELS[type as SessionType] ?? prettifyKey(type)
  return { label, chip: tone ?? SESSION_TYPE_TONES.general }
}

/** Support type label with the same graceful fallback. */
export function supportTypeLabel(type: SupportType | string): string {
  return SUPPORT_TYPE_LABELS[type as SupportType] ?? prettifyKey(type)
}

export const SESSION_TYPE_OPTIONS: { value: SessionType; label: string }[] = (
  Object.keys(SESSION_TYPE_LABELS) as SessionType[]
).map((value) => ({ value, label: SESSION_TYPE_LABELS[value] }))

export const SUPPORT_TYPE_OPTIONS: { value: SupportType; label: string }[] = (
  Object.keys(SUPPORT_TYPE_LABELS) as SupportType[]
).map((value) => ({ value, label: SUPPORT_TYPE_LABELS[value] }))

// ─── Follow-up helpers ───────────────────────────────────────────────

export function priorityMeta(priority: FollowUpPriority): { label: string; className: string } {
  switch (priority) {
    case 'high':
      return { label: 'High', className: 'text-rose-600 dark:text-rose-400' }
    case 'low':
      return { label: 'Low', className: 'text-muted-foreground/60' }
    default:
      return { label: 'Normal', className: 'text-muted-foreground' }
  }
}

export interface DueMeta {
  state: 'overdue' | 'today' | 'later'
  label: string
  daysOverdue: number
}

/**
 * Due-date semantics from the client clock: "Overdue by N days", "Due today"
 * or the plain date. Day granularity (an intraday due time is not a promise).
 */
export function dueMeta(iso: string, now = new Date()): DueMeta {
  const due = new Date(iso)
  if (Number.isNaN(due.getTime())) return { state: 'later', label: '—', daysOverdue: 0 }
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const diffDays = Math.round((startOfToday.getTime() - startOfDue.getTime()) / 86_400_000)
  if (diffDays > 0) {
    return {
      state: 'overdue',
      label: `Overdue by ${diffDays} day${diffDays === 1 ? '' : 's'}`,
      daysOverdue: diffDays,
    }
  }
  if (diffDays === 0) return { state: 'today', label: 'Due today', daysOverdue: 0 }
  return { state: 'later', label: formatDate(due), daysOverdue: 0 }
}

/** Is a review/due date strictly in the past (day granularity)? */
export function isPastDate(iso: string, now = new Date()): boolean {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  return d.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
}

// ─── <input type="date"> helpers ─────────────────────────────────────

/** Date → "yyyy-mm-dd" in LOCAL time (never UTC — avoids off-by-one). */
export function toInputDate(value: Date | string | null | undefined): string {
  if (value == null || value === '') return ''
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayInputDate(): string {
  return toInputDate(new Date())
}
