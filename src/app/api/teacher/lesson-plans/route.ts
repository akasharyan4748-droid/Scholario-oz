import { NextRequest } from 'next/server'
import { withUser } from '@/lib/api'
import { requireTeacher, auditTeacherAction } from '@/lib/teacher-hub'
import {
  assertLessonScope,
  buildLessonPlannerPayload,
  createLessonPlan,
  mondayOfWeekUTC,
  parseLessonDay,
  validatePlanInput,
} from '@/lib/lesson-planner'
import type { LessonPlannerPayload } from '@/lib/lesson-planner-types'

export const runtime = 'nodejs'

// GET /api/teacher/lesson-plans?week=YYYY-MM-DD
// The Lesson Planner payload for the week containing `week` (any day of the
// week — the server snaps to its Monday; defaults to the current week):
// teaching assignments (the ONLY authorization surface — class-teacher
// position alone grants nothing), the teacher's plans for that week, live
// stats and the curriculum maps behind each (class, subject) assignment.
export async function GET(req: NextRequest) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const weekParam = req.nextUrl.searchParams.get('week')
      const anchor = weekParam ? parseLessonDay(weekParam, 'Week') : new Date()
      const weekStart = mondayOfWeekUTC(anchor)
      const payload: LessonPlannerPayload = await buildLessonPlannerPayload(ctx, weekStart)
      return payload
    },
    { roles: ['TEACHER'] },
  )
}

// POST /api/teacher/lesson-plans — create a lesson plan.
// classId + subjectId are re-validated against the session teacher's ACTIVE
// teaching assignments (never trusted from the client); the curriculum link
// must belong to that exact (class, subject).
export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const body = await req.json().catch(() => null)
      if (!body || typeof body !== 'object') throw new Error('Invalid request body')

      const scope = await assertLessonScope(ctx, body.classId, body.subjectId)
      const input = await validatePlanInput(ctx, scope, body as Record<string, unknown>)
      const plan = await createLessonPlan({ ctx, scope, input })

      await auditTeacherAction(
        user,
        ctx.schoolId,
        'LESSON_PLAN_CREATED',
        `${scope.subjectName} · ${scope.classLabel} · ${plan.topic} · ${plan.date}${plan.period ? ` · Period ${plan.period}` : ''}`,
      )

      // Refreshed payload for the week the plan lands in (one round-trip).
      const weekParam = typeof body.week === 'string' ? body.week : null
      const anchor = weekParam ? parseLessonDay(weekParam, 'Week') : parseLessonDay(plan.date)
      const payload = await buildLessonPlannerPayload(ctx, mondayOfWeekUTC(anchor))
      return { plan, payload }
    },
    { roles: ['TEACHER'] },
  )
}
