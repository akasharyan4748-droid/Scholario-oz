import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

// Composer audience → canonical DB audience tag. Class-like selections keep a
// CLASS: prefix so /api/notifications-feed can restrict visibility to the
// students of that class (staff roles always see class notices for oversight).
const AUDIENCE_MAP: Record<string, string> = {
  'All Parents': 'PARENTS',
  'All Students': 'STUDENTS',
  'All Teachers': 'TEACHERS',
  'All Staff': 'STAFF',
  'Whole School': 'ALL',
}

function mapAudience(raw: string): string {
  const trimmed = raw.trim()
  if (AUDIENCE_MAP[trimmed]) return AUDIENCE_MAP[trimmed]
  if (/class|grade|section/i.test(trimmed)) return `CLASS:${trimmed}`
  return trimmed.toUpperCase()
}

function mapPriority(category: string): string {
  if (category === 'Emergency') return 'URGENT'
  if (category === 'Examination' || category === 'Academic') return 'HIGH'
  return 'NORMAL'
}

// Estimated recipient count for the composed audience (real DB counts where
// possible). Returns null when we cannot estimate.
async function estimateRecipients(schoolId: string, audience: string): Promise<number | null> {
  try {
    if (audience === 'ALL' || audience === 'STUDENTS' || audience === 'PARENTS') {
      return await db.student.count({ where: { schoolId, user: { status: 'ACTIVE' } } })
    }
    if (audience === 'TEACHERS') {
      return await db.teacher.count({ where: { schoolId, user: { status: 'ACTIVE' } } })
    }
    if (audience === 'STAFF') {
      const t = await db.teacher.count({ where: { schoolId, user: { status: 'ACTIVE' } } })
      return t + 8 // + admin/support staff estimate
    }
    if (audience.startsWith('CLASS:')) {
      const className = audience.slice(6).trim()
      return await db.student.count({
        where: { schoolId, user: { status: 'ACTIVE' }, class: { name: { contains: className } } },
      })
    }
    return null
  } catch {
    return null
  }
}

// POST /api/announcements — publish a real school announcement.
// Creates a Notification row; the event-stream mini-service picks it up
// within ~4s and pushes a live toast to every connected dashboard.
export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      if (user.role !== 'PRINCIPAL') throw new Error('FORBIDDEN')

      const body = await req.json().catch(() => null)
      const title = String(body?.title || '').trim()
      const message = String(body?.message || '').trim()
      const category = String(body?.category || 'General')
      const audienceRaw = String(body?.audience || 'ALL')
      if (!title || title.length < 3) throw new Error('Title must be at least 3 characters')
      if (!message || message.length < 3) throw new Error('Message must be at least 3 characters')
      if (title.length > 120) throw new Error('Title too long (max 120 characters)')
      if (message.length > 2000) throw new Error('Message too long (max 2000 characters)')

      const audience = mapAudience(audienceRaw)
      const priority = mapPriority(category)
      const recipients = await estimateRecipients(schoolId, audience)

      const notification = await db.notification.create({
        data: {
          schoolId,
          title,
          message,
          audience,
          priority,
          senderId: user.id,
        },
        include: { sender: { select: { name: true, role: true } } },
      })

      return {
        id: notification.id,
        title: notification.title,
        audience: notification.audience,
        priority: notification.priority,
        createdAt: notification.createdAt,
        sender: notification.sender?.name ?? user.name,
        estimatedRecipients: recipients,
        live: true,
      }
    },
    { roles: ['PRINCIPAL'] }
  )
}

// GET /api/announcements — recent published announcements (newest first).
// Lets the Communication Center History tab show which broadcasts actually
// reached the platform (vs draft/mock-only records).
export async function GET() {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const rows = await db.notification.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        sender: { select: { name: true, role: true } },
        _count: { select: { reads: true } },
      },
    })
    return {
      announcements: rows.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        audience: n.audience,
        priority: n.priority,
        sender: n.sender?.name ?? 'Unknown',
        createdAt: n.createdAt,
        acknowledgedBy: n._count.reads,
      })),
    }
  })
}
