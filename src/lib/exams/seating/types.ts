/**
 * Seating types — Spec: Schedule = WHEN, Seating = WHERE.
 *
 * Rooms, seats, students, invigilators — all belong here, NOT in Schedule.
 */

export type SeatingType = 'single' | 'double'

export interface ExamRoom {
  id: string
  name: string
  roomNo: string
  rows: number
  cols: number
  seatingType: SeatingType
  /** Computed capacity = rows × cols × (seatingType === 'double' ? 2 : 1) */
  capacity: number
}

export interface Seat {
  id: string
  roomId: string
  seatNumber: string
  rowIdx: number
  colIdx: number
  /** For double-seat, 'A' or 'B'. Null for single. */
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
  classBand: string
  totalCapacity: number
  totalAssigned: number
  totalUnassigned: number
  fits: boolean
}

export interface ClassBand {
  id: string
  label: string
  /** Grade levels included in this band (matched against class gradeLevel). */
  grades: number[]
}

export const CLASS_BANDS: ClassBand[] = [
  { id: 'nursery-ukg', label: 'Nursery / LKG / UKG', grades: [-2, -1, 0] },
  { id: 'class-1-3', label: 'Classes 1–3', grades: [1, 2, 3] },
  { id: 'class-4-5', label: 'Classes 4–5', grades: [4, 5] },
  { id: 'class-6-8', label: 'Classes 6–8', grades: [6, 7, 8] },
  { id: 'class-9-10', label: 'Classes 9–10', grades: [9, 10] },
  { id: 'class-11-12', label: 'Classes 11–12', grades: [11, 12] },
  { id: 'class-1-5', label: 'Classes 1–5', grades: [1, 2, 3, 4, 5] },
  { id: 'class-9-12', label: 'Classes 9–12', grades: [9, 10, 11, 12] },
]

export interface InvigilatorAssignment {
  roomId: string
  teacherId: string
  teacherName: string
}

/** A mock student for seating (sourced from the exam's classes). */
export interface SeatingStudent {
  id: string
  name: string
  rollNo: string | null
  classId: string
  className: string
  gradeLevel: number
}
