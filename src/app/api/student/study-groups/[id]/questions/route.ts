import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import { requireStudent } from '@/lib/learning'

export const runtime = 'nodejs'

/// POST /api/student/study-groups/[id]/questions
///
/// Body: { question: string (5..500) }
///
/// Creates the caller's question in PENDING state — it stays invisible to
/// classmates until a teacher/principal publishes it (spec §29: honest
/// moderation, never uncontrolled public student content). The group must
/// belong to the caller's school (RLS).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withUser(
    async (user) => {
      const ctx = await requireStudent(user)
      const { id } = await params

      const group = await db.studyGroup.findUnique({ where: { id } })
      if (!group || group.schoolId !== ctx.schoolId) throw new Error('NOT_FOUND')

      const body = await req.json().catch(() => ({}))
      const question = typeof body?.question === 'string' ? body.question.trim() : ''
      if (question.length < 5 || question.length > 500) {
        throw new Error('question must be between 5 and 500 characters')
      }

      const row = await db.studyGroupQuestion.create({
        data: {
          groupId: id,
          schoolId: ctx.schoolId,
          studentId: ctx.studentId,
          question,
          status: 'pending',
        },
      })

      return {
        id: row.id,
        question: row.question,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        isMine: true,
        author: null,
      }
    },
    { roles: ['STUDENT'] },
  )
}
