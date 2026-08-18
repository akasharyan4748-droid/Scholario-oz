/**
 * Schedule generator — Spec §3 / §10 / §11 / §12 / §13.
 *
 * Pure function. Takes academic classes (each with its OWN subjects) + a
 * date window + papers/day → returns a per-class timetable.
 *
 * Key invariants (Spec §10 / §11 — no cross-contamination):
 *   - Each class column contains ONLY that class's subjects.
 *   - A subject is never duplicated within a class.
 *   - No subject from one class leaks into another class's column.
 *   - No date outside [startDate, endDate] is ever generated.
 *   - Sundays are skipped (Spec §7).
 *
 * Allocation strategy (Spec §12 / §13):
 *   - For each class, round-robin its subjects into the (date × slot) grid.
 *   - Different classes fill the SAME date+slot independently — e.g. on
 *     19 Aug slot 1, Class 6 has Hindi, Class 11-PCM has Physics, etc.
 *   - If a class runs out of subjects, its remaining cells are empty (null).
 *   - If the window is too short to fit a class's subjects, `fits=false`
 *     and `additionalDaysNeeded` is computed.
 */

import type {
  ScheduleClass,
  ScheduleOptions,
  ScheduleRow,
  ScheduleTimetable,
  ScheduleSubject,
} from './schedule-types'

/** Parse YYYY-MM-DD as a local date (NOT UTC) — avoids the "18 Aug" off-by-one. */
function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

/** Format a Date as YYYY-MM-DD (local, no timezone shift). */
function toLocalISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Add minutes to a HH:MM string, returning HH:MM (24h, no overflow past 23:59). */
function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = (h ?? 0) * 60 + (m ?? 0) + mins
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

/** Build the list of working dates (Sundays skipped) within [start, end]. */
function buildWorkingDates(start: Date, end: Date, skipSundays: boolean): Date[] {
  const out: Date[] = []
  const cur = new Date(start)
  cur.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  while (cur <= end) {
    if (!skipSundays || cur.getDay() !== 0) out.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

/**
 * Generate the timetable.
 *
 * @param classes  One entry per selected academic class/group, each with its OWN subjects.
 * @param options  Date window + papers/day + timing.
 */
export function generateScheduleTimetable(
  classes: ScheduleClass[],
  options: ScheduleOptions,
): ScheduleTimetable {
  const skipSundays = options.skipSundays ?? true
  const start = parseLocalDate(options.startDate)
  const end = parseLocalDate(options.endDate || options.startDate)
  const workingDates = buildWorkingDates(start, end, skipSundays)

  // Build rows: one row per (date × slot). For papersPerDay=1, one slot per day.
  const rows: ScheduleRow[] = []
  const slotsPerDay = options.papersPerDay >= 2 ? 2 : 1
  for (const date of workingDates) {
    const iso = toLocalISO(date)
    const dayLabel = DAY_LABELS[date.getDay()] ?? ''
    for (let slot = 0; slot < slotsPerDay; slot++) {
      const startTime = slot === 0
        ? options.startTime
        : addMinutes(options.startTime, options.paperDurationMin + options.gapMin)
      const endTime = addMinutes(startTime, options.paperDurationMin)
      const slotLabel = slotsPerDay === 1 ? 'Single' : `Slot ${slot + 1}`
      rows.push({
        date: iso,
        dayLabel,
        slotIndex: slot,
        slotLabel,
        startTime,
        endTime,
        cells: classes.map(() => null), // filled below
      })
    }
  }

  // Allocate subjects per class — round-robin into the (date × slot) rows.
  // Each class fills rows independently; empty cells stay null.
  const maxSubjects = Math.max(0, ...classes.map((c) => c.subjects.length))
  rows.forEach((row) => {
    classes.forEach((cls, classIdx) => {
      const subjects = cls.subjects
      if (subjects.length === 0) return
      // Linear index for this class into the rows: rowIdx * slotsPerDay + slotIndex.
      const linearIdx = rows.indexOf(row)
      if (linearIdx < subjects.length) {
        const subj: ScheduleSubject = subjects[linearIdx]
        row.cells[classIdx] = {
          subjectId: subj.id,
          subjectName: subj.name,
          subjectCode: subj.code,
        }
      }
    })
  })

  // Fit check: does the window have enough rows for the class with the most subjects?
  const totalSlots = rows.length
  const fits = totalSlots >= maxSubjects
  const additionalDaysNeeded = fits ? 0 : Math.ceil((maxSubjects - totalSlots) / slotsPerDay)

  return {
    classes,
    rows,
    fits,
    additionalDaysNeeded,
  }
}

/**
 * Validate a date window (Spec §1 / §2).
 *   - startDate must be >= tomorrow.
 *   - endDate must be >= startDate.
 */
export interface ScheduleWindowValidation {
  valid: boolean
  startError: string | null
  endError: string | null
}

export function validateScheduleWindow(
  startDate: string,
  endDate: string,
  todayISO: string,
): ScheduleWindowValidation {
  const result: ScheduleWindowValidation = { valid: true, startError: null, endError: null }
  if (!startDate) {
    result.valid = false
    result.startError = 'Select a start date.'
    return result
  }
  // Spec §1 — earliest selectable date is TOMORROW.
  if (startDate < todayISO) {
    result.valid = false
    result.startError = 'Start date cannot be today or in the past.'
  }
  if (endDate && endDate < startDate) {
    result.valid = false
    result.endError = 'End date cannot be before the start date.'
  }
  return result
}

/** Returns tomorrow's date as YYYY-MM-DD (local). */
export function tomorrowISO(now: Date = new Date()): string {
  const d = new Date(now)
  d.setDate(d.getDate() + 1)
  d.setHours(0, 0, 0, 0)
  return toLocalISO(d)
}

/** Returns today's date as YYYY-MM-DD (local). */
export function todayISO(now: Date = new Date()): string {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  return toLocalISO(d)
}
