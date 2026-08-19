/**
 * Seating generator — allocates real students to seats with class mixing.
 *
 * Rules:
 *   - Only students from eligible classes for each room are assigned.
 *   - Students are interleaved by class to avoid same-class adjacency.
 *   - No student appears more than once across the entire plan.
 *   - No room exceeds capacity.
 *   - Unassigned students are reported if capacity is insufficient.
 */

import type { ExamRoom, Seat, SeatingPlan, SeatingStudent } from './types'
import { computeCapacity } from './types'

/** Generate seat labels: Row A → A01, A02, ... Row B → B07, B08, ... */
export function generateSeatsForRoom(room: ExamRoom): Seat[] {
  const seats: Seat[] = []
  let seatNum = 1
  for (let r = 0; r < room.rows; r++) {
    const rowLabel = String.fromCharCode(65 + r)
    for (let c = 0; c < room.cols; c++) {
      if (room.seatingType === 'double') {
        seats.push({
          id: `${room.id}-${rowLabel}${seatNum}L`, roomId: room.id,
          seatNumber: `${rowLabel}${String(seatNum).padStart(2, '0')}L`,
          rowIdx: r, colIdx: c, position: 'L',
          studentId: null, studentName: null, studentRollNo: null, className: null,
        })
        seats.push({
          id: `${room.id}-${rowLabel}${seatNum}R`, roomId: room.id,
          seatNumber: `${rowLabel}${String(seatNum).padStart(2, '0')}R`,
          rowIdx: r, colIdx: c, position: 'R',
          studentId: null, studentName: null, studentRollNo: null, className: null,
        })
      } else {
        seats.push({
          id: `${room.id}-${rowLabel}${seatNum}`, roomId: room.id,
          seatNumber: `${rowLabel}${String(seatNum).padStart(2, '0')}`,
          rowIdx: r, colIdx: c, position: null,
          studentId: null, studentName: null, studentRollNo: null, className: null,
        })
      }
      seatNum++
    }
  }
  return seats
}

/** Interleave students by class to avoid same-class adjacency. */
function interleaveByClass(students: SeatingStudent[]): SeatingStudent[] {
  const byClass = new Map<string, SeatingStudent[]>()
  for (const s of students) {
    if (!byClass.has(s.className)) byClass.set(s.className, [])
    byClass.get(s.className)!.push(s)
  }
  const classLists = Array.from(byClass.values())
  const result: SeatingStudent[] = []
  const maxLen = Math.max(0, ...classLists.map((l) => l.length))
  for (let i = 0; i < maxLen; i++) {
    for (const list of classLists) {
      if (i < list.length) result.push(list[i])
    }
  }
  return result
}

/**
 * Generate a complete seating plan across all rooms.
 * Each room gets students from its eligible classes only.
 * No student is assigned to more than one seat.
 */
export function generateSeatingPlan(
  examId: string,
  rooms: ExamRoom[],
  studentsByClass: Map<string, SeatingStudent[]>,
): SeatingPlan {
  const allSeats: Seat[] = []
  const assignedStudentIds = new Set<string>()

  for (const room of rooms) {
    const roomSeats = generateSeatsForRoom(room)
    // Gather eligible students for this room (not already assigned elsewhere).
    const eligible: SeatingStudent[] = []
    for (const classId of room.eligibleClassIds) {
      const classStudents = studentsByClass.get(classId) ?? []
      for (const s of classStudents) {
        if (!assignedStudentIds.has(s.id)) eligible.push(s)
      }
    }

    // Shuffle + interleave for class mixing.
    const shuffled = [...eligible].sort(() => Math.random() - 0.5)
    const interleaved = interleaveByClass(shuffled)

    // Assign to seats.
    for (let i = 0; i < Math.min(interleaved.length, roomSeats.length); i++) {
      const student = interleaved[i]
      const seat = roomSeats[i]
      seat.studentId = student.id
      seat.studentName = student.name
      seat.studentRollNo = student.rollNo
      seat.className = student.className
      assignedStudentIds.add(student.id)
    }

    allSeats.push(...roomSeats)
  }

  const totalCapacity = allSeats.length
  const totalAssigned = allSeats.filter((s) => s.studentId !== null).length
  // Count total eligible students across all rooms (deduplicated).
  const allEligibleIds = new Set<string>()
  for (const room of rooms) {
    for (const classId of room.eligibleClassIds) {
      const classStudents = studentsByClass.get(classId) ?? []
      for (const s of classStudents) allEligibleIds.add(s.id)
    }
  }
  const totalEligible = allEligibleIds.size
  const totalUnassigned = Math.max(0, totalEligible - totalAssigned)

  return {
    examId,
    rooms,
    seats: allSeats,
    totalCapacity,
    totalAssigned,
    totalUnassigned,
    fits: totalEligible <= totalCapacity,
  }
}

/** Get seats for a specific room. */
export function seatsForRoom(plan: SeatingPlan, roomId: string): Seat[] {
  return plan.seats.filter((s) => s.roomId === roomId)
}

/** Count occupied seats per room. */
export function roomOccupancy(plan: SeatingPlan, roomId: string): { occupied: number; capacity: number } {
  const roomSeats = seatsForRoom(plan, roomId)
  const occupied = roomSeats.filter((s) => s.studentId !== null).length
  return { occupied, capacity: roomSeats.length }
}
