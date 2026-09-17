import { NextRequest } from 'next/server'
import { withUser } from '@/lib/api'
import { requireTeacher } from '@/lib/teacher-hub'
import { bookPtmSlot, completePtmSlot, releasePtmSlot, saveSlotNotes } from '@/lib/ptm-scheduler'

export const runtime = 'nodejs'

/**
 * POST /api/teacher/ptm/slot/[slotId] — slot-level actions (owner-scoped:
 * another teacher's slot answers NOT_FOUND, never its data).
 *
 *   { action: 'book',    studentId, bookedByName, contactPhone? }
 *   { action: 'release' }
 *   { action: 'complete' }
 *   { action: 'notes',   notes }
 *
 * Every action → the refreshed event detail + event summaries (one
 * response replaces the client's whole module state).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slotId: string }> },
) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const { slotId } = await params
      const body = await req.json().catch(() => ({}))
      switch (body?.action) {
        case 'book':
          return bookPtmSlot(user, ctx, slotId, body)
        case 'release':
          return releasePtmSlot(user, ctx, slotId)
        case 'complete':
          return completePtmSlot(user, ctx, slotId)
        case 'notes':
          return saveSlotNotes(user, ctx, slotId, body?.notes)
        default:
          throw new Error('UNKNOWN_ACTION')
      }
    },
    { roles: ['TEACHER'] },
  )
}
