/**
 * Seating generator — random allocation with class-band eligibility.
 *
 * Spec rules:
 *   - Only students from the selected class band are eligible.
 *   - Distribute across all rooms.
 *   - Avoid same-class adjacency where practical.
 *   - No duplicate student assignments.
 *   - No capacity overflow.
 *   - Report unassigned if capacity is insufficient.
 */

import type { ExamRoom, Seat, SeatingPlan, SeatingStudent, SeatingType } from './types'

/** Compute capacity from rows/cols/type. */
export function computeCapacity(rows: number, cols: number, type: SeatingType): number {
  return rows * cols * (type === 'double' ? 2 : 1)
}

/** Generate seat IDs + labels for a room. */
export function generateSeatsForRoom(room: ExamRoom): Seat[] {
  const seats: Seat[] = []
  let seatNum = 1
  for (let r = 0; r < room.rows; r++) {
    const rowLabel = String.fromCharCode(65 + r) // A, B, C, ...
    for (let c = 0; c < room.cols; c++) {
      if (room.seatingType === 'double') {
        seats.push({
          id: `${room.id}-${rowLabel}${c + 1}A`,
          roomId: room.id,
          seatNumber: `${rowLabel}${String(seatNum).padStart(2, '0')}A`,
          rowIdx: r,
          colIdx: c,
          position: 'A',
          studentId: null,
          studentName: null,
          studentRollNo: null,
          className: null,
        })
        seats.push({
          id: `${room.id}-${rowLabel}${c + 1}B`,
          roomId: room.id,
          seatNumber: `${rowLabel}${String(seatNum).padStart(2, '0')}B`,
          rowIdx: r,
          colIdx: c,
          position: 'B',
          studentId: null,
          studentName: null,
          studentRollNo: null,
          className: null,
        })
      } else {
        seats.push({
          id: `${room.id}-${rowLabel}${seatNum}`,
          roomId: room.id,
          seatNumber: `${rowLabel}${String(seatNum).padStart(2, '0')}`,
          rowIdx: r,
          colIdx: c,
          position: null,
          studentId: null,
          studentName: null,
          studentRollNo: null,
          className: null,
        })
      }
      seatNum++
    }
  }
  return seats
}

/**
 * Generate a seating plan. Students are shuffled and distributed across
 * rooms. Attempts to avoid same-class adjacency by interleaving.
 */
export function generateSeatingPlan(
  examId: string,
  rooms: ExamRoom[],
  students: SeatingStudent[],
  classBand: string,
): SeatingPlan {
  const allSeats: Seat[] = rooms.flatMap(generateSeatsForRoom)
  const totalCapacity = allSeats.length

  // Shuffle students (Fisher-Yates) for randomization.
  const shuffled = [...students]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // Interleave by class to avoid same-class adjacency: sort by className
  // in round-robin order so adjacent students tend to be from different classes.
  const byClass = new Map<string, SeatingStudent[]>()
  for (const s of shuffled) {
    if (!byClass.has(s.className)) byClass.set(s.className, [])
    byClass.get(s.className)!.push(s)
  }
  const classLists = Array.from(byClass.values())
  const interleaved: SeatingStudent[] = []
  const maxLen = Math.max(0, ...classLists.map((l) => l.length))
  for (let i = 0; i < maxLen; i++) {
    for (const list of classLists) {
      if (i < list.length) interleaved.push(list[i])
    }
  }

  // Assign students to seats.
  let assigned = 0
  for (let i = 0; i < Math.min(interleaved.length, allSeats.length); i++) {
    const student = interleaved[i]
    const seat = allSeats[i]
    seat.studentId = student.id
    seat.studentName = student.name
    seat.studentRollNo = student.rollNo
    seat.className = student.className
    assigned++
  }

  return {
    examId,
    rooms,
    seats: allSeats,
    classBand,
    totalCapacity,
    totalAssigned: assigned,
    totalUnassigned: Math.max(0, interleaved.length - totalCapacity),
    fits: interleaved.length <= totalCapacity,
  }
}

/** Get seats for a specific room from the plan. */
export function seatsForRoom(plan: SeatingPlan, roomId: string): Seat[] {
  return plan.seats.filter((s) => s.roomId === roomId)
}

/** Count occupied seats per room. */
export function roomOccupancy(plan: SeatingPlan, roomId: string): { occupied: number; capacity: number } {
  const roomSeats = seatsForRoom(plan, roomId)
  const occupied = roomSeats.filter((s) => s.studentId !== null).length
  return { occupied, capacity: roomSeats.length }
}
