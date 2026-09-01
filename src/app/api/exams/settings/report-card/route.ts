import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { getReportCardConfig, updateReportCardConfig } from '@/lib/exams/settings-service'

export const runtime = 'nodejs'

export async function GET() {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    return await getReportCardConfig(schoolId)
  })
}

export async function PUT(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      return await updateReportCardConfig(schoolId, body)
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
