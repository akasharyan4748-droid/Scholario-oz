import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import {
  requireTeacher,
  assertStudentInScope,
  authorizedStudentWhere,
  visibleBehaviorWhere,
  auditTeacherAction,
  parseDate,
  parseString,
  toBehaviorRecordItem,
  toFollowUpItem,
  toStudentRef,
} from '@/lib/teacher-hub'
import type { BehaviorPayload } from '@/lib/teacher-hub-types'

export const runtime = 'nodejs'

const TYPES = ['positive', 'observation', 'concern']

const STUDENT_SELECT = {
  id: true,
  rollNo: true,
  classId: true,
  class: { select: { name: true, section: true } },
  user: { select: { name: true } },
} as const

// GET /api/teacher/behavior — the Behavior workspace: school-configurable
// categories, recent visible records, open follow-ups, in-scope students and
// honest stats (every number is a COUNT over real rows).
export async function GET() {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const visible = visibleBehaviorWhere(ctx)

      const [categories, records, followUpRows, scopeStudents, typeGroups, openConcerns, distinctStudents, total, followUpDue] =
        await Promise.all([
          db.behaviorCategory.findMany({
            where: { schoolId: ctx.schoolId, isActive: true },
            orderBy: { sortOrder: 'asc' },
          }),
          db.behaviorRecord.findMany({
            where: visible,
            include: {
              student: { select: STUDENT_SELECT },
              recordedBy: { select: { id: true, name: true } },
            },
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
            take: 100,
          }),
          db.teacherFollowUp.findMany({
            where: { schoolId: ctx.schoolId, teacherId: ctx.userId, kind: 'behavior', status: 'open' },
            include: { student: { select: STUDENT_SELECT } },
            orderBy: { dueDate: 'asc' },
            take: 50,
          }),
          db.student.findMany({
            where: authorizedStudentWhere(ctx),
            include: { class: { select: { name: true, section: true } }, user: { select: { name: true } } },
            orderBy: { rollNo: 'asc' },
            take: 300,
          }),
          db.behaviorRecord.groupBy({ by: ['type'], where: visible, _count: { _all: true } }),
          db.behaviorRecord.count({
            where: { ...visible, type: 'concern', status: { not: 'resolved' } },
          }),
          db.behaviorRecord.findMany({ where: visible, select: { studentId: true }, distinct: ['studentId'] }),
          db.behaviorRecord.count({ where: visible }),
          db.teacherFollowUp.count({
            where: {
              schoolId: ctx.schoolId,
              teacherId: ctx.userId,
              kind: 'behavior',
              status: 'open',
              dueDate: { lte: new Date(new Date().setHours(23, 59, 59, 999)) },
            },
          }),
        ])

      const typeCount = (t: string) => typeGroups.find((g) => g.type === t)?._count._all ?? 0

      const payload: BehaviorPayload = {
        scopeLabel: ctx.classTeacherOf.map((c) => c.label).join(' · ') || 'Your records',
        categories: categories.map((c) => ({
          key: c.key,
          label: c.label,
          kind: (['any', 'positive', 'concern'].includes(c.kind) ? c.kind : 'any') as 'any' | 'positive' | 'concern',
        })),
        records: records.map(toBehaviorRecordItem),
        followUps: followUpRows.map(toFollowUpItem),
        students: scopeStudents.map(toStudentRef),
        stats: {
          studentsObserved: distinctStudents.length,
          positive: typeCount('positive'),
          observation: typeCount('observation'),
          concern: typeCount('concern'),
          openConcerns,
          followUpsOpen: followUpRows.length,
          followUpsDue: followUpDue,
          total,
        },
      }
      return payload
    },
    { roles: ['TEACHER'] },
  )
}

// POST /api/teacher/behavior — record an observation (positive / observation /
// concern) for a student in scope. Creates the matching follow-up row when
// follow-up is required. Private notes stay in the teacher/staff surface only.
export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const body = await req.json().catch(() => null)
      if (!body || typeof body !== 'object') throw new Error('Invalid request body')

      const student = await assertStudentInScope(ctx, body.studentId)

      const type = typeof body.type === 'string' && TYPES.includes(body.type) ? body.type : null
      if (!type) throw new Error('Type must be positive, observation or concern')

      const categoryKey = typeof body.category === 'string' ? body.category : ''
      const category = await db.behaviorCategory.findFirst({
        where: { schoolId: ctx.schoolId, key: categoryKey, isActive: true },
      })
      if (!category) throw new Error('Unknown behavior category')

      const description = parseString(body.description, 'Description', { required: true, max: 2000 })
      if (!description) throw new Error('Description is required')
      const actionTaken = parseString(body.actionTaken, 'Action taken', { max: 1000 })
      const privateNote = parseString(body.privateNote, 'Private note', { max: 2000 })
      const date = body.date != null ? parseDate(body.date, 'Date') : new Date()

      const followUpRequired = body.followUpRequired === true
      let followUpDate: Date | null = null
      if (followUpRequired) {
        followUpDate = parseDate(body.followUpDate, 'Follow-up date')
      }

      const record = await db.behaviorRecord.create({
        data: {
          schoolId: ctx.schoolId,
          studentId: student.id,
          recordedById: ctx.userId,
          date,
          category: category.key,
          type,
          description,
          actionTaken,
          followUpRequired,
          followUpDate,
          privateNote,
          status: type === 'concern' ? 'open' : 'resolved',
          parentNotified: false,
        },
        include: {
          student: { select: STUDENT_SELECT },
          recordedBy: { select: { id: true, name: true } },
        },
      })

      if (followUpRequired && followUpDate) {
        await db.teacherFollowUp.create({
          data: {
            schoolId: ctx.schoolId,
            teacherId: ctx.userId,
            kind: 'behavior',
            studentId: student.id,
            recordId: record.id,
            reason: `${category.label} follow-up — ${student.user?.name ?? 'student'}`,
            dueDate: followUpDate,
            priority: type === 'concern' ? 'high' : 'normal',
          },
        })
      }

      await auditTeacherAction(
        user,
        ctx.schoolId,
        'BEHAVIOR_RECORD_CREATED',
        `${type} record (${category.label}) for ${student.user?.name ?? 'student'}`,
      )

      return { record: toBehaviorRecordItem(record) }
    },
    { roles: ['TEACHER'] },
  )
}
