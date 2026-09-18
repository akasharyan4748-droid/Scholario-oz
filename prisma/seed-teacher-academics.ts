/**
 * seed-teacher-academics — demo data for the reworked Teacher academics
 * modules (Lesson Planner / Class Attendance / Marks Entry).
 *
 * Principles (same as seed-teacher-hub.ts):
 *  • runtime-resolved ids only — school by slug, classes by name, teachers
 *    and students by real rows; NO hardcoded cuids;
 *  • idempotent — deletes this seed's own rows, then re-creates;
 *  • relative dates so the demo never goes stale (completions derived by
 *    running the SAME scheduler the API uses);
 *  • honest data — every number the modules render comes from these rows.
 *
 * Seeds:
 *  1. ClassSubjectAssignment (ACTIVE) for Grade 9-A + 10-A — the
 *     permission source for teaching modules.
 *  2. Grade 10-A timetable (Mon–Sat × 6 periods) so the school's second
 *     class has real teaching assignments (Rohan also teaches 10-A Math →
 *     two separate curriculum instances).
 *  3. School calendar HOLIDAY events (real Indian school calendar).
 *  4. CurriculumTopic instances for both classes — REAL CBSE/NCERT
 *     structure (prisma/curriculum-data.ts), never AI-generated.
 *  5. LessonTopicCompletion history: every topic whose derived window
 *     ended before today is marked completed ON its scheduled end date
 *     (except 10-A Social Science's last two overdue topics, which stay
 *     uncompleted to demonstrate the Needs Rescheduling state honestly).
 *  6. "Periodic Assessment 1" exam (just completed, results in progress)
 *     with ExamClass + ExamSubjectConfig for both classes — the Marks
 *     Entry surface — plus a few real ExamMark rows.
 *  7. Baseline Attendance for Grade 9-A yesterday (class-teacher daily
 *     record the subject teachers will prefill from).
 *
 * Run: bun run db:seed-teacher-academics
 */

import { db } from '../src/lib/db'
import { CURRICULUM_SEED, HOLIDAY_SEED } from './curriculum-data'
import {
  computeSchedule,
  sessionStartFor,
  dayKey,
  parseDayKey,
  addDays,
  WEEKDAY_INDEX,
} from '../src/lib/lesson-schedule'

const SCHOOL_SLUG = 'demo-school'

// Grade 10-A timetable plan: Mon–Sat × 6 periods.
const PERIOD_TIMES: { period: number; start: string; end: string }[] = [
  { period: 1, start: '08:30', end: '09:15' },
  { period: 2, start: '09:15', end: '10:00' },
  { period: 3, start: '10:00', end: '10:45' },
  { period: 4, start: '11:00', end: '11:45' },
  { period: 5, start: '11:45', end: '12:30' },
  { period: 6, start: '13:15', end: '14:00' },
]

async function main() {
  const school = await db.school.findUnique({ where: { slug: SCHOOL_SLUG } })
  if (!school) throw new Error('Demo school not found — run the base seed first.')

  const classes = await db.class.findMany({ where: { schoolId: school.id } })
  const grade9 = classes.find((c) => c.name.startsWith('Grade 9'))
  const grade10 = classes.find((c) => c.name.startsWith('Grade 10'))
  if (!grade9 || !grade10) throw new Error('Grade 9 / Grade 10 classes not found.')
  const grade9Class = grade9
  const grade10Class = grade10

  // ── Canonical subject set: the subjects on Grade 9-A's timetable ──────
  const tt9 = (await db.timetable.findMany({
    where: { schoolId: school.id, classId: grade9.id, subjectId: { not: null } },
    select: { subjectId: true, subject: { select: { name: true } } },
  })) as { subjectId: string; subject: { name: string } }[]
  const subjectById = new Map<string, string>()
  tt9.forEach((r) => subjectById.set(r.subjectId, r.subject.name))
  const subjectIds = [...subjectById.keys()]
  if (subjectIds.length === 0) throw new Error('Grade 9-A timetable is empty — run seed-student-dashboard first.')

  const teachers = await db.teacher.findMany({
    where: { schoolId: school.id },
    include: { user: { select: { name: true, email: true } } },
  })
  const teacherByEmail = (email: string) => teachers.find((t) => t.user.email === email)
  const rohan = teacherByEmail('rohan.mehta@greenwood.edu.in')
  const kavita = teacherByEmail('teacher1@demoschool.edu')
  const priya = teacherByEmail('teacher3@demoschool.edu')
  const arjun = teacherByEmail('teacher2@demoschool.edu')
  if (!rohan || !kavita || !priya || !arjun) throw new Error('Teacher rows missing (rohan/kavita/priya/arjun).')

  const subjectName = (id: string) => subjectById.get(id) ?? ''
  const teacherForSubject = (id: string) => {
    const n = subjectName(id)
    if (n === 'Mathematics') return rohan
    if (n === 'Physics' || n === 'Chemistry') return kavita
    if (n === 'English' || n === 'Biology') return priya
    return arjun
  }
  const teacherNameForSubject = (id: string) => teacherForSubject(id).user.name ?? 'Faculty'

  console.log(`  School: ${school.name}`)
  console.log(`  Subjects on 9-A timetable: ${subjectIds.map(subjectName).join(', ')}`)

  // ── 0. School session anchor ─────────────────────────────────────────
  await db.school.update({
    where: { id: school.id },
    data: { academicYear: '2026-2027' },
  })

  // ── 1. ClassSubjectAssignment (the permission layer) ─────────────────
  await db.classSubjectAssignment.deleteMany({
    where: { schoolId: school.id, classId: { in: [grade9.id, grade10.id] } },
  })
  let csaOrder = 0
  for (const classId of [grade9.id, grade10.id]) {
    for (const subjectId of subjectIds) {
      csaOrder += 1
      await db.classSubjectAssignment.create({
        data: {
          schoolId: school.id,
          classId,
          subjectId,
          isCore: true,
          isActive: true,
          examinable: true,
          displayOrder: csaOrder,
        },
      })
    }
  }
  console.log(`  CSA: seeded ${csaOrder} active class-subject assignments (2 classes × ${subjectIds.length} subjects)`)

  // ── 2. Grade 10-A timetable (Mon–Sat × 6 periods) ────────────────────
  await db.timetable.deleteMany({ where: { schoolId: school.id, classId: grade10.id } })

  // Conflict-free plan. BUSINESS RULE (Teacher Workspace spec): one teacher
  // + one day + one period = at most one teaching assignment. The naive
  // "P1 Math + P2 English every day" rotation double-booked every shared
  // teacher against their Grade 9-A duties (e.g. Rohan had Grade 9-A Math
  // AND Grade 10-A Math at Mon P1). This plan places every 10-A slot at a
  // (day, period) where the subject's teacher is FREE from 9-A duties,
  // while keeping the exact same subject quotas the pacing engine uses
  // (Math 6 · English 6 · Physics 5 · Chemistry 5 · Biology 5 ·
  // Social Science 5 · Hindi 4 = 36 cells).
  const PLAN_10A: { day: string; period: number; subject: string }[] = [
    // Monday — 9-A busy: P1 Rohan, P2 Kavita, P3 Priya, P4 Rohan, P5 Kavita, P6 Arjun, P7 Arjun
    { day: 'Monday', period: 1, subject: 'Physics' },        // Kavita free at Mon P1
    { day: 'Monday', period: 3, subject: 'Social Science' },  // Arjun free at Mon P3
    { day: 'Monday', period: 4, subject: 'English' },         // Priya free at Mon P4
    { day: 'Monday', period: 5, subject: 'Hindi' },           // Arjun free at Mon P5
    { day: 'Monday', period: 6, subject: 'Chemistry' },       // Kavita free at Mon P6
    // Tuesday — 9-A busy: P1 Rohan, P2 Priya, P3 Kavita, P4 Kavita, P5 Priya, P6 Arjun, P7 Arjun
    { day: 'Tuesday', period: 1, subject: 'English' },
    { day: 'Tuesday', period: 3, subject: 'Hindi' },
    { day: 'Tuesday', period: 4, subject: 'Biology' },
    { day: 'Tuesday', period: 5, subject: 'Physics' },
    { day: 'Tuesday', period: 6, subject: 'Chemistry' },
    // Wednesday — 9-A busy: P1 Rohan, P2 Priya, P3 Priya, P4 Arjun, P5 Kavita, P6 Kavita, P7 Arjun
    { day: 'Wednesday', period: 1, subject: 'Chemistry' },
    { day: 'Wednesday', period: 3, subject: 'Social Science' },
    { day: 'Wednesday', period: 4, subject: 'Biology' },
    { day: 'Wednesday', period: 5, subject: 'English' },
    { day: 'Wednesday', period: 6, subject: 'Hindi' },
    // Thursday — 9-A busy: P1 Rohan, P2 Kavita, P3 Arjun, P4 Priya, P5 Rohan, P6 Kavita, P7 Priya
    { day: 'Thursday', period: 1, subject: 'English' },
    { day: 'Thursday', period: 3, subject: 'Biology' },
    { day: 'Thursday', period: 4, subject: 'Physics' },
    { day: 'Thursday', period: 5, subject: 'Hindi' },
    { day: 'Thursday', period: 6, subject: 'Social Science' },
    // Friday — 9-A busy: P1 Rohan, P2 Priya, P3 Arjun, P4 Priya, P5 Kavita, P6 Arjun, P7 Kavita
    { day: 'Friday', period: 1, subject: 'Biology' },
    { day: 'Friday', period: 3, subject: 'Chemistry' },
    { day: 'Friday', period: 4, subject: 'Physics' },
    { day: 'Friday', period: 5, subject: 'Social Science' },
    { day: 'Friday', period: 6, subject: 'English' },
    // Saturday — 9-A busy: P1 Rohan, P2 Kavita, P3 Arjun, P4 Arjun, P5 Priya, P6 Priya, P7 Kavita
    { day: 'Saturday', period: 1, subject: 'English' },
    { day: 'Saturday', period: 3, subject: 'Physics' },
    { day: 'Saturday', period: 4, subject: 'Biology' },
    { day: 'Saturday', period: 5, subject: 'Chemistry' },
    { day: 'Saturday', period: 6, subject: 'Social Science' },
  ]
  const cells: { day: string; period: number; subjectId: string; teacherName: string; room: string }[] = []
  const idByName = new Map(subjectIds.map((id) => [subjectName(id), id] as const))
  for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) {
    // Mathematics anchors P2 every day — every shared teacher is free at
    // their own class's P2 (9-A P2 rotates away from Rohan every day).
    cells.push({
      day,
      period: 2,
      subjectId: idByName.get('Mathematics')!,
      teacherName: teacherNameForSubject(idByName.get('Mathematics')!),
      room: 'Room 202',
    })
    for (const slot of PLAN_10A.filter((s) => s.day === day)) {
      const subjectId = idByName.get(slot.subject)
      if (!subjectId) continue
      cells.push({
        day: slot.day,
        period: slot.period,
        subjectId,
        teacherName: teacherNameForSubject(subjectId),
        room: `Room ${200 + slot.period}`,
      })
    }
  }
  await db.timetable.createMany({
    data: cells.map((c) => ({
      schoolId: school.id,
      classId: grade10.id,
      subjectId: c.subjectId,
      day: c.day,
      period: c.period,
      startTime: PERIOD_TIMES.find((p) => p.period === c.period)!.start,
      endTime: PERIOD_TIMES.find((p) => p.period === c.period)!.end,
      teacherName: c.teacherName,
      room: c.room,
    })),
  })
  const countBySubject = new Map<string, number>()
  cells.forEach((c) => countBySubject.set(subjectName(c.subjectId), (countBySubject.get(subjectName(c.subjectId)) ?? 0) + 1))
  console.log(`  10-A timetable: ${cells.length} cells — ${[...countBySubject.entries()].map(([k, v]) => `${k}:${v}`).join(', ')}`)

  // ── 3. School calendar holidays ──────────────────────────────────────
  await db.schoolEvent.deleteMany({ where: { schoolId: school.id, type: 'HOLIDAY' } })
  await db.schoolEvent.createMany({
    data: HOLIDAY_SEED.map((h) => ({
      schoolId: school.id,
      title: h.title,
      type: 'HOLIDAY',
      startDate: parseDayKey(h.start),
      endDate: parseDayKey(h.end),
      audience: 'ALL',
    })),
  })
  console.log(`  Holidays: ${HOLIDAY_SEED.length} seeded (incl. summer + Diwali breaks)`)

  // ── 4. Curriculum instances (real CBSE structure) ────────────────────
  await db.curriculumTopic.deleteMany({ where: { schoolId: school.id } })
  await db.lessonTopicCompletion.deleteMany({ where: { schoolId: school.id } })

  const today = new Date()
  const sessionStart = sessionStartFor('2026-2027', today)
  const holidays = HOLIDAY_SEED.map((h) => ({ title: h.title, start: h.start, end: h.end }))

  let topicCount = 0
  const planByClassSubject = new Map<
    string,
    { classId: string; subjectId: string; teacherId: string; topics: { id: string; endDate: string; periodsNeeded: number; topicName: string }[] }
  >()

  for (const seedSubject of CURRICULUM_SEED) {
    const classRow = seedSubject.grade === 9 ? grade9 : grade10
    const subjectId = idByName.get(seedSubject.subjectName)
    if (!subjectId) {
      console.log(`  SKIP ${seedSubject.subjectName} grade ${seedSubject.grade} — subject not on timetable`)
      continue
    }
    let topicNo = 0
    const created: { id: string; endDate: string; periodsNeeded: number; topicName: string }[] = []
    for (const t of seedSubject.topics) {
      topicNo += 1
      const row = await db.curriculumTopic.create({
        data: {
          schoolId: school.id,
          classId: classRow.id,
          subjectId,
          sourceBoard: 'CBSE-2026',
          unitNo: t.unitNo,
          unitName: t.unitName,
          topicNo,
          topicName: t.topicName,
          description: t.description,
          periodsNeeded: t.periodsNeeded,
          orderIndex: topicNo,
        },
      })
      created.push({ id: row.id, endDate: '', periodsNeeded: t.periodsNeeded, topicName: t.topicName })
      topicCount += 1
    }
    planByClassSubject.set(`${classRow.id}|${subjectId}`, {
      classId: classRow.id,
      subjectId,
      teacherId: teacherForSubject(subjectId).id,
      topics: created,
    })
  }
  console.log(`  Curriculum: ${topicCount} topics seeded across ${planByClassSubject.size} class-subject instances`)

  // ── 5. Completion history via the SAME scheduler the API runs ────────
  const todayKey = dayKey(today)
  let completionCount = 0
  for (const plan of planByClassSubject.values()) {
    const pace = {
      periodsPerWeek: countBySubjectFor(plan.classId, plan.subjectId),
      teachingDaysPerWeek: 6,
      teachingWeekdays: [1, 2, 3, 4, 5, 6],
    }
    const scheduled = computeSchedule({
      topics: plan.topics.map((t, i) => ({
        id: t.id,
        unitNo: 1,
        unitName: '',
        topicNo: i + 1,
        topicName: t.topicName,
        description: null,
        periodsNeeded: t.periodsNeeded,
        orderIndex: i + 1,
      })),
      completions: new Map(),
      sessionStart,
      today,
      pace,
      holidays,
    })

    const overdue = scheduled.filter((s) => s.endDate < todayKey)
    // 10-A Social Science keeps its last two overdue topics uncompleted —
    // the honest "Needs Rescheduling" demo state.
    const isSst10 = plan.classId === grade10.id && subjectName(plan.subjectId) === 'Social Science'
    const skipLast = isSst10 ? 2 : 0
    const toComplete = overdue.slice(0, Math.max(0, overdue.length - skipLast))

    for (const s of toComplete) {
      await db.lessonTopicCompletion.create({
        data: {
          schoolId: school.id,
          curriculumTopicId: s.id,
          classId: plan.classId,
          subjectId: plan.subjectId,
          teacherId: plan.teacherId,
          completedOn: parseDayKey(s.endDate),
        },
      })
      completionCount += 1
    }
    const todayTopic = scheduled.find((s) => s.status === 'today' || s.status === 'in-progress')
    console.log(
      `    ${labelFor(plan.classId)} ${subjectName(plan.subjectId)}: ${toComplete.length}/${scheduled.length} completed, today → ${todayTopic ? todayTopic.topicName : '—'}`
    )
  }
  console.log(`  Completions: ${completionCount} seeded (history preserved)`)

  // ── 6. Periodic Assessment 1 (Marks Entry surface) ───────────────────
  const existingPa = await db.exam.findFirst({
    where: { schoolId: school.id, name: 'Periodic Assessment 1' },
  })
  if (existingPa) {
    await db.exam.delete({ where: { id: existingPa.id } }).catch(async () => {
      // cascade-safe delete if relations block
      await db.examMark.deleteMany({ where: { examId: existingPa.id } })
      await db.examSubjectConfig.deleteMany({ where: { examId: existingPa.id } })
      await db.examClass.deleteMany({ where: { examId: existingPa.id } })
      await db.exam.delete({ where: { id: existingPa.id } })
    })
  }
  const pa1 = await db.exam.create({
    data: {
      schoolId: school.id,
      name: 'Periodic Assessment 1',
      term: 'Term 1',
      type: 'Class Test',
      session: '2026-2027',
      startDate: addDays(today, -7),
      endDate: addDays(today, -5),
      status: 'COMPLETED',
      resultStatus: 'In Progress',
      passPercentage: 33,
    },
  })
  for (const classId of [grade9.id, grade10.id]) {
    await db.examClass.create({ data: { examId: pa1.id, classId } })
    for (const subjectId of subjectIds) {
      await db.examSubjectConfig.create({
        data: { examId: pa1.id, classId, subjectId, maxMarks: 50, passMarks: 17, theoryMarks: 50, practicalMarks: 0 },
      })
    }
  }
  console.log(`  Exam: Periodic Assessment 1 seeded (${subjectIds.length * 2} subject configs, max 50)`)

  // A few real marks for Grade 9-A Mathematics so the grid opens with data.
  const mathId = idByName.get('Mathematics')!
  const students9 = await db.student.findMany({
    where: { classId: grade9.id },
    orderBy: { rollNo: 'asc' },
  })
  const preset: Record<string, number> = {}
  students9.slice(0, 3).forEach((s, i) => {
    preset[s.id] = [42, 38, 45][i] ?? 40
  })
  for (const [studentId, marks] of Object.entries(preset)) {
    await db.examMark.create({
      data: {
        examId: pa1.id,
        classId: grade9.id,
        subjectId: mathId,
        studentId,
        marksObtained: marks,
        status: 'PRESENT',
        workflowStatus: 'DRAFT',
        enteredBy: rohan.user.name ?? 'Teacher',
        enteredAt: addDays(today, -1),
      },
    })
  }
  console.log(`  ExamMarks: 3 draft rows seeded for 9-A Mathematics`)

  // ── 7. Baseline attendance for Grade 9-A yesterday ───────────────────
  const yesterday = addDays(today, -1)
  if (yesterday.getUTCDay() !== 0) {
    await db.attendance.deleteMany({
      where: { classId: grade9.id, date: { gte: yesterday, lt: new Date(yesterday.getTime() + 86_400_000) } },
    })
    const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'PRESENT', 'PRESENT', 'LATE', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT']
    for (let i = 0; i < students9.length; i += 1) {
      await db.attendance.create({
        data: {
          schoolId: school.id,
          studentId: students9[i].id,
          classId: grade9.id,
          date: yesterday,
          status: statuses[i % statuses.length],
          markedBy: rohan.user.name ?? 'Class Teacher',
        },
      })
    }
    console.log(`  Baseline attendance: ${students9.length} rows for 9-A on ${dayKey(yesterday)} (marked by ${rohan.user.name})`)
  }

  console.log('Done.')

  // helpers used above (closures need the timetable counts per class)
  function countBySubjectFor(classId: string, subjectId: string): number {
    if (classId === grade10Class.id) {
      return cells.filter((c) => c.subjectId === subjectId).length
    }
    return tt9.filter((r) => r.subjectId === subjectId).length
  }
  function labelFor(classId: string): string {
    return classId === grade9Class.id ? 'Grade 9-A' : 'Grade 10-A'
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
