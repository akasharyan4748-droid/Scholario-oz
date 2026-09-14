import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import { requireStudent, subjectNamesById } from '@/lib/learning'

export const runtime = 'nodejs'

/// GET /api/student/study-groups
///
/// The school's study groups with REAL member counts (StudyGroupMember
/// rows — never display constants) and the caller's membership flag.
/// Academic identity only: name, subject, member count (spec §26-27).
export async function GET() {
  return withUser(
    async (user) => {
      const ctx = await requireStudent(user)

      const [groups, memberships] = await Promise.all([
        db.studyGroup.findMany({
          where: { schoolId: ctx.schoolId },
          orderBy: { createdAt: 'asc' },
          include: { _count: { select: { members: true } } },
        }),
        db.studyGroupMember.findMany({
          where: { studentId: ctx.studentId, group: { schoolId: ctx.schoolId } },
          select: { groupId: true },
        }),
      ])

      const nameById = await subjectNamesById(ctx.schoolId, groups.map((g) => g.subjectId))
      const myGroups = new Set(memberships.map((m) => m.groupId))

      return {
        groups: groups.map((g) => ({
          id: g.id,
          name: g.name,
          description: g.description,
          subjectId: g.subjectId,
          subjectName: g.subjectId ? nameById.get(g.subjectId) ?? null : null,
          memberCount: g._count.members,
          isMember: myGroups.has(g.id),
        })),
      }
    },
    { roles: ['STUDENT'] },
  )
}
