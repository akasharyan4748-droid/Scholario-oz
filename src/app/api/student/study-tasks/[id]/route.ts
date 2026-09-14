import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import { requireStudent } from '@/lib/learning'

export const runtime = 'nodejs'

/// PATCH /api/student/study-tasks/[id]
///
/// Body (any subset): { title?, subjectId?, dueDate?, completed? }
/// `completed: true` stamps completedAt now; `false` clears it. The task
/// must belong to the session student (RLS — another student's task id is
/// a 404, never a write).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withUser(
    async (user) => {
      const ctx = await requireStudent(user)
      const { id } = await params

      const task = await db.studyTask.findUnique({ where: { id } })
      if (!task || task.studentId !== ctx.studentId || task.schoolId !== ctx.schoolId) {
        throw new Error('NOT_FOUND')
      }

      const body = await req.json().catch(() => ({}))
      const data: Record<string, unknown> = {}

      if (body?.title !== undefined) {
        const title = typeof body.title === 'string' ? body.title.trim() : ''
        if (!title || title.length > 200) throw new Error('title is required (max 200 characters)')
        data.title = title
      }
      if (body?.subjectId !== undefined) {
        if (body.subjectId === null || body.subjectId === '') {
          data.subjectId = null
        } else {
          const subject = await db.subject.findFirst({
            where: { id: String(body.subjectId), schoolId: ctx.schoolId },
            select: { id: true },
          })
          if (!subject) throw new Error('Subject not found for this school')
          data.subjectId = subject.id
        }
      }
      if (body?.dueDate !== undefined) {
        if (body.dueDate === null || body.dueDate === '') {
          data.dueDate = null
        } else {
          const parsed = new Date(String(body.dueDate))
          if (Number.isNaN(parsed.getTime())) throw new Error('dueDate must be a valid date')
          data.dueDate = parsed
        }
      }
      if (body?.completed !== undefined) {
        data.completedAt = body.completed ? new Date() : null
      }
      if (Object.keys(data).length === 0) throw new Error('Nothing to update')

      const updated = await db.studyTask.update({
        where: { id },
        data,
        include: { subject: { select: { name: true } } },
      })

      return {
        id: updated.id,
        title: updated.title,
        subjectId: updated.subjectId,
        subjectName: updated.subject?.name ?? null,
        dueDate: updated.dueDate ? updated.dueDate.toISOString() : null,
        completedAt: updated.completedAt ? updated.completedAt.toISOString() : null,
        createdAt: updated.createdAt.toISOString(),
      }
    },
    { roles: ['STUDENT'] },
  )
}

/// DELETE /api/student/study-tasks/[id] — removes the student's own task.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withUser(
    async (user) => {
      const ctx = await requireStudent(user)
      const { id } = await params

      const task = await db.studyTask.findUnique({ where: { id } })
      if (!task || task.studentId !== ctx.studentId || task.schoolId !== ctx.schoolId) {
        throw new Error('NOT_FOUND')
      }
      await db.studyTask.delete({ where: { id } })
      return { id }
    },
    { roles: ['STUDENT'] },
  )
}
