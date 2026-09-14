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
import type { SessionItem } from '@/lib/teacher-hub-types'

export const runtime = 'nodejs'

const SESSION_TYPES = [
  'academic',
  'wellbeing',
  'attendance',
  'career',
  'personal-development',
  'general',
]

// POST /api/teacher/mentoring/sessions — log a mentoring session. Logging for
// a student not yet assigned auto-creates the mentoring assignment (honest
// workflow: a first session IS an assignment).
export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const body = await req.json().catch(() => null)
      if (!body || typeof body !== 'object') throw new Error('Invalid request body')

      const student = await assertStudentInScope(ctx, body.studentId)

      const type =
        typeof body.type === 'string' && SESSION_TYPES.includes(body.type) ? body.type : 'general'
      const discussion = parseString(body.discussion, 'Discussion', { required: true, max: 4000 })
      if (!discussion) throw new Error('Discussion is required')
      const date = body.date != null ? parseDate(body.date, 'Date') : new Date()

      let actionItems: string[] = []
      if (body.actionItems != null) {
        if (!Array.isArray(body.actionItems)) throw new Error('Action items must be a list')
        actionItems = body.actionItems
          .filter((i): i is string => typeof i === 'string' && i.trim().length > 0)
          .slice(0, 12)
          .map((i) => i.trim())
      }

      let durationMinutes: number | null = null
      if (body.durationMinutes != null) {
        if (typeof body.durationMinutes !== 'number' || !Number.isFinite(body.durationMinutes)) {
          throw new Error('Duration must be a number')
        }
        durationMinutes = Math.min(Math.max(Math.round(body.durationMinutes), 5), 240)
      }

      let followUpDate: Date | null = null
      if (body.followUpDate != null && body.followUpDate !== '') {
        followUpDate = parseDate(body.followUpDate, 'Follow-up date')
      }

      // Assignment get-or-create (unique teacherId+studentId).
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

      const session = await db.mentoringSession.create({
        data: {
          schoolId: ctx.schoolId,
          assignmentId: assignment.id,
          studentId: student.id,
          teacherId: ctx.userId,
          date,
          type,
          discussion,
          actionItems: actionItems.length ? JSON.stringify(actionItems) : null,
          durationMinutes,
          followUpDate,
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

      if (followUpDate) {
        await db.teacherFollowUp.create({
          data: {
            schoolId: ctx.schoolId,
            teacherId: ctx.userId,
            kind: 'mentoring',
            studentId: student.id,
            sessionId: session.id,
            reason: `Mentoring follow-up — ${student.user?.name ?? 'student'}`,
            dueDate: followUpDate,
            priority: 'normal',
          },
        })
      }

      await auditTeacherAction(
        user,
        ctx.schoolId,
        'MENTORING_SESSION_LOGGED',
        `Session (${type}) with ${student.user?.name ?? 'student'}`,
      )

      const item: SessionItem = {
        id: session.id,
        date: session.date.toISOString(),
        type: session.type as SessionItem['type'],
        discussion: session.discussion,
        actionItems,
        durationMinutes: session.durationMinutes,
        followUpDate: session.followUpDate ? session.followUpDate.toISOString() : null,
        student: toStudentRef(session.student),
      }
      return { session: item }
    },
    { roles: ['TEACHER'] },
  )
}
