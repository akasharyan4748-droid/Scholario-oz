import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

export async function GET() {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const notifs = await db.notification.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { sender: { select: { name: true } } },
    })
    return notifs
  })
}

export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      const title = String(body.title || '').trim()
      const message = String(body.message || '').trim()
      if (!title || !message) throw new Error('title and message required')
      const n = await db.notification.create({
        data: {
          schoolId,
          title,
          message,
          audience: body.audience || 'ALL',
          priority: body.priority || 'NORMAL',
          senderId: user.id,
        },
      })
      return n
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT', 'TEACHER'] }
  )
}
