import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { setMarksBatch } from '@/lib/exams/service'

export const runtime = 'nodejs'

// POST /api/exams/[id]/marks/batch  body: { marks: SetMarkInput[] }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params
      const body = await req.json().catch(() => ({ marks: [] }))
      const result = await setMarksBatch(id, schoolId, user, body.marks ?? [])
      return result
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT', 'TEACHER'] }
  )
}
