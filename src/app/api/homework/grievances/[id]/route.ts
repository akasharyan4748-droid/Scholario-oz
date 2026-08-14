import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { resolveGrievance } from '@/lib/homework/oversight-service'

export const runtime = 'nodejs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params
      const body = await req.json().catch(() => ({}))
      if (!body.response) throw new Error('Response required')
      return await resolveGrievance(schoolId, id, user, body.response, body.status || 'resolved')
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
