import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const teacher = await db.user.findFirst({ where: { email: 'rohan.mehta@greenwood.edu.in' }, select: { id: true } })
  const tid = teacher!.id
  // 1. delete verification parent messages
  const del1 = await db.parentMessage.deleteMany({ where: { senderId: tid, body: { contains: 'Communication Hub verification' } } })
  console.log('deleted verification messages:', del1.count)
  // 2. delete the Saanvi test conversation (had only the verification message)
  const del2 = await db.parentConversation.deleteMany({ where: { id: 'cmu5ncbmt0007pprrmq5cboyz' } })
  console.log('deleted saanvi test conversation:', del2.count)
  // 3. restore Aarav conversation lastMessageAt from remaining messages
  const last = await db.parentMessage.findFirst({ where: { conversationId: 'cmu51uo4f000hsnkhg7qp5t68' }, orderBy: { createdAt: 'desc' } })
  if (last) {
    await db.parentConversation.update({ where: { id: 'cmu51uo4f000hsnkhg7qp5t68' }, data: { lastMessageAt: last.createdAt } })
    console.log('aarav conversation lastMessageAt restored to:', last.createdAt.toISOString())
  }
  // 4. delete the 2 test announcements (authored by a normal teacher — would contradict the permission narrative)
  const del4 = await db.notification.deleteMany({ where: { senderId: tid } })
  console.log('deleted test announcements:', del4.count)
  // final state
  const convos = await db.parentConversation.count({ where: { teacherId: tid } })
  const sentPM = await db.parentMessage.count({ where: { senderId: tid } })
  const unread = await db.parentMessage.count({ where: { conversation: { teacherId: tid }, senderId: { not: tid }, readAt: null } })
  const annByTeacher = await db.notification.count({ where: { senderId: tid } })
  console.log('FINAL: conversations =', convos, '| sentParentMessages =', sentPM, '| unread =', unread, '| announcementsByTeacher =', annByTeacher)
}
main().catch(console.error).finally(() => db.$disconnect())
