// Attendance module: mock data wiring, calendar helpers, color tokens.
// No JSX in this file — kept as `.tsx` to match the students module convention
// (see `students/shared.tsx`) so the folder reads as a uniform React module.

import { attendanceOverview } from '@/lib/mock/attendance'

// Build December 2025 attendance heatmap data
// December 1, 2025 is a Sunday. So days: Sun=1, Mon=2, ... Sat=7
// Calendar grid: weeks start Sunday
export type CalendarCell = {
  day: number | null
  rate: number | null
  isWeekend: boolean
  isHoliday: boolean
}

export function buildDecemberCalendar(): CalendarCell[] {
  const days: CalendarCell[] = []
  // Dec 1, 2025 = Sunday → first column of first row (no leading nulls needed)
  for (let i = 0; i < 0; i++) days.push({ day: null, rate: null, isWeekend: false, isHoliday: false })
  // December has 31 days
  for (let d = 1; d <= 31; d++) {
    const dayOfWeek = (d - 1) % 7 // 0=Sun (Dec 1), 1=Mon (Dec 2), etc.
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    // Christmas holidays: Dec 23–Jan 1 (winter break)
    const isHoliday = d >= 23
    let rate: number | null = null
    if (!isWeekend && !isHoliday) {
      // Realistic attendance fluctuation
      rate = 88 + Math.round(Math.sin(d * 0.6) * 4 + Math.cos(d * 0.3) * 3 + 4)
      rate = Math.max(82, Math.min(98, rate))
    }
    days.push({ day: d, rate, isWeekend, isHoliday })
  }
  return days
}

export const decemberCalendar = buildDecemberCalendar()

export function rateColor(rate: number | null): string {
  if (rate === null) return 'bg-muted/40 border-border'
  if (rate >= 95) return 'bg-emerald-500/85 border-emerald-600 text-white'
  if (rate >= 90) return 'bg-emerald-400/60 border-emerald-500 text-emerald-950'
  if (rate >= 85) return 'bg-amber-400/70 border-amber-500 text-amber-950'
  return 'bg-rose-400/70 border-rose-500 text-rose-950'
}

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
