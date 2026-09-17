import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const rooms = await db.timetable.findMany({ select: { room: true }, distinct: ['room'] })
  console.log('ROOMS:', JSON.stringify(rooms.map(r => r.room)))
  const tnames = await db.timetable.findMany({ select: { teacherName: true }, distinct: ['teacherName'] })
  console.log('TT TEACHERS:', JSON.stringify(tnames.map(t => t.teacherName)))
  const ec = await db.examClass.findMany({ select: { exam: { select: { name: true } }, class: { select: { name: true, section: true } } } })
  console.log('EXAMCLASSES:', ec.map(e => `${e.exam.name}:${e.class.name}-${e.class.section}`).join(' | '))
  const cfg = await db.examSubjectConfig.findMany({ select: { exam: { select: { name: true } }, subject: { select: { name: true } }, class: { select: { name: true, section: true } } } })
  console.log('CONFIG COUNT:', cfg.length, '| sample:', cfg.slice(0, 3).map(c => `${c.exam.name}/${c.class.name}-${c.class.section}/${c.subject.name}`).join(', '))
  const students = await db.student.findMany({ select: { class: { select: { name: true, section: true } } } })
  const byClass: Record<string, number> = {}
  for (const s of students) { const k = `${s.class?.name}-${s.class?.section}`; byClass[k] = (byClass[k] ?? 0) + 1 }
  console.log('STUDENTS BY CLASS:', JSON.stringify(byClass))
}
main().then(() => db.$disconnect())
