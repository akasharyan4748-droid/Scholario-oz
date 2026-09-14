import { db } from '../src/lib/db'
async function main() {
  console.log('TIMETABLE COUNT:', await db.timetable.count())
  console.log('EXAMS:', JSON.stringify(await db.exam.findMany({ select: { name: true, status: true, resultStatus: true, startDate: true } })))
}
main().catch(console.error).finally(() => db.$disconnect())
