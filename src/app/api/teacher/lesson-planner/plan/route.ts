import { withUser } from '@/lib/api'
import { getLessonPlan } from '@/lib/lesson-planner'

export const runtime = 'nodejs'

// GET /api/teacher/lesson-planner/plan?classId=&subjectId= — the full
// curriculum plan for ONE of the teacher's own (class, subject) teaching
// assignments: derived day-wise schedule, today's topic, unit progress and
// the upcoming queue. Returns null plan when the curriculum has not been
// configured for that pair (honest "Curriculum unavailable" state).
export async function GET(request: Request) {
  return withUser(
    async (user) => {
      const url = new URL(request.url)
      const classId = url.searchParams.get('classId')
      const subjectId = url.searchParams.get('subjectId')
      if (!classId || !subjectId) throw new Error('classId and subjectId are required')
      const plan = await getLessonPlan(user, classId, subjectId)
      if (!plan) throw new Error('FORBIDDEN')
      return plan
    },
    { roles: ['TEACHER'] }
  )
}
