import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { verifyMarks } from '@/lib/exams/service'

export const runtime = 'nodejs'

// POST /api/exams/[id]/marks/verify  body: { classId?, subjectId? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params
      const body = await req.json().catch(() => ({}))
      const result = await verifyMarks(id, schoolId, user, {
        classId: body.classId,
        subjectId: body.subjectId,
      })
      return result
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
