import { db } from '../src/lib/db'

async function main() {
  const users = await db.user.findMany({ where: { role: 'PRINCIPAL' }, select: { id: true, name: true, email: true, role: true, schoolId: true } })
  console.log('PRINCIPALS:', JSON.stringify(users, null, 2))

  const classes = await db.class.findMany({ select: { id: true, name: true, gradeLevel: true, section: true, schoolId: true } })
  console.log('CLASSES:', JSON.stringify(classes, null, 2))

  const subjects = await db.subject.findMany({ select: { id: true, name: true, code: true, classId: true, fullMarks: true, passMarks: true } })
  console.log('SUBJECTS:', JSON.stringify(subjects, null, 2))

  const students = await db.student.findMany({ select: { id: true, rollNo: true, admissionNo: true, classId: true, userId: true, user: { select: { name: true, email: true } } }, take: 30 })
  console.log('STUDENTS:', JSON.stringify(students, null, 2))

  const exams = await db.exam.findMany()
  console.log('EXAMS:', JSON.stringify(exams, null, 2))

  const teachers = await db.teacher.findMany({ include: { user: { select: { name: true, email: true } } } })
  console.log('TEACHERS:', JSON.stringify(teachers, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(async () => await db.$disconnect())
