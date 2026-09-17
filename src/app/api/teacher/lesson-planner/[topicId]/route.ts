import { NextRequest } from 'next/server'
import { withUser } from '@/lib/api'
import { requireTeacher } from '@/lib/teacher-hub'
import { applyLessonIntent, isLessonIntent } from '@/lib/lesson-planner'

export const runtime = 'nodejs'

// POST /api/teacher/lesson-planner/[topicId] — apply a teaching intent to
// a scheduled topic. Body: { intent: 'start' | 'complete' | 'undo' |
// 'flag' | 'unflag', reason?: string }. Scope is re-validated server-side;
// the response carries the refreshed planner payload for that scope.
export async function POST(req: NextRequest, { params }: { params: Promise<{ topicId: string }> }) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const { topicId } = await params
      const body = (await req.json().catch(() => ({}))) as { intent?: unknown; reason?: unknown }
      if (!isLessonIntent(body.intent)) throw new Error('BAD_INTENT')
      const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim() : null
      return applyLessonIntent(user, ctx, topicId, body.intent, reason)
    },
    { roles: ['TEACHER'] },
  )
}
