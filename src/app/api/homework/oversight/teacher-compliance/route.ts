import { withUser, schoolScoped } from '@/lib/api'
import { getTeacherCompliance } from '@/lib/homework/oversight-service'

export const runtime = 'nodejs'

export async function GET() {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    return await getTeacherCompliance(schoolId)
  })
}
