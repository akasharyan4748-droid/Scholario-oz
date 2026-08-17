import { db } from '../../src/lib/db'
async function main() {
  const school = await db.school.findFirst({ where: { isDemo: true } })
  if (!school) process.exit(0)
  const teacher = await db.teacher.findFirst({ where: { schoolId: school.id } })
  for (const g of [6, 7, 8]) {
    const existing = await db.class.findFirst({ where: { schoolId: school.id, gradeLevel: String(g) } })
    if (!existing) {
      const cls = await db.class.create({ data: { schoolId: school.id, name: `Grade ${g} - A`, gradeLevel: String(g), section: 'A', capacity: 40, room: `10${g}`, classTeacherId: teacher?.id } })
      for (const s of [
        { name: 'Hindi', code: 'HIN', fullMarks: 100, passMarks: 33 },
        { name: 'English', code: 'ENG', fullMarks: 100, passMarks: 33 },
        { name: 'Mathematics', code: 'MAT', fullMarks: 100, passMarks: 33 },
        { name: 'Science', code: 'SCI', fullMarks: 100, passMarks: 33 },
        { name: 'Social Science', code: 'SST', fullMarks: 100, passMarks: 33 },
        { name: 'Computer', code: 'CMP', fullMarks: 100, passMarks: 33 },
      ]) await db.subject.create({ data: { schoolId: school.id, classId: cls.id, ...s } })
      console.log(`Added Grade ${g} - A`)
    } else { console.log(`Grade ${g} already exists`) }
  }
  const all = await db.class.findMany({ where: { schoolId: school.id }, orderBy: { gradeLevel: 'asc' }, select: { name: true, gradeLevel: true, stream: true } })
  console.log('\n=== ALL CLASSES ===')
  for (const c of all) console.log(`  ${c.name} (grade=${c.gradeLevel}, stream=${c.stream ?? 'null'})`)
  await db.$disconnect()
}
main().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1) })
