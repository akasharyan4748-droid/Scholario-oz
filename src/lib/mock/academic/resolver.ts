/**
 * Academic resolver — Spec §28.
 *
 * Provides a service/resolver abstraction so the Examination UI consumes
 * `getAcademicClasses()` / `getClassSubjects()` / `getClassStreams()`
 * instead of importing mock arrays directly. The next phase can replace
 * this with a real API client without rewriting the Examination UI.
 *
 * This module is CLIENT-SIDE (Zustand store-backed). The Examination
 * `create-exam-fullscreen.tsx` reads class+subject data from here, NOT from
 * the server `/api/exams` route, so that Students & Classes mutations
 * (add/archive/restore/rename subject) propagate to Examination instantly.
 *
 * Spec §1 / §18 / §27: Students & Classes = SOURCE OF TRUTH for mock data.
 */

import type { SubjectDef } from './subjects'
import type { StreamKey } from './streams'
import { streamLabel, dbValueFromStreamKey } from './streams'

/** A class entry resolved for Examination consumption. */
export interface ResolvedAcademicClass {
  /** Class id from the store (e.g. 'C09' or 'C14-PCM'). */
  id: string
  /** Display name (e.g. "Class 6" — never includes the stream suffix). */
  name: string
  /** Numeric grade level (e.g. 6). */
  gradeLevel: number
  /** Level bucket (e.g. "Middle"). */
  level: string
  /** DB-format stream value (e.g. "Science-PCM") or null. */
  stream: string | null
  /** Human-readable stream label (e.g. "Science PCM") or null. */
  streamLabel: string | null
  /** Section labels (e.g. ['A', 'B']). */
  sections: string[]
  /** Number of sections (Examination shows "· N sections" badge). */
  sectionCount: number
  /** Active subjects for this class (archived subjects are excluded). */
  subjects: ResolvedAcademicSubject[]
}

export interface ResolvedAcademicSubject {
  /** Canonical subject id (stable across renames). */
  id: string
  /** Current display name (reflects any renames). */
  name: string
  /** 3-letter code. */
  code: string
  /** Core or Additional. */
  category: 'Core' | 'Additional'
}

/**
 * Examination-level class — sections of the same (grade, stream) are
 * already merged into a single selectable unit by the store, so this
 * shape simply mirrors ResolvedAcademicClass plus an Examination-style
 * label like "Class 11 — Science PCM".
 */
export interface ExamLevelClass extends ResolvedAcademicClass {
  /** "Class 6" or "Class 11 — Science PCM". */
  label: string
}

/** Build the Examination-style label (Spec §9). */
export function examClassLabel(name: string, gradeLevel: number, streamLabel: string | null): string {
  return streamLabel ? `${name} — ${streamLabel}` : name
}

/**
 * Resolve a single class+subject view from the store data.
 *
 * @param clsRecord  The ClassRecord from the Zustand store (has subjectIds).
 * @param subjects   The canonical subject registry from the store.
 */
export function resolveAcademicClass(
  clsRecord: { id: string; name: string; grade: number; level: string; stream?: StreamKey | null; sections: { name: string }[]; subjectIds?: string[]; subjects?: string[] },
  subjects: SubjectDef[],
): ResolvedAcademicClass {
  // New path: subjectIds[] (canonical). Fall back to subjects[] (legacy names)
  // by looking them up in the registry; if not found, treat as a custom subject.
  const activeSubjects: ResolvedAcademicSubject[] = []
  if (clsRecord.subjectIds && clsRecord.subjectIds.length > 0) {
    for (const id of clsRecord.subjectIds) {
      const s = subjects.find((x) => x.id === id && x.status === 'Active')
      if (!s) continue
      activeSubjects.push({ id: s.id, name: s.name, code: s.code, category: s.category })
    }
  } else if (clsRecord.subjects) {
    // Legacy fallback — match by name (renames may mismatch, hence the new path).
    for (const name of clsRecord.subjects) {
      const s = subjects.find((x) => x.name === name && x.status === 'Active')
      if (!s) continue
      activeSubjects.push({ id: s.id, name: s.name, code: s.code, category: s.category })
    }
  }

  const streamKey = clsRecord.stream ?? null
  const streamLbl = streamLabel(streamKey)

  return {
    id: clsRecord.id,
    name: clsRecord.name,
    gradeLevel: clsRecord.grade,
    level: clsRecord.level,
    stream: dbValueFromStreamKey(streamKey),
    streamLabel: streamLbl,
    sections: clsRecord.sections.map((s) => s.name),
    sectionCount: clsRecord.sections.length,
    subjects: activeSubjects,
  }
}

/**
 * Resolve all active classes for Examination.
 *
 * Sections are NOT collapsed here — the Students & Classes store already
 * stores each (grade, stream) as one ClassRecord with all sections inside
 * it. Examination consumers should call `toExamLevelClasses()` to get the
 * final Examination-style list (Spec §3 — sections never appear as
 * separate exam class entries).
 */
export function resolveAcademicClasses(
  classes: Array<Parameters<typeof resolveAcademicClass>[0]>,
  subjects: SubjectDef[],
): ResolvedAcademicClass[] {
  return classes
    .filter((c) => (c as { status?: string }).status !== 'Archived')
    .map((c) => resolveAcademicClass(c, subjects))
}

/**
 * Convert resolved academic classes to Examination-level chips.
 *
 * Each ResolvedAcademicClass already represents one (grade, stream) — no
 * section merging is needed because the Students & Classes store keeps
 * sections inside the class record (not as separate top-level class rows).
 */
export function toExamLevelClasses(
  resolved: ResolvedAcademicClass[],
): ExamLevelClass[] {
  return resolved
    .map((c) => ({
      ...c,
      label: examClassLabel(c.name, c.gradeLevel, c.streamLabel),
    }))
    .sort((a, b) => {
      if (a.gradeLevel !== b.gradeLevel) return a.gradeLevel - b.gradeLevel
      return (a.stream ?? '').localeCompare(b.stream ?? '')
    })
}

/**
 * Return active subjects for a specific class id.
 */
export function resolveClassSubjects(
  classId: string,
  classes: Array<Parameters<typeof resolveAcademicClass>[0]>,
  subjects: SubjectDef[],
): ResolvedAcademicSubject[] {
  const cls = classes.find((c) => c.id === classId)
  if (!cls) return []
  return resolveAcademicClass(cls, subjects).subjects
}

/**
 * Return the streams offered at a given grade (e.g. Class 11 → ['PCM', 'PCB']).
 */
export function resolveStreamsForGrade(
  grade: number,
  classes: Array<{ grade: number; stream?: StreamKey | null }>,
): StreamKey[] {
  const seen = new Set<StreamKey>()
  for (const c of classes) {
    if (c.grade === grade && c.stream && c.stream !== 'General') {
      seen.add(c.stream)
    }
  }
  return Array.from(seen)
}
