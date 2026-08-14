import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { listHomework, createHomework, getClasses, getTeachers, getAnalytics } from '@/lib/homework/service'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { searchParams } = new URL(req.url)
    const view = searchParams.get('view') || 'list'

    // Different views return different data
    if (view === 'classes') {
      return { classes: await getClasses(schoolId) }
    }
    if (view === 'teachers') {
      return { teachers: await getTeachers(schoolId) }
    }
    if (view === 'analytics') {
      return await getAnalytics(schoolId)
    }

    // Default: list homework with filters
    const filters = {
      status: searchParams.get('status') || undefined,
      classId: searchParams.get('classId') || undefined,
      subjectId: searchParams.get('subjectId') || undefined,
      teacherId: searchParams.get('teacherId') || undefined,
      search: searchParams.get('search') || undefined,
    }
    const homework = await listHomework(schoolId, filters)
    return { homework, classes: await getClasses(schoolId), teachers: await getTeachers(schoolId) }
  })
}

export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      const homework = await createHomework(schoolId, user, body)
      return homework
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT', 'TEACHER'] }
  )
}
