import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import {
  requireTeacher,
  assertStudentInScope,
  auditTeacherAction,
  parseDate,
  parseString,
  toFollowUpItem,
} from '@/lib/teacher-hub'

export const runtime = 'nodejs'

const KINDS = ['parent-connect', 'behavior', 'mentoring']
const PRIORITIES = ['low', 'normal', 'high']

// POST /api/teacher/follow-ups — create a follow-up owned by the authenticated
// teacher. The optional source refs (conversation/record/session) are verified
// against her scope before anything is written.
export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const body = await req.json().catch(() => null)
      if (!body || typeof body !== 'object') throw new Error('Invalid request body')

      const kind = typeof body.kind === 'string' && KINDS.includes(body.kind) ? body.kind : null
      if (!kind) throw new Error('Invalid follow-up kind')

      const reason = parseString(body.reason, 'Reason', { required: true, max: 300 })
      if (!reason) throw new Error('Reason is required')
      const note = parseString(body.note, 'Note', { max: 1000 })
      const dueDate = parseDate(body.dueDate, 'Due date')
      const priority =
        typeof body.priority === 'string' && PRIORITIES.includes(body.priority)
          ? body.priority
          : 'normal'

      // Resolve + validate the student (also anchors school scoping).
      let studentId: string | null = null
      if (body.studentId != null) {
        const student = await assertStudentInScope(ctx, body.studentId)
        studentId = student.id
      }

      // Validate any source reference against the teacher's ownership.
      let conversationId: string | null = null
      if (body.conversationId != null) {
        const conversation = await db.parentConversation.findFirst({
          where: {
            id: typeof body.conversationId === 'string' ? body.conversationId : '',
            schoolId: ctx.schoolId,
            teacherId: ctx.userId,
          },
          select: { id: true, studentId: true },
        })
        if (!conversation) throw new Error('Conversation not found')
        conversationId = conversation.id
        studentId = studentId ?? conversation.studentId
      }

      let recordId: string | null = null
      if (body.recordId != null) {
        const record = await db.behaviorRecord.findFirst({
          where: {
            id: typeof body.recordId === 'string' ? body.recordId : '',
            schoolId: ctx.schoolId,
            OR: [{ recordedById: ctx.userId }, { student: { classId: { in: ctx.classTeacherOf.map((c) => c.id) } } }],
          },
          select: { id: true, studentId: true },
        })
        if (!record) throw new Error('Behavior record not found')
        recordId = record.id
        studentId = studentId ?? record.studentId
      }

      let sessionId: string | null = null
      if (body.sessionId != null) {
        const session = await db.mentoringSession.findFirst({
          where: {
            id: typeof body.sessionId === 'string' ? body.sessionId : '',
            schoolId: ctx.schoolId,
            teacherId: ctx.userId,
          },
          select: { id: true, studentId: true },
        })
        if (!session) throw new Error('Mentoring session not found')
        sessionId = session.id
        studentId = studentId ?? session.studentId
      }

      const created = await db.teacherFollowUp.create({
        data: {
          schoolId: ctx.schoolId,
          teacherId: ctx.userId,
          kind,
          studentId,
          conversationId,
          recordId,
          sessionId,
          reason,
          note,
          dueDate,
          priority,
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
        'TEACHER_FOLLOW_UP_CREATED',
        `Follow-up (${kind}) "${reason}" due ${dueDate.toISOString().slice(0, 10)}`,
      )

      return { followUp: toFollowUpItem(created) }
    },
    { roles: ['TEACHER'] },
  )
}
