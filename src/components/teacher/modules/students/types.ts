/**
 * types — the pure DTO contract for the Teacher Student Directory
 * (Teacher Workspace spec §15). Client-safe: no server imports.
 *
 * SECURITY MODEL: the directory exposes ONLY students of the teacher's
 * authorized classes — classes with an ACTIVE ClassSubjectAssignment
 * (teacherId = the signed-in teacher) plus the class where she is class
 * teacher. Everything in these payloads is server-derived and
 * school-scoped; the client never sends anything but a classId that the
 * server re-validates against that authorized set.
 */

/** Per-student attendance counts derived from the Attendance table. */
export interface AttendanceSummaryDTO {
  present: number
  absent: number
  late: number
  leave: number
  /** total recorded days (includes any other status values) */
  total: number
  /** present/total × 100, rounded to 1 decimal · 0 when total = 0 */
  rate: number
}

/** One student row in the directory roster. */
export interface StudentDirectoryEntryDTO {
  id: string
  name: string
  rollNo: string | null
  admissionNo: string | null
  gender: string | null
  /** YYYY-MM-DD (stored as string on the Student row) */
  dob: string | null
  bloodGroup: string | null
  address: string | null
  guardianName: string | null
  guardianPhone: string | null
  attendance: AttendanceSummaryDTO
}

/** One authorized class in the class list (no roster). */
export interface ClassSummaryDTO {
  classId: string
  classLabel: string
  /** true when the signed-in teacher is this class's class teacher */
  isClassTeacher: boolean
  studentCount: number
}

/** The full roster response for one authorized class. */
export interface ClassRosterDTO {
  class: {
    classId: string
    classLabel: string
    isClassTeacher: boolean
  }
  /** rollNo numeric-safe ascending, then name */
  students: StudentDirectoryEntryDTO[]
}
