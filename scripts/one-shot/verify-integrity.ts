import { db } from '../../src/lib/db'
async function main() {
  // Check 1: All Result.subjectId values point to existing Subject rows
  const results = await db.result.findMany({ select: { id: true, subjectId: true } })
  const subjectIds = new Set((await db.subject.findMany({ select: { id: true } })).map(s => s.id))
  const orphanResults = results.filter(r => !subjectIds.has(r.subjectId))
  console.log(`Result rows: ${results.length}`)
  console.log(`Orphaned Results (subjectId no longer exists): ${orphanResults.length}`)
  if (orphanResults.length > 0) {
    console.log('  Sample orphan:', orphanResults[0])
  }

  // Check 2: All ExamSubjectConfig.subjectId valid
  const esc = await db.examSubjectConfig.findMany({ select: { id: true, subjectId: true } })
  const orphanEsc = esc.filter(e => !subjectIds.has(e.subjectId))
  console.log(`\nExamSubjectConfig rows: ${esc.length}, orphaned: ${orphanEsc.length}`)

  // Check 3: All ExamMark.subjectId valid
  const em = await db.examMark.findMany({ select: { id: true, subjectId: true } })
  const orphanEm = em.filter(e => !subjectIds.has(e.subjectId))
  console.log(`ExamMark rows: ${em.length}, orphaned: ${orphanEm.length}`)

  // Check 4: All ExamScheduleItem.subjectId valid
  const esi = await db.examScheduleItem.findMany({ select: { id: true, subjectId: true } })
  const orphanEsi = esi.filter(e => !subjectIds.has(e.subjectId))
  console.log(`ExamScheduleItem rows: ${esi.length}, orphaned: ${orphanEsi.length}`)

  // Check 5: Timetable, Assignment, Homework, QuestionBank (nullable subjectId)
  const tt = await db.timetable.findMany({ select: { id: true, subjectId: true } })
  const orphanTt = tt.filter(t => t.subjectId && !subjectIds.has(t.subjectId))
  console.log(`Timetable rows: ${tt.length}, orphaned: ${orphanTt.length}`)

  // Final: list all canonical subjects
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`CANONICAL SUBJECTS (${await db.subject.count()} total)`)
  console.log(`${'═'.repeat(60)}`)
  const all = await db.subject.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { results: true, examSubjects: true, examMarks: true, timetables: true, homeworks: true, assignments: true, questionBanks: true } } } })
  for (const s of all) {
    console.log(`  ${s.name.padEnd(22)} (${s.code ?? '—'}).padEnd(6)  status=${s.status}  classId=${s.classId ?? 'NULL'.padEnd(28)}  FKs: R=${s._count.results}, ES=${s._count.examSubjects}, EM=${s._count.examMarks}`)
  }

  await db.$disconnect()
}
main().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1) })
