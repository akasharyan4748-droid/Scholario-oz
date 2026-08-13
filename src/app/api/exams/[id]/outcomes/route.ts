import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { getOutcomes } from '@/lib/exams/service-extended'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { id } = await params
    const url = new URL(req.url)
    const classId = url.searchParams.get('classId')
    const outcomes = await getOutcomes(id, classId, schoolId)
    return outcomes
  })
}
