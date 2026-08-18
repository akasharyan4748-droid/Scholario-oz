// Backfill ClassSubjectAssignment from the pre-dedup backup DB.
//
// Strategy:
//   1. Read all (subjectName, subjectCode, classId) tuples from backup DB
//   2. Map each subjectName to the canonical subject ID (handling the
//      Mathematics → Maths rename)
//   3. Insert ClassSubjectAssignment rows for each unique (classId, canonicalSubjectId)
//   4. Mark isCore=true for default subjects, isCore=false for additional subjects
//   5. Set displayOrder per Spec §33 (Hindi=1, English=2, Maths/Science=3-4, etc.)
//
// Run with: ./node_modules/.bin/tsx scripts/backfill-class-subject-assignments.ts

import { PrismaClient } from '@prisma/client'
import { db } from '../../src/lib/db'

// Spec §33: deterministic subject ordering
const CORE_SUBJECT_ORDER: Record<string, number> = {
  Hindi: 1,
  English: 2,
  Maths: 3,
  Science: 4,
  'Social Science': 5,
  Physics: 3,      // Senior secondary
  Chemistry: 4,
  Biology: 5,
}

// Spec §3/§4/§5: core vs additional subjects
const CORE_SUBJECT_NAMES = new Set([
  'Hindi', 'English', 'Maths', 'Science', 'Social Science',
  'Physics', 'Chemistry', 'Biology',
])

async function main() {
  console.log('🔄 Backfilling ClassSubjectAssignment from backup DB...')

  const backupDb = new PrismaClient({
    datasources: { db: { url: 'file:/home/z/my-project/db/custom.db.bak.phase1' } },
  })

  // 1. Read backup subject rows
  const oldSubjects = await backupDb.subject.findMany({
    select: { id: true, name: true, code: true, classId: true, schoolId: true },
  })
  console.log(`  Backup has ${oldSubjects.length} subject rows`)

  // 2. Read current canonical subjects (post-dedup, post-Maths-rename)
  const canonical = await db.subject.findMany({ select: { id: true, name: true, code: true } })

  // Build mapping: (name, code) → canonical ID
  // Handle the Mathematics → Maths rename
  const nameMap = new Map<string, string>()
  for (const s of canonical) {
    nameMap.set(`${s.name}|${s.code ?? ''}`, s.id)
  }
  // Add alias for Mathematics → Maths (so backup rows with "Mathematics" match)
  const mathsCanonical = canonical.find((s) => s.name === 'Maths')
  if (mathsCanonical) {
    nameMap.set(`Mathematics|${mathsCanonical.code ?? ''}`, mathsCanonical.id)
  }

  // 3. Build unique (classId, canonicalSubjectId) pairs
  const pairs = new Set<string>()
  for (const old of oldSubjects) {
    if (!old.classId) continue
    const key = `${old.name}|${old.code ?? ''}`
    const canonicalId = nameMap.get(key)
    if (!canonicalId) {
      console.log(`  WARN: no canonical match for ${old.name} (${old.code})`)
      continue
    }
    pairs.add(`${old.classId}|${canonicalId}`)
  }
  console.log(`  Recovered ${pairs.size} unique (class, subject) pairs`)

  // 4. Insert ClassSubjectAssignment rows
  let inserted = 0
  for (const pair of pairs) {
    const [classId, subjectId] = pair.split('|')
    const cls = await db.class.findUnique({ where: { id: classId }, select: { schoolId: true } })
    const subj = await db.subject.findUnique({ where: { id: subjectId }, select: { name: true } })
    if (!cls || !subj) continue

    const isCore = CORE_SUBJECT_NAMES.has(subj.name)
    const displayOrder = CORE_SUBJECT_ORDER[subj.name] ?? 99

    await db.classSubjectAssignment.upsert({
      where: { classId_subjectId: { classId, subjectId } },
      create: {
        schoolId: cls.schoolId,
        classId,
        subjectId,
        isCore,
        isActive: true,
        examinable: true,
        displayOrder,
      },
      update: {},
    })
    inserted++
  }
  console.log(`  ✓ Inserted ${inserted} ClassSubjectAssignment rows`)

  // 5. Verify
  const total = await db.classSubjectAssignment.count()
  console.log(`\n  Total ClassSubjectAssignment rows: ${total}`)

  // Show per-class breakdown
  const classes = await db.class.findMany({
    orderBy: [{ gradeLevel: 'asc' }, { stream: 'asc' }],
    include: {
      subjectAssignments: {
        include: { subject: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
  })
  console.log(`\n${'═'.repeat(60)}`)
  console.log('PER-CLASS SUBJECT ASSIGNMENTS')
  console.log('═'.repeat(60))
  for (const c of classes) {
    console.log(`\n${c.name} (${c.subjectAssignments.length} subjects):`)
    for (const a of c.subjectAssignments) {
      console.log(`  ${a.displayOrder}. ${a.subject.name.padEnd(22)} (${a.subject.code ?? '—'})  ${a.isCore ? 'CORE' : 'ADDITIONAL'}  ${a.examinable ? 'EXAM' : 'NO-EXAM'}  ${a.isActive ? 'ACTIVE' : 'INACTIVE'}`)
    }
  }

  await backupDb.$disconnect()
  await db.$disconnect()
}

main().catch(async (e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
