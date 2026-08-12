import { db } from '../src/lib/db'
async function main() {
  const deleted = await db.exam.deleteMany({ where: { name: { startsWith: 'E2E Test Exam' } } })
  console.log(`Deleted ${deleted.count} test exams`)
}
main().catch(console.error).finally(() => db.$disconnect())
