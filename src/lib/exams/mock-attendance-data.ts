/**
 * Mock exam attendance store — session-specific manual marking.
 *
 * Attendance is NOT auto-generated from marks. It's manually recorded
 * by the invigilator. The store tracks per-student attendance status
 * per exam session (date + shift + room + subject).
 */

import { create } from 'zustand'

export type AttendanceStatus = 'NOT_MARKED' | 'PRESENT' | 'ABSENT' | 'LEAVE'

export interface ExamAttendanceRecord {
  id: string
  examId: string
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
  seatNumber: string
  status: AttendanceStatus
  remarks: string | null
}

export interface ExamSession {
  id: string
  examId: string
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
  invigilatorName: string | null
  submitted: boolean
  submittedAt: string | null
  submittedBy: string | null
}

interface MockAttendanceState {
  records: ExamAttendanceRecord[]
  sessions: ExamSession[]
  /** Initialize attendance from exam schedule + students. */
  initAttendance: (exam: any, students: Array<{ id: string; name: string; rollNo: string | null; classId: string; className: string }>) => void
  /** Mark a student's attendance status. */
  markStatus: (recordId: string, status: AttendanceStatus) => void
  /** Mark all students in a session as present. */
  markAllPresent: (sessionId: string) => void
  /** Submit attendance for a session. */
  submitSession: (sessionId: string) => void
  /** Get records for a session. */
  getSessionRecords: (sessionId: string) => ExamAttendanceRecord[]
}

function buildSessionId(examId: string, date: string, startTime: string, roomId: string): string {
  return `session-${examId}-${date}-${startTime}-${roomId}`
}

export const useMockAttendanceStore = create<MockAttendanceState>()((set, get) => ({
  records: [],
  sessions: [],

  initAttendance: (exam, students) => {
    const existing = get().records.filter((r) => r.examId === exam.id)
    if (existing.length > 0) return

    const newRecords: ExamAttendanceRecord[] = []
    const newSessions: ExamSession[] = []
    const seenSessions = new Set<string>()

    // Group schedule by (date, startTime, classId) → sessions.
    for (const item of exam.schedule) {
      const examClass = exam.classes.find((c: any) => c.classId === item.classId)
      if (!examClass) continue
      const classStudents = students.filter((s) => s.classId === item.classId)
      const roomId = `room-${item.classId}`
      const roomName = `Room A`
      const sessionId = buildSessionId(exam.id, item.date, item.startTime, roomId)
      const shiftLabel = item.startTime === '09:00' ? '1st Shift' : '2nd Shift'

      if (!seenSessions.has(sessionId)) {
        seenSessions.add(sessionId)
        newSessions.push({
          id: sessionId,
          examId: exam.id,
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
          invigilatorName: null,
          submitted: false,
          submittedAt: null,
          submittedBy: null,
        })
      }

      for (const student of classStudents) {
        newRecords.push({
          id: `att-${exam.id}-${item.date}-${item.startTime}-${student.id}`,
          examId: exam.id,
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
          seatNumber: `${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')}`,
          status: 'NOT_MARKED' as AttendanceStatus,
          remarks: null,
        })
      }
    }

    set((state) => ({
      records: [...state.records, ...newRecords],
      sessions: [...state.sessions, ...newSessions],
    }))
  },

  markStatus: (recordId, status) => {
    set((state) => ({
      records: state.records.map((r) => r.id === recordId ? { ...r, status } : r),
    }))
  },

  markAllPresent: (sessionId) => {
    set((state) => ({
      records: state.records.map((r) => {
        const session = state.sessions.find((s) => s.id === sessionId)
        if (!session) return r
        if (r.examId === session.examId && r.date === session.date && r.startTime === session.startTime && r.roomId === session.roomId) {
          return { ...r, status: 'PRESENT' as AttendanceStatus }
        }
        return r
      }),
    }))
  },

  submitSession: (sessionId) => {
    set((state) => ({
      sessions: state.sessions.map((s) => s.id === sessionId ? {
        ...s, submitted: true, submittedAt: new Date().toISOString(), submittedBy: 'current-user',
      } : s),
    }))
  },

  getSessionRecords: (sessionId) => {
    const session = get().sessions.find((s) => s.id === sessionId)
    if (!session) return []
    return get().records.filter((r) =>
      r.examId === session.examId && r.date === session.date &&
      r.startTime === session.startTime && r.roomId === session.roomId
    )
  },
}))
