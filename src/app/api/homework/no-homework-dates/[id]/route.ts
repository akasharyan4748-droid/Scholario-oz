import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { removeNoHomeworkDate } from '@/lib/homework/oversight-service'

export const runtime = 'nodejs'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params
      await removeNoHomeworkDate(schoolId, id)
      return { deleted: true }
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
