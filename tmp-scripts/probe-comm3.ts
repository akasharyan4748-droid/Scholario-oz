import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const teacher = await db.user.findFirst({ where: { email: 'rohan.mehta@greenwood.edu.in' }, select: { id: true } })
  const tid = teacher!.id
  // 1. read-state persisted?
  const read = await db.notificationRead.findFirst({ where: { notificationId: 'cmu1g9t3e0073ol6uptyoehab', userId: tid } })
  console.log('READ MARK PERSISTED:', read != null, read?.readAt.toISOString())
  // 2. my test artifacts
  const verif = await db.parentMessage.findMany({ where: { senderId: tid, body: { contains: 'Communication Hub verification' } }, select: { id: true, conversationId: true, body: true, createdAt: true } })
  console.log('VERIFICATION MESSAGES:', verif.length)
  for (const v of verif) console.log(' ', v.id, 'convo:', v.conversationId, '|', v.body.slice(0, 50))
  // conversations created today by the test
  const saanvi = await db.parentConversation.findFirst({ where: { id: verif.find(v => v.body.includes('Saanvi'))?.conversationId ?? '' }, include: { _count: { select: { messages: true } } } })
  console.log('SAANVI CONVO message count:', saanvi?._count.messages)
  // 3. test announcements
  const anns = await db.notification.findMany({ where: { senderId: tid }, select: { id: true, title: true, audience: true, createdAt: true } })
  console.log('ANNOUNCEMENTS BY TEACHER (test artifacts):', anns.length)
  for (const a of anns) console.log(' ', a.id, a.audience, '|', a.title)
}
main().catch(console.error).finally(() => db.$disconnect())
