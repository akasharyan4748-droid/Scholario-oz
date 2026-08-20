/**
 * Mock exam attendance store — session-specific manual marking.
 *
 * Attendance is NOT auto-generated from marks. It is manually recorded
 * by the invigilator (or Principal) 30 minutes before the exam starts.
 *
 * Session identity = (examId + scheduleItemId). All session metadata
 * (date, startTime, endTime, subject, class, room) is derived from the
 * exam schedule — there is NO separate conflicting date stored here.
 *
 * Invigilator identity comes from the invigilator store
 * (@/lib/exams/mock-invigilator-data). This store holds a reference to
 * the scheduleItemId so the join is always live.
 *
 * Attendance open gate:
 *   - "Scheduled"  : now < (examStart - 30 min)
 *   - "Ready"      : examStart - 30min <= now < examEnd
 *   - "In Progress": examStart <= now < examEnd  (subset of Ready, editable)
 *   - "Submitted"  : after submitSession() is called
 *   - "Reviewed"   : after principal reviews
 */

import { create } from 'zustand'
import { useMockInvigilatorStore } from './mock-invigilator-data'
import { useMockAuditStore } from './mock-audit-data'

export type AttendanceStatus = 'NOT_MARKED' | 'PRESENT' | 'ABSENT' | 'LEAVE'

export type SessionGateStatus = 'Scheduled' | 'Ready' | 'In Progress' | 'Submitted' | 'Reviewed'

export type RecordedByRole = 'INVIGILATOR' | 'PRINCIPAL'

export interface ExamAttendanceRecord {
  id: string
  examId: string
  scheduleItemId: string
  /** Session identity (denormalised for display). */
  date: string
  startTime: string
  endTime: string
  shiftLabel: string
  subjectId: string
  subjectName: string
  classId: string
  className: string
  roomId: string
  roomName: string
  studentId: string
  studentName: string
  studentRollNo: string | null
  /** Seat number from the seating roster (e.g. "B01"). */
  seatNumber: string
  status: AttendanceStatus
  remarks: string | null
}

export interface ExamSession {
  id: string
  examId: string
  scheduleItemId: string
  date: string
  startTime: string
  endTime: string
  shiftLabel: string
  subjectId: string
  subjectName: string
  classId: string
  className: string
  roomId: string
  roomName: string
  /** Invigilator identity (denormalised from invigilator store). */
  invigilatorId: string | null
  invigilatorName: string | null
  /** Whether attendance has been submitted. */
  submitted: boolean
  submittedAt: string | null
  submittedBy: string | null
  submittedByRole: RecordedByRole | null
  /** Who recorded the attendance (may differ from invigilator if Principal did it). */
  recordedByRole: RecordedByRole | null
  recordedBy: string | null
  /** Whether Principal has reviewed. */
  reviewed: boolean
}

interface MockAttendanceState {
  records: ExamAttendanceRecord[]
  sessions: ExamSession[]
  /** Initialize attendance sessions + roster from exam schedule + students. */
  initAttendance: (
    exam: any,
    students: Array<{ id: string; name: string; rollNo: string | null; classId: string; className: string }>,
  ) => void
  /** Mark a student's attendance status. */
  markStatus: (recordId: string, status: AttendanceStatus) => void
  /** Mark all students in a session as present (explicit action). */
  markAllPresent: (sessionId: string) => void
  /** Submit attendance for a session. Returns { ok, pendingCount }. */
  submitSession: (sessionId: string, byRole: RecordedByRole, byName: string) => { ok: boolean; pendingCount: number }
  /** Mark a session as reviewed by Principal. */
  reviewSession: (sessionId: string) => void
  /** Get records for a session. */
  getSessionRecords: (sessionId: string) => ExamAttendanceRecord[]
}

function buildSessionId(examId: string, scheduleItemId: string): string {
  return `session-${examId}-${scheduleItemId}`
}

/** Parse "HH:MM" + "YYYY-MM-DD" into a Date (local). */
function parseSessionDateTime(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [h, min] = timeStr.split(':').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1, h ?? 0, min ?? 0, 0, 0)
}

/**
 * Compute the gate status for a session based on the current wall-clock
 * time relative to the exam start/end times. "Submitted"/"Reviewed"
 * override the time-based statuses.
 */
export function computeGateStatus(session: ExamSession): SessionGateStatus {
  if (session.reviewed) return 'Reviewed'
  if (session.submitted) return 'Submitted'
  const now = new Date()
  const start = parseSessionDateTime(session.date, session.startTime)
  const end = parseSessionDateTime(session.date, session.endTime)
  const openAt = new Date(start.getTime() - 30 * 60 * 1000) // 30 min before
  if (now < openAt) return 'Scheduled'
  if (now >= start && now < end) return 'In Progress'
  if (now >= openAt) return 'Ready' // between openAt and start, or after end (still markable)
  return 'Scheduled'
}

/** When attendance opens (30 min before start), as a Date. */
export function computeAttendanceOpenAt(session: ExamSession): Date {
  const start = parseSessionDateTime(session.date, session.startTime)
  return new Date(start.getTime() - 30 * 60 * 1000)
}

export const useMockAttendanceStore = create<MockAttendanceState>()((set, get) => ({
  records: [],
  sessions: [],

  initAttendance: (exam, students) => {
    const existing = get().sessions.filter((s) => s.examId === exam.id)
    if (existing.length > 0) return

    // Auto-assign invigilators for this exam (round-robin) if not already done.
    const invigilatorStore = useMockInvigilatorStore.getState()
    if (invigilatorStore.getExamDuties(exam.id).length === 0) {
      invigilatorStore.autoAssignForExam(exam)
    }
    const duties = invigilatorStore.getExamDuties(exam.id)

    const newRecords: ExamAttendanceRecord[] = []
    const newSessions: ExamSession[] = []
    const seenSessions = new Set<string>()

    // Group schedule by scheduleItemId → one session per schedule item.
    for (const item of exam.schedule) {
      const examClass = exam.classes.find((c: any) => c.classId === item.classId)
      if (!examClass) continue
      const classStudents = students.filter((s) => s.classId === item.classId)
      const duty = duties.find((d) => d.scheduleItemId === item.id) ?? null
      const sessionId = buildSessionId(exam.id, item.id)
      const shiftLabel = item.startTime < '12:00' ? '1st Shift' : '2nd Shift'
      const roomName = duty?.roomName ?? item.room ?? 'Room A'
      const roomId = `room-${roomName.replace(/\s+/g, '-').toLowerCase()}`

      if (!seenSessions.has(sessionId)) {
        seenSessions.add(sessionId)
        newSessions.push({
          id: sessionId,
          examId: exam.id,
          scheduleItemId: item.id,
          date: item.date,
          startTime: item.startTime,
          endTime: item.endTime,
          shiftLabel,
          subjectId: item.subjectId,
          subjectName: item.subjectName,
          classId: item.classId,
          className: examClass.className,
          roomId,
          roomName,
          invigilatorId: duty?.teacherId ?? null,
          invigilatorName: duty?.teacherName ?? null,
          submitted: false,
          submittedAt: null,
          submittedBy: null,
          submittedByRole: null,
          recordedByRole: null,
          recordedBy: null,
          reviewed: false,
        })
      }

      // Deterministic seat numbers: A01, A02, ... per room.
      classStudents.forEach((student, sIdx) => {
        const seatLetter = String.fromCharCode(65 + (sIdx % 5))
        const seatNum = String(Math.floor(sIdx / 5) + 1).padStart(2, '0')
        newRecords.push({
          id: `att-${exam.id}-${item.id}-${student.id}`,
          examId: exam.id,
          scheduleItemId: item.id,
          date: item.date,
          startTime: item.startTime,
          endTime: item.endTime,
          shiftLabel,
          subjectId: item.subjectId,
          subjectName: item.subjectName,
          classId: item.classId,
          className: examClass.className,
          roomId,
          roomName,
          studentId: student.id,
          studentName: student.name,
          studentRollNo: student.rollNo,
          seatNumber: `${seatLetter}${seatNum}`,
          status: 'NOT_MARKED' as AttendanceStatus,
          remarks: null,
        })
      })
    }

    set((state) => ({
      records: [...state.records, ...newRecords],
      sessions: [...state.sessions, ...newSessions],
    }))
  },

  markStatus: (recordId, status) => {
    set((state) => ({
      records: state.records.map((r) => (r.id === recordId ? { ...r, status } : r)),
    }))
  },

  markAllPresent: (sessionId) => {
    set((state) => {
      const session = state.sessions.find((s) => s.id === sessionId)
      if (!session) return state
      return {
        records: state.records.map((r) =>
          r.examId === session.examId && r.scheduleItemId === session.scheduleItemId
            ? { ...r, status: 'PRESENT' as AttendanceStatus }
            : r,
        ),
      }
    })
  },

  submitSession: (sessionId, byRole, byName) => {
    const session = get().sessions.find((s) => s.id === sessionId)
    if (!session) return { ok: false, pendingCount: 0 }
    const records = get().records.filter(
      (r) => r.examId === session.examId && r.scheduleItemId === session.scheduleItemId,
    )
    const pendingCount = records.filter((r) => r.status === 'NOT_MARKED').length
    if (pendingCount > 0) return { ok: false, pendingCount }

    const now = new Date().toISOString()
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              submitted: true,
              submittedAt: now,
              submittedBy: byName,
              submittedByRole: byRole,
              recordedByRole: byRole,
              recordedBy: byName,
            }
          : s,
      ),
    }))

    // Mark the invigilator duty as submitted.
    useMockInvigilatorStore.getState().markDutySubmitted(session.examId, session.scheduleItemId)

    // Record an audit event.
    useMockAuditStore.getState().recordEvent({
      examId: session.examId,
      action: 'ATTENDANCE_SUBMITTED',
      summary: `${session.className} ${session.subjectName} attendance submitted`,
      entityType: 'session',
      entityId: session.id,
      metadata: {
        className: session.className,
        subjectName: session.subjectName,
        room: session.roomName,
        present: records.filter((r) => r.status === 'PRESENT').length,
        absent: records.filter((r) => r.status === 'ABSENT').length,
      },
      userId: byRole === 'PRINCIPAL' ? 'principal' : session.invigilatorId,
      userName: byName,
      userRole: byRole,
      oldValue: null,
      newValue: `submitted by ${byName}`,
    })

    return { ok: true, pendingCount: 0 }
  },

  reviewSession: (sessionId) => {
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, reviewed: true } : s)),
    }))
  },

  getSessionRecords: (sessionId) => {
    const session = get().sessions.find((s) => s.id === sessionId)
    if (!session) return []
    return get().records.filter(
      (r) => r.examId === session.examId && r.scheduleItemId === session.scheduleItemId,
    )
  },
}))
