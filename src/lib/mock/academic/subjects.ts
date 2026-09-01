/**
 * Canonical subject registry — mock academic source of truth.
 *
 * Spec §22 / §5 / §6 / §10–14:
 *   Default subject names are exactly: Hindi, English, Science, Maths,
 *   Social Science, Arts & Drawing, Physics, Chemistry, Biology.
 *
 * Each subject has a STABLE canonical id. Renames update ONLY the `name`
 * field here — every consumer resolves the current name via the id, so a
 * rename propagates everywhere the shared mock data is consumed (Spec §9).
 *
 * Categories:
 *   - "Core"        → default subjects per class (Spec §5 / §10–13)
 *   - "Additional"  → optional add-on subjects (Spec §6: Arts & Drawing)
 *
 * This file is the SEED. The Students & Classes Zustand store clones it
 * into `state.academicSubjects` on init — all mutations happen there.
 */

export type SubjectCategory = 'Core' | 'Additional'
export type SubjectStatus = 'Active' | 'Archived'

export interface SubjectDef {
  /** Stable canonical id — never changes, even if name is renamed. */
  id: string
  /** Display name — may be renamed by the principal (Spec §9). */
  name: string
  /** 3-letter code shown as a badge in subject cards. */
  code: string
  /** Core = default curriculum subject; Additional = optional add-on. */
  category: SubjectCategory
  /** Active = appears in new exam creation; Archived = hidden. */
  status: SubjectStatus
}

/**
 * Initial canonical subject registry. The Zustand store clones this list
 * (deep copy) on init so principal mutations don't mutate these constants.
 */
export const INITIAL_SUBJECTS: SubjectDef[] = [
  { id: 'sub-hindi',    name: 'Hindi',          code: 'HIN', category: 'Core',       status: 'Active' },
  { id: 'sub-english',  name: 'English',        code: 'ENG', category: 'Core',       status: 'Active' },
  { id: 'sub-science',  name: 'Science',        code: 'SCI', category: 'Core',       status: 'Active' },
  { id: 'sub-maths',    name: 'Maths',          code: 'MAT', category: 'Core',       status: 'Active' },
  { id: 'sub-sst',      name: 'Social Science', code: 'SST', category: 'Core',       status: 'Active' },
  { id: 'sub-arts',     name: 'Arts & Drawing', code: 'ART', category: 'Additional', status: 'Active' },
  { id: 'sub-phy',      name: 'Physics',        code: 'PHY', category: 'Core',       status: 'Active' },
  { id: 'sub-chem',     name: 'Chemistry',      code: 'CHE', category: 'Core',       status: 'Active' },
  { id: 'sub-bio',      name: 'Biology',        code: 'BIO', category: 'Core',       status: 'Active' },
]

/**
 * Stable subject-id constants — used by class definitions to reference
 * their default subjects without hardcoding string names.
 */
export const SUBJECT_IDS = {
  HINDI:    'sub-hindi',
  ENGLISH:  'sub-english',
  SCIENCE:  'sub-science',
  MATHS:    'sub-maths',
  SST:      'sub-sst',
  ARTS:     'sub-arts',
  PHYSICS:  'sub-phy',
  CHEMISTRY:'sub-chem',
  BIOLOGY:  'sub-bio',
} as const

/**
 * Default subject ids per spec section.
 *   Nursery–Class 10 (Spec §5 + §6): 5 Core + 1 Additional (Arts & Drawing)
 *   Class 11/12 Science PCM (Spec §10 / §12): Hindi, English, Physics, Chemistry, Maths
 *   Class 11/12 Science PCB (Spec §11 / §13): Hindi, English, Physics, Chemistry, Biology
 */
export const NURSERY_TO_10_SUBJECT_IDS: string[] = [
  SUBJECT_IDS.HINDI,
  SUBJECT_IDS.ENGLISH,
  SUBJECT_IDS.SCIENCE,
  SUBJECT_IDS.MATHS,
  SUBJECT_IDS.SST,
  SUBJECT_IDS.ARTS,
]

export const SCIENCE_PCM_SUBJECT_IDS: string[] = [
  SUBJECT_IDS.HINDI,
  SUBJECT_IDS.ENGLISH,
  SUBJECT_IDS.PHYSICS,
  SUBJECT_IDS.CHEMISTRY,
  SUBJECT_IDS.MATHS,
]

export const SCIENCE_PCB_SUBJECT_IDS: string[] = [
  SUBJECT_IDS.HINDI,
  SUBJECT_IDS.ENGLISH,
  SUBJECT_IDS.PHYSICS,
  SUBJECT_IDS.CHEMISTRY,
  SUBJECT_IDS.BIOLOGY,
]

/** Generate a 3-letter code from a subject name (for custom-added subjects). */
export function codeForName(name: string): string {
  return name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'SUB'
}

/** Generate a stable id for a custom-added subject (deterministic from name). */
export function idForCustomSubject(name: string): string {
  return `sub-custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
}
