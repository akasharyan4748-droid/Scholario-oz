'use client'

/**
 * marks/shared — pure helpers for the Marks Entry module: draft-input
 * parsing/validation, live stats over the drafts, and selection resolution.
 * No fetching, no mock arrays — everything derives from the API payloads
 * (types in ./types) or from what the teacher typed.
 */

import type { GridSelection, GridStudent, MarksExam, MarksGrid } from './types'

// ─── Draft input handling ──────────────────────────────────────────────

/** Strip everything that is not a digit — the input never shows other characters. */
export function sanitizeDraftInput(raw: string): string {
  return raw.replace(/[^0-9]/g, '')
}

/** Parse a draft input string into its mark (null = empty / not entered). */
export function parseDraft(value: string): number | null {
  if (value.trim() === '') return null
  const n = Number.parseInt(value, 10)
  return Number.isNaN(n) ? null : n
}

/** A draft is valid when empty OR a whole number within 0..maxMarks. */
export function isDraftValid(value: string, maxMarks: number): boolean {
  const n = parseDraft(value)
  return n == null || (n >= 0 && n <= maxMarks)
}

/** Student ids whose current draft is out of range (never saved, never submitted). */
export function invalidDraftIds(grid: MarksGrid, drafts: Record<string, string>): string[] {
  return grid.students
    .filter((s) => !isDraftValid(drafts[s.id] ?? '', grid.maxMarks))
    .map((s) => s.id)
}

// ─── Drafts ↔ grid ─────────────────────────────────────────────────────

/** Draft map seeded from the server roster ('' = not entered yet). */
export function initialDrafts(grid: MarksGrid): Record<string, string> {
  const drafts: Record<string, string> = {}
  for (const s of grid.students) {
    drafts[s.id] = s.marks != null ? String(s.marks) : ''
  }
  return drafts
}

/**
 * True while the row's input differs from the server-persisted mark — the
 * row hides its server-derived grade chip until the value is saved.
 */
export function isRowDirty(student: GridStudent, draft: string): boolean {
  return draft !== (student.marks != null ? String(student.marks) : '')
}

// ─── Live stats ────────────────────────────────────────────────────────

export interface MarksStats {
  /** Number of valid, entered marks. */
  entered: number
  /** Roster size. */
  total: number
  /** Mean of entered marks (null when nothing entered). */
  average: number | null
  /** Highest entered mark (null when nothing entered). */
  highest: number | null
  /** Entered marks ≥ passMarks (null when nothing entered). */
  passCount: number | null
}

/** Live stats over the drafts — invalid drafts are ignored, never counted. */
export function computeStats(grid: MarksGrid, drafts: Record<string, string>): MarksStats {
  let entered = 0
  let sum = 0
  let highest = -1
  let passCount = 0
  for (const s of grid.students) {
    const value = drafts[s.id] ?? ''
    if (!isDraftValid(value, grid.maxMarks)) continue
    const n = parseDraft(value)
    if (n == null) continue
    entered += 1
    sum += n
    if (n > highest) highest = n
    if (n >= grid.passMarks) passCount += 1
  }
  return {
    entered,
    total: grid.students.length,
    average: entered > 0 ? sum / entered : null,
    highest: entered > 0 ? highest : null,
    passCount: entered > 0 ? passCount : null,
  }
}

/** 38.333… → "38.3" (stat strip + submit dialog). */
export function formatAverage(average: number | null): string | null {
  return average == null ? null : average.toFixed(1)
}

// ─── Selection resolution ──────────────────────────────────────────────

/** Default selection: first exam → first class → first subject. */
export function defaultSelection(exams: MarksExam[]): GridSelection | null {
  for (const exam of exams) {
    const cls = exam.classes[0]
    const subject = cls?.subjects[0]
    if (cls && subject) {
      return { examId: exam.id, classId: cls.classId, subjectId: subject.id }
    }
  }
  return null
}

/** Keep a previous selection only while every level still exists in the payload. */
export function resolveSelection(
  exams: MarksExam[],
  previous: GridSelection | null,
): GridSelection | null {
  if (previous) {
    const exam = exams.find((e) => e.id === previous.examId)
    const cls = exam?.classes.find((c) => c.classId === previous.classId)
    const subject = cls?.subjects.find((s) => s.id === previous.subjectId)
    if (exam && cls && subject) return previous
  }
  return defaultSelection(exams)
}
