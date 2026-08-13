import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { overrideOutcome } from '@/lib/exams/service-extended'

export const runtime = 'nodejs'

// PATCH /api/exams/[id]/outcomes/[studentId]  body: { outcome, reason?, notes? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; studentId: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id, studentId } = await params
      const body = await req.json().catch(() => ({}))
      await overrideOutcome(id, studentId, schoolId, user, {
        outcome: body.outcome,
        reason: body.reason,
        notes: body.notes,
      })
      return { updated: true }
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
