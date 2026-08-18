import { db } from '../../src/lib/db'
async function main() {
  const subjects = await db.subject.findMany({ select: { id: true, name: true, code: true, status: true, updatedAt: true, classId: true }, take: 10 })
  console.log('Sample after migration:')
  for (const s of subjects) {
    console.log(`  ${s.name} (${s.code}) status=${s.status} updatedAt=${s.updatedAt} classId=${s.classId ?? 'NULL'}`)
  }
  const totalStatus = await db.subject.groupBy({ by: ['status'], _count: { _all: true } })
  console.log('\nStatus counts:', totalStatus)
  await db.$disconnect()
}
main().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1) })
