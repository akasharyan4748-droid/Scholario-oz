import { withUser, schoolScoped } from '@/lib/api'
import { listPolicies, updatePolicy } from '@/lib/homework/oversight-service'

export const runtime = 'nodejs'

export async function GET() {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    return await listPolicies(schoolId)
  })
}

export async function PATCH(req: Request) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      if (!body.id) throw new Error('Policy id required')
      return await updatePolicy(schoolId, body.id, {
        maxMinutesPerDay: body.maxMinutesPerDay !== undefined ? Number(body.maxMinutesPerDay) : undefined,
        enabled: body.enabled,
      })
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
