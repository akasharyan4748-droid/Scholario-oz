import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { getAssignmentRepository } from '@/lib/homework/oversight-service'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { searchParams } = new URL(req.url)
    return await getAssignmentRepository(schoolId, {
      teacherId: searchParams.get('teacherId') || undefined,
      subjectId: searchParams.get('subjectId') || undefined,
      classId: searchParams.get('classId') || undefined,
      search: searchParams.get('search') || undefined,
    })
  })
}
