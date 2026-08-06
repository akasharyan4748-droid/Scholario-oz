import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('classId')
    const items = await db.assignment.findMany({
      where: { schoolId, ...(classId ? { classId } : {}) },
      include: { class: true, subject: true, creator: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return items
  })
}

export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      const title = String(body.title || '').trim()
      if (!title) throw new Error('title required')
      const a = await db.assignment.create({
        data: {
          schoolId,
          classId: body.classId || null,
          subjectId: body.subjectId || null,
          title,
          description: body.description || null,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          createdBy: user.id,
        },
      })
      return a
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT', 'TEACHER'] }
  )
}
