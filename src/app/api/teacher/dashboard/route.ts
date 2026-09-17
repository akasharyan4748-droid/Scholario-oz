import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'
import { classLabelOf } from '@/lib/teacher-hub'
import { getTeachingAssignments, getLessonPlan } from '@/lib/lesson-planner'
import { audienceAllows } from '@/lib/notices'
import { dayKey } from '@/lib/lesson-schedule'

export const runtime = 'nodejs'

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * GET /api/teacher/dashboard — ONE aggregate for the Teacher Dashboard:
 * identity, teaching assignments, today's periods (real timetable),
 * class-teacher attendance snapshot for today, curriculum progress with
 * today's topic per assignment, Teacher Hub pending counts and the
 * latest school notices. Sections fail independently (allSettled).
 */
export async function GET() {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const today = new Date()
      const todayDayKey = dayKey(today)
      const weekday = WEEKDAY_NAMES[today.getDay()]
      const teacherName = (user.name || '').trim().toLowerCase()

      const teacher = await db.teacher.findUnique({ where: { userId: user.id } })

      const assignments = await getTeachingAssignments(user)

      // ── Today's periods (the teacher's own cells on today's weekday) ──
      const myCells = teacherName
        ? (
            await db.timetable.findMany({
              where: { schoolId, day: weekday, teacherName: { not: null } },
              include: {
                class: { select: { name: true, section: true } },
                subject: { select: { name: true } },
              },
              orderBy: { period: 'asc' },
            })
          ).filter((r) => (r.teacherName || '').trim().toLowerCase() === teacherName)
        : []

      // ── Class-teacher classes + today's attendance snapshot ──────────
      const classTeacherOf = await db.class.findMany({
        where: { schoolId, classTeacherId: user.id },
        select: { id: true, name: true, section: true, students: { select: { id: true } } },
        orderBy: { name: 'asc' },
      })
      const attendanceSnapshots = await Promise.all(
        classTeacherOf.map(async (c) => {
          const rows = await db.attendance.findMany({
            where: {
              classId: c.id,
              date: { gte: new Date(`${todayDayKey}T00:00:00.000Z`), lt: new Date(`${todayDayKey}T23:59:59.999Z`) },
            },
            select: { status: true },
          })
          return {
            classId: c.id,
            classLabel: classLabelOf(c),
            studentCount: c.students.length,
            marked: rows.length > 0,
            counts: {
              present: rows.filter((r) => r.status === 'PRESENT').length,
              absent: rows.filter((r) => r.status === 'ABSENT').length,
              late: rows.filter((r) => r.status === 'LATE').length,
              leave: rows.filter((r) => r.status === 'LEAVE').length,
            },
          }
        })
      )

      // ── Curriculum progress + today's topic per teaching assignment ──
      const curriculum = await Promise.all(
        assignments.map(async (a) => {
          try {
            const plan = await getLessonPlan(user, a.classId, a.subjectId)
            if (!plan) return null
            return {
              classId: a.classId,
              classLabel: a.classLabel,
              subjectId: a.subjectId,
              subjectName: a.subjectName,
              progress: plan.progress,
              todayTopic: plan.today.topic
                ? {
                    topicName: plan.today.topic.topicName,
                    unitName: plan.today.topic.unitName,
                    status: plan.today.topic.status,
                    endDate: plan.today.topic.endDate,
                  }
                : null,
              todayReason: plan.today.reason,
            }
          } catch {
            return null
          }
        })
      )

      // ── Teacher Hub pending counts ───────────────────────────────────
      // NOTE: ParentConversation.teacherId is the TEACHER'S USER id (the
      // seeded hub contract), while follow-ups/behavior use Teacher row ids.
      const hub = await (async () => {
        const [unreadRows, followUps, openConcerns] = await Promise.all([
          db.parentMessage.count({
            where: { conversation: { teacherId: user.id }, readAt: null, senderId: { not: user.id } },
          }),
          teacher
            ? db.teacherFollowUp.count({ where: { schoolId, teacherId: teacher.id, status: 'open' } })
            : Promise.resolve(0),
          db.behaviorRecord.count({ where: { schoolId, type: 'concern', status: { in: ['open', 'monitoring'] } } }),
        ])
        return { unreadMessages: unreadRows, openFollowUps: followUps, openConcerns }
      })()

      // ── Latest notices for staff ─────────────────────────────────────
      const noticeRows = (
        await db.notification.findMany({
          where: { schoolId },
          include: { sender: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 40,
        })
      ).filter((n) => audienceAllows(n.audience, user))
      const notices = noticeRows.slice(0, 3).map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        priority: n.priority,
        sender: n.sender?.name ?? 'School',
        createdAt: n.createdAt.toISOString(),
      }))

      return {
        teacher: {
          name: user.name ?? 'Teacher',
          employeeId: teacher?.employeeId ?? null,
        },
        today: {
          weekday,
          date: todayDayKey,
          periods: myCells.map((r) => ({
            period: r.period,
            startTime: r.startTime,
            endTime: r.endTime,
            subjectName: r.subject?.name ?? 'Subject',
            classLabel: classLabelOf(r.class),
            room: r.room,
          })),
        },
        assignments: assignments.map((a) => ({
          classId: a.classId,
          classLabel: a.classLabel,
          subjectId: a.subjectId,
          subjectName: a.subjectName,
          periodsPerWeek: a.periodsPerWeek,
        })),
        classTeacherOf: attendanceSnapshots.map((s) => ({
          classId: s.classId,
          classLabel: s.classLabel,
          studentCount: s.studentCount,
        })),
        attendance: attendanceSnapshots,
        curriculum: curriculum.filter((c): c is NonNullable<typeof c> => c !== null),
        hub,
        notices,
      }
    },
    { roles: ['TEACHER'] }
  )
}
