import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
const AUD: Record<string, string[]> = {
  TEACHER: ['ALL', 'TEACHERS', 'STAFF'],
}
function allows(aud: string) {
  const allowed = AUD['TEACHER']
  if (aud.toUpperCase().startsWith('CLASS:')) return true
  return allowed.includes(aud.toUpperCase())
}
async function main() {
  const teacher = await db.user.findFirst({ where: { email: 'rohan.mehta@greenwood.edu.in' }, select: { id: true, schoolId: true } })
  const tid = teacher!.id
  const notifs = await db.notification.findMany({ where: { schoolId: teacher!.schoolId! }, orderBy: { createdAt: 'desc' }, include: { reads: { where: { userId: tid } }, sender: { select: { name: true } } } })
  const seen = new Set<string>()
  const visible = notifs.filter(n => allows(n.audience) && !seen.has(`${n.title}\u0000${n.message}`) && seen.add(`${n.title}\u0000${n.message}`))
  console.log('VISIBLE-DEDUP TO TEACHER:', visible.length)
  for (const n of visible) console.log(' ', n.audience, '|', n.title.slice(0, 45), '|', n.createdAt.toISOString().slice(0, 10), '| read:', n.reads.length > 0, '| by:', n.sender?.name)
  // unread visible
  const unreadVis = visible.filter(n => n.reads.length === 0)
  console.log('UNREAD VISIBLE:', unreadVis.length)
  // conversations: last message from parent (awaiting reply)
  const convos = await db.parentConversation.findMany({ where: { teacherId: tid }, include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } } })
  let awaiting = 0
  for (const c of convos) { const last = c.messages[0]; if (last && last.senderId !== tid) { awaiting++; console.log('  AWAITING:', c.studentId) } }
  console.log('CONVERSATIONS:', convos.length, 'AWAITING REPLY:', awaiting)
  // Message table for school: any to teachers?
  const schoolMsgs = await db.message.findMany({ where: { schoolId: teacher!.schoolId! }, select: { recipientId: true, senderId: true, subject: true, read: true, recipient: { select: { role: true, name: true } }, sender: { select: { name: true } } }, take: 15 })
  console.log('SCHOOL MESSAGES:', schoolMsgs.length)
  for (const m of schoolMsgs.slice(0, 10)) console.log(' ', m.sender?.name, '->', m.recipient?.name, `(${m.recipient?.role})`, '|', m.subject.slice(0, 30), '| read:', m.read)
  // check MessageTemplate rows detail
  const templates = await db.messageTemplate.findMany({ where: { schoolId: teacher!.schoolId!, isActive: true }, orderBy: { sortOrder: 'asc' }, select: { label: true, kind: true, category: true } })
  console.log('TEMPLATES:', templates.map(t => `${t.kind}:${t.label}`).join(' · '))
  // teacher's own sent Message row
  const mySent = await db.message.findFirst({ where: { senderId: tid }, select: { subject: true, createdAt: true, recipient: { select: { name: true } } } })
  console.log('MY SENT MESSAGE:', mySent)
}
main().catch(console.error).finally(() => db.$disconnect())
