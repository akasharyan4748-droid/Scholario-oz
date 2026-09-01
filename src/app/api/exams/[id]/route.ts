import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { getExam, updateExam, deleteExam, getAuditLogs } from '@/lib/exams/service'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { id } = await params
    const exam = await getExam(id, schoolId)
    if (!exam) throw new Error('NOT_FOUND')
    return exam
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params
      const body = await req.json().catch(() => ({}))
      const updated = await updateExam(id, schoolId, user, body)
      return updated
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
      await deleteExam(id, schoolId, user)
      return { deleted: true }
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
