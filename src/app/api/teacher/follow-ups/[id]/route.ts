import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import {
  requireTeacher,
  auditTeacherAction,
  parseDate,
  parseString,
  toFollowUpItem,
} from '@/lib/teacher-hub'

export const runtime = 'nodejs'

const STATUSES = ['open', 'done', 'cancelled']

// PATCH /api/teacher/follow-ups/[id] — complete / cancel / reschedule / re-note.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const { id } = await params

      const existing = await db.teacherFollowUp.findFirst({
        where: { id, schoolId: ctx.schoolId, teacherId: ctx.userId },
      })
      if (!existing) throw new Error('Follow-up not found')

      const body = await req.json().catch(() => null)
      if (!body || typeof body !== 'object') throw new Error('Invalid request body')

      const data: {
        status?: string
        dueDate?: Date
        note?: string | null
        completedAt?: Date | null
      } = {}
      if (typeof body.status === 'string' && STATUSES.includes(body.status)) {
        data.status = body.status
        data.completedAt = body.status === 'done' ? new Date() : null
      }
      if (body.dueDate != null) data.dueDate = parseDate(body.dueDate, 'Due date')
      if (body.note !== undefined) data.note = parseString(body.note, 'Note', { max: 1000 })
      if (Object.keys(data).length === 0) throw new Error('Nothing to update')

      const updated = await db.teacherFollowUp.update({
        where: { id: existing.id },
        data,
        include: {
          student: {
            select: {
              id: true,
              rollNo: true,
              classId: true,
              class: { select: { name: true, section: true } },
              user: { select: { name: true } },
            },
          },
        },
      })

      await auditTeacherAction(
        user,
        ctx.schoolId,
        'TEACHER_FOLLOW_UP_UPDATED',
        `Follow-up "${existing.reason}" → ${data.status ?? 'rescheduled'}`,
      )

      return { followUp: toFollowUpItem(updated) }
    },
    { roles: ['TEACHER'] },
  )
}
