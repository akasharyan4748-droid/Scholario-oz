/**
 * Mock invigilator / teacher store — assigns teachers to exam sessions
 * (date + shift + room + subject + class) as invigilators.
 *
 * This is the canonical source of invigilator identity. The attendance
 * store and the notifications system both read from here — there is no
 * separate "invigilator name" field duplicated elsewhere.
 *
 * Duty status flow:
 *   Assigned → Accepted → (attendance submitted) → Submitted
 *
 * Teachers come from a small in-memory roster seeded with realistic
 * Indian-school names. In a real backend these would come from the
 * Staff / Teacher table.
 */

import { create } from 'zustand'

export interface InvigilatorTeacher {
  id: string
  name: string
  email: string | null
  department: string | null
  employeeId: string | null
  /** How many sessions they're currently assigned to. */
  assignedCount: number
}

export type DutyStatus = 'ASSIGNED' | 'ACCEPTED' | 'SUBMITTED'

export interface InvigilatorDuty {
  id: string
  examId: string
  /** The session this duty belongs to: keyed by (examId + scheduleItemId). */
  scheduleItemId: string
  /** Session identity (denormalised for display without re-joining). */
  date: string
  startTime: string
  endTime: string
  subjectId: string
  subjectName: string
  classId: string
  className: string
  roomName: string
  /** Assigned teacher. */
  teacherId: string
  teacherName: string
  /** Duty acceptance status. */
  status: DutyStatus
  /** When the duty was assigned. */
  assignedAt: string
}

interface MockInvigilatorState {
  teachers: InvigilatorTeacher[]
  duties: InvigilatorDuty[]
  /** Assign a teacher to a session as invigilator. */
  assignDuty: (duty: Omit<InvigilatorDuty, 'id' | 'status' | 'assignedAt'>) => InvigilatorDuty | null
  /** Auto-assign duties for an entire exam schedule (round-robin). */
  autoAssignForExam: (exam: any) => number
  /** Get duties for an exam. */
  getExamDuties: (examId: string) => InvigilatorDuty[]
  /** Find the invigilator for a specific session. */
  findInvigilator: (examId: string, scheduleItemId: string) => InvigilatorDuty | null
  /** Mark a duty as accepted. */
  acceptDuty: (dutyId: string) => void
  /** Mark a duty as submitted (called when attendance is submitted). */
  markDutySubmitted: (examId: string, scheduleItemId: string) => void
}

/** Realistic Indian-school teacher roster. */
const SEED_TEACHERS: InvigilatorTeacher[] = [
  { id: 'T-RAJESH', name: 'Mr. Rajesh Kumar', email: 'rajesh.kumar@scholario.edu', department: 'Mathematics', employeeId: 'EMP-001', assignedCount: 0 },
  { id: 'T-SHARMA', name: 'Mr. Anil Sharma', email: 'anil.sharma@scholario.edu', department: 'Mathematics', employeeId: 'EMP-002', assignedCount: 0 },
  { id: 'T-PRIYA', name: 'Ms. Priya Nair', email: 'priya.nair@scholario.edu', department: 'English', employeeId: 'EMP-003', assignedCount: 0 },
  { id: 'T-VERMA', name: 'Mrs. Sunita Verma', email: 'sunita.verma@scholario.edu', department: 'Science', employeeId: 'EMP-004', assignedCount: 0 },
  { id: 'T-REDDY', name: 'Mr. Karthik Reddy', email: 'karthik.reddy@scholario.edu', department: 'Social Science', employeeId: 'EMP-005', assignedCount: 0 },
  { id: 'T-JOSHI', name: 'Mrs. Meera Joshi', email: 'meera.joshi@scholario.edu', department: 'Hindi', employeeId: 'EMP-006', assignedCount: 0 },
  { id: 'T-GUPTA', name: 'Mr. Sandeep Gupta', email: 'sandeep.gupta@scholario.edu', department: 'Commerce', employeeId: 'EMP-007', assignedCount: 0 },
  { id: 'T-IYER', name: 'Dr. Lakshmi Iyer', email: 'lakshmi.iyer@scholario.edu', department: 'Physics', employeeId: 'EMP-008', assignedCount: 0 },
  { id: 'T-NAIDU', name: 'Mr. Venkat Naidu', email: 'venkat.naidu@scholario.edu', department: 'Chemistry', employeeId: 'EMP-009', assignedCount: 0 },
  { id: 'T-DESAI', name: 'Mrs. Anjali Desai', email: 'anjali.desai@scholario.edu', department: 'Biology', employeeId: 'EMP-010', assignedCount: 0 },
]

let dutyCounter = 0
function makeDutyId(): string {
  dutyCounter += 1
  return `duty-${Date.now()}-${dutyCounter}`
}

/** Pick a room name deterministically from a class+subject hash. */
function pickRoomName(classId: string, idx: number): string {
  const rooms = ['Room A', 'Room B', 'Room C', 'Room D', 'Hall 1', 'Hall 2']
  // Deterministic so the same session always gets the same room.
  const hash = (classId.charCodeAt(0) + idx) % rooms.length
  return rooms[hash]
}

export const useMockInvigilatorStore = create<MockInvigilatorState>()((set, get) => ({
  teachers: SEED_TEACHERS,
  duties: [],

  assignDuty: (input) => {
    const existing = get().duties.find(
      (d) => d.examId === input.examId && d.scheduleItemId === input.scheduleItemId,
    )
    if (existing) {
      // Update in place.
      const updated: InvigilatorDuty = { ...existing, ...input }
      set((state) => ({ duties: state.duties.map((d) => d.id === existing.id ? updated : d) }))
      return updated
    }
    const duty: InvigilatorDuty = {
      ...input,
      id: makeDutyId(),
      status: 'ASSIGNED',
      assignedAt: new Date().toISOString(),
    }
    set((state) => ({
      duties: [...state.duties, duty],
      teachers: state.teachers.map((t) => t.id === duty.teacherId ? { ...t, assignedCount: t.assignedCount + 1 } : t),
    }))
    return duty
  },

  autoAssignForExam: (exam) => {
    if (!exam?.schedule?.length) return 0
    const teachers = get().teachers
    if (teachers.length === 0) return 0
    let assigned = 0
    // Round-robin assignment across the schedule.
    exam.schedule.forEach((item: any, idx: number) => {
      const existing = get().duties.find(
        (d) => d.examId === exam.id && d.scheduleItemId === item.id,
      )
      if (existing) return // already assigned
      const teacher = teachers[idx % teachers.length]
      const roomName = item.room || pickRoomName(item.classId, idx)
      const duty: InvigilatorDuty = {
        id: makeDutyId(),
        examId: exam.id,
        scheduleItemId: item.id,
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        classId: item.classId,
        className: item.className,
        roomName,
        teacherId: teacher.id,
        teacherName: teacher.name,
        status: 'ASSIGNED',
        assignedAt: new Date().toISOString(),
      }
      set((state) => ({
        duties: [...state.duties, duty],
        teachers: state.teachers.map((t) => t.id === teacher.id ? { ...t, assignedCount: t.assignedCount + 1 } : t),
      }))
      assigned++
    })
    return assigned
  },

  getExamDuties: (examId) => {
    return get().duties.filter((d) => d.examId === examId)
  },

  findInvigilator: (examId, scheduleItemId) => {
    return get().duties.find((d) => d.examId === examId && d.scheduleItemId === scheduleItemId) ?? null
  },

  acceptDuty: (dutyId) => {
    set((state) => ({
      duties: state.duties.map((d) => d.id === dutyId ? { ...d, status: 'ACCEPTED' as DutyStatus } : d),
    }))
  },

  markDutySubmitted: (examId, scheduleItemId) => {
    set((state) => ({
      duties: state.duties.map((d) =>
        d.examId === examId && d.scheduleItemId === scheduleItemId
          ? { ...d, status: 'SUBMITTED' as DutyStatus }
          : d,
      ),
    }))
  },
}))
