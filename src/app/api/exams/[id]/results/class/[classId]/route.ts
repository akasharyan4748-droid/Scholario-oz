import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { getResultsForClass } from '@/lib/exams/service'

export const runtime = 'nodejs'

// GET /api/exams/[id]/results/class/[classId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; classId: string }> }
) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { id, classId } = await params
    const result = await getResultsForClass(id, classId, schoolId)
    return result
  })
}
