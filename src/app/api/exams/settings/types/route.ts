import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { listExamTypes, createExamType } from '@/lib/exams/settings-service'

export const runtime = 'nodejs'

export async function GET() {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    return await listExamTypes(schoolId)
  })
}

export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      return await createExamType(schoolId, { name: body.name, code: body.code })
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
