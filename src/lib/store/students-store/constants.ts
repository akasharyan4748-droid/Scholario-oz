import type { House } from './types'
import {
  INITIAL_SUBJECTS,
  ACADEMIC_CLASSES,
  type SubjectDef,
  type AcademicClassDef,
} from '@/lib/mock/academic'

// ============================================================
// SUBJECTS — canonical registry (Spec §5 / §6 / §22)
// ------------------------------------------------------------
// The Students & Classes Zustand store clones this list on init so
// principal mutations (rename / add custom) don't mutate the seed.
// Naming follows spec §22 exactly: Hindi, English, Science, Maths,
// Social Science, Arts & Drawing, Physics, Chemistry, Biology.
// ============================================================

/** Seed subject registry (cloned by the store on init). */
export const SEED_SUBJECTS: SubjectDef[] = INITIAL_SUBJECTS.map((s) => ({ ...s }))

// ============================================================
// CLASSES — academic class catalog (Spec §2 / §3 / §4)
// ------------------------------------------------------------
// One entry per (grade + stream). Class 11/12 are split into
// Science-PCM and Science-PCB offerings. Each entry's `subjectIds`
// references canonical subject ids from SEED_SUBJECTS.
// ============================================================

/** Seed class catalog (consumed by the store to seed ClassRecords). */
export const SEED_CLASSES: AcademicClassDef[] = ACADEMIC_CLASSES.map((c) => ({ ...c, sections: [...c.sections], subjectIds: [...c.subjectIds] }))

// ============================================================
// LEGACY COMPAT — `SUBJECTS_BY_LEVEL` + `CLASS_DEFS`
// ------------------------------------------------------------
// Older code (class-subjects.tsx, subject-card.tsx, seed-data.ts,
// archived-subjects-panel.tsx) still imports these. We provide
// derived aliases that pull from the new academic module so the
// existing imports keep working until each file is migrated.
//
// NOTE: These are DEPRECATED. New code should import from
// `@/lib/mock/academic` directly.
// ============================================================

/**
 * @deprecated Use `SEED_SUBJECTS` or `@/lib/mock/academic` instead.
 * Maps a class level to the display names of its default subjects.
 */
export const SUBJECTS_BY_LEVEL: Record<string, string[]> = (() => {
  const byLevel: Record<string, string[]> = {}
  for (const cls of ACADEMIC_CLASSES) {
    if (!byLevel[cls.level]) {
      byLevel[cls.level] = cls.subjectIds
        .map((id) => INITIAL_SUBJECTS.find((s) => s.id === id)?.name)
        .filter((n): n is string => Boolean(n))
    }
  }
  return byLevel
})()

/**
 * @deprecated Use `SEED_CLASSES` or `@/lib/mock/academic` instead.
 * Flat class definitions used by legacy seed-data.ts.
 */
export const CLASS_DEFS = ACADEMIC_CLASSES.map((c) => ({
  id: c.id,
  name: c.name,
  grade: c.grade,
  level: c.level,
  sections: [...c.sections],
  capacity: c.capacity,
  room: c.room,
  classTeacherId: c.classTeacherId,
  stream: c.stream,
  subjectIds: [...c.subjectIds],
}))

// ============================================================
// HOUSES — extra-curricular houses (unchanged)
// ============================================================

export const HOUSE_DEFS: House[] = [
  { id: 'H1', name: 'Aryabhata', color: 'oklch(0.6 0.18 250)', motto: 'Wisdom Through Knowledge', points: 1240, competitionWins: 12 },
  { id: 'H2', name: 'Bhaskara', color: 'oklch(0.6 0.18 25)', motto: 'Excellence In Action', points: 1180, competitionWins: 10 },
  { id: 'H3', name: 'Ramanujan', color: 'oklch(0.6 0.18 150)', motto: 'Logic Leads The Way', points: 1320, competitionWins: 14 },
  { id: 'H4', name: 'Tagore', color: 'oklch(0.6 0.18 75)', motto: 'Creativity Unbound', points: 1090, competitionWins: 9 },
]
