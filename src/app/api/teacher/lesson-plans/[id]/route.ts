import { NextRequest } from 'next/server'
import { withUser } from '@/lib/api'
import { requireTeacher, auditTeacherAction } from '@/lib/teacher-hub'
import {
  applyLessonStatusIntent,
  assertLessonScope,
  buildLessonPlannerPayload,
  deleteLessonPlan,
  duplicateLessonPlan,
  mondayOfWeekUTC,
  parseLessonDay,
  updateLessonPlan,
  validatePlanInput,
} from '@/lib/lesson-planner'
import type { LessonStatusIntent } from '@/lib/lesson-planner-types'

export const runtime = 'nodejs'

const INTENTS: LessonStatusIntent[] = ['start', 'complete', 'cancel', 'reopen', 'needs-review']
const INTENT_LABEL: Record<LessonStatusIntent, string> = {
  start: 'started',
  complete: 'completed',
  cancel: 'cancelled',
  reopen: 're-opened',
  'needs-review': 'flagged for review',
}

/** Resolve the week the refreshed payload should describe: ?week= param, else the plan's own week. */
function refreshWeek(planDateISO: string, req: NextRequest): Date {
  const weekParam = req.nextUrl.searchParams.get('week')
  const anchor = weekParam ? parseLessonDay(weekParam, 'Week') : parseLessonDay(planDateISO)
  return mondayOfWeekUTC(anchor)
}

// PATCH /api/teacher/lesson-plans/[id] — either a status intent
// ({ intent: 'start' | 'complete' | 'cancel' | 'reopen' | 'needs-review' })
// or a full field update (same body as POST). Ownership is enforced
// server-side (schoolId + teacherId of the session); scope fields are
// re-validated against the teacher's active teaching assignments.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const { id } = await params
      const body = await req.json().catch(() => null)
      if (!body || typeof body !== 'object') throw new Error('Invalid request body')

      if (typeof body.intent === 'string') {
        const intent = INTENTS.find((i) => i === body.intent)
        if (!intent) throw new Error('intent must be one of start, complete, cancel, reopen, needs-review')
        const plan = await applyLessonStatusIntent({ ctx, planId: id, intent })
        await auditTeacherAction(
          user,
          ctx.schoolId,
          intent === 'complete' ? 'LESSON_PLAN_COMPLETED' : 'LESSON_PLAN_STATUS',
          `${plan.subjectName} · ${plan.classLabel} · ${plan.topic} · ${INTENT_LABEL[intent]}`,
        )
        const payload = await buildLessonPlannerPayload(ctx, refreshWeek(plan.date, req))
        return { plan, payload }
      }

      // full field update — scope first (assignment may have changed)
      const scope = await assertLessonScope(ctx, body.classId, body.subjectId)
      const input = await validatePlanInput(ctx, scope, body as Record<string, unknown>)
      const plan = await updateLessonPlan({ ctx, planId: id, scope, input })
      await auditTeacherAction(
        user,
        ctx.schoolId,
        'LESSON_PLAN_UPDATED',
        `${scope.subjectName} · ${scope.classLabel} · ${plan.topic} · ${plan.date}`,
      )
      const payload = await buildLessonPlannerPayload(ctx, refreshWeek(plan.date, req))
      return { plan, payload }
    },
    { roles: ['TEACHER'] },
  )
}

// DELETE /api/teacher/lesson-plans/[id]?week=YYYY-MM-DD — delete an owned
// plan. Returns the refreshed payload for the viewed week.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const { id } = await params

      // capture the plan's week for the refresh (row disappears on delete)
      const weekParam = req.nextUrl.searchParams.get('week')
      const week = weekParam
        ? mondayOfWeekUTC(parseLessonDay(weekParam, 'Week'))
        : mondayOfWeekUTC(new Date())

      await deleteLessonPlan({ ctx, planId: id })
      await auditTeacherAction(user, ctx.schoolId, 'LESSON_PLAN_DELETED', `Plan ${id}`)
      const payload = await buildLessonPlannerPayload(ctx, week)
      return { deleted: true, payload }
    },
    { roles: ['TEACHER'] },
  )
}

// POST /api/teacher/lesson-plans/[id] — duplicate an owned plan.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const { id } = await params
      const plan = await duplicateLessonPlan({ ctx, planId: id })
      await auditTeacherAction(
        user,
        ctx.schoolId,
        'LESSON_PLAN_DUPLICATED',
        `${plan.subjectName} · ${plan.classLabel} · ${plan.topic}`,
      )
      const payload = await buildLessonPlannerPayload(ctx, refreshWeek(plan.date, req))
      return { plan, payload }
    },
    { roles: ['TEACHER'] },
  )
}
