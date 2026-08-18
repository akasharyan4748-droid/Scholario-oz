/**
 * Schedule reorder helpers — Spec §14 / §15 / §16 / §18.
 *
 * Pure functions for moving a subject within a class column (vertical
 * reorder) or across date+slot within the SAME class column.
 *
 * Invariants (Spec §18 — no duplicates):
 *   - After a move, every subject appears at most once per class.
 *   - A subject never moves into a different class's column (Spec §15).
 *
 * The move is implemented as a SWAP between the source cell and the
 * destination cell. If both cells have subjects, they swap. If the
 * destination is empty, the subject moves there and the source becomes
 * empty. This guarantees no duplicates and keeps subjects within their
 * own column.
 */

import type { ScheduleCell, ScheduleRow, ScheduleTimetable } from './schedule-types'

export interface CellLocation {
  /** Row index in `timetable.rows`. */
  rowIdx: number
  /** Class column index in `timetable.classes`. */
  classIdx: number
}

/**
 * Swap two cells in the SAME class column. Refuses if the columns differ
 * (Spec §15 — no cross-class movement).
 *
 * Returns a NEW timetable (immutable) or the original if the move is invalid.
 */
export function swapCells(
  timetable: ScheduleTimetable,
  src: CellLocation,
  dst: CellLocation,
): ScheduleTimetable {
  // Validate: same class column
  if (src.classIdx !== dst.classIdx) return timetable
  // Validate: row indices in range
  if (src.rowIdx < 0 || src.rowIdx >= timetable.rows.length) return timetable
  if (dst.rowIdx < 0 || dst.rowIdx >= timetable.rows.length) return timetable
  if (src.classIdx < 0 || src.classIdx >= timetable.classes.length) return timetable
  if (src.rowIdx === dst.rowIdx) return timetable

  const newRows = timetable.rows.map((r) => ({ ...r, cells: [...r.cells] }))
  const srcCell = newRows[src.rowIdx].cells[src.classIdx]
  const dstCell = newRows[dst.rowIdx].cells[dst.classIdx]
  // Swap
  newRows[src.rowIdx].cells[src.classIdx] = dstCell
  newRows[dst.rowIdx].cells[dst.classIdx] = srcCell
  return { ...timetable, rows: newRows }
}

/**
 * Move a subject from src to dst within the same class column. If dst is
 * empty, src becomes empty. If dst is occupied, they swap. This is the
 * canonical "drag a subject to a new slot" behavior.
 */
export function moveSubject(
  timetable: ScheduleTimetable,
  src: CellLocation,
  dst: CellLocation,
): ScheduleTimetable {
  return swapCells(timetable, src, dst)
}

/**
 * Verify timetable integrity — no subject appears twice in the same column.
 * Returns the list of duplicate subject ids per class (empty if clean).
 */
export function findDuplicates(timetable: ScheduleTimetable): Record<string, string[]> {
  const dupes: Record<string, string[]> = {}
  timetable.classes.forEach((cls, classIdx) => {
    const seen = new Set<string>()
    const dups = new Set<string>()
    timetable.rows.forEach((row) => {
      const cell: ScheduleCell | null = row.cells[classIdx]
      if (!cell) return
      if (seen.has(cell.subjectId)) dups.add(cell.subjectId)
      seen.add(cell.subjectId)
    })
    if (dups.size > 0) dupes[cls.id] = Array.from(dups)
  })
  return dupes
}

/** Count how many subjects are filled in a class column (non-null cells). */
export function countFilled(timetable: ScheduleTimetable, classIdx: number): number {
  return timetable.rows.reduce((n, row) => n + (row.cells[classIdx] ? 1 : 0), 0)
}

/** Returns true if every class column has all its subjects allocated. */
export function isComplete(timetable: ScheduleTimetable): boolean {
  return timetable.classes.every((cls, idx) => countFilled(timetable, idx) >= cls.subjects.length)
}

/**
 * Flatten the timetable back to the legacy `GeneratedScheduleItem[]` shape
 * for storage in the mock exams store / future API submission.
 *
 * One item per NON-EMPTY cell. Each item references its classId.
 */
export function flattenTimetable(
  timetable: ScheduleTimetable,
): Array<{
  classId: string
  subjectId: string
  date: string
  startTime: string
  endTime: string
  room?: string
  invigilatorName?: string
}> {
  const out: Array<{ classId: string; subjectId: string; date: string; startTime: string; endTime: string; room?: string; invigilatorName?: string }> = []
  for (const row of timetable.rows) {
    timetable.classes.forEach((cls, classIdx) => {
      const cell = row.cells[classIdx]
      if (!cell) return
      out.push({
        classId: cls.id,
        subjectId: cell.subjectId,
        date: row.date,
        startTime: row.startTime,
        endTime: row.endTime,
        room: '',
        invigilatorName: '',
      })
    })
  }
  return out
}

/** Type re-export for convenience. */
export type { ScheduleRow, ScheduleTimetable, ScheduleCell }
