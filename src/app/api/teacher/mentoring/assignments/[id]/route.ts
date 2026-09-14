import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import {
  requireTeacher,
  auditTeacherAction,
  parseString,
  toStudentRef,
} from '@/lib/teacher-hub'
import type { MenteeItem } from '@/lib/teacher-hub-types'

export const runtime = 'nodejs'

const STATUSES = ['on-track', 'watch', 'needs-support', 'critical']
const SUPPORT_TYPES = ['academic', 'attendance', 'social', 'wellbeing', 'career', 'general']

// PATCH /api/teacher/mentoring/assignments/[id] — update status / support
// type / notes / active (mentor-private data, owner only).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const { id } = await params

      const existing = await db.mentoringAssignment.findFirst({
        where: { id, schoolId: ctx.schoolId, teacherId: ctx.userId },
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
      if (!existing) throw new Error('Mentoring assignment not found')

      const body = await req.json().catch(() => null)
      if (!body || typeof body !== 'object') throw new Error('Invalid request body')

      const data: { status?: string; supportType?: string; notes?: string | null; active?: boolean } = {}
      if (typeof body.status === 'string' && STATUSES.includes(body.status)) data.status = body.status
      if (typeof body.supportType === 'string' && SUPPORT_TYPES.includes(body.supportType)) {
        data.supportType = body.supportType
      }
      if (body.notes !== undefined) data.notes = parseString(body.notes, 'Notes', { max: 2000 })
      if (typeof body.active === 'boolean') data.active = body.active
      if (Object.keys(data).length === 0) throw new Error('Nothing to update')

      const updated = await db.mentoringAssignment.update({
        where: { id: existing.id },
        data,
      })

      await auditTeacherAction(
        user,
        ctx.schoolId,
        'MENTORING_ASSIGNMENT_UPDATED',
        `Mentee ${existing.student.user?.name ?? 'student'} → ${Object.keys(data).join(', ')}`,
      )

      const mentee: MenteeItem = {
        id: updated.id,
        status: updated.status as MenteeItem['status'],
        supportType: updated.supportType as MenteeItem['supportType'],
        notes: updated.notes,
        active: updated.active,
        createdAt: updated.createdAt.toISOString(),
        student: toStudentRef(existing.student),
        lastSessionAt: null,
        nextFollowUpAt: null,
        goals: { total: 0, achieved: 0, inProgress: 0 },
        sessionCount: 0,
      }
      return { mentee }
    },
    { roles: ['TEACHER'] },
  )
}
