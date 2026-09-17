/**
 * seed-exam-ops — real exam-operation records for the Teacher Exam
 * Proctoring module: ExamScheduleItems (papers with rooms, times and
 * invigilators) and ExamSeatAssignments (room + seat per student) for the
 * school's real exams, classes, subjects, students and teachers.
 *
 * Run: bun run db:seed-exam-ops
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

/** Exam-suitable rooms (classrooms upstairs + labs). */
const EXAM_ROOMS = ['Room 201', 'Room 202', 'Room 203', 'Room 204', 'Room 205', 'Room 206']
/** Seating grid per room (rows × cols). */
const ROOM_GRID = { rows: 4, cols: 6 }

/** Morning / afternoon paper slots. */
const SLOTS = [
  { start: '09:00', end: '11:30' },
  { start: '13:30', end: '16:00' },
]

function dayKey(d: Date): string {
  return `${d.getUTCFullYear()}-${`${d.getUTCMonth() + 1}`.padStart(2, '0')}-${`${d.getUTCDate()}`.padStart(2, '0')}`
}

/** Working days (Mon–Sat) inside [start, end], capped at maxDays. */
function workingDays(start: Date, end: Date, maxDays: number): Date[] {
  const days: Date[] = []
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))
  const stop = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()))
  while (cursor <= stop && days.length < maxDays) {
    const wd = cursor.getUTCDay()
    if (wd >= 1 && wd <= 6) days.push(new Date(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return days
}

async function main() {
  const school = await db.school.findFirst({ select: { id: true, name: true } })
  if (!school) throw new Error('No school found')
  console.log(`School: ${school.name}`)

  // Clean previous exam-ops seeds (schedule items + seat assignments only —
  // exams, classes, subject configs and students are owned by other seeds).
  const delSched = await db.examScheduleItem.deleteMany({})
  const delSeats = await db.examSeatAssignment.deleteMany({})
  console.log(`  Cleared ${delSched.count} schedule items, ${delSeats.count} seat assignments`)

  // Real invigilators: the teachers who actually teach this school's classes.
  const invigilators = await db.timetable.findMany({
    select: { teacherName: true },
    distinct: ['teacherName'],
    where: { schoolId: school.id, teacherName: { not: null } },
  })
  const invNames = invigilators.map((t) => t.teacherName!).filter(Boolean)
  if (invNames.length === 0) throw new Error('No teachers found in timetable')
  console.log(`  Invigilators: ${invNames.join(', ')}`)

  // ── Schedule items: one paper per ExamSubjectConfig ──────────────────
  const configs = await db.examSubjectConfig.findMany({
    where: { exam: { schoolId: school.id } },
    include: {
      exam: { select: { name: true, startDate: true, endDate: true } },
      class: { select: { name: true, section: true } },
      subject: { select: { name: true } },
    },
    orderBy: [{ examId: 'asc' }, { classId: 'asc' }, { subjectId: 'asc' }],
  })

  // Group by exam → assign papers across the exam's working days, two slots
  // per day, cycling rooms and invigilators.
  const byExam = new Map<string, typeof configs>()
  for (const c of configs) {
    const list = byExam.get(c.examId) ?? []
    list.push(c)
    byExam.set(c.examId, list)
  }

  let schedCount = 0
  for (const [examId, list] of byExam) {
    const exam = list[0].exam
    const days = workingDays(exam.startDate, exam.endDate, 10)
    let slotIdx = 0
    for (let i = 0; i < list.length; i++) {
      const cfg = list[i]
      const day = days[Math.floor(slotIdx / SLOTS.length)] ?? days[days.length - 1]
      const slot = SLOTS[slotIdx % SLOTS.length]
      const room = EXAM_ROOMS[i % EXAM_ROOMS.length]
      const invigilator = invNames[(i + 1) % invNames.length]
      await db.examScheduleItem.create({
        data: {
          examId,
          classId: cfg.classId,
          subjectId: cfg.subjectId,
          date: day,
          startTime: slot.start,
          endTime: slot.end,
          room,
          invigilatorName: invigilator,
        },
      })
      schedCount++
      slotIdx++
    }
  }
  console.log(`  Created ${schedCount} schedule items (papers with rooms + invigilators)`)

  // ── Seat assignments: every student of every exam class ──────────────
  // Classes are INTERLEAVED in each room (seat 1 = class A student 1,
  // seat 2 = class B student 1, …) — standard exam-hall practice to
  // avoid neighbours from the same class. Rooms fill to 24 seats (4×6).
  const examsWithClasses = await db.exam.findMany({
    where: { schoolId: school.id, examClasses: { some: {} } },
    select: { id: true, name: true },
  })

  let seatCount = 0
  for (const exam of examsWithClasses) {
    const rosters = await db.examClass.findMany({
      where: { examId: exam.id },
      select: { classId: true },
    })
    const classStudents: { id: string }[][] = []
    for (const rc of rosters) {
      const students = await db.student.findMany({
        where: { classId: rc.classId, user: { status: 'ACTIVE' } },
        orderBy: [{ rollNo: 'asc' }],
        select: { id: true },
      })
      classStudents.push(students)
    }
    // Interleave: seat 1 = class A student 1, seat 2 = class B student 1…
    const withClass: { studentId: string; classId: string }[] = []
    const maxLen = Math.max(0, ...classStudents.map((s) => s.length))
    for (let i = 0; i < maxLen; i++) {
      classStudents.forEach((students, ci) => {
        if (i < students.length) {
          withClass.push({
            studentId: students[i].id,
            classId: rosters[ci].classId,
          })
        }
      })
    }

    for (let i = 0; i < withClass.length; i++) {
      const room = EXAM_ROOMS[Math.floor(i / (ROOM_GRID.rows * ROOM_GRID.cols))]
      const seatInRoom = (i % (ROOM_GRID.rows * ROOM_GRID.cols)) + 1
      const row = Math.floor((seatInRoom - 1) / ROOM_GRID.cols) + 1
      const col = ((seatInRoom - 1) % ROOM_GRID.cols) + 1
      await db.examSeatAssignment.create({
        data: {
          examId: exam.id,
          classId: withClass[i].classId,
          studentId: withClass[i].studentId,
          room,
          seatNumber: seatInRoom,
          row,
          column: col,
        },
      })
      seatCount++
    }
  }
  console.log(`  Created ${seatCount} seat assignments`)

  // ── Verify ────────────────────────────────────────────────────────────
  const verify = await db.examScheduleItem.findMany({
    include: { exam: { select: { name: true } }, subject: { select: { name: true } }, class: { select: { name: true, section: true } } },
    orderBy: [{ date: 'asc' }],
    take: 5,
  })
  for (const v of verify) {
    console.log(`    ${dayKey(v.date)} ${v.startTime} ${v.exam.name} ${v.class.name}-${v.class.section} ${v.subject.name} @ ${v.room} (${v.invigilatorName})`)
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
