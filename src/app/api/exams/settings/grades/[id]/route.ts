import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { updateGradeScale, deleteGradeScale } from '@/lib/exams/settings-service'

export const runtime = 'nodejs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params
      const body = await req.json().catch(() => ({}))
      return await updateGradeScale(schoolId, id, {
        grade: body.grade,
        minPct: body.minPct !== undefined ? Number(body.minPct) : undefined,
        maxPct: body.maxPct !== undefined ? Number(body.maxPct) : undefined,
        color: body.color,
      })
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params
      await deleteGradeScale(schoolId, id)
      return { deleted: true }
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
