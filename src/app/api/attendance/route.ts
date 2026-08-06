import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('classId')
    const date = searchParams.get('date')
    const where: Record<string, unknown> = { schoolId }
    if (classId) where.classId = classId
    if (date) where.date = new Date(date)
    const rows = await db.attendance.findMany({
      where,
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { date: 'desc' },
      take: 500,
    })
    return rows
  })
}

// bulk mark attendance for a class on a date
export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      const classId = body.classId
      const date = body.date ? new Date(body.date) : new Date()
      const entries: Array<{ studentId: string; status: string }> = body.entries || []
      if (!classId || !entries.length) throw new Error('classId and entries[] required')

      await db.$transaction(
        entries.map((e) =>
          db.attendance.upsert({
            where: { studentId_date: { studentId: e.studentId, date } },
            create: {
              schoolId,
              studentId: e.studentId,
              classId,
              date,
              status: e.status,
              markedBy: user.id,
            },
            update: { status: e.status, markedBy: user.id },
          })
        )
      )
      return { marked: entries.length, date }
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT', 'TEACHER'] }
  )
}
