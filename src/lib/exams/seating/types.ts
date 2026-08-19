/**
 * Seating types — Spec: Schedule = WHEN, Seating = WHERE.
 */

export type SeatingType = 'single' | 'double'

export interface ExamRoom {
  id: string
  name: string
  roomNo: string
  rows: number
  cols: number
  seatingType: SeatingType
  capacity: number
  /** Class IDs eligible for this room (from the exam's selected classes). */
  eligibleClassIds: string[]
}

export interface Seat {
  id: string
  roomId: string
  seatNumber: string
  rowIdx: number
  colIdx: number
  /** 'L' or 'R' for double-seat. Null for single. */
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

export interface InvigilatorAssignment {
  roomId: string
  teacherId: string
  teacherName: string
}

/** A student record for seating (sourced from the Students & Classes store). */
export interface SeatingStudent {
  id: string
  name: string
  rollNo: string | null
  classId: string
  className: string
}

/** Compute capacity from rows/cols/type. */
export function computeCapacity(rows: number, cols: number, type: SeatingType): number {
  return rows * cols * (type === 'double' ? 2 : 1)
}
