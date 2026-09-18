import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import { requireTeacher, parseString } from '@/lib/teacher-hub'
import type { DirectThreadPayload } from '@/components/teacher/modules/communication/types'

export const runtime = 'nodejs'

const THREAD_TAKE = 200

// GET /api/teacher/communication/direct/[userId] — the full direct thread
// between the session teacher and one counterpart (a staff member, or any
// user the Message engine has connected them with). Marks the received,
// unread messages read server-side before returning — the caller clears its
// local unread badge from the payload.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const { userId } = await params

      const counterpart = await db.user.findFirst({
        where: { id: userId, schoolId: ctx.schoolId },
        select: { id: true, name: true, role: true, status: true },
      })
      if (!counterpart || counterpart.status !== 'ACTIVE') {
        throw new Error('Conversation participant not found in your school')
      }

      const [rows] = await Promise.all([
        db.message.findMany({
          where: {
            schoolId: ctx.schoolId,
            OR: [
              { senderId: ctx.userId, recipientId: counterpart.id },
              { senderId: counterpart.id, recipientId: ctx.userId },
            ],
          },
          orderBy: { createdAt: 'asc' },
          take: THREAD_TAKE,
        }),
        // Reading the thread marks the counterpart's messages read.
        db.message.updateMany({
          where: {
            schoolId: ctx.schoolId,
            senderId: counterpart.id,
            recipientId: ctx.userId,
            read: false,
          },
          data: { read: true },
        }),
      ])

      const payload: DirectThreadPayload = {
        counterpart: {
          id: counterpart.id,
          name: counterpart.name ?? 'User',
          role: counterpart.role,
        },
        messages: rows.map((m) => ({
          id: m.id,
          subject: m.subject,
          body: m.body,
          fromMe: m.senderId === ctx.userId,
          senderName:
            m.senderId === ctx.userId ? ctx.name : (counterpart.name ?? 'User'),
          read: m.read,
          createdAt: m.createdAt.toISOString(),
        })),
      }
      return payload
    },
    { roles: ['TEACHER'] },
  )
}

// POST /api/teacher/communication/direct/[userId] — send a direct message to
// a same-school counterpart (Message row; the shared /api/messages engine's
// persistence, scoped through the teacher session).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const { userId } = await params
      const body = await req.json().catch(() => null)
      if (!body || typeof body !== 'object') throw new Error('Invalid request body')

      const subject = parseString(body.subject, 'Subject', { required: true, max: 200 })
      const messageBody = parseString(body.body, 'Message', { required: true, max: 4000 })
      if (!subject || !messageBody) throw new Error('Subject and message are required')

      const counterpart = await db.user.findFirst({
        where: { id: userId, schoolId: ctx.schoolId, status: 'ACTIVE' },
        select: { id: true, name: true, role: true },
      })
      if (!counterpart) throw new Error('Recipient not found in your school')
      if (counterpart.id === ctx.userId) throw new Error('You cannot message yourself')

      const created = await db.message.create({
        data: {
          schoolId: ctx.schoolId,
          senderId: ctx.userId,
          recipientId: counterpart.id,
          subject,
          body: messageBody,
        },
      })

      return {
        message: {
          id: created.id,
          subject: created.subject,
          body: created.body,
          fromMe: true,
          senderName: ctx.name,
          read: false,
          createdAt: created.createdAt.toISOString(),
        },
      }
    },
    { roles: ['TEACHER'] },
  )
}
