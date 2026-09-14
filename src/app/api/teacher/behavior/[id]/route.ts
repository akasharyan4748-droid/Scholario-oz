import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import {
  requireTeacher,
  auditTeacherAction,
  parseDate,
  toBehaviorRecordItem,
} from '@/lib/teacher-hub'

export const runtime = 'nodejs'

const STATUSES = ['open', 'monitoring', 'resolved']

// PATCH /api/teacher/behavior/[id] — update status / follow-up date / parent
// notification. Visible-scope rule: the recorder or the student's class
// teacher may update (class teachers close the loop on their class).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const { id } = await params

      const existing = await db.behaviorRecord.findFirst({
        where: {
          id,
          schoolId: ctx.schoolId,
          OR: [
            { recordedById: ctx.userId },
            { student: { classId: { in: ctx.classTeacherOf.map((c) => c.id) } } },
          ],
        },
      })
      if (!existing) throw new Error('Behavior record not found')

      const body = await req.json().catch(() => null)
      if (!body || typeof body !== 'object') throw new Error('Invalid request body')

      const data: { status?: string; followUpDate?: Date | null; parentNotified?: boolean } = {}
      if (typeof body.status === 'string' && STATUSES.includes(body.status)) {
        data.status = body.status
      }
      if (body.followUpDate !== undefined) {
        data.followUpDate = body.followUpDate == null ? null : parseDate(body.followUpDate, 'Follow-up date')
      }
      if (typeof body.parentNotified === 'boolean') data.parentNotified = body.parentNotified
      if (Object.keys(data).length === 0) throw new Error('Nothing to update')

      const updated = await db.behaviorRecord.update({
        where: { id: existing.id },
        data,
        include: {
          student: {
            select: {
              id: true,
              rollNo: true,
              class: { select: { name: true, section: true } },
              user: { select: { name: true } },
            },
          },
          recordedBy: { select: { id: true, name: true } },
        },
      })

      await auditTeacherAction(
        user,
        ctx.schoolId,
        'BEHAVIOR_RECORD_UPDATED',
        `Record ${existing.id} → ${Object.keys(data).join(', ')}`,
      )

      return { record: toBehaviorRecordItem(updated) }
    },
    { roles: ['TEACHER'] },
  )
}
