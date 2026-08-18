// Spec §24: canonical display name is "Maths" (not "Mathematics").
// This is a metadata-only update — subjectId stays the same, so all
// FK references (Result, ExamSubjectConfig, ExamMark, etc.) remain valid.
//
// Run with: ./node_modules/.bin/tsx scripts/normalize-maths-name.ts

import { db } from '../../src/lib/db'

async function main() {
  console.log('🔄 Normalizing subject display names per Spec §24...')

  // Mathematics → Maths (Spec §24)
  const result = await db.subject.updateMany({
    where: { name: 'Mathematics' },
    data: { name: 'Maths' },
  })
  console.log(`  ✓ "Mathematics" → "Maths": ${result.count} row(s) updated`)

  // Verify final state
  const subjects = await db.subject.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true, status: true, classId: true },
  })
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`CANONICAL SUBJECTS AFTER NORMALIZATION (${subjects.length})`)
  console.log(`${'═'.repeat(60)}`)
  for (const s of subjects) {
    console.log(`  ${s.name.padEnd(22)} (${s.code ?? '—'})  status=${s.status}  classId=${s.classId ?? 'NULL'}`)
  }

  await db.$disconnect()
}

main().catch(async (e) => {
  console.error('FATAL:', e)
  await db.$disconnect()
  process.exit(1)
})
