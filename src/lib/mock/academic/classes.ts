/**
 * Academic class catalog — Spec §2 / §3 / §4 / §23 / §24.
 *
 * One `AcademicClassDef` entry per (grade + stream). For Nursery–Class 10
 * there is exactly one entry per grade (stream is null). For Class 11/12
 * there are TWO entries per grade — one for Science-PCM, one for Science-PCB.
 *
 * The Students & Classes UI shows each entry as a separate card. The
 * Examination class selector shows each entry as a single selectable chip
 * (sections are never listed individually — Spec §3 / §15).
 *
 * Spec §4: "Do NOT create separate unrelated classes such as 'Class 11 PCM'
 * unless the existing UI/data architecture specifically requires an internal
 * representation." Our internal representation IS (grade + stream) — each
 * stream is a separate academic offering with its own subject list, so we
 * model them as separate AcademicClassDef entries that share the same
 * `name` ("Class 11") but differ by `stream`.
 */

import type { StreamKey } from './streams'
import {
  NURSERY_TO_10_SUBJECT_IDS,
  SCIENCE_PCM_SUBJECT_IDS,
  SCIENCE_PCB_SUBJECT_IDS,
} from './subjects'

export type ClassLevel = 'Pre-Primary' | 'Primary' | 'Middle' | 'Secondary' | 'Senior Secondary'

export interface AcademicClassDef {
  /** Stable canonical id — e.g. 'C14-PCM' (never changes). */
  id: string
  /** Display name without stream suffix — e.g. "Class 11" (never "Class 11 PCM"). */
  name: string
  /** Numeric grade. -2 = Pre-Nursery, 0 = KG, 1..12 = Class 1..12. */
  grade: number
  /** Level bucket — used by Students & Classes UI for filtering / styling. */
  level: ClassLevel
  /** Section labels (e.g. ['A', 'B']). For 11/12 streams, single section ['A']. */
  sections: string[]
  /** Max students per section. */
  capacity: number
  /** Physical room identifier (display only). */
  room: string
  /** Default class teacher (mock teacher id). */
  classTeacherId: string
  /** Stream — only set for Class 11/12 Science streams; null otherwise. */
  stream?: StreamKey
  /** Default subject ids assigned to this class on first load. */
  subjectIds: string[]
}

/**
 * Default academic class catalog. Matches the existing demo school's class
 * list (Pre-Nursery, KG, Class 2, 4, 6, 8, 9, 10, 11, 12) — Class 11/12
 * are split into Science-PCM and Science-PCB stream offerings.
 *
 * Spec §2: whatever classes exist here are exactly the classes available
 * to Examination. Adding/removing a class here propagates automatically.
 */
export const ACADEMIC_CLASSES: AcademicClassDef[] = [
  // ── Pre-Primary ─────────────────────────────────────────────────────
  { id: 'C01', name: 'Pre-Nursery', grade: -2, level: 'Pre-Primary',
    sections: ['A', 'B'], capacity: 25, room: 'G-01', classTeacherId: 'T-002',
    subjectIds: NURSERY_TO_10_SUBJECT_IDS },
  { id: 'C03', name: 'KG', grade: 0, level: 'Pre-Primary',
    sections: ['A', 'B'], capacity: 28, room: 'G-03', classTeacherId: 'T-008',
    subjectIds: NURSERY_TO_10_SUBJECT_IDS },
  // ── Primary ──────────────────────────────────────────────────────────
  { id: 'C05', name: 'Class 2', grade: 2, level: 'Primary',
    sections: ['A', 'B', 'C'], capacity: 35, room: 'F1-05', classTeacherId: 'T-014',
    subjectIds: NURSERY_TO_10_SUBJECT_IDS },
  { id: 'C07', name: 'Class 4', grade: 4, level: 'Primary',
    sections: ['A', 'B'], capacity: 38, room: 'F1-07', classTeacherId: 'T-020',
    subjectIds: NURSERY_TO_10_SUBJECT_IDS },
  // ── Middle ───────────────────────────────────────────────────────────
  { id: 'C09', name: 'Class 6', grade: 6, level: 'Middle',
    sections: ['A', 'B'], capacity: 40, room: 'F2-09', classTeacherId: 'T-026',
    subjectIds: NURSERY_TO_10_SUBJECT_IDS },
  { id: 'C11', name: 'Class 8', grade: 8, level: 'Middle',
    sections: ['A', 'B'], capacity: 42, room: 'F2-11', classTeacherId: 'T-032',
    subjectIds: NURSERY_TO_10_SUBJECT_IDS },
  // ── Secondary ────────────────────────────────────────────────────────
  { id: 'C12', name: 'Class 9', grade: 9, level: 'Secondary',
    sections: ['A', 'B'], capacity: 45, room: 'F3-12', classTeacherId: 'T-035',
    subjectIds: NURSERY_TO_10_SUBJECT_IDS },
  { id: 'C13', name: 'Class 10', grade: 10, level: 'Secondary',
    sections: ['A', 'B'], capacity: 45, room: 'F3-13', classTeacherId: 'T-038',
    subjectIds: NURSERY_TO_10_SUBJECT_IDS },
  // ── Senior Secondary — Class 11 (Spec §4 / §10 / §11) ───────────────
  { id: 'C14-PCM', name: 'Class 11', grade: 11, level: 'Senior Secondary',
    sections: ['A'], capacity: 45, room: 'F3-14', classTeacherId: 'T-041',
    stream: 'PCM', subjectIds: SCIENCE_PCM_SUBJECT_IDS },
  { id: 'C14-PCB', name: 'Class 11', grade: 11, level: 'Senior Secondary',
    sections: ['A'], capacity: 45, room: 'F3-14', classTeacherId: 'T-041',
    stream: 'PCB', subjectIds: SCIENCE_PCB_SUBJECT_IDS },
  // ── Senior Secondary — Class 12 (Spec §4 / §12 / §13) ───────────────
  { id: 'C15-PCM', name: 'Class 12', grade: 12, level: 'Senior Secondary',
    sections: ['A'], capacity: 45, room: 'F3-15', classTeacherId: 'T-044',
    stream: 'PCM', subjectIds: SCIENCE_PCM_SUBJECT_IDS },
  { id: 'C15-PCB', name: 'Class 12', grade: 12, level: 'Senior Secondary',
    sections: ['A'], capacity: 45, room: 'F3-15', classTeacherId: 'T-044',
    stream: 'PCB', subjectIds: SCIENCE_PCB_SUBJECT_IDS },
]

/** Returns true if a class id belongs to a senior-secondary stream class. */
export function isStreamClass(classId: string): boolean {
  return ACADEMIC_CLASSES.some((c) => c.id === classId && c.stream != null)
}

/** Returns the AcademicClassDef for a given id, or undefined. */
export function getAcademicClassDef(classId: string): AcademicClassDef | undefined {
  return ACADEMIC_CLASSES.find((c) => c.id === classId)
}

/** Returns all streams offered at a given grade (e.g. 11 → ['PCM', 'PCB']). */
export function streamsForGrade(grade: number): StreamKey[] {
  return ACADEMIC_CLASSES
    .filter((c) => c.grade === grade && c.stream != null)
    .map((c) => c.stream as StreamKey)
}
