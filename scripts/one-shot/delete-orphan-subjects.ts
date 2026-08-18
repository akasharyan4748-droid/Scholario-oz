// Delete 6 orphaned Subject rows with classId=NULL and zero FK references.
// These are remnants of deleted Commerce/Humanities classes (Spec §30).
// Verified safe: 0 references in Result, ExamSubjectConfig, ExamMark,
// ExamScheduleItem, ExamAttendance, Timetable, Assignment, QuestionBank, Homework.
//
// Run with: ./node_modules/.bin/tsx scripts/delete-orphan-subjects.ts

import { db } from '../../src/lib/db'

async function main() {
  console.log('🗑️  Deleting orphaned subjects (classId=NULL, zero FK refs)...')

  const orphans = await db.subject.findMany({
    where: { classId: null },
    select: { id: true, name: true, code: true },
  })
  console.log(`Found ${orphans.length} orphans:`)
  for (const s of orphans) {
    console.log(`  - ${s.name} (${s.code})`)
  }

  // Double-check FK safety before deletion
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
    if (total > 0) {
      throw new Error(`REFUSING TO DELETE ${s.name} — has ${total} FK references: ${JSON.stringify(refs)}`)
    }
  }

  const deleted = await db.subject.deleteMany({ where: { classId: null } })
  console.log(`\n✓ Deleted ${deleted.count} orphaned subject(s).`)

  const remaining = await db.subject.count()
  console.log(`✓ Subjects remaining: ${remaining}`)

  await db.$disconnect()
}

main().catch(async (e) => {
  console.error('FATAL:', e)
  await db.$disconnect()
  process.exit(1)
})
