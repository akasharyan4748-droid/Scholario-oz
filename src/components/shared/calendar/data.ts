'use client'

/**
 * calendar/data — canonical helpers + visual tokens for the shared
 * Calendar workspace (used by BOTH the Principal and Student panels).
 *
 * The event data layer itself stays in `@/lib/store/calendar-store`
 * (single source of truth — no duplicate calendar systems). This file
 * only provides presentation tokens (type colors, tints) and pure
 * month-grid helpers.
 *
 * "Today" anchors to the app's canonical academic timeline
 * (`TODAY_STR` from `@/lib/mock/school-calendar`, Dec 10 2025) so the
 * calendar opens on the same month the rest of Scholario-OS is showing
 * (attendance, dashboards, exam schedule) instead of an empty real-clock
 * month.
 */

import { TODAY_STR } from '@/lib/mock/school-calendar'

export type { CalendarEvent, CalendarEventSource } from '@/lib/store/calendar-store'

// ─── Canonical "today" ────────────────────────────────────────────────

/** The app's canonical today (YYYY-MM-DD) — matches Attendance/timeline. */
export const CANONICAL_TODAY = TODAY_STR

export function todayParts(): { year: number; month: number; day: number } {
  const [y, m, d] = CANONICAL_TODAY.split('-').map(Number)
  return { year: y, month: m - 1, day: d }
}

// ─── Event type tokens ────────────────────────────────────────────────

/**
 * Per-type visual tokens — ONE restrained accent per event type:
 *   - `solid`  : oklch color for dots / date tiles (inline style)
 *   - `chipBg` : background for in-cell chips (type color @ ~12%,
 *                tuned to read as translucent glass over the frosted
 *                calendar card)
 *   - `badge`  : pill background for type badges
 *   - `text`   : chip/badge text color (light + dark)
 * NO indigo/blue. Same family as the previous module palette, with
 * Cultural nudged from blue-violet → fuchsia to stay out of blue.
 */
export interface TypeToken {
  solid: string
  chipBg: string
  badge: string
  text: string
}

export const TYPE_TOKENS: Record<string, TypeToken> = {
  Exam: {
    solid: 'oklch(0.62 0.2 20)',
    chipBg: 'bg-rose-500/[0.12]',
    badge: 'bg-rose-500/10',
    text: 'text-rose-700 dark:text-rose-300',
  },
  Event: {
    solid: 'oklch(0.55 0.14 162)',
    chipBg: 'bg-emerald-500/[0.12]',
    badge: 'bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  Holiday: {
    solid: 'oklch(0.7 0.16 75)',
    chipBg: 'bg-amber-500/[0.12]',
    badge: 'bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-300',
  },
  Meeting: {
    solid: 'oklch(0.6 0.18 300)',
    chipBg: 'bg-violet-500/[0.12]',
    badge: 'bg-violet-500/10',
    text: 'text-violet-700 dark:text-violet-300',
  },
  Competition: {
    solid: 'oklch(0.68 0.13 200)',
    chipBg: 'bg-cyan-500/[0.12]',
    badge: 'bg-cyan-500/10',
    text: 'text-cyan-700 dark:text-cyan-300',
  },
  Cultural: {
    solid: 'oklch(0.6 0.18 330)',
    chipBg: 'bg-fuchsia-500/[0.12]',
    badge: 'bg-fuchsia-500/10',
    text: 'text-fuchsia-700 dark:text-fuchsia-300',
  },
  General: {
    solid: 'oklch(0.55 0.02 160)',
    chipBg: 'bg-foreground/[0.05]',
    badge: 'bg-muted',
    text: 'text-muted-foreground',
  },
}

/** Solid dot color for an event type (falls back to General). */
export function typeColor(type: string): string {
  return TYPE_TOKENS[type]?.solid ?? TYPE_TOKENS.General.solid
}

export const ALL_TYPES = [
  'Exam',
  'Event',
  'Holiday',
  'Meeting',
  'Competition',
  'Cultural',
  'General',
] as const

export const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

// ─── Pure month-grid helpers ──────────────────────────────────────────

export interface MonthCell {
  /** Day of month. */
  day: number
  /** Full ISO date (YYYY-MM-DD). */
  dateISO: string
  /** True when the cell belongs to the visible month. */
  inMonth: boolean
  /** 0 = same month, -1 = previous, +1 = next (for adjacent-day clicks). */
  monthOffset: number
}

/** Pad 1 → '01'. */
export function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function isoOf(year: number, month0: number, day: number): string {
  return `${year}-${pad(month0 + 1)}-${pad(day)}`
}

/**
 * Build the 6×7 (42-cell) month matrix INCLUDING muted adjacent-month
 * days (like modern enterprise calendars) instead of blank spacers.
 * Clicking an adjacent day navigates to that month.
 */
export function buildMonthMatrix(year: number, month0: number): MonthCell[] {
  const firstWeekday = new Date(year, month0, 1).getDay() // 0 = Sunday
  const daysInMonth = new Date(year, month0 + 1, 0).getDate()
  const daysInPrev = new Date(year, month0, 0).getDate()

  const cells: MonthCell[] = []

  // Leading cells — tail of the previous month.
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = daysInPrev - i
    cells.push({
      day,
      dateISO: month0 === 0 ? isoOf(year - 1, 11, day) : isoOf(year, month0 - 1, day),
      inMonth: false,
      monthOffset: -1,
    })
  }
  // Visible-month cells.
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, dateISO: isoOf(year, month0, d), inMonth: true, monthOffset: 0 })
  }
  // Trailing cells — head of the next month (fill to 42).
  let next = 1
  while (cells.length < 42) {
    cells.push({
      day: next,
      dateISO: month0 === 11 ? isoOf(year + 1, 0, next) : isoOf(year, month0 + 1, next),
      inMonth: false,
      monthOffset: 1,
    })
    next++
  }
  return cells
}

/** Day-of-month of the canonical today, if it falls in the given month. */
export function getTodayInMonth(year: number, month0: number): number | null {
  const t = todayParts()
  if (t.year === year && t.month === month0) return t.day
  return null
}

// ─── Date formatting (timezone-safe — parses ISO manually) ────────────

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

function parseISO(dateStr: string): { y: number; m: number; d: number } | null {
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  return { y: parseInt(m[1], 10), m: parseInt(m[2], 10) - 1, d: parseInt(m[3], 10) }
}

/** "15 Dec 2025" */
export function formatDayMonthYear(dateStr: string): string {
  const p = parseISO(dateStr)
  if (!p) return dateStr
  return `${p.d} ${MONTH_NAMES[p.m].slice(0, 3)} ${p.y}`
}

/** "Monday" for a YYYY-MM-DD string. */
export function weekdayOf(dateStr: string): string {
  const p = parseISO(dateStr)
  if (!p) return ''
  const dow = new Date(p.y, p.m, p.d).getDay()
  return WEEKDAY_NAMES[dow]
}

/** "15" + "DEC" — compact tile label parts. */
export function formatDayMonth(dateStr: string): { day: string; month: string } {
  const p = parseISO(dateStr)
  if (!p) return { day: '–', month: '' }
  return { day: String(p.d), month: MONTH_NAMES[p.m].slice(0, 3).toUpperCase() }
}

/** "Mon, 15 December 2025" — full readable label. */
export function formatFullDate(dateStr: string): string {
  const p = parseISO(dateStr)
  if (!p) return dateStr
  const wd = weekdayOf(dateStr).slice(0, 3)
  return `${wd}, ${p.d} ${MONTH_NAMES[p.m]} ${p.y}`
}

/** Human time label: "09:00" → "9:00 AM", "—" → "All day". */
export function formatTimeLabel(time: string): string {
  if (!time || time === '—') return 'All day'
  const m = time.match(/^(\d{2}):(\d{2})$/)
  if (!m) return time
  const h = parseInt(m[1], 10)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${m[2]} ${suffix}`
}

/** Source label for detail rows. */
export const SOURCE_META: Record<string, { label: string }> = {
  school: { label: 'School event' },
  exam: { label: 'Exam schedule' },
  holiday: { label: 'Official holiday' },
  user: { label: 'Added by you' },
}
