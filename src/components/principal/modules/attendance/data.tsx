// Attendance module: month-aware calendar helpers + color tokens.
//
// Brief PART 6-8 (Phase 5): Heatmap must build calendar for ANY month,
// not just December 2025. Month navigation arrows actually work + data
// changes with the selected month.
//
// Brief PART 9-13: Uses school-calendar.ts as the single source of truth
// for holidays + weekends. NO duplicate holiday list here.

import { isHoliday, isWeekend, getHoliday, type Holiday } from '@/lib/mock/school-calendar'
import { attendanceOverview } from '@/lib/mock/attendance'

export type CalendarCell = {
  /** ISO date string (YYYY-MM-DD) — used for school-calendar lookups. */
  dateStr: string
  /** Day-of-month number (1-31), or null for empty leading/trailing cells. */
  day: number | null
  /** Attendance rate (%), or null for non-working days. */
  rate: number | null
  /** True if Saturday or Sunday. */
  isWeekend: boolean
  /** True if school holiday (from school-calendar). */
  isHoliday: boolean
  /** Holiday details (name + type), if applicable. */
  holiday: Holiday | null
}

/**
 * Build a calendar grid for a given month + year.
 *
 * Brief PART 6-7: The calendar grid aligns weekdays correctly (Sunday-first),
 * so different months render different leading null cells.
 *
 * Brief PART 7: Calendar data (rates, holidays, weekend flags) is computed
 * for the actual selected month — NOT static December 2025.
 *
 * Brief PART 9: Holidays come from school-calendar.ts (single source).
 *
 * Brief PART 35: Weekend cells show "Weekend" — clearly distinguished from
 * attendance intensity colors.
 */
export function buildMonthCalendar(year: number, month: number): CalendarCell[] {
  const days: CalendarCell[] = []
  // First day of the month
  const firstDay = new Date(year, month - 1, 1)
  // Day-of-week of the 1st (0=Sun, 1=Mon, ..., 6=Sat)
  const firstDayOfWeek = firstDay.getDay()
  // Number of days in the month
  const daysInMonth = new Date(year, month, 0).getDate()

  // Leading empty cells (Sunday-first grid)
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push({
      dateStr: '',
      day: null,
      rate: null,
      isWeekend: false,
      isHoliday: false,
      holiday: null,
    })
  }

  // Real day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const weekend = isWeekend(dateStr)
    const holiday = isHoliday(dateStr)
    const holidayDetails = getHoliday(dateStr)
    let rate: number | null = null
    // Brief PART 7: derive a deterministic attendance rate per working day.
    // Uses the same fluctuation formula as before, but keyed on the date
    // so different months produce different (but stable) rates.
    if (!weekend && !holiday) {
      // Brief PART 12: future dates have NO rate (yet to occur).
      const today = '2025-12-10'
      if (dateStr > today) {
        rate = null
      } else {
        // Deterministic per-date fluctuation
        const seed = year * 10000 + month * 100 + d
        rate = 88 + Math.round(Math.sin(seed * 0.6) * 4 + Math.cos(seed * 0.3) * 3 + 4)
        rate = Math.max(82, Math.min(98, rate))
      }
    }
    days.push({
      dateStr,
      day: d,
      rate,
      isWeekend: weekend,
      isHoliday: holiday,
      holiday: holidayDetails,
    })
  }

  return days
}

/** Backward-compatible export: December 2025 calendar. */
export const decemberCalendar = buildMonthCalendar(2025, 12)

export function rateColor(rate: number | null): string {
  if (rate === null) return 'bg-muted/40 border-border'
  if (rate >= 95) return 'bg-emerald-500/85 border-emerald-600 text-white'
  if (rate >= 90) return 'bg-emerald-400/60 border-emerald-500 text-emerald-950'
  if (rate >= 85) return 'bg-amber-400/70 border-amber-500 text-amber-950'
  return 'bg-rose-400/70 border-rose-500 text-rose-950'
}

/** Holiday cell color — distinct from attendance intensity (Brief PART 35). */
export const HOLIDAY_CELL_COLOR = 'bg-violet-500/15 border-violet-500/40 text-violet-700 dark:text-violet-300'

export const todayBreakdown = [
  { name: 'Present', value: attendanceOverview.today.present, color: 'oklch(0.65 0.16 162)' },
  { name: 'Late', value: attendanceOverview.today.late, color: 'oklch(0.7 0.15 75)' },
  { name: 'Absent', value: attendanceOverview.today.absent, color: 'oklch(0.62 0.2 25)' },
  { name: 'Leave', value: attendanceOverview.today.leave, color: 'oklch(0.7 0.15 200)' },
]

// Realistic student count per class — used by the Class-wise Report table.
export const CLASS_TOTALS = [48, 52, 56, 96, 99, 64, 68, 70, 72, 74]
export function classTotalForIndex(i: number): number {
  return CLASS_TOTALS[i] ?? 60
}

/** Format a (year, month) as a readable label. */
export function formatMonthLabel(year: number, month: number): string {
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

/** Compact "MON YYYY" label (e.g., "DEC 2025") for the heatmap header. */
export function formatMonthLabelCompact(year: number, month: number): string {
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }).toUpperCase()
}
