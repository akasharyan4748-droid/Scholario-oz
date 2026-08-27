import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'

export const runtime = 'nodejs'

// Which announcement audiences each viewer role is allowed to see.
// `ALL` is visible to everyone; other tags are matched case-insensitively.
const AUDIENCE_BY_ROLE: Record<string, string[]> = {
  PRINCIPAL: ['ALL', 'TEACHERS', 'STAFF', 'STUDENTS', 'PRINCIPAL', 'ADMIN'],
  TEACHER: ['ALL', 'TEACHERS', 'STAFF'],
  STUDENT: ['ALL', 'STUDENTS'],
  PARENT: ['ALL', 'PARENTS', 'GUARDIANS'],
}

function baseAudienceAllows(audience: string, role: string): boolean {
  const allowed = AUDIENCE_BY_ROLE[role] ?? ['ALL']
  return allowed.includes(audience.toUpperCase())
}

// `CLASS:<class name>` notices target a specific class roster. Staff roles
// (principal/teacher) always see them for oversight; students only when the
// class matches their own (exact name, shared grade base, or prefix match).
async function audienceAllows(audience: string | null | undefined, user: {
  id: string
  role: string
  schoolId: string | null
}): Promise<boolean> {
  if (!audience) return true
  const aud = audience.trim()
  if (!aud.toUpperCase().startsWith('CLASS:')) return baseAudienceAllows(aud, user.role)

  // Staff oversight — principals & teachers see every class notice
  if (user.role === 'PRINCIPAL' || user.role === 'TEACHER' || user.role === 'SUPER_ADMIN') return true
  if (user.role !== 'STUDENT') return false

  const student = await db.student.findUnique({
    where: { userId: user.id },
    include: { class: { select: { name: true } } },
  })
  if (!student?.class?.name) return false
  const target = aud.slice(6).trim().toUpperCase()
  const mine = student.class.name.trim().toUpperCase()
  if (!target || !mine) return false
  if (target === mine) return true
  // "Grade 10" (grade-wide) should reach students of "Grade 10 - A"
  const baseOf = (s: string) => s.replace(/[-–]\s*[A-Z]\s*$/, '').trim()
  return baseOf(mine) === baseOf(target) || mine.startsWith(target) || target.startsWith(mine)
}

// GET aggregated notifications feed: unread messages + recent announcements.
// Announcement read-state is persisted per-user via the NotificationRead table,
// so acknowledgements survive reloads (messages use their own `read` column).
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

    // Recent school announcements (last 8 visible to this role) with read marks.
    // Audience filtering happens app-side because audience tags are free-form
    // (fetch a wider window, filter, then trim so the list stays full).
    const announcementRows = await db.notification.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: 24,
      include: { reads: { where: { userId: user.id }, select: { id: true } } },
    })
    const announcements: typeof announcementRows = []
    for (const row of announcementRows) {
      if (announcements.length >= 8) break
      if (await audienceAllows(row.audience, user)) announcements.push(row)
    }

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
        read: a.reads.length > 0,
        priority: a.priority,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    const unreadAnnouncements = announcements.filter((a) => a.reads.length === 0).length

    return {
      feed: feed.slice(0, 15),
      unreadCount: unreadMessages.length + unreadAnnouncements,
    }
  })
}

// PATCH — persist read state. MESSAGE items set `read` on the row;
// ANNOUNCEMENT items upsert a per-user NotificationRead acknowledgement.
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

    if (type === 'ANNOUNCEMENT') {
      // Ensure the announcement exists in this user's school scope
      const ntf = await db.notification.findUnique({ where: { id }, select: { schoolId: true } })
      if (!ntf || ntf.schoolId !== user.schoolId) throw new Error('NOT_FOUND')
      await db.notificationRead.upsert({
        where: { notificationId_userId: { notificationId: id, userId: user.id } },
        create: { notificationId: id, userId: user.id },
        update: {},
      })
      return { ok: true, persisted: true }
    }

    return { ok: true, persisted: false }
  })
}
