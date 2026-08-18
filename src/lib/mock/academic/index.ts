/**
 * Academic mock data barrel — single import surface for the shared
 * Students & Classes ↔ Examination academic source (Spec §18 / §28).
 *
 * Consumers should import from `@/lib/mock/academic` rather than the
 * individual files, so the internal structure can evolve without breaking
 * downstream code.
 */

export type {
  SubjectCategory,
  SubjectStatus,
  SubjectDef,
} from './subjects'

export {
  INITIAL_SUBJECTS,
  SUBJECT_IDS,
  NURSERY_TO_10_SUBJECT_IDS,
  SCIENCE_PCM_SUBJECT_IDS,
  SCIENCE_PCB_SUBJECT_IDS,
  codeForName,
  idForCustomSubject,
} from './subjects'

export type { StreamKey, StreamDef } from './streams'
export {
  STREAMS,
  streamLabel,
  isScienceStream,
  streamKeyFromDbValue,
  dbValueFromStreamKey,
} from './streams'

export type { ClassLevel, AcademicClassDef } from './classes'
export {
  ACADEMIC_CLASSES,
  isStreamClass,
  getAcademicClassDef,
  streamsForGrade,
} from './classes'

export type {
  ResolvedAcademicClass,
  ResolvedAcademicSubject,
  ExamLevelClass,
} from './resolver'
export {
  examClassLabel,
  resolveAcademicClass,
  resolveAcademicClasses,
  toExamLevelClasses,
  resolveClassSubjects,
  resolveStreamsForGrade,
} from './resolver'

// Note: the client-side hooks `useAcademicClasses` / `useClassSubjects`
// live in `./use-academic-classes` (marked 'use client'). Import them
// DIRECTLY from that file in client components — do NOT re-export from
// this barrel, since the barrel is imported by both server and client code.
