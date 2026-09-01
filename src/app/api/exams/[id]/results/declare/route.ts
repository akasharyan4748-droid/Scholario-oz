import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { declareResults } from '@/lib/exams/service'

export const runtime = 'nodejs'

// POST /api/exams/[id]/results/declare
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params
      const result = await declareResults(id, schoolId, user)
      return result
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
