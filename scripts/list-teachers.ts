import { db } from '../src/lib/db'

async function main() {
  const teachers = await db.teacher.findMany({
    where: { schoolId: 'cmshlub0a0001oypsseqvscgl' },
    include: { user: { select: { name: true, email: true } } },
  })
  console.log(`Teachers: ${teachers.length}`)
  for (const t of teachers) {
    console.log(`  • ${t.user.name} | dept=${t.department} | empId=${t.employeeId}`)
  }
}
main().catch(console.error).finally(() => db.$disconnect())
