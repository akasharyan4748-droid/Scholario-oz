import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'
import { classLabelOf } from '@/lib/teacher-hub'

export const runtime = 'nodejs'

/**
 * GET /api/teacher/class-attendance — the classes this teacher can mark
 * attendance for:
 *   • classes where she is the CLASS TEACHER (she owns the daily baseline
 *     for the whole class), and
 *   • classes she teaches subjects in (subject-session attendance only,
 *     prefilled from the class teacher's baseline).
 * Class-teacher and subject-teacher capabilities live in ONE workspace —
 * the flag drives the available workflow, not a separate app.
 */
export async function GET() {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const teacherName = (user.name || '').trim().toLowerCase()

      const classTeacherOf = await db.class.findMany({
        where: { schoolId, classTeacherId: user.id },
        select: { id: true, name: true, section: true },
        orderBy: { name: 'asc' },
      })

      // Classes with the teacher's cells on the timetable.
      const ttRows = teacherName
        ? await db.timetable.findMany({
            where: { schoolId, teacherName: { not: null }, subjectId: { not: null } },
            select: {
              classId: true,
              subjectId: true,
              teacherName: true,
              class: { select: { name: true, section: true } },
              subject: { select: { name: true } },
            },
          })
        : []
      const mine = ttRows.filter(
        (r) => (r.teacherName || '').trim().toLowerCase() === teacherName && r.subjectId
      ) as (typeof ttRows[number] & { subjectId: string; subject: { name: string } })[]

      const classesMap = new Map<
        string,
        { classId: string; label: string; isClassTeacher: boolean; subjects: { id: string; name: string }[] }
      >()
      for (const c of classTeacherOf) {
        classesMap.set(c.id, { classId: c.id, label: classLabelOf(c), isClassTeacher: true, subjects: [] })
      }
      for (const r of mine) {
        if (!r.subjectId) continue
        const existing = classesMap.get(r.classId)
        if (existing) {
          if (!existing.subjects.some((s) => s.id === r.subjectId)) {
            existing.subjects.push({ id: r.subjectId, name: r.subject.name })
          }
        } else {
          classesMap.set(r.classId, {
            classId: r.classId,
            label: classLabelOf(r.class),
            isClassTeacher: false,
            subjects: [{ id: r.subjectId, name: r.subject.name }],
          })
        }
      }

      const classes = [...classesMap.values()].sort((a, b) => a.label.localeCompare(b.label))
      for (const c of classes) c.subjects.sort((a, b) => a.name.localeCompare(b.name))
      return { classes }
    },
    { roles: ['TEACHER'] }
  )
}
