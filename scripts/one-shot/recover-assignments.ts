// Recover original (subjectName, classId) pairs from the pre-dedup DB backup.
// We'll use this to backfill ClassSubjectAssignment in Phase 2.

import { PrismaClient } from '@prisma/client'
import { db } from '../../src/lib/db'

async function main() {
  // Connect to backup DB
  const backupDb = new PrismaClient({
    datasources: { db: { url: 'file:/home/z/my-project/db/custom.db.bak.phase1' } },
  })

  const oldSubjects = await backupDb.subject.findMany({
    select: { id: true, name: true, code: true, classId: true, schoolId: true },
  })
  console.log(`Backup DB has ${oldSubjects.length} subject rows`)

  // Get current canonical subjects
  const canonical = await db.subject.findMany({ select: { id: true, name: true, code: true } })
  const byNameCode = new Map<string, string>()
  for (const s of canonical) {
    byNameCode.set(`${s.name}|${s.code ?? ''}`, s.id)
  }

  // Build assignment map: (classId, canonicalSubjectId)
  const assignments = new Set<string>()
  for (const old of oldSubjects) {
    if (!old.classId) continue
    const key = `${old.name}|${old.code ?? ''}`
    const canonicalId = byNameCode.get(key)
    if (!canonicalId) {
      console.log(`  WARN: no canonical match for ${old.name} (${old.code})`)
      continue
    }
    assignments.add(`${old.classId}|${canonicalId}`)
  }

  console.log(`\nRecovered ${assignments.size} unique (classId, canonicalSubjectId) pairs:`)
  for (const a of assignments) {
    const [classId, subjectId] = a.split('|')
    const cls = await db.class.findUnique({ where: { id: classId }, select: { name: true } })
    const subj = await db.subject.findUnique({ where: { id: subjectId }, select: { name: true } })
    console.log(`  ${cls?.name ?? 'UNKNOWN'} → ${subj?.name ?? 'UNKNOWN'}`)
  }

  await backupDb.$disconnect()
  await db.$disconnect()
}

main().catch(async (e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
