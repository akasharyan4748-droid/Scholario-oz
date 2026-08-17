import { db } from '../../src/lib/db'
async function main() {
  // Normalize Mathematics code to MAT across all Grade 9 subjects (was MATH)
  const updated = await db.subject.updateMany({ where: { code: 'MATH', name: 'Mathematics' }, data: { code: 'MAT' } })
  console.log(`Normalized ${updated.count} Mathematics subject codes (MATH → MAT)`)
  await db.$disconnect()
}
main().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1) })
