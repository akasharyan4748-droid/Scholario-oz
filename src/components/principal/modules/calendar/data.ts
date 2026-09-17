/**
 * Calendar module data helpers — colors, types, week-day headers, padding.
 *
 * The previous hardcoded constants (YEAR=2025, MONTH=11, FIRST_DAY=0,
 * DAYS_IN_MONTH=31) are GONE — the visible year/month is now runtime state
 * owned by the Calendar shell, and the grid is recomputed dynamically when
 * the user navigates between months.
 *
 * CalendarEvent is re-exported from the canonical `calendar-store` so the
 * whole module shares a single type definition.
 */

export type { CalendarEvent, CalendarEventSource } from '@/lib/store/calendar-store'

// Event-type colors — small accent dots, never large color blocks.
// Spec: Exam=red, Event=emerald, Holiday=amber, Meeting=violet,
// Competition=cyan, Cultural=violet-blue, General=grey.
// NO indigo or blue.
export const TYPE_COLORS: Record<string, string> = {
  Exam: 'oklch(0.62 0.2 25)',
  Event: 'oklch(0.55 0.14 162)',
  Holiday: 'oklch(0.7 0.16 75)',
  Meeting: 'oklch(0.6 0.18 300)',
  Competition: 'oklch(0.7 0.15 200)',
  Cultural: 'oklch(0.55 0.16 250)',
  General: 'oklch(0.55 0.02 160)',
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

/** Pad a single-digit number with a leading zero (1 → '01'). */
export function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

/**
 * Build the 42-cell month grid (7 cols × 6 rows).
 *
 * Cells before the first weekday of the month and after the last day are
 * `null` (rendered as empty spacers).
 */
export function buildMonthCells(year: number, month0: number): (number | null)[] {
  const firstDay = new Date(year, month0, 1).getDay() // 0 = Sunday
  const daysInMonth = new Date(year, month0 + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length < 42) cells.push(null)
  return cells
}

/** Returns the day-of-month (1-31) of "today" if it falls in the given month, else null. */
export function getTodayInMonth(year: number, month0: number): number | null {
  const t = new Date()
  if (t.getFullYear() === year && t.getMonth() === month0) return t.getDate()
  return null
}
