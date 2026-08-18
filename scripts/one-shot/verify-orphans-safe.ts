import { db } from '../../src/lib/db'
async function main() {
  const orphans = await db.subject.findMany({
    where: { classId: null },
    select: { id: true, name: true, code: true },
  })
  console.log(`Orphaned subjects (classId=NULL): ${orphans.length}`)
  for (const s of orphans) {
    const refs = {
      results: await db.result.count({ where: { subjectId: s.id } }),
      examSubjects: await db.examSubjectConfig.count({ where: { subjectId: s.id } }),
      examMarks: await db.examMark.count({ where: { subjectId: s.id } }),
      examSchedule: await db.examScheduleItem.count({ where: { subjectId: s.id } }),
      examAttendance: await db.examAttendance.count({ where: { subjectId: s.id } }),
      timetables: await db.timetable.count({ where: { subjectId: s.id } }),
      assignments: await db.assignment.count({ where: { subjectId: s.id } }),
      questionBanks: await db.questionBank.count({ where: { subjectId: s.id } }),
      homeworks: await db.homework.count({ where: { subjectId: s.id } }),
    }
    const total = Object.values(refs).reduce((a, b) => a + b, 0)
    console.log(`  ${s.name.padEnd(22)} (${s.code})  total FK refs: ${total}`)
    if (total > 0) console.log(`    ${JSON.stringify(refs)}`)
  }
  await db.$disconnect()
}
main().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1) })
