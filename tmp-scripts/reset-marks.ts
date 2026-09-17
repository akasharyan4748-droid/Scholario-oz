import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const deleted = await db.examMark.deleteMany({
    where: { student: { user: { name: { in: ['Aditya Singh', 'Saanvi Nair', 'Ananya Gupta'] } } } },
  })
  const reverted = await db.examMark.updateMany({
    data: { workflowStatus: 'DRAFT', verifiedBy: null },
  })
  console.log('deleted test rows:', deleted.count, '| reverted to DRAFT:', reverted.count)
  const remaining = await db.examMark.findMany({
    select: { marksObtained: true, workflowStatus: true, student: { select: { user: { select: { name: true } } } } },
  })
  console.log(remaining.map(r => `${r.student.user.name}: ${r.marksObtained} (${r.workflowStatus})`))
}
main().then(() => db.$disconnect())
