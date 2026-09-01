import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { updateExamType, deleteExamType } from '@/lib/exams/settings-service'

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
      return await updateExamType(schoolId, id, {
        name: body.name,
        code: body.code,
        enabled: body.enabled,
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
      await deleteExamType(schoolId, id)
      return { deleted: true }
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
