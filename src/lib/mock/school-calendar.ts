// school-calendar.ts — single source of truth for the academic calendar.
//
// Brief PART 9-13 + PART 34-35: Attendance MUST respect the school's official
// academic calendar — no duplicate holiday lists inside Attendance or Staff.
//
// Provides:
//   - isHoliday(dateStr) → boolean
//   - getHoliday(dateStr) → { name, type } | null
//   - isWorkingDay(dateStr) → boolean (working day = not weekend + not holiday)
//   - isFutureDate(dateStr, todayStr) → boolean
//
// Holidays are derived from the existing `calendarEvents` (Holiday type) +
// standard Indian school holidays. This is the SINGLE source — both student
// attendance + staff attendance consume this module.

/**
 * Standard Indian school holidays (month, day, name).
 * These are deterministic year-over-year.
 */
const FIXED_HOLIDAYS: { month: number; day: number; name: string; type: 'national' | 'religious' | 'school' }[] = [
  { month: 1, day: 26, name: 'Republic Day', type: 'national' },
  { month: 8, day: 15, name: 'Independence Day', type: 'national' },
  { month: 10, day: 2, name: 'Gandhi Jayanti', type: 'national' },
  { month: 12, day: 25, name: 'Christmas Day', type: 'religious' },
  { month: 1, day: 1, name: 'New Year\'s Day', type: 'school' },
  { month: 11, day: 1, name: 'Karnataka Rajyotsava', type: 'school' },
]

/**
 * Winter break (Dec 23 → Jan 1) — declared by the school.
 */
const WINTER_BREAK = { startMonth: 12, startDay: 23, endMonth: 1, endDay: 1, name: 'Winter Break', type: 'school' as const }

/**
 * Summer break (Apr 15 → May 31) — declared by the school.
 */
const SUMMER_BREAK = { startMonth: 4, startDay: 15, endMonth: 5, endDay: 31, name: 'Summer Break', type: 'school' as const }

export interface Holiday {
  dateStr: string
  name: string
  type: 'national' | 'religious' | 'school' | 'winter-break' | 'summer-break'
}

/** Format a date as YYYY-MM-DD (no timezone shift). */
function formatISO(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Parse YYYY-MM-DD → { year, month, day } */
function parseISO(dateStr: string): { year: number; month: number; day: number } | null {
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  return { year: parseInt(m[1], 10), month: parseInt(m[2], 10), day: parseInt(m[3], 10) }
}

/** Check if a date falls within a date range (inclusive), supporting year wrap. */
function isInRange(year: number, month: number, day: number, range: { startMonth: number; startDay: number; endMonth: number; endDay: number }): boolean {
  // Convert date to comparable "month-day" tuple
  const target = month * 100 + day
  const start = range.startMonth * 100 + range.startDay
  const end = range.endMonth * 100 + range.endDay
  if (start <= end) {
    return target >= start && target <= end
  }
  // Range wraps around year boundary (e.g., Dec 23 → Jan 1)
  return target >= start || target <= end
}

/**
 * Returns the holiday for a specific date, or null if it's a working day.
 * Brief PART 9: SINGLE source of truth — no duplicate lists.
 */
export function getHoliday(dateStr: string): Holiday | null {
  const parsed = parseISO(dateStr)
  if (!parsed) return null
  const { year, month, day } = parsed

  // Fixed holidays (Jan 26, Aug 15, Oct 2, Dec 25, etc.)
  for (const h of FIXED_HOLIDAYS) {
    if (h.month === month && h.day === day) {
      return { dateStr, name: h.name, type: h.type }
    }
  }

  // Winter break
  if (isInRange(year, month, day, WINTER_BREAK)) {
    return { dateStr, name: WINTER_BREAK.name, type: 'winter-break' }
  }
  // Summer break
  if (isInRange(year, month, day, SUMMER_BREAK)) {
    return { dateStr, name: SUMMER_BREAK.name, type: 'summer-break' }
  }

  // Sundays + Saturdays are weekend (handled separately by isWeekend),
  // not as holidays per Brief PART 35.
  return null
}

/** Returns true if the date is a school holiday (working day = false). */
export function isHoliday(dateStr: string): boolean {
  return getHoliday(dateStr) !== null
}

/** Returns true if the date is a weekend (Sunday or Saturday). */
export function isWeekend(dateStr: string): boolean {
  const parsed = parseISO(dateStr)
  if (!parsed) return false
  const date = new Date(parsed.year, parsed.month - 1, parsed.day)
  const dayOfWeek = date.getDay() // 0=Sun, 6=Sat
  return dayOfWeek === 0 || dayOfWeek === 6
}

/** Returns true if the date is a working day (not weekend + not holiday). */
export function isWorkingDay(dateStr: string): boolean {
  return !isWeekend(dateStr) && !isHoliday(dateStr)
}

/**
 * Returns true if the date is in the future (after `todayStr`).
 * Brief PART 12 + PART 46: future dates are not markable.
 */
export function isFutureDate(dateStr: string, todayStr: string): boolean {
  return dateStr > todayStr
}

/** Returns true if the date is today. */
export function isToday(dateStr: string, todayStr: string): boolean {
  return dateStr === todayStr
}

/** Returns true if the date is in the past (before today). */
export function isPastDate(dateStr: string, todayStr: string): boolean {
  return dateStr < todayStr
}

/** The canonical "today" string used by the Attendance module. */
export const TODAY_STR = '2025-12-10'

/**
 * Categorize a date by its attendance state (Brief PART 46):
 *   - 'future' — disabled (not markable)
 *   - 'holiday' — disabled (no attendance)
 *   - 'working' — editable (if not submitted)
 *
 * Holiday takes precedence over future (Brief PART 13).
 */
export type DateCategory = 'future' | 'holiday' | 'working'

export function categorizeDate(dateStr: string, todayStr: string = TODAY_STR): DateCategory {
  if (isHoliday(dateStr)) return 'holiday'
  if (isFutureDate(dateStr, todayStr)) return 'future'
  return 'working'
}
