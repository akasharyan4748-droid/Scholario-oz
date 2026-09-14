import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import {
  requireTeacher,
  assertStudentInScope,
  auditTeacherAction,
  parseDate,
  parseString,
  toStudentRef,
} from '@/lib/teacher-hub'
import type { GoalItem } from '@/lib/teacher-hub-types'

export const runtime = 'nodejs'

const GOAL_STATUSES = ['not-started', 'in-progress', 'on-track', 'achieved', 'paused']

// POST /api/teacher/mentoring/goals — create a student goal for a mentee.
export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const body = await req.json().catch(() => null)
      if (!body || typeof body !== 'object') throw new Error('Invalid request body')

      const student = await assertStudentInScope(ctx, body.studentId)

      const title = parseString(body.title, 'Goal', { required: true, max: 200 })
      if (!title) throw new Error('Goal is required')
      const target = parseString(body.target, 'Target', { max: 200 })
      const status =
        typeof body.status === 'string' && GOAL_STATUSES.includes(body.status)
          ? body.status
          : 'in-progress'
      let reviewDate: Date | null = null
      if (body.reviewDate != null && body.reviewDate !== '') {
        reviewDate = parseDate(body.reviewDate, 'Review date')
      }

      // Assignment get-or-create (a goal implies a mentoring relationship).
      const assignment = await db.mentoringAssignment.upsert({
        where: { teacherId_studentId: { teacherId: ctx.userId, studentId: student.id } },
        create: {
          schoolId: ctx.schoolId,
          teacherId: ctx.userId,
          studentId: student.id,
          status: 'on-track',
          supportType: 'general',
        },
        update: {},
      })

      const goal = await db.mentoringGoal.create({
        data: {
          schoolId: ctx.schoolId,
          assignmentId: assignment.id,
          studentId: student.id,
          teacherId: ctx.userId,
          title,
          target,
          reviewDate,
          status,
        },
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
        'MENTORING_GOAL_CREATED',
        `Goal "${title}" for ${student.user?.name ?? 'student'}`,
      )

      const item: GoalItem = {
        id: goal.id,
        title: goal.title,
        target: goal.target,
        reviewDate: goal.reviewDate ? goal.reviewDate.toISOString() : null,
        status: goal.status as GoalItem['status'],
        createdAt: goal.createdAt.toISOString(),
        student: toStudentRef(goal.student),
      }
      return { goal: item }
    },
    { roles: ['TEACHER'] },
  )
}
