import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { addScheduleItem } from '@/lib/exams/service'

export const runtime = 'nodejs'

// POST /api/exams/[id]/schedule  body: { classId, subjectId, date, startTime, endTime, room?, invigilatorName? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params
      const body = await req.json().catch(() => ({}))
      const item = await addScheduleItem(id, schoolId, user, {
        classId: body.classId,
        subjectId: body.subjectId,
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
