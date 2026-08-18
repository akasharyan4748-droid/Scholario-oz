/**
 * Schedule types — Spec §5 / §10 / §12.
 *
 * The schedule model is PER-CLASS: each selected academic class/group gets
 * its own column of subjects. There is NO union of subjects across classes
 * (Spec §11 — no cross-contamination).
 *
 * A `ScheduleCell` is one subject exam slot for one class on one date+slot.
 * Empty cells (no subject assigned) are represented as `null`.
 *
 * The timetable is a 2D grid:
 *   rows = (date × slot) pairs, in chronological order, Sundays skipped
 *   cols = one per selected academic class
 */

export interface ScheduleClass {
  /** Class id (e.g. 'C09', 'C14-PCM'). */
  id: string
  /** Display label (e.g. "Class 6", "Class 11 — Science PCM"). */
  label: string
  /** Subjects assigned to this class — only these may appear in this column. */
  subjects: ScheduleSubject[]
}

export interface ScheduleSubject {
  /** Canonical subject id (stable across renames). */
  id: string
  /** Current display name (resolved from the academic registry). */
  name: string
  /** 3-letter code. */
  code: string
}

export interface ScheduleRow {
  /** YYYY-MM-DD — a working day (Mon–Sat, Sundays skipped). */
  date: string
  /** Day-of-week short label (e.g. "Wed"). */
  dayLabel: string
  /** Slot index within the day (0 for 1-paper/day; 0 or 1 for 2-papers/day). */
  slotIndex: number
  /** Slot label (e.g. "Slot 1", "09:00–10:00"). */
  slotLabel: string
  /** Start time HH:MM. */
  startTime: string
  /** End time HH:MM. */
  endTime: string
  /** One cell per class column. `null` = empty (no exam in this slot for this class). */
  cells: (ScheduleCell | null)[]
}

export interface ScheduleCell {
  /** Canonical subject id — must belong to the class's own subject list. */
  subjectId: string
  /** Display name (resolved from registry at render time). */
  subjectName: string
  /** 3-letter code. */
  subjectCode: string
}

export interface ScheduleTimetable {
  /** Column definitions — one per selected class. */
  classes: ScheduleClass[]
  /** Rows — (date × slot) pairs, chronological, Sundays skipped. */
  rows: ScheduleRow[]
  /** Whether all subjects fit in the window. */
  fits: boolean
  /** How many more days would be needed if `fits` is false. */
  additionalDaysNeeded: number
}

/** Options passed to the schedule generator. */
export interface ScheduleOptions {
  /** Start date YYYY-MM-DD (inclusive). Must be >= tomorrow. */
  startDate: string
  /** End date YYYY-MM-DD (inclusive). Must be >= startDate. */
  endDate: string
  /** Papers per day — 1 or 2. */
  papersPerDay: number
  /** Start time HH:MM (e.g. "09:00"). */
  startTime: string
  /** Paper duration in minutes (e.g. 60 for UT, 195 for Half-Yearly). */
  paperDurationMin: number
  /** Gap between papers in minutes (e.g. 15). */
  gapMin: number
  /** Skip Sundays (day 0). Default true. */
  skipSundays?: boolean
}
