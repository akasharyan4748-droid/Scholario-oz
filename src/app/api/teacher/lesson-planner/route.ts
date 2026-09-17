import { withUser } from '@/lib/api'
import { getTeachingAssignments } from '@/lib/lesson-planner'

export const runtime = 'nodejs'

// GET /api/teacher/lesson-planner — the teacher's ACTIVE teaching
// assignments (class + subject pairs from the timetable ∩ ACTIVE
// ClassSubjectAssignment). This is the picker source: only classes and
// subjects the teacher actually teaches ever appear.
export async function GET() {
  return withUser(
    async (user) => {
      const assignments = await getTeachingAssignments(user)
      return { assignments }
    },
    { roles: ['TEACHER'] }
  )
}
