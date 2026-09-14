'use client'

/**
 * Student Behavior — shared type/status/category config + helpers.
 *
 * Pure config + pure functions: no data fetching, no JSX. The module's
 * visual language lives here so the records list, the Record Observation
 * dialog and the student profile sheet stay perfectly consistent:
 *
 *   · positive    → emerald — recognition gets EQUAL visual dignity to
 *                   concerns (this is a behaviour & wellbeing record
 *                   system, not a punishment ledger)
 *   · observation → sky     — neutral, factual
 *   · concern     → rose    — needs resolution
 *
 * Record statuses: open (rose) / monitoring (amber) / resolved (emerald).
 */

import type { BehaviorCategoryItem, BehaviorStatus, BehaviorType } from '@/lib/teacher-hub-types'

export type {
  BehaviorPayload,
  BehaviorRecordItem,
  BehaviorStatus,
  BehaviorType,
  BehaviorCategoryItem,
  FollowUpItem,
  StudentBehaviorProfile,
  StudentRef,
} from '@/lib/teacher-hub-types'

// ---------- record type config ----------

export interface BehaviorTypeConfig {
  label: string
  /** left accent border on record rows */
  border: string
  /** small dot colour */
  dot: string
  /** text tone */
  text: string
  /** active segmented button in the Record Observation dialog */
  segmentActive: string
}

export const TYPE_CONFIG: Record<BehaviorType, BehaviorTypeConfig> = {
  positive: {
    label: 'Positive',
    border: 'border-l-emerald-500',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    segmentActive: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  observation: {
    label: 'Observation',
    border: 'border-l-sky-500',
    dot: 'bg-sky-500',
    text: 'text-sky-600 dark:text-sky-400',
    segmentActive: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400',
  },
  concern: {
    label: 'Concern',
    border: 'border-l-rose-500',
    dot: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    segmentActive: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400',
  },
}

export const TYPE_ORDER: BehaviorType[] = ['positive', 'observation', 'concern']

// ---------- record status config ----------

export interface BehaviorStatusConfig {
  label: string
  dot: string
  text: string
}

export const STATUS_CONFIG: Record<BehaviorStatus, BehaviorStatusConfig> = {
  open: { label: 'Open', dot: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
  monitoring: { label: 'Monitoring', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  resolved: { label: 'Resolved', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
}

// ---------- helpers ----------

/** Resolve a category key → the school-configured label (fallback: the key). */
export function categoryLabelOf(categories: BehaviorCategoryItem[], key: string): string {
  return categories.find((c) => c.key === key)?.label ?? key
}

/** Default record type for a category kind — the user can always override. */
export function defaultTypeForKind(kind: BehaviorCategoryItem['kind']): BehaviorType {
  if (kind === 'positive') return 'positive'
  if (kind === 'concern') return 'concern'
  return 'observation'
}

export type DueState = 'overdue' | 'today' | 'later'

/** Calendar-day comparison of an ISO date against "now". */
export function dueState(iso: string, now = new Date()): DueState {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'later'
  const due = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  if (due < today) return 'overdue'
  if (due === today) return 'today'
  return 'later'
}

/** "14 Sep" (year appended when it differs from the current year) — compact date rails. */
export function compactDate(iso: string, now = new Date()): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const sameYear = d.getFullYear() === now.getFullYear()
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

/** yyyy-mm-dd for <input type="date"> values. */
export function toDateInputValue(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * The module's primary action recipe — the exact house toolbar button.
 * Shared by the toolbar, the empty state, the profile sheet and the
 * dialog submit so "Record Observation" looks identical everywhere.
 */
export const PRIMARY_ACTION_CLASS =
  'flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90'
