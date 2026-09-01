import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { publishResults } from '@/lib/exams/service-extended'

export const runtime = 'nodejs'

// POST /api/exams/[id]/publish  body: { notifyStudents?, notifyParents? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params
      const body = await req.json().catch(() => ({}))
      const result = await publishResults(id, schoolId, user, {
        notifyStudents: body.notifyStudents,
        notifyParents: body.notifyParents,
      })
      return result
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
