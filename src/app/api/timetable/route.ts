import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('classId')
    const slots = await db.timetable.findMany({
      where: { schoolId, ...(classId ? { classId } : {}) },
      include: { subject: true },
      orderBy: [{ day: 'asc' }, { period: 'asc' }],
    })
    return slots
  })
}
