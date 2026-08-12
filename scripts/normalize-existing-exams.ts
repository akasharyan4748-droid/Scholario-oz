import { db } from '../src/lib/db'

async function main() {
  // Bring legacy seeded exams in line with the new schema conventions
  const exams = await db.exam.findMany()
  console.log(`Found ${exams.length} existing exams`)
  for (const e of exams) {
    const patch: any = {}
    if (!e.type) patch.type = 'Unit Test'
    if (!e.session) patch.session = '2025-2026'
    if (!e.resultStatus) {
      // existing status mapping
      patch.resultStatus = e.status === 'COMPLETED' ? 'Result Declared' : 'Not Started'
    }
    if (e.status === 'COMPLETED' && !patch.resultStatus) patch.resultStatus = 'Result Declared'
    if (Object.keys(patch).length > 0) {
      await db.exam.update({ where: { id: e.id }, data: patch })
      console.log(`Updated ${e.name}:`, patch)
    }
  }
  const after = await db.exam.findMany()
  console.log('AFTER:', JSON.stringify(after, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(async () => await db.$disconnect())
