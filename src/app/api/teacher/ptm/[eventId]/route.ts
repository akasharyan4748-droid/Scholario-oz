import { NextRequest } from 'next/server'
import { withUser } from '@/lib/api'
import { requireTeacher } from '@/lib/teacher-hub'
import { cancelPtmEvent, ptmEventDetail } from '@/lib/ptm-scheduler'

export const runtime = 'nodejs'

/**
 * GET /api/teacher/ptm/[eventId] — one event + its slots (by startTime).
 * Owner-scoped: another teacher's event answers NOT_FOUND, never its data.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const { eventId } = await params
      return ptmEventDetail(ctx, eventId)
    },
    { roles: ['TEACHER'] },
  )
}

/**
 * POST /api/teacher/ptm/[eventId] — event-level actions.
 *   { action: 'cancel' } → soft-cancel (rows kept for history).
 *     → the refreshed detail + event summaries.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const { eventId } = await params
      const body = await req.json().catch(() => ({}))
      if (body?.action !== 'cancel') throw new Error('UNKNOWN_ACTION')
      return cancelPtmEvent(user, ctx, eventId)
    },
    { roles: ['TEACHER'] },
  )
}
