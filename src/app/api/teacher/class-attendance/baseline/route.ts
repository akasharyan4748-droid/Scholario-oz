import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'
import { parseDateParam, resolveClassScope, isValidStatus } from '@/lib/class-attendance'

export const runtime = 'nodejs'

interface BaselineBody {
  classId?: string
  date?: string
  entries?: { studentId: string; status: string }[]
}

/**
 * POST /api/teacher/class-attendance/baseline — the CLASS TEACHER saves
 * the official daily attendance for her class. Upserts the canonical
 * Attendance rows (unique per student+date) that students/parents see and
 * that subject teachers prefill from. Only the class teacher of this
 * class may write the baseline; the roster is re-derived server-side and
 * every status is validated.
 */
export async function POST(request: Request) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = (await request.json().catch(() => null)) as BaselineBody | null
      if (!body?.classId || !body?.date || !Array.isArray(body.entries) || body.entries.length === 0) {
        throw new Error('classId, date and entries are required')
      }
      const day = parseDateParam(body.date)
      if (day.getTime() > Date.now() + 86_400_000) throw new Error('Future dates cannot be marked')

      const { isClassTeacher } = await resolveClassScope(user, schoolId, body.classId)
      if (!isClassTeacher) throw new Error('FORBIDDEN — only the class teacher can save the daily baseline')

      // Roster truth comes from the server, never the request.
      const students = await db.student.findMany({
        where: { classId: body.classId, user: { status: 'ACTIVE' } },
        select: { id: true },
      })
      const rosterIds = new Set(students.map((s) => s.id))
      const entries = body.entries.filter(
        (e) => rosterIds.has(e.studentId) && isValidStatus(e.status)
      )
      if (entries.length !== rosterIds.size) {
        throw new Error('Every student needs a valid status')
      }

      // The baseline save is authoritative for the whole class-day: replace
      // any rows in the day window (legacy rows may carry non-midnight
      // times — deleteMany by range avoids unique-constraint collisions)
      // and write one canonical row per student at midnight UTC.
      const nextDay = new Date(day.getTime() + 86_400_000)
      await db.attendance.deleteMany({
        where: { classId: body.classId, date: { gte: day, lt: nextDay } },
      })
      for (const e of entries) {
        await db.attendance.create({
          data: {
            schoolId,
            studentId: e.studentId,
            classId: body.classId,
            date: day,
            status: e.status,
            markedBy: user.name ?? 'Class Teacher',
          },
        })
      }

      const counts = {
        present: entries.filter((e) => e.status === 'PRESENT').length,
        absent: entries.filter((e) => e.status === 'ABSENT').length,
        late: entries.filter((e) => e.status === 'LATE').length,
        leave: entries.filter((e) => e.status === 'LEAVE').length,
      }
      return { saved: entries.length, counts }
    },
    { roles: ['TEACHER'] }
  )
}
