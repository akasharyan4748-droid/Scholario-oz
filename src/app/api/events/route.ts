import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const upcoming = searchParams.get('upcoming')

    const where: Record<string, unknown> = { schoolId }
    if (type) where.type = type
    if (upcoming === '1') where.startDate = { gte: new Date() }

    const events = await db.schoolEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
      take: 100,
      include: { creator: { select: { name: true } } },
    })
    return events
  })
}

export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      const title = String(body.title || '').trim()
      if (!title) throw new Error('Event title is required')

      const ev = await db.schoolEvent.create({
        data: {
          schoolId,
          title,
          description: body.description || null,
          type: body.type || 'EVENT',
          startDate: body.startDate ? new Date(body.startDate) : new Date(),
          endDate: body.endDate ? new Date(body.endDate) : null,
          location: body.location || null,
          audience: body.audience || 'ALL',
          createdBy: user.id,
        },
        include: { creator: { select: { name: true } } },
      })
      return ev
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT', 'TEACHER'] }
  )
}

export async function DELETE(req: NextRequest) {
  return withUser(
    async () => {
      const { searchParams } = new URL(req.url)
      const id = searchParams.get('id')
      if (!id) throw new Error('id required')
      await db.schoolEvent.delete({ where: { id } })
      return { id }
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}

// debug
