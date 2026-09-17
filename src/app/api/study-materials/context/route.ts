import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

/// STUDY MATERIALS — upload context (staff roles only).
///
/// GET /api/study-materials/context
///   Everything the "Add Material" dialog needs, tenant-scoped:
///     · classes   — the school's classes (for CLASS targeting)
///     · students  — per-class roster {id, name, className} (STUDENTS targeting)
///     · subjects  — distinct subject names (Subject + ClassSubjectAssignment)
///   The client NEVER receives anything it could use to address another
///   school's records.

export async function GET() {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      if (!['PRINCIPAL', 'MANAGEMENT', 'TEACHER'].includes(user.role)) {
        throw new Error('FORBIDDEN')
      }

      const classes = await db.class.findMany({
        where: { schoolId },
        select: { id: true, name: true, section: true },
        orderBy: { name: 'asc' },
      })

      const students = await db.student.findMany({
        where: { schoolId },
        select: {
          id: true,
          rollNo: true,
          admissionNo: true,
          classId: true,
          user: { select: { name: true } },
        },
        orderBy: [{ classId: 'asc' }, { rollNo: 'asc' }],
      })

      const subjectRows = await db.subject.findMany({
        where: { schoolId, status: 'Active' },
        select: { name: true },
        distinct: ['name'],
        orderBy: { name: 'asc' },
      })

      return {
        classes: classes.map((c) => ({ id: c.id, name: c.name })),
        students: students.map((s) => ({
          id: s.id,
          name: s.user?.name ?? s.admissionNo ?? s.id.slice(-6),
          rollNo: s.rollNo ?? '',
          classId: s.classId ?? '',
        })),
        subjects: subjectRows.map((s) => s.name),
      }
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT', 'TEACHER'] }
  )
}
