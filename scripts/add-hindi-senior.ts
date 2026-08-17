// Add Hindi to all Grade 11-12 Science classes (missing from spec defaults)
import { db } from '../src/lib/db'

async function main() {
  const school = await db.school.findFirst({ where: { isDemo: true } })
  if (!school) { console.log('No demo school'); return }

  const seniorClasses = await db.class.findMany({
    where: { schoolId: school.id, gradeLevel: { in: ['11', '12'] }, stream: { startsWith: 'Science-' } },
  })

  for (const cls of seniorClasses) {
    // Check if Hindi already exists
    const existingHindi = await db.subject.findFirst({
      where: { classId: cls.id, name: 'Hindi' },
    })
    if (!existingHindi) {
      await db.subject.create({
        data: { schoolId: school.id, classId: cls.id, name: 'Hindi', code: 'HIN', fullMarks: 100, passMarks: 33 },
      })
      console.log(`  ✓ Added Hindi to ${cls.name}`)
    } else {
      console.log(`  - Hindi already exists in ${cls.name}`)
    }
  }

  // Verify
  const classes = await db.class.findMany({
    where: { schoolId: school.id, gradeLevel: { in: ['11', '12'] } },
    orderBy: { gradeLevel: 'asc' },
    include: { subjects: { orderBy: { name: 'asc' } } },
  })
  console.log('\n=== 11-12 SUBJECTS ===')
  for (const c of classes) {
    console.log(`${c.name}: ${c.subjects.map(s => s.name).join(', ')}`)
  }

  await db.$disconnect()
}
main().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1) })
