import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { getAuditLogs } from '@/lib/exams/service'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { id } = await params
    const logs = await getAuditLogs(id, schoolId)
    return logs
  })
}
