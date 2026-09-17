import { NextRequest } from 'next/server'
import { withUser } from '@/lib/api'
import { requireTeacher } from '@/lib/teacher-hub'
import { createPtmEvent, ptmOverview } from '@/lib/ptm-scheduler'

export const runtime = 'nodejs'

/**
 * GET /api/teacher/ptm — the PTM Scheduler's aggregate opening payload.
 *
 *   → { today, events: […], students: […] }
 *
 *   · events  — ONLY this teacher's PTM events (schoolId + teacherId
 *     scope), newest meetingDate first, each with slot counts + fill rate;
 *   · students — her authorized booking targets (students of ACTIVE
 *     subject-assignment classes ∪ class-teacher classes — the Student
 *     Directory scope).
 */
export async function GET() {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      return ptmOverview(ctx)
    },
    { roles: ['TEACHER'] },
  )
}

/**
 * POST /api/teacher/ptm — create a PTM event.
 *   { title, meetingDate (YYYY-MM-DD), windowStart/windowEnd ("HH:MM"),
 *     slotMinutes (5..60), location? }
 *     → the refreshed detail + event summaries (slots auto-generated).
 */
export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const body = await req.json().catch(() => ({}))
      return createPtmEvent(user, ctx, body)
    },
    { roles: ['TEACHER'] },
  )
}
