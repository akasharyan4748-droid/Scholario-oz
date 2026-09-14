import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import {
  requireStudent,
  authorizedMaterials,
  subjectNamesById,
  type LearningMaterialCard,
} from '@/lib/learning'
import { toStudyMaterialMeta } from '@/lib/study-materials'

export const runtime = 'nodejs'

/// GET /api/student/study-groups/[id]
///
/// One group (school-scoped — a foreign id is a 404) with:
///   questions        PUBLISHED questions + the caller's own PENDING ones
///                    (an honest "Pending moderation" state, spec §29) —
///                    authors carry school-scoped identity ONLY (name +
///                    class label — never contact details, spec §28)
///   sharedResources  authorized materials, scoped to the group's subject
///                    when it has one
///   isMember/memberCount
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withUser(
    async (user) => {
      const ctx = await requireStudent(user)
      const { id } = await params

      const group = await db.studyGroup.findUnique({
        where: { id },
        include: {
          subject: { select: { name: true } },
          _count: { select: { members: true } },
        },
      })
      if (!group || group.schoolId !== ctx.schoolId) throw new Error('NOT_FOUND')

      const [membership, questions, materials] = await Promise.all([
        db.studyGroupMember.findUnique({
          where: { groupId_studentId: { groupId: id, studentId: ctx.studentId } },
        }),
        db.studyGroupQuestion.findMany({
          where: {
            groupId: id,
            OR: [{ status: 'published' }, { studentId: ctx.studentId, status: 'pending' }],
          },
          orderBy: { createdAt: 'desc' },
          include: {
            student: {
              include: { user: { select: { name: true } }, class: { select: { name: true } } },
            },
          },
        }),
        authorizedMaterials(ctx, group.subjectId ? { subjectId: group.subjectId } : {}),
      ])

      const nameById = await subjectNamesById(ctx.schoolId, materials.map((m) => m.subjectId))

      const cards: LearningMaterialCard[] = materials.slice(0, 8).map((m) => {
        const meta = toStudyMaterialMeta(m, m.subjectId ? nameById.get(m.subjectId) ?? null : null)
        return {
          ...meta,
          createdAt: meta.createdAt.toISOString(),
          publishedAt: meta.publishedAt ? meta.publishedAt.toISOString() : null,
          // Honest per-student state is not fetched here (this list is a
          // compact resource index for the group, not the personal view).
          opened: false,
          completed: false,
          bookmarked: false,
          lastOpenedAt: null,
        }
      })

      return {
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
          subjectId: group.subjectId,
          subjectName: group.subject?.name ?? null,
          memberCount: group._count.members,
          isMember: !!membership,
        },
        questions: questions.map((q) => ({
          id: q.id,
          question: q.question,
          status: q.status,
          createdAt: q.createdAt.toISOString(),
          isMine: q.studentId === ctx.studentId,
          author: {
            name: q.student.user?.name ?? 'Student',
            classLabel: q.student.class?.name ?? null,
          },
        })),
        sharedResources: cards,
      }
    },
    { roles: ['STUDENT'] },
  )
}
