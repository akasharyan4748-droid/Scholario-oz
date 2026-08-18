// Deduplicate Subject rows: for each (schoolId, name, code), pick ONE
// canonical Subject.id, update all FK references to point to it, then
// delete the duplicate rows.
//
// FK references to update (per Prisma schema):
//   - Result.subjectId
//   - ExamSubjectConfig.subjectId
//   - ExamScheduleItem.subjectId
//   - ExamMark.subjectId
//   - ExamAttendance.subjectId (Subject? relation — nullable)
//   - Timetable.subjectId (Subject? relation — nullable)
//   - Assignment.subjectId (Subject? relation — nullable)
//   - QuestionBank.subjectId (Subject? relation — nullable)
//   - Homework.subjectId (Subject? relation — nullable)
//
// Strategy: for each duplicate group, pick the OLDEST subject (lowest
// createdAt, smallest cuid) as canonical. Update all FKs to point to it.
// Delete the others.
//
// Run with: ./node_modules/.bin/tsx scripts/deduplicate-subjects.ts

import { db } from '../../src/lib/db'

async function main() {
  console.log('🔍 Auditing duplicate subjects...')

  // Group by (schoolId, name, code) — canonical subject identity
  const subjects = await db.subject.findMany({
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  })

  const groups = new Map<string, typeof subjects>()
  for (const s of subjects) {
    // Normalize key: code is nullable; treat null as empty string
    const key = `${s.schoolId}|${s.name}|${s.code ?? ''}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(s)
  }

  let duplicateGroups = 0
  let duplicatesRemoved = 0
  let fkUpdates = 0

  for (const [key, group] of groups) {
    if (group.length <= 1) continue // no duplicates
    duplicateGroups++

    // Canonical = oldest (first in sorted array)
    const canonical = group[0]
    const dups = group.slice(1)
    const [, name, code] = key.split('|')

    console.log(`\n  "${name}" (${code || '—'}): ${group.length} rows → canonical ${canonical.id}`)
    console.log(`    Classes: ${group.map((s) => s.classId ?? 'NULL').join(', ')}`)

    // For each duplicate, update FK references to point to canonical, then delete
    for (const dup of dups) {
      // ─── Update FK references ────────────────────────────────────────
      // Note: SQLite doesn't support JOINs in UPDATE, so we do per-row updates.

      // Result.subjectId
      const results = await db.result.updateMany({
        where: { subjectId: dup.id },
        data: { subjectId: canonical.id },
      })
      fkUpdates += results.count

      // ExamSubjectConfig.subjectId
      const examSubjs = await db.examSubjectConfig.updateMany({
        where: { subjectId: dup.id },
        data: { subjectId: canonical.id },
      })
      fkUpdates += examSubjs.count

      // ExamScheduleItem.subjectId
      const schedItems = await db.examScheduleItem.updateMany({
        where: { subjectId: dup.id },
        data: { subjectId: canonical.id },
      })
      fkUpdates += schedItems.count

      // ExamMark.subjectId
      const examMarks = await db.examMark.updateMany({
        where: { subjectId: dup.id },
        data: { subjectId: canonical.id },
      })
      fkUpdates += examMarks.count

      // ExamAttendance.subjectId (nullable)
      const examAtt = await db.examAttendance.updateMany({
        where: { subjectId: dup.id },
        data: { subjectId: canonical.id },
      })
      fkUpdates += examAtt.count

      // Timetable.subjectId (nullable)
      const timetables = await db.timetable.updateMany({
        where: { subjectId: dup.id },
        data: { subjectId: canonical.id },
      })
      fkUpdates += timetables.count

      // Assignment.subjectId (nullable)
      const assignments = await db.assignment.updateMany({
        where: { subjectId: dup.id },
        data: { subjectId: canonical.id },
      })
      fkUpdates += assignments.count

      // QuestionBank.subjectId (nullable)
      const qb = await db.questionBank.updateMany({
        where: { subjectId: dup.id },
        data: { subjectId: canonical.id },
      })
      fkUpdates += qb.count

      // Homework.subjectId (nullable)
      const hw = await db.homework.updateMany({
        where: { subjectId: dup.id },
        data: { subjectId: canonical.id },
      })
      fkUpdates += hw.count

      // ─── Delete the duplicate ────────────────────────────────────────
      await db.subject.delete({ where: { id: dup.id } })
      duplicatesRemoved++
      console.log(`    ✓ Removed dup ${dup.id} (classId=${dup.classId ?? 'NULL'}) — ${results.count + examSubjs.count + examMarks.count + schedItems.count + examAtt.count + timetables.count + assignments.count + qb.count + hw.count} FK refs updated`)
    }
  }

  console.log(`\n${'═'.repeat(60)}`)
  console.log(`SUMMARY`)
  console.log(`${'═'.repeat(60)}`)
  console.log(`Duplicate groups:  ${duplicateGroups}`)
  console.log(`Duplicates removed: ${duplicatesRemoved}`)
  console.log(`FK references updated: ${fkUpdates}`)
  console.log(`Subjects remaining: ${await db.subject.count()}`)

  await db.$disconnect()
}

main().catch(async (e) => {
  console.error('FATAL:', e)
  await db.$disconnect()
  process.exit(1)
})
