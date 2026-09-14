import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import { requireStudent, mySubjects } from '@/lib/learning'

export const runtime = 'nodejs'

/// GET /api/student/study-tasks
///
/// The student's OWN planner tasks (session-resolved student + school —
/// client ids are never trusted). Incomplete first, by due date ascending
/// (undated last), then completed newest-first.
export async function GET() {
  return withUser(
    async (user) => {
      const ctx = await requireStudent(user)
      const tasks = await db.studyTask.findMany({
        where: { studentId: ctx.studentId, schoolId: ctx.schoolId },
        include: { subject: { select: { name: true } } },
      })
      const rank = (t: { completedAt: Date | null; dueDate: Date | null }): number => {
        if (t.completedAt) return 2
        if (t.dueDate) return 0
        return 1
      }
      const sorted = [...tasks].sort((a, b) => {
        const ra = rank(a)
        const rb = rank(b)
        if (ra !== rb) return ra - rb
        if (ra === 2) return b.completedAt!.getTime() - a.completedAt!.getTime()
        if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime()
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
      return {
        tasks: sorted.map((t) => ({
          id: t.id,
          title: t.title,
          subjectId: t.subjectId,
          subjectName: t.subject?.name ?? null,
          dueDate: t.dueDate ? t.dueDate.toISOString() : null,
          completedAt: t.completedAt ? t.completedAt.toISOString() : null,
          createdAt: t.createdAt.toISOString(),
        })),
        subjects: await mySubjects(ctx),
      }
    },
    { roles: ['STUDENT'] },
  )
}

/// POST /api/student/study-tasks
///
/// Body: { title: string (1..200), subjectId?: string, dueDate?: string ISO }
/// Creates a task for the session student. subjectId must resolve to a
/// Subject of THIS school; dueDate must parse as a date.
export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const ctx = await requireStudent(user)

      const body = await req.json().catch(() => ({}))
      const title = typeof body?.title === 'string' ? body.title.trim() : ''
      if (!title || title.length > 200) throw new Error('title is required (max 200 characters)')

      let subjectId: string | null = null
      if (body?.subjectId) {
        const subject = await db.subject.findFirst({
          where: { id: String(body.subjectId), schoolId: ctx.schoolId },
          select: { id: true, name: true },
        })
        if (!subject) throw new Error('Subject not found for this school')
        subjectId = subject.id
      }

      let dueDate: Date | null = null
      if (body?.dueDate) {
        const parsed = new Date(String(body.dueDate))
        if (Number.isNaN(parsed.getTime())) throw new Error('dueDate must be a valid date')
        dueDate = parsed
      }

      const task = await db.studyTask.create({
        data: {
          schoolId: ctx.schoolId,
          studentId: ctx.studentId,
          title,
          subjectId,
          dueDate,
        },
        include: { subject: { select: { name: true } } },
      })

      return {
        id: task.id,
        title: task.title,
        subjectId: task.subjectId,
        subjectName: task.subject?.name ?? null,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedAt: null,
        createdAt: task.createdAt.toISOString(),
      }
    },
    { roles: ['STUDENT'] },
  )
}
