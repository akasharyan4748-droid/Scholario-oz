import { NextRequest } from 'next/server'
import { withUser } from '@/lib/api'
import { requireTeacher } from '@/lib/teacher-hub'
import {
  applyLessonAction,
  assertAssignment,
  buildCurriculumPayload,
  resolveTopicInCurriculum,
} from '@/lib/curriculum-execution'
import type { CurriculumExecutionPayload, LessonAction } from '@/lib/curriculum-types'

export const runtime = 'nodejs'

const ACTIONS: LessonAction[] = ['start', 'complete', 'postpone', 'skip']

// GET /api/teacher/curriculum-execution?classId=&subjectId=
// The automated curriculum execution payload for one of the teacher's
// teaching assignments (defaults to the first): master curriculum, derived
// day-wise schedule (timetable + holiday aware), today's lesson, up-next,
// curriculum map with per-topic state, and live progress.
export async function GET(req: NextRequest) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const params = req.nextUrl.searchParams
      const classId = params.get('classId')
      const subjectId = params.get('subjectId')
      const payload: CurriculumExecutionPayload = await buildCurriculumPayload(
        ctx,
        classId && subjectId ? classId : null,
        classId && subjectId ? subjectId : null,
      )
      return payload
    },
    { roles: ['TEACHER'] },
  )
}

// POST /api/teacher/curriculum-execution — execute today's lesson.
// body: { action: 'start' | 'complete' | 'postpone' | 'skip', classId, subjectId, topicId }
// The assignment and the topic's membership in the resolved curriculum are
// re-validated server-side; the refreshed payload is returned in one round-trip.
export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const body = await req.json().catch(() => null)
      if (!body || typeof body !== 'object') throw new Error('Invalid request body')

      const action = ACTIONS.find((a) => a === body.action)
      if (!action) throw new Error('action must be one of start, complete, postpone, skip')

      const assignment = await assertAssignment(ctx, body.classId, body.subjectId)
      const topicId = await resolveTopicInCurriculum(ctx, assignment, body.topicId)
      await applyLessonAction({ user, ctx, assignment, topicId, action })

      const payload = await buildCurriculumPayload(ctx, assignment.classId, assignment.subjectId)
      return { payload }
    },
    { roles: ['TEACHER'] },
  )
}
