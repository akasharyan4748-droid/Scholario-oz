import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { listTeachers, assignInvigilator } from '@/lib/exams/service-extended'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const teachers = await listTeachers(schoolId)
    return teachers
  })
}

// POST /api/exams/[id]/invigilator  body: { scheduleItemId, teacherId }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params
      const body = await req.json().catch(() => ({}))
      const result = await assignInvigilator(id, body.scheduleItemId, schoolId, user, body.teacherId)
      return result
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
