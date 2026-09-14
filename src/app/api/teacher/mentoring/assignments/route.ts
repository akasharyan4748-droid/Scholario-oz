import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import {
  requireTeacher,
  assertStudentInScope,
  auditTeacherAction,
  parseString,
  toStudentRef,
} from '@/lib/teacher-hub'
import type { MenteeItem } from '@/lib/teacher-hub-types'

export const runtime = 'nodejs'

const STATUSES = ['on-track', 'watch', 'needs-support', 'critical']
const SUPPORT_TYPES = ['academic', 'attendance', 'social', 'wellbeing', 'career', 'general']

// POST /api/teacher/mentoring/assignments — add (or reactivate) a mentee.
export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const body = await req.json().catch(() => null)
      if (!body || typeof body !== 'object') throw new Error('Invalid request body')

      const student = await assertStudentInScope(ctx, body.studentId)

      const status =
        typeof body.status === 'string' && STATUSES.includes(body.status) ? body.status : 'on-track'
      const supportType =
        typeof body.supportType === 'string' && SUPPORT_TYPES.includes(body.supportType)
          ? body.supportType
          : 'general'
      const notes = parseString(body.notes, 'Notes', { max: 2000 })

      const assignment = await db.mentoringAssignment.upsert({
        where: { teacherId_studentId: { teacherId: ctx.userId, studentId: student.id } },
        create: {
          schoolId: ctx.schoolId,
          teacherId: ctx.userId,
          studentId: student.id,
          status,
          supportType,
          notes,
        },
        update: { status, supportType, notes, active: true },
      })

      await auditTeacherAction(
        user,
        ctx.schoolId,
        'MENTORING_ASSIGNMENT_CREATED',
        `Mentee ${student.user?.name ?? 'student'} (${status})`,
      )

      const mentee: MenteeItem = {
        id: assignment.id,
        status: assignment.status as MenteeItem['status'],
        supportType: assignment.supportType as MenteeItem['supportType'],
        notes: assignment.notes,
        active: assignment.active,
        createdAt: assignment.createdAt.toISOString(),
        student: toStudentRef(student),
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
