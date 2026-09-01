import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { listGradeScales, createGradeScale } from '@/lib/exams/settings-service'

export const runtime = 'nodejs'

export async function GET() {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    return await listGradeScales(schoolId)
  })
}

export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      return await createGradeScale(schoolId, {
        grade: body.grade,
        minPct: Number(body.minPct),
        maxPct: Number(body.maxPct),
        color: body.color,
      })
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
