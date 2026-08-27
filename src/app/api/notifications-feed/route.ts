import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'

export const runtime = 'nodejs'

// GET aggregated notifications feed: unread messages + recent announcements
export async function GET() {
  return withUser(async (user) => {
    // Super admin has no school scope — return empty feed
    if (user.role === 'SUPER_ADMIN' || !user.schoolId) {
      return { feed: [], unreadCount: 0 }
    }

    const schoolId = user.schoolId

    // Unread messages addressed to this user
    const unreadMessages = await db.message.findMany({
      where: { schoolId, recipientId: user.id, read: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { sender: { select: { name: true, role: true } } },
    })

    // Recent school announcements (last 5)
    const announcements = await db.notification.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // Combine into a unified feed
    const feed = [
      ...unreadMessages.map((m) => ({
        id: m.id,
        type: 'MESSAGE',
        title: m.sender?.name ?? 'Unknown sender',
        description: m.subject,
        timestamp: m.createdAt,
        read: false,
      })),
      ...announcements.map((a) => ({
        id: a.id,
        type: 'ANNOUNCEMENT',
        title: a.title,
        description: a.message,
        timestamp: a.createdAt,
        read: false,
        priority: a.priority,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return {
      feed: feed.slice(0, 15),
      unreadCount: unreadMessages.length,
    }
  })
}

// PATCH — persist read state. Only MESSAGE items have per-user read state in
// the DB (announcements are school-wide broadcasts and stay ephemeral).
export async function PATCH(req: NextRequest) {
  return withUser(async (user) => {
    const body = await req.json().catch(() => null)
    const id = body?.id
    const type = (body?.type || 'MESSAGE').toUpperCase()
    if (!id || typeof id !== 'string') throw new Error('BAD_REQUEST')

    if (type === 'MESSAGE') {
      // Ensure the message belongs to this user before marking read
      const msg = await db.message.findUnique({ where: { id }, select: { recipientId: true } })
      if (!msg || msg.recipientId !== user.id) throw new Error('NOT_FOUND')
      await db.message.update({ where: { id }, data: { read: true } })
      return { ok: true, persisted: true }
    }

    // Announcements: nothing to persist server-side (acknowledged client-side only)
    return { ok: true, persisted: false }
  })
}
