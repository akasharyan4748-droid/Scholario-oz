// Type definitions for the students store.
//
// All entity types (StudentRecord, ClassRecord, House, etc.) and the
// `StudentsState` store contract live here so they can be imported
// independently of the store implementation.

export type StudentStatus = 'Active' | 'Archived'
export type FeeStatus = 'Paid' | 'Partial' | 'Pending'
export type Gender = 'Male' | 'Female'

export interface TimelineEvent {
  id: string
  type: 'admission' | 'promotion' | 'transfer' | 'fee' | 'house' | 'archive' | 'restore'
  title: string
  description: string
  date: string
  by: string
}

export interface StudentRecord {
  id: string
  admissionNo: string
  rollNo: string
  name: string
  avatar: string
  gender: Gender
  classId: string
  className: string
  section: string
  dob: string
  bloodGroup: string
  category: string
  fatherName: string
  motherName: string
  guardianPhone: string
  guardianEmail: string
  guardianName: string
  city: string
  state: string
  hostel: boolean
  disciplinePoints: number
  address: string
  admissionDate: string
  previousSchool: string
  status: StudentStatus
  archiveReason?: string
  archiveDate?: string
  attendance: number
  feeStatus: FeeStatus
  feePaid: number
  feeTotal: number
  transport: boolean
  scholarship: number
  houseId?: string
  houseName?: string
  medical: string
  academics: {
    overallGrade: string
    overallPercent: number
    rankInClass: number
    subjects: { name: string; grade: string; percent: number; teacher: string }[]
  }
  attendanceTrend: { month: string; percent: number }[]
  achievements: { title: string; date: string; level: string }[]
  disciplineRecords: { date: string; type: string; description: string; points: number }[]
  documents: { id: string; title: string; type: string; uploadedDate: string; verified: boolean }[]
  transportRoute?: string
  timeline: TimelineEvent[]
}

export interface SectionRecord {
  id: string
  name: string
  classId: string
  capacity: number
  classTeacherId?: string
  /** Section-level Assistant Class Teacher (real persisted assignment). */
  assistantTeacherId?: string
  room: string
}

/** Archived subject within a class — preserved for restore (Spec §7 / §25). */
export interface ArchivedSubject {
  /** Canonical subject id (stable across renames). */
  id: string
  /** Display name at archive time (snapshot — rename does NOT update this). */
  name: string
  archivedAt: string
}

export interface ClassRecord {
  id: string
  name: string
  grade: number
  level: 'Pre-Primary' | 'Primary' | 'Middle' | 'Secondary' | 'Senior Secondary'
  sections: SectionRecord[]
  capacity: number
  classTeacherId: string
  /** Class-level Assistant Class Teacher (real persisted assignment). */
  assistantTeacherId?: string
  /**
   * Canonical subject ids (Spec §28 — IDs are stable across renames).
   * The Students & Classes UI hydrates display names from the store's
   * `academicSubjects` registry. This is the source of truth consumed
   * by Examination.
   */
  subjectIds: string[]
  /**
   * Subject display names (legacy / convenience). Derived from
   * `subjectIds` + the `academicSubjects` registry. Mutations to
   * subjects should go through `subjectIds`, NOT this array. We keep
   * it for backward-compat with components that still read names.
   */
  subjects: string[]
  /** Subjects archived from this class — preserved for restore. */
  archivedSubjects: ArchivedSubject[]
  /** Per-subject teacher assignment map (subject id → teacher ID). */
  subjectTeachers: Record<string, string>
  /** Stream key — only set for Class 11/12 (e.g. 'PCM' / 'PCB'). */
  stream?: import('@/lib/mock/academic').StreamKey | null
  room: string
  status: 'Active' | 'Archived'
}

export interface House {
  id: string
  name: string
  color: string
  motto: string
  captainId?: string
  viceCaptainId?: string
  points: number
  competitionWins: number
}

export interface PromotionRecord {
  id: string
  studentId: string
  studentName: string
  fromClass: string
  toClass: string
  academicYear: string
  feeCleared: boolean
  resultCleared: boolean
  attendanceCleared: boolean
  status: 'Pending' | 'Approved' | 'Completed' | 'Rejected'
  date: string
  requestedBy: string
}

export interface TransferRecord {
  id: string
  studentId: string
  studentName: string
  type: 'Section Change' | 'Class Change' | 'School Transfer' | 'Graduation' | 'Archive'
  fromClass: string
  toClass: string
  reason: string
  status: 'Pending' | 'Completed'
  date: string
}

export interface StudentsState {
  students: StudentRecord[]
  classes: ClassRecord[]
  houses: House[]
  promotions: PromotionRecord[]
  transfers: TransferRecord[]
  /**
   * Canonical subject registry (Spec §28). Each entry has a stable id and
   * a display name that may be renamed. Both Students & Classes UI and
   * Examination hydrate subject names by looking up ids in this list.
   */
  academicSubjects: import('@/lib/mock/academic').SubjectDef[]
  archiveStudent: (id: string, reason: string, by: string) => void
  restoreStudent: (id: string, by: string) => void
  transferStudent: (id: string, type: TransferRecord['type'], toClass: string, reason: string, by: string) => void
  assignHouse: (id: string, houseId: string, by: string) => void
  updateRollNumber: (id: string, roll: string, by: string) => void
  createPromotion: (ids: string[], from: string, to: string, year: string, by: string) => void
  approvePromotion: (id: string, by: string) => void
  executePromotion: (id: string, by: string) => void
  addHousePoints: (id: string, pts: number) => void
  assignHouseCaptain: (id: string, sid: string, role: 'captain' | 'vice') => void
  /** Replace the class-level Class Teacher. Pass null/undefined to clear. */
  updateClassTeacher: (classId: string, teacherId: string | null) => void
  /** Replace the class-level Assistant Class Teacher. Pass null/undefined to clear. */
  updateClassAssistantTeacher: (classId: string, teacherId: string | null) => void
  /** Replace a section's Class Teacher. Pass null/undefined to clear. */
  updateSectionTeacher: (classId: string, sectionId: string, teacherId: string | null) => void
  /** Replace a section's Assistant Class Teacher. Pass null/undefined to clear. */
  updateSectionAssistantTeacher: (classId: string, sectionId: string, teacherId: string | null) => void
  /**
   * Add an EXISTING canonical subject to a class (Spec §8). No-op if the
   * class already has the subject id. Does NOT create a new canonical
   * subject — use `createCustomSubject` for that.
   */
  addClassSubject: (classId: string, subjectId: string) => void
  /**
   * Archive a subject from a class — moves it to archivedSubjects for
   * recovery (Spec §7 / §25). Archived subjects do NOT appear in
   * Examination's class picker.
   */
  archiveClassSubject: (classId: string, subjectId: string) => void
  /** Restore a previously-archived subject — moves it back to active. */
  restoreClassSubject: (classId: string, subjectId: string) => void
  /** Permanently delete an archived subject (no recovery). */
  deleteArchivedSubject: (classId: string, subjectId: string) => void
  /** Assign / replace a teacher for a specific subject in a class (by id). */
  updateSubjectTeacher: (classId: string, subjectId: string, teacherId: string | null) => void
  /**
   * Rename a canonical subject (Spec §9). Updates the display name in the
   * `academicSubjects` registry — every consumer (Students & Classes,
   * Examination) instantly sees the new name because they resolve names
   * by id lookup. Id stays stable.
   */
  renameSubject: (subjectId: string, newName: string) => void
  /**
   * Create a NEW custom canonical subject and add it to a class (Spec §8).
   * Generates a stable id from the name. If a subject with the same name
   * already exists, returns its id instead of creating a duplicate.
   */
  createCustomSubject: (classId: string, name: string) => string
  /**
   * Look up a subject by id from the canonical registry.
   * Returns undefined if not found or archived.
   */
  getSubjectById: (subjectId: string) => import('@/lib/mock/academic').SubjectDef | undefined
  getStudentById: (id: string) => StudentRecord | undefined
  getClassById: (id: string) => ClassRecord | undefined
  getClassStudents: (classId: string) => StudentRecord[]
}
