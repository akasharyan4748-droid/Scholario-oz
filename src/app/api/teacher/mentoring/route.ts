import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import {
  requireTeacher,
  authorizedStudentWhere,
  toFollowUpItem,
  toStudentRef,
} from '@/lib/teacher-hub'
import type { MenteeItem, MentoringPayload, SessionItem, GoalItem } from '@/lib/teacher-hub-types'

export const runtime = 'nodejs'

const STUDENT_SELECT = {
  id: true,
  rollNo: true,
  classId: true,
  class: { select: { name: true, section: true } },
  user: { select: { name: true } },
} as const

// GET /api/teacher/mentoring — the whole mentoring workspace: mentees (with
// last session / next follow-up / goal roll-ups), recent sessions, goals,
// open follow-ups, in-scope students for pickers and honest stats.
export async function GET() {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const owned = { schoolId: ctx.schoolId, teacherId: ctx.userId }
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

      const [assignments, sessionRows, goalRows, followUpRows, scopeStudents, sessionStats, sessionsThisMonth] =
        await Promise.all([
          db.mentoringAssignment.findMany({
            where: owned,
            include: { student: { select: STUDENT_SELECT } },
            orderBy: [{ active: 'desc' }, { createdAt: 'asc' }],
            take: 100,
          }),
          db.mentoringSession.findMany({
            where: owned,
            include: { student: { select: STUDENT_SELECT } },
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
            take: 60,
          }),
          db.mentoringGoal.findMany({
            where: owned,
            include: { student: { select: STUDENT_SELECT } },
            orderBy: [{ updatedAt: 'desc' }],
            take: 150,
          }),
          db.teacherFollowUp.findMany({
            where: { ...owned, kind: 'mentoring', status: 'open' },
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
          db.mentoringSession.groupBy({
            by: ['assignmentId'],
            where: owned,
            _count: { _all: true },
            _max: { date: true },
          }),
          db.mentoringSession.count({ where: { ...owned, date: { gte: startOfMonth } } }),
        ])

      // Per-student next follow-up (nearest open due date).
      const nextFollowUpByStudent = new Map<string, Date>()
      for (const f of followUpRows) {
        if (!f.studentId) continue
        const existing = nextFollowUpByStudent.get(f.studentId)
        if (!existing || f.dueDate < existing) nextFollowUpByStudent.set(f.studentId, f.dueDate)
      }

      const sessionStatsByAssignment = new Map(
        sessionStats.map((s) => [s.assignmentId, { count: s._count._all, last: s._max.date }]),
      )
      const goalsByAssignment = new Map<string, typeof goalRows>()
      for (const g of goalRows) {
        const list = goalsByAssignment.get(g.assignmentId) ?? []
        list.push(g)
        goalsByAssignment.set(g.assignmentId, list)
      }

      const mentees: MenteeItem[] = assignments.map((a) => {
        const stats = sessionStatsByAssignment.get(a.id)
        const goals = goalsByAssignment.get(a.id) ?? []
        const nextFollowUp = nextFollowUpByStudent.get(a.studentId)
        return {
          id: a.id,
          status: a.status as MenteeItem['status'],
          supportType: a.supportType as MenteeItem['supportType'],
          notes: a.notes,
          active: a.active,
          createdAt: a.createdAt.toISOString(),
          student: toStudentRef(a.student),
          lastSessionAt: stats?.last ? stats.last.toISOString() : null,
          nextFollowUpAt: nextFollowUp ? nextFollowUp.toISOString() : null,
          goals: {
            total: goals.length,
            achieved: goals.filter((g) => g.status === 'achieved').length,
            inProgress: goals.filter((g) => g.status === 'in-progress' || g.status === 'on-track').length,
          },
          sessionCount: stats?.count ?? 0,
        }
      })

      const sessions: SessionItem[] = sessionRows.map((s) => ({
        id: s.id,
        date: s.date.toISOString(),
        type: s.type as SessionItem['type'],
        discussion: s.discussion,
        actionItems: s.actionItems ? safeParseActionItems(s.actionItems) : [],
        durationMinutes: s.durationMinutes,
        followUpDate: s.followUpDate ? s.followUpDate.toISOString() : null,
        student: toStudentRef(s.student),
      }))

      const goals: GoalItem[] = goalRows.map((g) => ({
        id: g.id,
        title: g.title,
        target: g.target,
        reviewDate: g.reviewDate ? g.reviewDate.toISOString() : null,
        status: g.status as GoalItem['status'],
        createdAt: g.createdAt.toISOString(),
        student: toStudentRef(g.student),
      }))

      const payload: MentoringPayload = {
        teacher: {
          name: ctx.name,
          classLabel: ctx.classTeacherOf.map((c) => c.label).join(' · ') || 'Teacher',
        },
        assignments: mentees,
        sessions,
        goals,
        followUps: followUpRows.map(toFollowUpItem),
        students: scopeStudents.map(toStudentRef),
        stats: {
          activeMentees: mentees.filter((m) => m.active).length,
          sessionsThisMonth,
          followUpsOpen: followUpRows.length,
          followUpsDue: followUpRows.filter((f) => f.dueDate <= endOfToday).length,
          needingSupport: mentees.filter(
            (m) => m.active && (m.status === 'needs-support' || m.status === 'critical'),
          ).length,
          totalSessions: sessionStats.reduce((sum, s) => sum + s._count._all, 0),
        },
      }
      return payload
    },
    { roles: ['TEACHER'] },
  )
}

function safeParseActionItems(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.filter((i): i is string => typeof i === 'string' && i.trim().length > 0)
    return []
  } catch {
    return []
  }
}
