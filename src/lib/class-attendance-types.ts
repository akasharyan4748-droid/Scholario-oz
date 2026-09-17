/**
 * class-attendance-types — the pure DTO contract for the Class Attendance
 * module (CT baseline + ST prefill workflow, spec §11 of the Teacher
 * Workspace cleanup brief). Client-safe: no server imports.
 *
 * MENTAL MODEL:
 *   Class Teacher marks attendance  →  the class's daily BASELINE (the
 *   `Attendance` table)  →  every Subject Teacher opening their assigned
 *   class sees the already-marked baseline as PREFILL, adjusts only the
 *   exceptions, and explicitly submits their OWN subject-session record
 *   (`SubjectSessionAttendance`) — a separate, teacher-owned layer.
 *   Simply VIEWING prefilled statuses never creates a submission.
 */

/** The ONLY statuses Class Attendance may surface (spec §11). */
export type AttendanceMark = 'present' | 'absent' | 'late' | 'leave'

export const ATTENDANCE_MARKS: readonly AttendanceMark[] = ['present', 'absent', 'late', 'leave']

export function isAttendanceMark(v: unknown): v is AttendanceMark {
  return typeof v === 'string' && (ATTENDANCE_MARKS as readonly string[]).includes(v)
}

/** Normalizes a stored status (uppercase, e.g. "PRESENT") to a mark. */
export function toAttendanceMark(status: string): AttendanceMark | null {
  const lower = status.toLowerCase()
  return isAttendanceMark(lower) ? lower : null
}

// ─── scopes (the teacher's allowed classes) ────────────────────────────

export interface AttendanceScopeSubject {
  subjectId: string
  subjectName: string
  subjectCode: string | null
}

export interface AttendanceScopeDTO {
  classId: string
  classLabel: string
  /** true when the signed-in teacher is this class's Class Teacher */
  isClassTeacher: boolean
  /** the teacher's ACTIVE subject assignments for this class (empty for a
   *  CT-only class → the module runs in CT_DAILY mode) */
  subjects: AttendanceScopeSubject[]
}

/** GET /api/teacher/class-attendance (no params). */
export interface ClassAttendanceScopesPayload {
  scopes: AttendanceScopeDTO[]
  /** YYYY-MM-DD — the school's "today" (Asia/Kolkata), for the date picker */
  today: string
}

// ─── the marking view ──────────────────────────────────────────────────

export interface AttendanceStudentDTO {
  studentId: string
  name: string
  rollNo: string | null
  /** the Class Teacher's baseline status for this date (null = not marked) */
  baselineStatus: AttendanceMark | null
  /** this teacher's submitted subject-session status (null = not submitted;
   *  always null in CT_DAILY mode) */
  sessionStatus: AttendanceMark | null
}

export interface ClassAttendanceMetaDTO {
  mode: 'SUBJECT' | 'CT_DAILY'
  isClassTeacher: boolean
  baseline: {
    /** any baseline rows exist for this class + date */
    marked: boolean
    /** roster students that have a baseline row */
    count: number
  }
  session: {
    /** any subject-session rows exist for this teacher's subject + date */
    submitted: boolean
    /** ISO timestamp of the most recent session row (null when not submitted) */
    submittedAt: string | null
    /** roster students covered by session rows */
    count: number
  }
}

/** GET with classId(+subjectId)+date · POST submit response (refreshed). */
export interface ClassAttendanceViewDTO {
  classId: string
  classLabel: string
  /** null in CT_DAILY mode */
  subjectId: string | null
  subjectName: string | null
  /** YYYY-MM-DD */
  date: string
  mode: 'SUBJECT' | 'CT_DAILY'
  isClassTeacher: boolean
  roster: AttendanceStudentDTO[]
  meta: ClassAttendanceMetaDTO
  /** always fresh alongside the view (one state object client-side) */
  scopes: AttendanceScopeDTO[]
  today: string
}

/** POST body entry. */
export interface AttendanceSubmitEntry {
  studentId: string
  status: AttendanceMark
}
