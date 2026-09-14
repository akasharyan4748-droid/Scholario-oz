import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import { requireTeacher, auditTeacherAction, classLabelOf } from '@/lib/teacher-hub'
import type { GoalItem } from '@/lib/teacher-hub-types'

export const runtime = 'nodejs'

const GOAL_STATUSES = ['not-started', 'in-progress', 'on-track', 'achieved', 'paused']

// PATCH /api/teacher/mentoring/goals/[id] — update a goal's status (owner only).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const { id } = await params

      const existing = await db.mentoringGoal.findFirst({
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
      if (!existing) throw new Error('Goal not found')

      const body = await req.json().catch(() => null)
      if (!body || typeof body !== 'object') throw new Error('Invalid request body')
      const status = typeof body.status === 'string' && GOAL_STATUSES.includes(body.status) ? body.status : null
      if (!status) throw new Error('Invalid goal status')

      const updated = await db.mentoringGoal.update({
        where: { id: existing.id },
        data: { status },
      })

      await auditTeacherAction(
        user,
        ctx.schoolId,
        'MENTORING_GOAL_UPDATED',
        `Goal "${existing.title}" for ${existing.student.user?.name ?? 'student'} → ${status}`,
      )

      const item: GoalItem = {
        id: updated.id,
        title: updated.title,
        target: updated.target,
        reviewDate: updated.reviewDate ? updated.reviewDate.toISOString() : null,
        status: updated.status as GoalItem['status'],
        createdAt: updated.createdAt.toISOString(),
        student: {
          id: existing.student.id,
          name: existing.student.user?.name ?? 'Unnamed student',
          rollNo: existing.student.rollNo,
          classLabel: classLabelOf(existing.student.class),
          classId: existing.student.classId ?? null,
        },
      }
      return { goal: item }
    },
    { roles: ['TEACHER'] },
  )
}
