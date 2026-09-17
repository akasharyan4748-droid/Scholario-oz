import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import {
  requireTeacher,
  assertStudentInScope,
  visibleBehaviorWhere,
  toBehaviorRecordItem,
  toFollowUpItem,
  toStudentRef,
} from '@/lib/teacher-hub'
import type { StudentBehaviorProfile } from '@/lib/teacher-hub-types'

export const runtime = 'nodejs'

// GET /api/teacher/behavior/student/[studentId] — one student's behavior
// profile: full visible record timeline, counts, open follow-ups, plus the
// existing parent conversation link (when any).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> },
) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const { studentId } = await params
      const student = await assertStudentInScope(ctx, studentId)

      const [records, followUpRows, conversation] = await Promise.all([
        db.behaviorRecord.findMany({
          where: { ...visibleBehaviorWhere(ctx), studentId: student.id },
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
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          take: 100,
        }),
        db.teacherFollowUp.findMany({
          where: {
            schoolId: ctx.schoolId,
            teacherId: ctx.userId,
            kind: 'behavior',
            status: 'open',
            studentId: student.id,
          },
          include: {
            student: {
              select: {
                id: true,
                rollNo: true,
                class: { select: { name: true, section: true } },
                user: { select: { name: true } },
              },
            },
          },
          orderBy: { dueDate: 'asc' },
        }),
        db.parentConversation.findFirst({
          where: { schoolId: ctx.schoolId, teacherId: ctx.userId, studentId: student.id },
          select: { id: true },
        }),
      ])

      const items = records.map(toBehaviorRecordItem)
      const payload: StudentBehaviorProfile = {
        student: toStudentRef(student),
        records: items,
        counts: {
          positive: items.filter((r) => r.type === 'positive').length,
          observation: items.filter((r) => r.type === 'observation').length,
          concern: items.filter((r) => r.type === 'concern').length,
          open: items.filter((r) => r.type === 'concern' && r.status !== 'resolved').length,
        },
        followUps: followUpRows.map(toFollowUpItem),
        conversationId: conversation?.id ?? null,
      }
      return payload
    },
    { roles: ['TEACHER'] },
  )
}
