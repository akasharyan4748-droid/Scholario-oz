import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'
import { parseDateParam, resolveClassScope, isValidStatus } from '@/lib/class-attendance'

export const runtime = 'nodejs'

interface SessionBody {
  classId?: string
  subjectId?: string
  date?: string
  entries?: { studentId: string; status: string }[]
}

/**
 * POST /api/teacher/class-attendance/session — a SUBJECT teacher submits
 * her own attendance session for a class she teaches. This is SEPARATE
 * from the class-teacher baseline (viewing the prefilled baseline never
 * writes anything — only this explicit submission does). Re-submitting
 * the same (class, subject, teacher, date) updates her own session.
 */
export async function POST(request: Request) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = (await request.json().catch(() => null)) as SessionBody | null
      if (!body?.classId || !body?.subjectId || !body?.date || !Array.isArray(body.entries) || body.entries.length === 0) {
        throw new Error('classId, subjectId, date and entries are required')
      }
      const day = parseDateParam(body.date)
      if (day.getTime() > Date.now() + 86_400_000) throw new Error('Future dates cannot be marked')

      const { subjects } = await resolveClassScope(user, schoolId, body.classId)
      const teaches = subjects.find((s) => s.id === body.subjectId)
      if (!teaches) throw new Error('FORBIDDEN — you do not teach this subject for this class')

      const teacher = await db.teacher.findUnique({ where: { userId: user.id } })
      if (!teacher) throw new Error('NO_TEACHER_RECORD')

      const students = await db.student.findMany({
        where: { classId: body.classId, user: { status: 'ACTIVE' } },
        select: { id: true },
      })
      const rosterIds = new Set(students.map((s) => s.id))
      const entries = body.entries.filter((e) => rosterIds.has(e.studentId) && isValidStatus(e.status))
      if (entries.length !== rosterIds.size) {
        throw new Error('Every student needs a valid status')
      }

      const session = await db.subjectAttendanceSession.upsert({
        where: {
          classId_subjectId_teacherId_date: {
            classId: body.classId,
            subjectId: body.subjectId,
            teacherId: teacher.id,
            date: day,
          },
        },
        create: {
          schoolId,
          classId: body.classId,
          subjectId: body.subjectId,
          teacherId: teacher.id,
          date: day,
        },
        update: {},
      })

      for (const e of entries) {
        await db.subjectAttendanceEntry.upsert({
          where: {
            sessionId_studentId: { sessionId: session.id, studentId: e.studentId },
          },
          create: { sessionId: session.id, studentId: e.studentId, status: e.status },
          update: { status: e.status },
        })
      }

      const counts = {
        present: entries.filter((e) => e.status === 'PRESENT').length,
        absent: entries.filter((e) => e.status === 'ABSENT').length,
        late: entries.filter((e) => e.status === 'LATE').length,
        leave: entries.filter((e) => e.status === 'LEAVE').length,
      }
      return { saved: entries.length, subjectName: teaches.name, counts }
    },
    { roles: ['TEACHER'] }
  )
}
