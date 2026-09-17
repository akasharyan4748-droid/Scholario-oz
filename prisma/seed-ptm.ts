/**
 * seed-ptm — demo PTM Scheduler state (PTM-1).
 *
 * Principles (same as seed-class-attendance.ts):
 *  • runtime-resolved ids only — school/classes/teachers/students by
 *    query; NO hardcoded cuids;
 *  • idempotent — each event spec is keyed by (teacher, title, meeting
 *    day); an already-present event is skipped whole, so re-running is
 *    always safe and never duplicates;
 *  • future dates only, never today — the live booking/complete/release
 *    flow stays demonstrable on a clean "today";
 *  • real students from the teacher's authorized classes with plausible
 *    guardian names/phones.
 *
 * Seeded state (sandbox "today" = 2026-09-16):
 *  • Rohan (CT 9-A + Math 9-A/10-A):
 *      (a) "Term 1 PTM · Grade 9-A" — 2026-09-24, 10:00–12:00, 15-min
 *          slots (8): 3 BOOKED + 1 COMPLETED (with notes);
 *      (b) "Mathematics PTM · Grade 10-A" — 2026-09-19, 09:00–10:30,
 *          15-min slots (6): 2 BOOKED.
 *  • Priya (English & Social Science, both classes): 1 event on
 *    2026-09-26 (the teacher-isolation probe) — 11:00–12:00, 4 slots,
 *    1 BOOKED.
 *
 * Run: bun run db:seed-ptm
 */

import { db } from '../src/lib/db'

function dayToDate(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`)
}

/** Guardian display names + phones, keyed by student roll ("01"…). */
const GUARDIANS: Record<string, { name: string; phone: string }> = {
  '01': { name: 'Rajesh Sharma', phone: '+91 98201 11001' },
  '02': { name: 'Nisha Patel', phone: '+91 98201 11002' },
  '03': { name: 'Suresh Reddy', phone: '+91 98201 11003' },
  '04': { name: 'Meera Gupta', phone: '+91 98201 11004' },
  '06': { name: 'Lakshmi Nair', phone: '+91 98201 11006' },
  '11': { name: 'Anil Sharma', phone: '+91 98201 21011' },
  '12': { name: 'Kavita Patel', phone: '+91 98201 21012' },
}

const COMPLETED_NOTES =
  'Discussed the term so far — strong grasp of linear equations, needs practice with word problems. Agreed on a weekly practice worksheet; the parent will reinforce the homework routine at home.'

interface BookingSpec {
  startTime: string
  rollNo: string
  status: 'BOOKED' | 'COMPLETED'
  notes?: string
}

interface EventSpec {
  teacherEmail: string
  title: string
  meetingDay: string
  windowStart: string
  windowEnd: string
  slotMinutes: number
  location: string
  classNamePrefix: string
  bookings: BookingSpec[]
}

const EVENT_SPECS: EventSpec[] = [
  {
    teacherEmail: 'rohan.mehta@greenwood.edu.in',
    title: 'Term 1 PTM · Grade 9-A',
    meetingDay: '2026-09-24',
    windowStart: '10:00',
    windowEnd: '12:00',
    slotMinutes: 15,
    location: 'Classroom 9-A',
    classNamePrefix: 'Grade 9',
    bookings: [
      { startTime: '10:00', rollNo: '01', status: 'COMPLETED', notes: COMPLETED_NOTES },
      { startTime: '10:15', rollNo: '02', status: 'BOOKED' },
      { startTime: '10:30', rollNo: '03', status: 'BOOKED' },
      { startTime: '11:00', rollNo: '04', status: 'BOOKED' },
    ],
  },
  {
    teacherEmail: 'rohan.mehta@greenwood.edu.in',
    title: 'Mathematics PTM · Grade 10-A',
    meetingDay: '2026-09-19',
    windowStart: '09:00',
    windowEnd: '10:30',
    slotMinutes: 15,
    location: 'Mathematics Lab',
    classNamePrefix: 'Grade 10',
    bookings: [
      { startTime: '09:00', rollNo: '11', status: 'BOOKED' },
      { startTime: '09:15', rollNo: '12', status: 'BOOKED' },
    ],
  },
  {
    teacherEmail: 'teacher3@demoschool.edu',
    title: 'English & Social Science PTM · Grade 9-A',
    meetingDay: '2026-09-26',
    windowStart: '11:00',
    windowEnd: '12:00',
    slotMinutes: 15,
    location: 'Classroom 9-A',
    classNamePrefix: 'Grade 9',
    bookings: [{ startTime: '11:00', rollNo: '06', status: 'BOOKED' }],
  },
]

async function main() {
  for (const spec of EVENT_SPECS) {
    const user = await db.user.findFirst({
      where: { email: spec.teacherEmail, role: 'TEACHER' },
      select: { id: true, schoolId: true, name: true },
    })
    if (!user) throw new Error(`${spec.teacherEmail} not found`)
    const teacher = await db.teacher.findUnique({ where: { userId: user.id } })
    if (!teacher) throw new Error(`Teacher row for ${spec.teacherEmail} not found`)

    const cls = await db.class.findFirst({
      where: { schoolId: user.schoolId!, name: { startsWith: spec.classNamePrefix } },
      select: { id: true, name: true, section: true },
      orderBy: { name: 'asc' },
    })
    if (!cls) throw new Error(`Class ${spec.classNamePrefix} not found`)

    const students = await db.student.findMany({
      where: { schoolId: user.schoolId!, classId: cls.id },
      select: { id: true, rollNo: true, user: { select: { name: true } } },
    })
    const byRoll = new Map(students.map((s) => [s.rollNo ?? '', s]))

    // idempotency: (teacher, title, meeting day) already seeded → skip
    const dayStart = dayToDate(spec.meetingDay)
    const dayEnd = new Date(dayStart)
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1)
    const existing = await db.ptmEvent.findFirst({
      where: {
        teacherId: teacher.id,
        title: spec.title,
        meetingDate: { gte: dayStart, lt: dayEnd },
      },
      select: { id: true, _count: { select: { slots: true } } },
    })
    if (existing) {
      console.log(`${spec.title} (${spec.teacherEmail}) — already present (${existing._count.slots} slots) — skipped`)
      continue
    }

    // slot generation — identical rule to the server engine
    const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))
    const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    const slotDefs: { startTime: string; endTime: string }[] = []
    for (let m = toMin(spec.windowStart); m + spec.slotMinutes <= toMin(spec.windowEnd); m += spec.slotMinutes) {
      slotDefs.push({ startTime: fmt(m), endTime: fmt(m + spec.slotMinutes) })
    }
    if (!slotDefs.length) throw new Error(`${spec.title}: window fits no slots`)

    const completedAt = new Date(Date.now() - 2 * 60 * 60 * 1000) // seeded "recently held"
    let booked = 0
    let completed = 0

    await db.ptmEvent.create({
      data: {
        schoolId: user.schoolId!,
        teacherId: teacher.id,
        title: spec.title,
        meetingDate: dayStart,
        windowStart: spec.windowStart,
        windowEnd: spec.windowEnd,
        slotMinutes: spec.slotMinutes,
        location: spec.location,
        status: 'SCHEDULED',
        slots: {
          create: slotDefs.map((s) => {
            const booking = spec.bookings.find((b) => b.startTime === s.startTime)
            const student = booking ? byRoll.get(booking.rollNo) : undefined
            const guardian = booking ? GUARDIANS[booking.rollNo] : undefined
            if (!booking) {
              return {
                schoolId: user.schoolId!,
                teacherId: teacher.id,
                startTime: s.startTime,
                endTime: s.endTime,
              }
            }
            if (!student) throw new Error(`${spec.title}: student roll ${booking.rollNo} not found in ${cls.name}`)
            if (!guardian) throw new Error(`${spec.title}: no guardian profile for roll ${booking.rollNo}`)
            if (booking.status === 'BOOKED') booked++
            else completed++
            return {
              schoolId: user.schoolId!,
              teacherId: teacher.id,
              startTime: s.startTime,
              endTime: s.endTime,
              status: booking.status,
              studentId: student.id,
              bookedByName: guardian.name,
              contactPhone: guardian.phone,
              notes: booking.notes ?? null,
              completedAt: booking.status === 'COMPLETED' ? completedAt : null,
            }
          }),
        },
      },
    })

    console.log(
      `${spec.title} (${spec.teacherEmail}) — created: ${slotDefs.length} × ${spec.slotMinutes}-min slots on ${spec.meetingDay} · ${booked} booked · ${completed} completed`,
    )
  }
  console.log('seed complete — no events on today, the live booking flow stays demonstrable.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
