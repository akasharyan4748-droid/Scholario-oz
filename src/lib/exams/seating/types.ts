/**
 * Seating types — Spec: Schedule = WHEN, Seating = WHERE.
 */

export type SeatingType = 'single' | 'double' | 'triple'

export interface ExamRoom {
  id: string
  name: string
  roomNo: string
  rows: number
  cols: number
  seatingType: SeatingType
  capacity: number
  eligibleClassIds: string[]
}

export interface Seat {
  id: string
  roomId: string
  seatNumber: string
  rowIdx: number
  colIdx: number
  position: string | null
  studentId: string | null
  studentName: string | null
  studentRollNo: string | null
  className: string | null
}

export interface SeatingPlan {
  examId: string
  rooms: ExamRoom[]
  seats: Seat[]
  totalCapacity: number
  totalAssigned: number
  totalUnassigned: number
  fits: boolean
}

/** Exam slot (date + shift) — derived from the exam's schedule. */
export interface ExamSlot {
  id: string
  date: string
  startTime: string
  endTime: string
  shiftLabel: string
}

/** Invigilator assignment per slot + room (max 3 per slot+room). */
export interface InvigilationAssignment {
  id: string
  examSlotId: string
  roomId: string
  teacherId: string
  teacherName: string
}

/** A student for seating (sourced from Students & Classes store). */
export interface SeatingStudent {
  id: string
  name: string
  rollNo: string | null
  classId: string
  className: string
}

/** Compute capacity from rows/cols/type. */
export function computeCapacity(rows: number, cols: number, type: SeatingType): number {
  const multiplier = type === 'triple' ? 3 : type === 'double' ? 2 : 1
  return rows * cols * multiplier
}
