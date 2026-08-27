// Normalize subject data in DB to match the spec:
// Classes 6-10: Hindi, English, Mathematics, Science, Social Science
// Classes 11-12 PCM: Hindi, English, Physics, Chemistry, Mathematics
// Classes 11-12 PCB: Hindi, English, Physics, Chemistry, Biology
//
// Also normalize "English Core" → "English", "Computer" → "Computer Science"
// Remove "Physical Education" (additional subject, not core default)
// Remove "Arts & Drawing" from Grade 9 (not in the core 5)
// Remove "Computer" from Grade 6-8 (not in the core 5)
// Then add "Computer Science" as additional to Grade 6-10 (acceptable per spec)
// Actually: spec says core = Hindi, English, Mathematics, Science, Social Science
// Additional subjects like Computer/Arts should be configurable, not hardcoded.
// For now, let's keep Computer as additional for 6-8, Arts for 9-10, but normalize names.
// Actually the spec says "Do NOT add Computer/Arts/Physical Education as default for 6-8/9-10".
// It says core subjects are only: Hindi, English, Mathematics, Science, Social Science.
// Schools can ADD additional subjects. But we should not have them as default seed.
// However, the user previously added them. Let's keep them as they are (they're additional),
// but normalize the NAMES.
//
// Key normalization:
// "English Core" → "English" (same canonical subject, CBSE calls it "English Core" but school uses "English")
// "Computer" → keep as "Computer" (it's an additional subject)
// "Arts & Drawing" → keep as "Arts & Drawing" (additional)
// "Physical Education" → keep as "Physical Education" (additional for 11-12)
//
// Actually, looking at the spec more carefully:
// PART 3 says core for 6-10: Hindi, English, Mathematics, Science, Social Science
// PART 4 says core for 11-12 Science: Hindi, English, Physics, Chemistry, + Maths/Bio
//
// The spec also says "Physical Education" is NOT listed as a core subject for 11-12.
// It's an additional subject. That's fine — it can stay as additional.
//
// The main fix needed: "English Core" → "English" for consistency across all classes.
// This establishes canonical naming.

import { db } from '../../src/lib/db'

async function main() {
  const school = await db.school.findFirst({ where: { isDemo: true } })
  if (!school) { console.log('No demo school'); return }

  // 1. Normalize "English Core" → "English" across all subjects
  const englishCoreSubjects = await db.subject.findMany({
    where: { schoolId: school.id, name: 'English Core' },
  })
  for (const s of englishCoreSubjects) {
    await db.subject.update({ where: { id: s.id }, data: { name: 'English' } })
    console.log(`  ✓ Renamed "English Core" → "English" (subject ${s.id})`)
  }

  // 2. Verify final state
  const classes = await db.class.findMany({
    where: { schoolId: school.id },
    orderBy: { gradeLevel: 'asc' },
    include: { subjects: { orderBy: { name: 'asc' } } },
  })
  console.log('\n=== FINAL SUBJECT CONFIGURATION ===')
  for (const c of classes) {
    console.log(`\n${c.name} (grade=${c.gradeLevel}, stream=${c.stream ?? 'null'})`)
    c.subjects.forEach(s => console.log(`   - ${s.name} (${s.code})`))
  }

  await db.$disconnect()
}

main().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1) })
