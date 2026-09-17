/**
 * teacher-attendance-types — pure DTO contract for the Class Attendance
 * workflow (client-safe: no server imports). Mirrors the teacher-hub-types
 * discipline: the server serializes into these shapes, the client consumes
 * them, and ids are never sent back without server re-validation.
 */

export type AttendanceStatusValue = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'
export type AttendanceSubmissionStatus = 'DRAFT' | 'SUBMITTED'
export type AttendanceRole = 'CLASS_TEACHER' | 'SUBJECT_TEACHER'

/** One class the teacher is authorized to take attendance for. */
export interface AttendanceClassInfo {
  id: string
  label: string
  /** true when Class.classTeacherId === this teacher */
  isClassTeacher: boolean
  /** subject names this teacher teaches in this class (subject teachers) */
  subjects: string[]
  /** honest roster size */
  studentCount: number
  /** this teacher's submission for the selected date, if any */
  submission: {
    status: AttendanceSubmissionStatus
    updatedAt: string
    submittedAt: string | null
  } | null
}

export interface AttendanceEntryDTO {
  studentId: string
  status: AttendanceStatusValue
}

export interface AttendanceSubmissionDTO {
  id: string
  status: AttendanceSubmissionStatus
  role: AttendanceRole
  subjectName: string | null
  sourceSubmissionId: string | null
  submittedAt: string | null
  updatedAt: string
  entries: AttendanceEntryDTO[]
}

export interface AttendanceRosterStudent {
  id: string
  name: string
  rollNo: string | null
}

export interface AttendanceDetail {
  classId: string
  classLabel: string
  date: string // YYYY-MM-DD
  roster: AttendanceRosterStudent[]
  /** this teacher's submission (draft or submitted); null = not started */
  you: AttendanceSubmissionDTO | null
  /** the class's class teacher (name + their submission) when it is another teacher */
  classTeacher: {
    teacherId: string
    teacherName: string
    submission: AttendanceSubmissionDTO | null
  } | null
  /**
   * Set when the teacher has NOT started yet and the class teacher has a
   * SUBMITTED record: the client pre-fills the working state from these
   * entries and shows the subtle "Pre-filled from Class Teacher" status.
   * Nothing is persisted until the teacher saves.
   */
  prefill: {
    fromSubmissionId: string
    submittedAt: string
    entries: AttendanceEntryDTO[]
  } | null
  /**
   * Set when the teacher HAS a draft but the class teacher has since
   * SUBMITTED a (different) record: the draft is preserved and the client
   * shows the "Class Teacher attendance has been submitted" notice with a
   * review/apply action. Never silently overwrites the teacher's work.
   */
  classTeacherUpdate: {
    submissionId: string
    submittedAt: string
    entries: AttendanceEntryDTO[]
  } | null
}

export interface AttendancePayload {
  teacherName: string
  date: string // YYYY-MM-DD
  classes: AttendanceClassInfo[]
  /** null when no class is selected / teacher has no authorized classes */
  detail: AttendanceDetail | null
}
