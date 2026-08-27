import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { listGrievances, resolveGrievance } from '@/lib/homework/oversight-service'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || undefined
    return await listGrievances(schoolId, status)
  })
}
