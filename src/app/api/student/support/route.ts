import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { api } from '@/lib/api'

export const runtime = 'nodejs'

/**
 * SS-1 — student Help & Support.
 *
 * GET  — the school office's REAL contact details (from the School row)
 *        so the student knows who they're reaching.
 *
 * POST — send a support request to the school office. Delivered through
 *        the EXISTING Message infrastructure (no parallel ticket system):
 *        the recipient is resolved server-side to the school's principal
 *        (fallback: first MANAGEMENT user) — a student can never pick an
 *        arbitrary recipient, and cross-school sends are impossible because
 *        schoolId is derived from the session.
 */

const SUPPORT_CATEGORIES = ['account', 'technical', 'general', 'feedback'] as const
type SupportCategory = (typeof SUPPORT_CATEGORIES)[number]

const CATEGORY_LABELS: Record<SupportCategory, string> = {
  account: 'Account issue',
  technical: 'Technical issue',
  general: 'General question',
  feedback: 'Feedback',
}

export async function GET() {
  return api(async () => {
    const user = await getCurrentUser()
    if (!user) throw new Error('UNAUTHORIZED')
    if (!user.schoolId) throw new Error('NO_SCHOOL')

    const school = await db.school.findUnique({
      where: { id: user.schoolId },
      select: { name: true, phone: true, email: true, address: true, city: true },
    })
    return {
      office: school
        ? {
            schoolName: school.name,
            phone: school.phone,
            email: school.email,
            address: [school.address, school.city].filter(Boolean).join(', ') || null,
          }
        : null,
    }
  })
}

export async function POST(req: NextRequest) {
  return api(async () => {
    const user = await getCurrentUser()
    if (!user) throw new Error('UNAUTHORIZED')
    if (user.role !== 'STUDENT') throw new Error('FORBIDDEN')
    if (!user.schoolId) throw new Error('NO_SCHOOL')

    const body = await req.json().catch(() => ({}))
    const category = String(body?.category || 'general') as SupportCategory
    if (!SUPPORT_CATEGORIES.includes(category)) throw new Error('Invalid support category')

    const subject = String(body?.subject || '').trim()
    const messageBody = String(body?.body || '').trim()
    if (!subject || !messageBody) throw new Error('Subject and message are required')
    if (subject.length > 120) throw new Error('Subject must be under 120 characters')
    if (messageBody.length > 4000) throw new Error('Message must be under 4000 characters')

    // Resolve the office recipient server-side (principal, then management).
    const office = await db.user.findFirst({
      where: { schoolId: user.schoolId, role: 'PRINCIPAL', status: 'ACTIVE' },
      select: { id: true, name: true },
    })
    const fallbackOffice = office
      ? null
      : await db.user.findFirst({
          where: { schoolId: user.schoolId, role: 'MANAGEMENT', status: 'ACTIVE' },
          select: { id: true, name: true },
        })
    const recipient = office ?? fallbackOffice
    if (!recipient) throw new Error('No school office account is available to receive messages')

    const label = CATEGORY_LABELS[category]
    const student = await db.student.findUnique({
      where: { userId: user.id },
      select: { classId: true, rollNo: true },
    })

    await db.message.create({
      data: {
        schoolId: user.schoolId,
        senderId: user.id,
        recipientId: recipient.id,
        subject: `[Student support · ${label}] ${subject}`,
        body:
          `${messageBody}\n\n— Sent from Settings → Help & Support by ${user.name ?? user.email}` +
          (student?.rollNo ? ` (Roll ${student.rollNo})` : ''),
      },
    })

    await db.activityLog.create({
      data: {
        schoolId: user.schoolId,
        userId: user.id,
        action: 'support_request_sent',
        detail: `Support request (${category}) delivered to the school office.`,
      },
    }).catch(() => {})

    return { ok: true, deliveredTo: recipient.name ?? 'School office' }
  })
}
