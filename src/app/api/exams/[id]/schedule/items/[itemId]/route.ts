import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { updateScheduleItem, deleteScheduleItem } from '@/lib/exams/service'

export const runtime = 'nodejs'

// PATCH /api/exams/[id]/schedule/items/[itemId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id, itemId } = await params
      const body = await req.json().catch(() => ({}))
      const item = await updateScheduleItem(id, itemId, schoolId, user, {
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        room: body.room,
        invigilatorName: body.invigilatorName,
      })
      return item
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id, itemId } = await params
      await deleteScheduleItem(id, itemId, schoolId, user)
      return { deleted: true }
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
