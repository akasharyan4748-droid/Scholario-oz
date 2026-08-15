import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { computeAutoOutcomes } from '@/lib/exams/service-extended'

export const runtime = 'nodejs'

// POST /api/exams/[id]/outcomes/compute  body: { classId }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params
      const body = await req.json().catch(() => ({}))
      const result = await computeAutoOutcomes(id, body.classId, schoolId)
      return result
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
