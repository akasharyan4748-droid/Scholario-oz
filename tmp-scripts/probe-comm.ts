import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  // Teacher user
  const teacher = await db.user.findFirst({ where: { email: 'rohan.mehta@greenwood.edu.in' }, select: { id: true, name: true, schoolId: true, role: true } })
  console.log('TEACHER:', teacher)
  if (!teacher) return
  const tid = teacher.id
  // Announcements
  const notifs = await db.notification.findMany({ where: { schoolId: teacher.schoolId! }, orderBy: { createdAt: 'desc' }, take: 50, select: { id: true, title: true, audience: true, priority: true, createdAt: true, senderId: true } })
  console.log('NOTIFICATIONS:', notifs.length)
  for (const n of notifs.slice(0, 12)) console.log(' ', n.audience, '|', n.title.slice(0, 40), '|', n.createdAt.toISOString().slice(0, 10), '| sender:', n.senderId)
  const reads = await db.notificationRead.findMany({ where: { userId: tid }, select: { notificationId: true } })
  console.log('TEACHER READS:', reads.length)
  // Messages to teacher
  const msgs = await db.message.findMany({ where: { recipientId: tid }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, subject: true, read: true, createdAt: true, sender: { select: { name: true } } } })
  console.log('MESSAGES TO TEACHER:', msgs.length)
  for (const m of msgs.slice(0, 6)) console.log(' ', m.sender?.name, '|', m.subject.slice(0, 40), '| read:', m.read, '|', m.createdAt.toISOString().slice(0, 10))
  const sent = await db.message.count({ where: { senderId: tid } })
  console.log('MESSAGES SENT BY TEACHER (Message table):', sent)
  // Parent conversations
  const convos = await db.parentConversation.findMany({ where: { teacherId: tid }, include: { parent: { select: { name: true } }, student: { include: { user: { select: { name: true } } } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } } })
  console.log('PARENT CONVERSATIONS:', convos.length)
  for (const c of convos) console.log(' ', c.parent.name, '| student:', c.student.user?.name, '| last:', c.lastMessageAt?.toISOString(), '| lastMsg:', c.messages[0]?.body?.slice(0, 30))
  const sentPM = await db.parentMessage.count({ where: { senderId: tid } })
  const unreadPM = await db.parentMessage.count({ where: { conversation: { teacherId: tid }, senderId: { not: tid }, readAt: null } })
  console.log('PARENT MESSAGES SENT BY TEACHER:', sentPM, '| UNREAD FROM PARENTS:', unreadPM)
  // Templates
  const templates = await db.messageTemplate.findMany({ where: { schoolId: teacher.schoolId!, isActive: true }, select: { id: true, label: true, kind: true } })
  console.log('TEMPLATES:', templates.length)
  // Students in scope with guardians
  const classes = await db.class.findMany({ where: { schoolId: teacher.schoolId!, classTeacherId: tid }, select: { id: true, name: true } })
  console.log('CLASS TEACHER OF:', classes)
  const students = await db.student.count({ where: { classId: { in: classes.map(c => c.id) }, guardianId: { not: null } } })
  console.log('IN-SCOPE STUDENTS WITH GUARDIAN:', students)
  // Follow-ups open
  const fu = await db.teacherFollowUp.count({ where: { teacherId: tid, kind: 'parent-connect', status: 'open' } })
  console.log('OPEN PARENT-CONNECT FOLLOW-UPS:', fu)
}
main().catch(console.error).finally(() => db.$disconnect())
