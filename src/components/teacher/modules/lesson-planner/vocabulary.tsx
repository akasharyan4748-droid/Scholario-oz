'use client'

/**
 * vocabulary — the Lesson Planner's status taxonomy + date arithmetic.
 *
 * The ONLY lesson statuses the module may ever render are the five
 * `LessonDisplayStatus` values (spec §23) — never Locked, never "Pending
 * Approval", never anything invented client-side. Tone discipline: emerald
 * for the completion flow, sky strictly for the TODAY badge, amber for
 * in-progress, rose for reschedule flags, slate for upcoming. No indigo,
 * no blue.
 *
 * Dates travel as school-local `YYYY-MM-DD` strings, so every helper here
 * parses them arithmetically — no `new Date('2026-09-16')` timezone traps.
 */

import {
  CalendarCheck,
  CalendarX2,
  CheckCircle2,
  Clock,
  PlayCircle,
  type LucideIcon,
} from 'lucide-react'
import { StatusBadge } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import type { LessonDisplayStatus } from '@/lib/lesson-planner-types'

export interface LessonStatusConfig {
  label: string
  icon: LucideIcon
  /** icon / standalone text tone */
  tone: string
  /** chip classes (bg / text / border) applied over the StatusBadge base */
  chip: string
}

export const LESSON_STATUS_CONFIG: Record<LessonDisplayStatus, LessonStatusConfig> = {
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2,
    tone: 'text-emerald-600 dark:text-emerald-400',
    chip: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
  },
  TODAY: {
    label: 'Today',
    icon: CalendarCheck,
    tone: 'text-sky-600 dark:text-sky-400',
    chip: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25',
  },
  IN_PROGRESS: {
    label: 'In progress',
    icon: PlayCircle,
    tone: 'text-amber-600 dark:text-amber-400',
    chip: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
  },
  UPCOMING: {
    label: 'Upcoming',
    icon: Clock,
    tone: 'text-slate-500 dark:text-slate-400',
    chip: 'bg-muted text-muted-foreground border-border',
  },
  NEEDS_RESCHEDULING: {
    label: 'Needs rescheduling',
    icon: CalendarX2,
    tone: 'text-rose-600 dark:text-rose-400',
    chip: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25',
  },
}

/** StatusBadge rendered in the lesson tone set (twMerge resolves conflicts). */
export function LessonStatusBadge({
  status,
  className,
}: {
  status: LessonDisplayStatus
  className?: string
}) {
  const config = LESSON_STATUS_CONFIG[status]
  return (
    <StatusBadge status={config.label} variant="neutral" className={cn(config.chip, className)} />
  )
}

// ─── shared action recipes (44px touch targets) ───────────────────────

/** The primary teaching action — emerald, the module's success flow. */
export const LESSON_ACTION_PRIMARY =
  'h-11 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700'
/** The secondary action — card surface, same target height. */
export const LESSON_ACTION_SECONDARY =
  'h-11 rounded-xl border border-border bg-card px-4 text-xs font-medium text-foreground hover:bg-muted/50'

// ─── date helpers (school-local YYYY-MM-DD strings) ───────────────────

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

interface DayParts {
  y: number
  m: number
  d: number
}

function parseDay(day: string): DayParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!match) return null
  const y = Number(match[1])
  const m = Number(match[2])
  const d = Number(match[3])
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  return { y, m, d }
}

/** "2026-09-16" → "16 Sep 2026" (en-IN compact, timezone-safe). */
export function formatLessonDate(day: string): string {
  const p = parseDay(day)
  return p ? `${p.d} ${MONTHS_SHORT[p.m - 1]} ${p.y}` : day
}

/** "2026-09-16" → "16 Sep" (map rows, compact meta). */
export function formatLessonDateShort(day: string): string {
  const p = parseDay(day)
  return p ? `${p.d} ${MONTHS_SHORT[p.m - 1]}` : day
}

function dayNumber(day: string): number | null {
  const p = parseDay(day)
  return p ? Date.UTC(p.y, p.m - 1, p.d) / 86_400_000 : null
}

/** The local calendar today as YYYY-MM-DD (the planner's school frame). */
export function localTodayISO(): string {
  const now = new Date()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${m}-${d}`
}

/**
 * "Today" / "Tomorrow" / weekday-then-date for the first week ahead,
 * then the plain date. Past dates fall back to the date honestly.
 */
export function relativeLessonDate(day: string, today: string): string {
  const t = dayNumber(today)
  const d = dayNumber(day)
  if (t === null || d === null) return formatLessonDate(day)
  const diff = d - t
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff > 1 && diff <= 7) {
    const p = parseDay(day)
    if (p) {
      const weekday = WEEKDAYS_SHORT[new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay()]
      return `${weekday}, ${p.d} ${MONTHS_SHORT[p.m - 1]}`
    }
  }
  return formatLessonDate(day)
}

// ─── minutes → periods ────────────────────────────────────────────────

/** 45-minute periods, always at least one. */
export function minutesToPeriods(min: number): number {
  return Math.max(1, Math.round(min / 45))
}

/** "~12 periods" / "~1 period" — the teacher-facing estimate label. */
export function periodsLabel(min: number): string {
  const p = minutesToPeriods(min)
  return `~${p} period${p === 1 ? '' : 's'}`
}

/** en-IN grouped minutes ("5,490 min"). */
export function formatMinutes(min: number): string {
  return min.toLocaleString('en-IN')
}
