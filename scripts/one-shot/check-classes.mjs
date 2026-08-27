import { db } from '../../src/lib/db'

async function main() {
  console.log('=== CURRENT CLASS + SUBJECT DATA ===')
  const classes = await db.class.findMany({
    include: { subjects: { orderBy: { name: 'asc' } } },
    orderBy: [{ gradeLevel: 'asc' }, { section: 'asc' }],
  })
  for (const c of classes) {
    console.log(`\n${c.name}  (grade=${c.gradeLevel}, stream=${c.stream ?? 'null'})`)
    c.subjects.forEach(s => console.log(`   - ${s.name}  (${s.code ?? '—'})  max=${s.fullMarks ?? '—'}  pass=${s.passMarks ?? '—'}`))
  }
  await db.$disconnect()
}
main().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1) })
