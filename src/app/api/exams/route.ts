import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

export async function GET() {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const exams = await db.exam.findMany({
      where: { schoolId },
      orderBy: { startDate: 'desc' },
      include: { class: { select: { name: true } }, _count: { select: { results: true } } },
      take: 50,
    })
    return exams
  })
}

export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      const name = String(body.name || '').trim()
      if (!name) throw new Error('Exam name required')
      const e = await db.exam.create({
        data: {
          schoolId,
          name,
          term: body.term || 'TERM1',
          classId: body.classId || null,
          startDate: body.startDate ? new Date(body.startDate) : new Date(),
          endDate: body.endDate ? new Date(body.endDate) : null,
          status: body.status || 'SCHEDULED',
        },
      })
      return e
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT', 'TEACHER'] }
  )
}
