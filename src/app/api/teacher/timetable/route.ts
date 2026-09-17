import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'
import { classLabelOf } from '@/lib/teacher-hub'

export const runtime = 'nodejs'

/**
 * GET /api/teacher/timetable — the teacher's OWN weekly schedule.
 *
 * PERMISSION MODEL (server-decided, school-scoped):
 *   · rows — Timetable cells of this school whose teacherName matches the
 *     signed-in teacher (case-insensitive trim — the same resolution rule
 *     the Dashboard and Lesson Planner use);
 *   · a teacher can never see another teacher's cells: the name filter is
 *     applied server-side before anything is returned;
 *   · subjects/classes come from the row relations, never fabricated.
 *
 * Shape: { cells, stats, academicSession } where cells is a flat list of
 * { day, period, startTime, endTime, subjectName, classLabel, room }.
 */
export async function GET() {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const teacherName = (user.name || '').trim().toLowerCase()

      const rows = teacherName
        ? (
            await db.timetable.findMany({
              where: { schoolId, teacherName: { not: null } },
              include: {
                class: { select: { name: true, section: true } },
                subject: { select: { name: true } },
              },
              orderBy: [{ period: 'asc' }],
            })
          ).filter((r) => (r.teacherName || '').trim().toLowerCase() === teacherName)
        : []

      const cells = rows.map((r) => ({
        day: r.day,
        period: r.period,
        startTime: r.startTime,
        endTime: r.endTime,
        subjectName: r.subject?.name ?? 'Subject',
        classLabel: classLabelOf(r.class),
        room: r.room,
      }))

      const classes = new Set(cells.map((c) => c.classLabel))
      const subjects = new Set(cells.map((c) => c.subjectName))
      const days = new Set(cells.map((c) => c.day))

      const school = await db.school.findUnique({
        where: { id: schoolId },
        select: { academicYear: true },
      })

      return {
        cells,
        stats: {
          periodsPerWeek: cells.length,
          classes: classes.size,
          subjects: subjects.size,
          teachingDays: days.size,
        },
        academicSession: school?.academicYear ?? null,
      }
    },
    { roles: ['TEACHER'] }
  )
}
