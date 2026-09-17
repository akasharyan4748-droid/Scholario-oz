import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const teacher = await db.user.findFirst({ where: { email: 'rohan.mehta@greenwood.edu.in' }, select: { id: true } })
  const reads = await db.notificationRead.findMany({ where: { userId: teacher!.id }, include: { notification: { select: { title: true } } } })
  console.log('TEACHER READS:', reads.length)
  for (const r of reads) console.log(' ', r.notification.title.slice(0, 45), '|', r.readAt.toISOString())
}
main().catch(console.error).finally(() => db.$disconnect())
