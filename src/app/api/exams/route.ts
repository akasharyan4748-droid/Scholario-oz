import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { listExams, createExam, getClasses } from '@/lib/exams/service'

export const runtime = 'nodejs'

export async function GET() {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const exams = await listExams(schoolId)
    return { exams, classes: await getClasses(schoolId) }
  })
}

export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      const exam = await createExam(schoolId, user, body)
      return exam
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
