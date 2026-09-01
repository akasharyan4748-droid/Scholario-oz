import { withUser, schoolScoped } from '@/lib/api'
import { getTeacherActivity } from '@/lib/homework/oversight-service'

export const runtime = 'nodejs'

export async function GET() {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    return await getTeacherActivity(schoolId)
  })
}
