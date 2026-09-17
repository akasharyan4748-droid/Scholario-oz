/**
 * seed-attendance-workflow — server-backed Class Attendance workflow demo data.
 *
 * FINAL WORKFLOW CORRECTION state:
 *  • ACCOUNT A — Vikram Sharma (vikram.sharma@greenwood.edu.in / teacher123)
 *      Teacher + CLASS TEACHER of Grade 9 - A (the spec's "Class 2-A" — the
 *      roster is exactly the spec's: Aarav, Diya, Vivaan, Ananya, …).
 *  • ACCOUNT B — Rohan Mehta (rohan.mehta@greenwood.edu.in / teacher123)
 *      Teacher + SUBJECT TEACHER (Mathematics) of Grade 9 - A. He is NOT the
 *      class teacher — he receives the class teacher's submitted attendance
 *      as the default starting state and files his own independent record.
 *
 * Principles (same as seed-teacher-hub.ts):
 *  • runtime-resolved ids only — school by slug, teachers by email, students
 *    by class roster; NO hardcoded cuids;
 *  • idempotent — resets this school's workflow rows, then re-creates;
 *  • relative dates (daysAgo) so the demo never goes stale;
 *  • honest data — every subject assignment and submission is a real row the
 *    attendance APIs actually authorize against and read.
 *
 * What this seeds:
 *  1. The Vikram Sharma teacher account (User + Teacher row, hashed password).
 *  2. Class.classTeacherId anchors: Grade 9 - A → Vikram · Grade 10 - A → Arjun.
 *  3. ClassSubjectAssignment rows with teacherId anchors (the subject-teacher
 *     attendance authorization surface):
 *       Grade 9 - A  → Mathematics: Rohan · Physics/Chemistry: Kavita ·
 *                      English/Biology/Social Science/Hindi: Priya
 *       Grade 10 - A → Chemistry/Biology: Arjun (also its class teacher)
 *     Mr. Arjun Nair deliberately has NO Grade 9 - A assignment — he is the
 *     negative authorization test (teacher2@demoschool.edu).
 *  4. YESTERDAY's submitted class-teacher attendance for both classes (plus
 *     one submitted subject-teacher record pre-filled from the class teacher)
 *     so history exists — TODAY is left clean for the live workflow demo.
 *  5. The class-teacher submissions are synced into the legacy Attendance
 *     table (the official daily record student/principal dashboards read).
 *
 * Run: bun run db:seed-attendance
 */

import { db } from '../src/lib/db'
import { hashPassword } from '../src/lib/auth'

/** attendance day at UTC midnight, n days ago */
const attendanceDay = (n: number): Date => {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

const submittedAt = (n: number, h = 9, m = 20): Date => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(h, m, 0, 0)
  return d
}

async function main() {
  const school = await db.school.findFirst({ where: { slug: 'demo-school' } })
  if (!school) throw new Error('demo-school not found')

  const byEmail = async (email: string) => {
    const u = await db.user.findFirst({ where: { email, schoolId: school.id } })
    if (!u) throw new Error(`user ${email} not found`)
    return u
  }
  const rohan = await byEmail('rohan.mehta@greenwood.edu.in') // subject teacher (Mathematics) 9-A
  const kavita = await byEmail('teacher1@demoschool.edu') // subject teacher 9-A
  const priya = await byEmail('teacher3@demoschool.edu') // subject teacher 9-A
  const arjun = await byEmail('teacher2@demoschool.edu') // class teacher 10-A, NO 9-A scope

  // ── 0. Vikram Sharma — Teacher + Class Teacher of Grade 9 - A ──
  let vikram = await db.user.findFirst({ where: { email: 'vikram.sharma@greenwood.edu.in' } })
  if (!vikram) {
    vikram = await db.user.create({
      data: {
        schoolId: school.id,
        email: 'vikram.sharma@greenwood.edu.in',
        name: 'Vikram Sharma',
        role: 'TEACHER',
        status: 'ACTIVE',
        phone: '+91 98100 10004',
        passwordHash: hashPassword('teacher123'),
      },
    })
    console.log('   Created teacher account: Vikram Sharma (vikram.sharma@greenwood.edu.in / teacher123)')
  } else {
    // keep the demo credentials deterministic on re-runs
    await db.user.update({
      where: { id: vikram.id },
      data: { name: 'Vikram Sharma', role: 'TEACHER', status: 'ACTIVE', passwordHash: hashPassword('teacher123') },
    })
  }
  const vikramTeacher = await db.teacher.upsert({
    where: { userId: vikram.id },
    update: { schoolId: school.id, employeeId: 'EMP-021', department: 'Mathematics', subjects: 'Mathematics' },
    create: { schoolId: school.id, userId: vikram.id, employeeId: 'EMP-021', department: 'Mathematics', subjects: 'Mathematics' },
  })
  void vikramTeacher

  const grade9 = await db.class.findFirst({ where: { schoolId: school.id, name: 'Grade 9 - A' } })
  const grade10 = await db.class.findFirst({ where: { schoolId: school.id, name: 'Grade 10 - A' } })
  if (!grade9 || !grade10) throw new Error('demo classes not found')

  // ── 1. Class-teacher anchors (assignment-based identity, not user types) ──
  await db.class.update({ where: { id: grade9.id }, data: { classTeacherId: vikram.id } })
  await db.class.update({ where: { id: grade10.id }, data: { classTeacherId: arjun.id } })

  const subjects = await db.subject.findMany({ where: { schoolId: school.id } })
  const subjectId = (classId: string, name: string) => {
    const s = subjects.find((x) => x.name === name && x.classId === classId)
    if (!s) throw new Error(`subject ${name} for class not found`)
    return s.id
  }

  // ── 2. Subject assignments (teacherId = attendance authorization anchor) ──
  await db.classSubjectAssignment.deleteMany({ where: { schoolId: school.id } })
  const assignmentRows: {
    classId: string
    subjectId: string
    teacherId: string
    displayOrder: number
  }[] = [
    // Grade 9 - A
    { classId: grade9.id, subjectId: subjectId(grade9.id, 'Mathematics'), teacherId: rohan.id, displayOrder: 1 },
    { classId: grade9.id, subjectId: subjectId(grade9.id, 'Physics'), teacherId: kavita.id, displayOrder: 2 },
    { classId: grade9.id, subjectId: subjectId(grade9.id, 'English'), teacherId: priya.id, displayOrder: 3 },
    { classId: grade9.id, subjectId: subjectId(grade9.id, 'Chemistry'), teacherId: kavita.id, displayOrder: 4 },
    { classId: grade9.id, subjectId: subjectId(grade9.id, 'Biology'), teacherId: priya.id, displayOrder: 5 },
    { classId: grade9.id, subjectId: subjectId(grade9.id, 'Social Science'), teacherId: priya.id, displayOrder: 6 },
    { classId: grade9.id, subjectId: subjectId(grade9.id, 'Hindi'), teacherId: priya.id, displayOrder: 7 },
    // Grade 10 - A (Arjun is class teacher AND subject teacher)
    { classId: grade10.id, subjectId: subjectId(grade10.id, 'Chemistry'), teacherId: arjun.id, displayOrder: 1 },
    { classId: grade10.id, subjectId: subjectId(grade10.id, 'Biology'), teacherId: arjun.id, displayOrder: 2 },
  ]
  for (const r of assignmentRows) {
    await db.classSubjectAssignment.upsert({
      where: { classId_subjectId: { classId: r.classId, subjectId: r.subjectId } },
      update: { teacherId: r.teacherId, isActive: true },
      create: { schoolId: school.id, ...r },
    })
  }

  // ── 3. Reset the workflow: submissions + today's synced legacy rows ──
  await db.attendanceSubmission.deleteMany({ where: { schoolId: school.id } })
  await db.attendance.deleteMany({ where: { schoolId: school.id, date: { gte: attendanceDay(0) } } })

  const rosterOf = async (classId: string) =>
    db.student.findMany({
      where: { classId },
      orderBy: { rollNo: 'asc' },
      select: { id: true },
    })

  const grade9Roster = await rosterOf(grade9.id)
  const grade10Roster = await rosterOf(grade10.id)

  /** deterministic, varied statuses — index-based, never random */
  const patternFor = (i: number): string =>
    i % 11 === 3 ? 'ABSENT' : i % 11 === 7 ? 'LATE' : 'PRESENT'

  const mkEntries = (roster: { id: string }[], statuses?: (i: number) => string) =>
    roster.map((s, i) => ({ studentId: s.id, status: (statuses ?? patternFor)(i) }))

  const yesterday = 1
  const day = attendanceDay(yesterday)

  // Grade 9 - A — class teacher (Vikram) SUBMITTED
  const g9ClassTeacher = await db.attendanceSubmission.create({
    data: {
      schoolId: school.id,
      classId: grade9.id,
      teacherId: vikram.id,
      date: day,
      status: 'SUBMITTED',
      role: 'CLASS_TEACHER',
      submittedAt: submittedAt(yesterday, 9, 14),
      entries: { create: mkEntries(grade9Roster) },
    },
  })

  // Grade 9 - A — subject teacher (Kavita, Physics) SUBMITTED, default values
  // from the class teacher's record (sourceSubmissionId lineage)
  await db.attendanceSubmission.create({
    data: {
      schoolId: school.id,
      classId: grade9.id,
      teacherId: kavita.id,
      date: day,
      status: 'SUBMITTED',
      role: 'SUBJECT_TEACHER',
      subjectId: subjectId(grade9.id, 'Physics'),
      sourceSubmissionId: g9ClassTeacher.id,
      submittedAt: submittedAt(yesterday, 10, 42),
      // same pattern except she marked the 4th student present after review
      entries: {
        create: mkEntries(grade9Roster, (i) => (i === 3 ? 'PRESENT' : patternFor(i))),
      },
    },
  })

  // Grade 10 - A — class teacher (Arjun) SUBMITTED
  const g10ClassTeacher = await db.attendanceSubmission.create({
    data: {
      schoolId: school.id,
      classId: grade10.id,
      teacherId: arjun.id,
      date: day,
      status: 'SUBMITTED',
      role: 'CLASS_TEACHER',
      submittedAt: submittedAt(yesterday, 9, 5),
      entries: { create: mkEntries(grade10Roster) },
    },
  })

  // ── 4. Sync class-teacher submissions into legacy Attendance ──
  const syncLegacy = async (classId: string, submissionId: string) => {
    const sub = await db.attendanceSubmission.findUnique({
      where: { id: submissionId },
      include: { entries: true },
    })
    if (!sub) return
    for (const e of sub.entries) {
      await db.attendance.upsert({
        where: { studentId_date: { studentId: e.studentId, date: sub.date } },
        update: { status: e.status, markedBy: sub.teacherId, classId },
        create: {
          schoolId: school.id,
          studentId: e.studentId,
          classId,
          date: sub.date,
          status: e.status,
          markedBy: sub.teacherId,
        },
      })
    }
  }
  await syncLegacy(grade9.id, g9ClassTeacher.id)
  await syncLegacy(grade10.id, g10ClassTeacher.id)

  console.log('   Teacher accounts: Vikram Sharma (CT Grade 9 - A) · Rohan Mehta (ST Mathematics, Grade 9 - A)')
  console.log('   Subject assignments:', assignmentRows.length)
  console.log('   Submissions: 3 (Vikram CT 9-A · Kavita ST 9-A · Arjun CT 10-A) — yesterday, submitted')
  console.log('   Today left clean for the live workflow demo')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
