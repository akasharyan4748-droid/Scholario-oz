// Fix DB: delete Commerce/Humanities classes, add Grade 12 PCB if missing
import { db } from '../src/lib/db'

async function main() {
  const school = await db.school.findFirst({ where: { isDemo: true } })
  if (!school) { console.log('No demo school'); return }

  // Delete Commerce and Humanities
  const toDelete = await db.class.findMany({ where: { schoolId: school.id, stream: { in: ['Commerce', 'Humanities'] } }, select: { id: true, name: true, stream: true } })
  for (const cls of toDelete) { await db.class.delete({ where: { id: cls.id } }); console.log(`  ✗ Deleted ${cls.name} (${cls.stream})`) }

  // Add Grade 12 PCB if missing
  const existing12PCB = await db.class.findFirst({ where: { schoolId: school.id, name: 'Grade 12 - Science PCB' } })
  if (!existing12PCB) {
    const teacher = await db.teacher.findFirst({ where: { schoolId: school.id } })
    const cls = await db.class.create({ data: { schoolId: school.id, name: 'Grade 12 - Science PCB', gradeLevel: '12', section: 'B', stream: 'Science-PCB', capacity: 40, room: '402', classTeacherId: teacher?.id } })
    for (const s of [{ name: 'English Core', code: 'ENG', fullMarks: 100, passMarks: 33 }, { name: 'Physics', code: 'PHY', fullMarks: 100, passMarks: 33 }, { name: 'Chemistry', code: 'CHE', fullMarks: 100, passMarks: 33 }, { name: 'Biology', code: 'BIO', fullMarks: 100, passMarks: 33 }, { name: 'Physical Education', code: 'PED', fullMarks: 100, passMarks: 33 }]) {
      await db.subject.create({ data: { schoolId: school.id, classId: cls.id, ...s } })
    }
    console.log('  ✓ Added Grade 12 - Science PCB')
  }

  // Also add Grade 6-8 if missing (they exist but check)
  const allClasses = await db.class.findMany({ where: { schoolId: school.id }, orderBy: { gradeLevel: 'asc' }, select: { id: true, name: true, gradeLevel: true, stream: true } })
  console.log('\n=== FINAL CLASSES ===')
  for (const c of allClasses) console.log(`  ${c.name} (grade=${c.gradeLevel}, stream=${c.stream ?? 'null'})`)

  await db.$disconnect()
}
main().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1) })
