'use client'

/**
 * time-engine — THE canonical time calculator for the Timetable module.
 *
 * Brief section 1: ONE source of truth. Period times are DERIVED from:
 *   - schoolStart (anchor)
 *   - row sequence (order)
 *   - each row's durationMin
 *
 * Brief section 1.7: Any structural mutation (add/delete/move/break change)
 * MUST funnel through `recomputeRowTimes` so the timeline stays
 * chronologically valid.
 *
 * Brief section 1.8: `validateTimeline` surfaces invalid states.
 *
 * Brief section 15: UI, Preview, and PDF all read the SAME derived `.time`
 * string — never re-calculate independently.
 *
 * DURATION MODEL
 * ──────────────
 * Each row carries its own `durationMin`:
 *   - Period:     45 (default, user-editable via TimeEditor)
 *   - Short Break:15 (default)
 *   - Lunch Break:45 (default)
 *
 * When the user edits a row's time via TimeEditor:
 *   1. The new range is parsed → new durationMin = end − start.
 *   2. This row keeps its new start; subsequent rows cascade from
 *      new end via `recomputeRowTimes` starting from this row.
 *
 * This means editing one row never silently breaks the rest of the day.
 */

/** Default period/break durations in minutes (Brief section 1.5 + 1.6). */
export const DEFAULT_PERIOD_DURATION_MIN = 45
export const DEFAULT_SHORT_BREAK_DURATION_MIN = 15
export const DEFAULT_LUNCH_BREAK_DURATION_MIN = 45

/** Default anchor — first period starts at 08:30 AM. */
export const DEFAULT_SCHOOL_START = '08:30 AM'

/* ────────────── Time format helpers ────────────── */

/** Parse "08:30 AM" → minutes from midnight (510). Falls back to 510. */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 510
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return 510
  let hour = parseInt(match[1], 10)
  const minute = parseInt(match[2], 10)
  const period = match[3].toUpperCase()
  if (period === 'PM' && hour !== 12) hour += 12
  if (period === 'AM' && hour === 12) hour = 0
  return hour * 60 + minute
}

/** Minutes from midnight → "08:30 AM". */
export function formatMinutesToTime(minutes: number): string {
  let hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  const period = hour >= 12 ? 'PM' : 'AM'
  if (hour === 0) hour = 12
  if (hour > 12) hour -= 12
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`
}

/** Parse "08:30 AM - 09:15 AM" → { start, end } in minutes from midnight. */
export function parseTimeRange(timeStr: string): { start: number; end: number } {
  if (!timeStr) return { start: parseTimeToMinutes(DEFAULT_SCHOOL_START), end: parseTimeToMinutes(DEFAULT_SCHOOL_START) + DEFAULT_PERIOD_DURATION_MIN }
  const parts = timeStr.split(' - ')
  const start = parseTimeToMinutes(parts[0] || DEFAULT_SCHOOL_START)
  // If end is missing, infer start + 45 min
  const endStr = parts[1] || formatMinutesToTime(start + DEFAULT_PERIOD_DURATION_MIN)
  const end = parseTimeToMinutes(endStr)
  // Handle next-day wrap (e.g., 11:30 PM → 12:30 AM next day)
  return { start, end: end < start ? end + 24 * 60 : end }
}

/* ────────────── Row type + duration defaults ────────────── */

export interface TimelineRow {
  number: number
  name: string
  time: string
  isBreak: boolean
  breakType?: 'short' | 'lunch'
  /** Duration in minutes — the only per-row time value that matters.
   *  `.time` is always DERIVED from this via `recomputeRowTimes`. */
  durationMin: number
}

/** Default duration for a row of a given type. */
export function defaultDurationForRow(isBreak: boolean, breakType?: 'short' | 'lunch'): number {
  if (!isBreak) return DEFAULT_PERIOD_DURATION_MIN
  if (breakType === 'short') return DEFAULT_SHORT_BREAK_DURATION_MIN
  if (breakType === 'lunch') return DEFAULT_LUNCH_BREAK_DURATION_MIN
  return DEFAULT_SHORT_BREAK_DURATION_MIN
}

/* ────────────── Canonical recomputation ────────────── */

/**
 * Brief 1.1 + 1.7: Recompute `.time` for every row from a single anchor.
 *
 * The new array preserves each row's `durationMin` — only `.time` is derived.
 *
 * @param rows          The current row sequence.
 * @param schoolStart   Anchor time string, e.g. "08:30 AM".
 *                      If omitted, uses the first row's current start time.
 */
export function recomputeRowTimes<T extends TimelineRow>(
  rows: T[],
  schoolStart?: string
): T[] {
  if (rows.length === 0) return rows

  // Anchor: explicit param > first row's current start > DEFAULT_SCHOOL_START
  let cursor: number
  if (schoolStart) {
    cursor = parseTimeToMinutes(schoolStart)
  } else {
    cursor = parseTimeRange(rows[0].time).start
  }

  return rows.map((row) => {
    const start = cursor
    const end = start + row.durationMin
    cursor = end
    return { ...row, time: `${formatMinutesToTime(start)} - ${formatMinutesToTime(end)}` }
  })
}

/**
 * Brief 1.7 (single-row edit): Re-anchor the timeline at one specific row.
 *
 * Used when the user edits one row's start/end via TimeEditor. The edited row
 * keeps its new start + new durationMin; every row AFTER it cascades.
 *
 * Rows BEFORE the edited row are left untouched (their times are still valid).
 *
 * @param rows          All rows.
 * @param rowNumber     The number of the row being edited.
 * @param newTimeRange  The new "08:30 AM - 09:15 AM" string for that row.
 */
export function reanchorTimelineAtRow<T extends TimelineRow>(
  rows: T[],
  rowNumber: number,
  newTimeRange: string
): T[] {
  const editIdx = rows.findIndex((r) => r.number === rowNumber)
  if (editIdx === -1) return rows

  const { start: newStart, end: newEnd } = parseTimeRange(newTimeRange)
  const newDuration = Math.max(5, newEnd - newStart) // safety floor of 5 min

  // Build the new array:
  //  - rows before editIdx: unchanged
  //  - editIdx: new start + new duration
  //  - rows after editIdx: cascade from editIdx's new end
  const next: T[] = []
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (i < editIdx) {
      next.push(row)
    } else if (i === editIdx) {
      const end = newStart + newDuration
      next.push({ ...row, durationMin: newDuration, time: `${formatMinutesToTime(newStart)} - ${formatMinutesToTime(end)}` })
    } else {
      const prevEnd = parseTimeRange(next[i - 1].time).end
      const start = prevEnd
      const end = start + row.durationMin
      next.push({ ...row, time: `${formatMinutesToTime(start)} - ${formatMinutesToTime(end)}` })
    }
  }
  return next
}

/* ────────────── Validation (Brief 1.8) ────────────── */

export interface TimelineIssue {
  rowNumber: number
  rowName: string
  message: string
}

/**
 * Validate a timeline. Returns an array of issues (empty = valid).
 *
 * Brief 1.8 rules:
 *   - For every row: start < end
 *   - For every consecutive pair: next.start >= previous.end
 */
export function validateTimeline(rows: TimelineRow[]): TimelineIssue[] {
  const issues: TimelineIssue[] = []
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const { start, end } = parseTimeRange(row.time)
    if (end <= start) {
      issues.push({ rowNumber: row.number, rowName: row.name, message: 'End must be after start' })
    }
    if (i > 0) {
      const prev = rows[i - 1]
      const prevEnd = parseTimeRange(prev.time).end
      if (start < prevEnd) {
        issues.push({
          rowNumber: row.number,
          rowName: row.name,
          message: `${row.name} starts before ${prev.name} ends`,
        })
      }
    }
  }
  return issues
}

/* ────────────── Period renumbering (Brief section 2) ────────────── */

/**
 * Brief 2: Visible period numbering should reflect actual order.
 * Internal `number` (used as stable row ID + slot.period lookup) stays stable,
 * but the visible `name` is renumbered 1..N.
 */
export function renumberVisiblePeriods<T extends TimelineRow>(rows: T[]): T[] {
  let periodNum = 0
  return rows.map((row) => {
    if (row.isBreak) return row
    periodNum++
    return { ...row, name: `Period ${periodNum}` }
  })
}
