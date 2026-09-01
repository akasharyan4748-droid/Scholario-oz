import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { applyGraceMarks } from '@/lib/exams/service-extended'

export const runtime = 'nodejs'

// POST /api/exams/[id]/grace  body: { markId, graceMarks, reason }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params
      const body = await req.json().catch(() => ({}))
      const result = await applyGraceMarks(id, schoolId, user, {
        markId: body.markId,
        graceMarks: Number(body.graceMarks) || 0,
        reason: body.reason || '',
      })
      return result
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
