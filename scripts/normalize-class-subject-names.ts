// Normalize class + subject names to spec-compliant canonical names.
// Spec §9:  "Class 6" / "Class 11 — Science PCM"  (NOT "Grade 6 - A")
// Spec §16: "English" (NOT "English Core"), "Computer Science" (NOT "Computer")
// Spec §25: Historical exam/marks records use subjectId FK — name changes are safe.
//
// Run with: ./node_modules/.bin/tsx scripts/normalize-class-subject-names.ts

import { db } from '../src/lib/db'

async function main() {
  console.log('🔄 Normalizing class + subject names to canonical form...\n')

  // ─── 1. Rename classes ──────────────────────────────────────────────
  const classRenames: Array<{ from: string; to: string }> = [
    { from: 'Grade 6 - A', to: 'Class 6' },
    { from: 'Grade 7 - A', to: 'Class 7' },
    { from: 'Grade 8 - A', to: 'Class 8' },
    { from: 'Grade 9 - A', to: 'Class 9' },
    { from: 'Grade 10 - A', to: 'Class 10' },
    { from: 'Grade 11 - Science PCM', to: 'Class 11 — Science PCM' },
    { from: 'Grade 11 - Science PCB', to: 'Class 11 — Science PCB' },
    { from: 'Grade 12 - Science PCM', to: 'Class 12 — Science PCM' },
    { from: 'Grade 12 - Science PCB', to: 'Class 12 — Science PCB' },
  ]

  let classCount = 0
  for (const { from, to } of classRenames) {
    const result = await db.class.updateMany({ where: { name: from }, data: { name: to } })
    if (result.count > 0) {
      console.log(`  ✓ Class: "${from}" → "${to}"  (${result.count} row)`)
      classCount += result.count
    }
  }
  console.log(`  → ${classCount} class name(s) normalized.\n`)

  // ─── 2. Normalize subject names ─────────────────────────────────────
  // Spec §16: normalize duplicates to canonical names.
  //   English Core  → English
  //   Computer      → Computer Science
  //   Maths         → Mathematics
  //   Social Studies → Social Science
  // These renames preserve subjectId — historical marks/results remain valid.
  const subjectRenames: Array<{ from: string; to: string }> = [
    { from: 'English Core', to: 'English' },
    { from: 'Computer', to: 'Computer Science' },
    { from: 'Maths', to: 'Mathematics' },
    { from: 'Social Studies', to: 'Social Science' },
    { from: 'Computer Applications', to: 'Computer Science' },
    { from: 'Hindi Elective', to: 'Hindi' },
  ]

  let subjCount = 0
  for (const { from, to } of subjectRenames) {
    const result = await db.subject.updateMany({ where: { name: from }, data: { name: to } })
    if (result.count > 0) {
      console.log(`  ✓ Subject: "${from}" → "${to}"  (${result.count} row)`)
      subjCount += result.count
    }
  }
  console.log(`  → ${subjCount} subject name(s) normalized.\n`)

  // ─── 3. Verify final state ──────────────────────────────────────────
  console.log('═══ FINAL STATE ═══')
  const classes = await db.class.findMany({
    include: { subjects: { orderBy: { name: 'asc' } } },
    orderBy: [{ gradeLevel: 'asc' }, { stream: 'asc' }],
  })
  for (const c of classes) {
    console.log(`\n${c.name}  (grade=${c.gradeLevel}, stream=${c.stream ?? 'null'})`)
    c.subjects.forEach(s => console.log(`   - ${s.name}  (${s.code ?? '—'})`))
  }

  await db.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await db.$disconnect()
  process.exit(1)
})
