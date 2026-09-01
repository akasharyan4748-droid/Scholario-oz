import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { getLoadMatrix } from '@/lib/homework/oversight-service'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || undefined
    return await getLoadMatrix(schoolId, date)
  })
}
