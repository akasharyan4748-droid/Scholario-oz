/**
 * useScheduleState — Spec §14 / §22.
 *
 * Manages the editable schedule timetable state for the Create Exam form.
 * Re-generates the timetable whenever the inputs (classes, subjects, date
 * window, papers/day) change, and exposes a `moveSubject` action for the
 * drag-and-drop UI.
 *
 * The hook is the single source of truth for the schedule during exam
 * creation. The flattened schedule (`flattenTimetable(timetable)`) is
 * what gets submitted to the mock exams store.
 */

'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import {
  generateScheduleTimetable,
  todayISO,
  tomorrowISO,
  validateScheduleWindow,
  type ScheduleWindowValidation,
} from './schedule-generator'
import { moveSubject, flattenTimetable, type CellLocation } from './schedule-reorder'
import type { ScheduleClass, ScheduleOptions, ScheduleTimetable } from './schedule-types'

export interface UseScheduleStateArgs {
  classes: ScheduleClass[]
  options: ScheduleOptions | null
}

export interface UseScheduleStateResult {
  timetable: ScheduleTimetable | null
  /** Flattened schedule (one item per non-empty cell) — for submission. */
  flattened: ReturnType<typeof flattenTimetable>
  windowValidation: ScheduleWindowValidation
  moveSubjectCell: (src: CellLocation, dst: CellLocation) => void
  /** Today + tomorrow ISO strings (for the date picker minDate). */
  todayISO: string
  tomorrowISO: string
}

export function useScheduleState({ classes, options }: UseScheduleStateArgs): UseScheduleStateResult {
  const todayStr = useMemo(() => todayISO(), [])
  const tomorrowStr = useMemo(() => tomorrowISO(), [])
  const [override, setOverride] = useState<ScheduleTimetable | null>(null)

  // Generate the base timetable from inputs. Recomputes when inputs change.
  const baseTimetable = useMemo(() => {
    if (!options || classes.length === 0) return null
    return generateScheduleTimetable(classes, options)
  }, [classes, options])

  // When inputs change, clear any manual override (Spec §22 — regenerate live).
  useEffect(() => {
    setOverride(null)
  }, [baseTimetable])

  const timetable = override ?? baseTimetable

  const windowValidation = useMemo(() => {
    if (!options) return { valid: false, startError: null, endError: null }
    return validateScheduleWindow(options.startDate, options.endDate, todayStr)
  }, [options, todayStr])

  const moveSubjectCell = useCallback((src: CellLocation, dst: CellLocation) => {
    setOverride((prev) => {
      const current = prev ?? baseTimetable
      if (!current) return prev
      return moveSubject(current, src, dst)
    })
  }, [baseTimetable])

  const flattened = useMemo(() => (timetable ? flattenTimetable(timetable) : []), [timetable])

  return {
    timetable,
    flattened,
    windowValidation,
    moveSubjectCell,
    todayISO: todayStr,
    tomorrowISO: tomorrowStr,
  }
}
