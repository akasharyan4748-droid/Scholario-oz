/**
 * seed-class-attendance — demo baseline + one subject-session for the
 * Class Attendance CT→ST workflow (ATT-1).
 *
 * Principles (same as seed-lesson-planner.ts):
 *  • runtime-resolved ids only — school by slug, class/teacher/subject by
 *    query; NO hardcoded cuids;
 *  • idempotent — skips any day that already has rows, so re-running is
 *    always safe and never duplicates;
 *  • relative dates — the two most recent PAST school days (never today,
 *    never the future) so the live CT→ST flow can always be demonstrated
 *    on a clean "today";
 *  • collision-safe baseline writes — legacy Attendance rows may carry a
 *    non-midnight timestamp, so existence is checked with a day range.
 *
 * Seeded state:
 *  • Grade 9-A daily baseline (Attendance, all students, marked by the
 *    class teacher Rohan) for the 2 most recent past school days —
 *    mostly PRESENT with a couple of ABSENT/LATE/LEAVE for realism.
 *  • ONE past subject session — Rohan · Mathematics · Grade 9-A on the
 *    most recent of those days, matching the baseline except one student
 *    (present in the baseline, LATE in the math period).
 *
 * Run: bun run db:seed-class-attendance
 */

import { db } from '../src/lib/db'
import { loadHolidaySet, todayStr } from '../src/lib/lesson-planner'

const TZ = 'Asia/Kolkata'
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

function dayToDate(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`)
}
function addDays(day: string, n: number): string {
  const d = dayToDate(day)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** The n most recent school days STRICTLY BEFORE today (Mon–Sat, no holidays). */
async function recentPastSchoolDays(schoolId: string, count: number): Promise<string[]> {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date())
  const holidays = await loadHolidaySet(schoolId, addDays(today, -30), today)
  const days: string[] = []
  let cursor = today
  let guard = 0
  while (days.length < count && guard < 60) {
    cursor = addDays(cursor, -1)
    guard++
    const weekday = WEEKDAY_NAMES[dayToDate(cursor).getUTCDay()]
    if (weekday === 'Sunday') continue
    if (holidays.has(cursor)) continue
    days.push(cursor)
  }
  return days // [mostRecent, older, ...]
}

async function main() {
  const school = await db.school.findFirst({ where: { slug: 'demo-school' } })
  if (!school) throw new Error('demo-school not found')

  const classes = await db.class.findMany({ where: { schoolId: school.id }, orderBy: { name: 'asc' } })
  const c9 = classes.find((c) => c.name.startsWith('Grade 9'))
  if (!c9) throw new Error('Grade 9 class not found')

  // Rohan — the Grade 9-A class teacher (classTeacherId stores his userId)
  const rohanUser = await db.user.findFirst({ where: { email: 'rohan.mehta@greenwood.edu.in', role: 'TEACHER' }, select: { id: true } })
  if (!rohanUser) throw new Error('Rohan user not found')
  const rohan = await db.teacher.findFirst({ where: { userId: rohanUser.id } })
  if (!rohan) throw new Error('Rohan teacher row not found')
  if (c9.classTeacherId !== rohanUser.id) {
    throw new Error('Rohan is not the Grade 9-A class teacher — refusing to seed a misleading baseline')
  }

  // Mathematics 9-A — resolved through Rohan's ACTIVE assignment (never a hardcoded id)
  const mathAssignment = await db.classSubjectAssignment.findFirst({
    where: { schoolId: school.id, classId: c9.id, teacherId: rohan.id, isActive: true },
    include: { subject: true },
  })
  if (!mathAssignment) throw new Error('Rohan has no active subject assignment for Grade 9-A')
  const math = mathAssignment.subject

  const students = await db.student.findMany({
    where: { schoolId: school.id, classId: c9.id },
    select: { id: true, rollNo: true, user: { select: { name: true } } },
  })
  if (!students.length) throw new Error('Grade 9-A has no students')
  // numeric-safe roll order (same rule as the engine)
  students.sort((a, b) => {
    const na = Number(a.rollNo)
    const nb = Number(b.rollNo)
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb
    return (a.rollNo ?? '').localeCompare(b.rollNo ?? '')
  })

  const today = todayStr()
  console.log(`seeding class attendance for today=${today} · school=${school.slug} · class=${c9.name} (${students.length} students)`)
  if (today !== new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date())) {
    throw new Error('todayStr() disagrees with the seed clock — aborting to avoid seeding the wrong days')
  }

  const [mostRecent, older] = await recentPastSchoolDays(school.id, 2)
  if (!mostRecent || !older) throw new Error('could not resolve two past school days')
  console.log(`target school days: ${older} + ${mostRecent}`)

  // ── 1. the class baseline (Attendance) for both days ──
  // Calm realistic exceptions, keyed by roster position (deterministic):
  //   older day      → 1 ABSENT (3rd student) + 1 LATE (7th)
  //   most recent day→ 1 ABSENT (5th) + 1 LEAVE (9th)
  const dayPlans: { day: string; exceptions: Map<number, 'ABSENT' | 'LATE' | 'LEAVE'> }[] = [
    { day: older, exceptions: new Map([[2, 'ABSENT'], [6, 'LATE']]) },
    { day: mostRecent, exceptions: new Map([[4, 'ABSENT'], [8, 'LEAVE']]) },
  ]

  const baselineByDay = new Map<string, Map<string, string>>() // day → studentId → status

  for (const plan of dayPlans) {
    const from = dayToDate(plan.day)
    const to = dayToDate(addDays(plan.day, 1))
    const existing = await db.attendance.count({
      where: { classId: c9.id, date: { gte: from, lt: to } },
    })
    if (existing > 0) {
      console.log(`${plan.day}: baseline already present (${existing} rows) — skipped`)
      const rows = await db.attendance.findMany({
        where: { classId: c9.id, date: { gte: from, lt: to } },
        select: { studentId: true, status: true },
      })
      baselineByDay.set(plan.day, new Map(rows.map((r) => [r.studentId, r.status])))
      continue
    }
    const statuses = new Map<string, string>()
    for (const [i, s] of students.entries()) {
      const status = plan.exceptions.get(i) ?? 'PRESENT'
      await db.attendance.create({
        data: {
          schoolId: school.id,
          studentId: s.id,
          classId: c9.id,
          date: from,
          status,
          markedBy: rohanUser.id, // house convention: Attendance.markedBy = userId
        },
      })
      statuses.set(s.id, status)
    }
    baselineByDay.set(plan.day, statuses)
    const counts = [...statuses.values()].reduce<Record<string, number>>((acc, st) => {
      acc[st] = (acc[st] ?? 0) + 1
      return acc
    }, {})
    console.log(`${plan.day}: baseline created — ${JSON.stringify(counts)} (marked by Rohan, CT)`)
  }

  // ── 2. ONE past subject session — Rohan · Mathematics · the most recent day ──
  // Matches the baseline except ONE student who was PRESENT in the baseline
  // but LATE in the math period (the "adjust exceptions" story).
  const sessionDate = dayToDate(mostRecent)
  const sessionExisting = await db.subjectSessionAttendance.count({
    where: { classId: c9.id, subjectId: math.id, date: sessionDate },
  })
  if (sessionExisting > 0) {
    console.log(`${mostRecent} · ${math.name}: subject session already present (${sessionExisting} rows) — skipped`)
  } else {
    const baseline = baselineByDay.get(mostRecent)!
    // exception: the 2nd student (PRESENT in baseline) was LATE to the math period
    const exceptionStudent = students[1]
    let changed = 0
    for (const s of students) {
      const base = baseline.get(s.id) ?? 'PRESENT'
      const status = s.id === exceptionStudent?.id && base === 'PRESENT' ? 'LATE' : base
      if (status !== base) changed++
      await db.subjectSessionAttendance.create({
        data: {
          schoolId: school.id,
          studentId: s.id,
          classId: c9.id,
          subjectId: math.id,
          teacherId: rohan.id, // house convention: session teacherId = Teacher-table id
          date: sessionDate,
          status,
        },
      })
    }
    console.log(`${mostRecent} · ${math.name}: subject session created — ${students.length} rows, ${changed} exception vs baseline (${exceptionStudent?.user?.name ?? '—'} LATE)`)
  }

  console.log('seed complete — today is untouched so the live CT→ST flow stays demonstrable.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
