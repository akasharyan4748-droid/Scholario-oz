import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'
import { parseDateParam, resolveClassScope } from '@/lib/class-attendance'
import { classLabelOf } from '@/lib/teacher-hub'

export const runtime = 'nodejs'

/**
 * GET /api/teacher/class-attendance/board?classId=&date= — one attendance
 * board: the roster, the class-teacher baseline for that date (what
 * subject teachers prefill from), the caller's own subject sessions for
 * that date. Reading NEVER writes anything.
 */
export async function GET(request: Request) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const url = new URL(request.url)
      const classId = url.searchParams.get('classId')
      const date = url.searchParams.get('date')
      if (!classId) throw new Error('classId is required')
      const day = parseDateParam(date)
      const nextDay = new Date(day.getTime() + 86_400_000)

      const { isClassTeacher, subjects } = await resolveClassScope(user, schoolId, classId)
      const cls = await db.class.findUnique({
        where: { id: classId },
        select: { name: true, section: true },
      })
      const students = await db.student.findMany({
        where: { classId, user: { status: 'ACTIVE' } },
        select: { id: true, rollNo: true, user: { select: { name: true } } },
        orderBy: { rollNo: 'asc' },
      })

      // Class-teacher baseline for the date (official daily record).
      // Dedupe by student (latest row wins) — legacy rows may carry times.
      const baselineRaw = await db.attendance.findMany({
        where: { classId, date: { gte: day, lt: nextDay } },
        select: { studentId: true, status: true, markedBy: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      })
      const byStudent = new Map<string, (typeof baselineRaw)[number]>()
      for (const r of baselineRaw) byStudent.set(r.studentId, r)
      const baselineRows = [...byStudent.values()]
      const baseline =
        baselineRows.length > 0
          ? {
              exists: true,
              entries: Object.fromEntries(baselineRows.map((r) => [r.studentId, r.status])) as Record<string, string>,
              markedBy: baselineRows[0]?.markedBy ?? null,
              savedAt: baselineRows[0]?.createdAt?.toISOString() ?? null,
              counts: {
                present: baselineRows.filter((r) => r.status === 'PRESENT').length,
                absent: baselineRows.filter((r) => r.status === 'ABSENT').length,
                late: baselineRows.filter((r) => r.status === 'LATE').length,
                leave: baselineRows.filter((r) => r.status === 'LEAVE').length,
              },
            }
          : { exists: false, entries: {}, markedBy: null, savedAt: null, counts: { present: 0, absent: 0, late: 0, leave: 0 } }

      // The caller's own subject sessions for the date.
      const teacher = await db.teacher.findUnique({ where: { userId: user.id } })
      const sessions = teacher
        ? await db.subjectAttendanceSession.findMany({
            where: { schoolId, classId, teacherId: teacher.id, date: { gte: day, lt: nextDay } },
            include: {
              subject: { select: { id: true, name: true } },
              entries: { select: { studentId: true, status: true } },
            },
          })
        : []
      const mySessions = Object.fromEntries(
        sessions.map((s) => [
          s.subject.id,
          {
            subjectId: s.subject.id,
            subjectName: s.subject.name,
            savedAt: s.createdAt.toISOString(),
            entries: Object.fromEntries(s.entries.map((e) => [e.studentId, e.status])) as Record<string, string>,
          },
        ])
      )

      return {
        classId,
        label: cls ? classLabelOf(cls) : 'Class',
        date: url.searchParams.get('date') ?? new Date().toISOString().slice(0, 10),
        isClassTeacher,
        subjects,
        students: students.map((s) => ({ id: s.id, rollNo: s.rollNo, name: s.user?.name ?? 'Student' })),
        baseline,
        mySessions,
      }
    },
    { roles: ['TEACHER'] }
  )
}
