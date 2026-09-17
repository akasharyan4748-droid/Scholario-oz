import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const exams = await db.exam.findMany({ select: { name: true, type: true, term: true, status: true, startDate: true, endDate: true } })
  console.log('EXAMS:', JSON.stringify(exams))
  const sched = await db.examScheduleItem.count()
  const seats = await db.examSeatAssignment.count()
  const att = await db.examAttendance.count()
  console.log('ScheduleItems:', sched, '| SeatAssignments:', seats, '| ExamAttendance:', att)
  const classes = await db.class.findMany({ select: { name: true, section: true } })
  console.log('CLASSES:', classes.map(c => `${c.name}-${c.section}`).join(', '))
}
main().then(() => db.$disconnect())
