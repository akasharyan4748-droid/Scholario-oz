import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { listExamRules, updateManyExamRules } from '@/lib/exams/settings-service'

export const runtime = 'nodejs'

export async function GET() {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    return await listExamRules(schoolId)
  })
}

export async function PUT(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      await updateManyExamRules(schoolId, body.rules || {})
      return { saved: true }
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
