import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import { requireTeacher, auditTeacherAction } from '@/lib/teacher-hub'
import { SEED_TEACHERS } from '@/lib/store/teachers-store/seed-data'
import { DEFAULT_POSITIONS } from '@/lib/store/teachers-store/constants'
import { getTeacherActivePermissions } from '@/lib/store/teachers-store/helpers'

export const runtime = 'nodejs'

// POST /api/teacher/communication/announcement — publish a school
// announcement as a Notification row. Permission is enforced on BOTH sides:
//   · client — the "New Announcement" dialog is rendered only when the
//     teacher's active position permissions include 'announcements'
//     (teachers-store — the same permission system that gates the teacher
//     nav), so normal teachers never even see the control ("Do not display
//     administrative controls to normal Teachers").
//   · server — this route resolves the session teacher in the canonical
//     staff roster (the same SEED_TEACHERS + DEFAULT_POSITIONS data the
//     client store initializes from) and independently requires the
//     'announcements' permission from an ACTIVE position. The demo teacher
//     (Rohan Mehta — Subject Teacher + Class Teacher) does NOT hold it, so
//     the endpoint rejects him exactly as the hidden button implies.
// The server independently enforces everything else it can derive from the
// session: TEACHER role, school scope, payload validity and an audience
// WHITELIST (school-wide tags + the teacher's own class-teacher classes —
// class options are re-derived server-side, never taken from the client).
// NOTE (honest limitation): position assignments live in the client-side
// teachers-store; the server consults the canonical seed roster, so an
// in-session principal edit to a teacher's positions is not visible here
// until that data is persisted server-side (follow-up).
const AUDIENCE_TAGS: Record<string, string> = {
  'All Teachers': 'TEACHERS',
  'All Parents': 'PARENTS',
  'All Staff': 'STAFF',
  'Whole School': 'ALL',
}
const PRIORITIES = new Set(['NORMAL', 'HIGH', 'URGENT'])

export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)

      // ── REAL server-side permission check ──────────────────────────
      // Resolve the session teacher in the canonical staff roster and
      // require 'announcements' from an ACTIVE position (e.g. Cultural
      // Coordinator). No permission data → no admin control (fail closed).
      const rosterRecord = SEED_TEACHERS.find(
        (t) => t.email.toLowerCase() === user.email.toLowerCase(),
      )
      const permissions = rosterRecord
        ? getTeacherActivePermissions(rosterRecord, DEFAULT_POSITIONS)
        : []
      if (!permissions.includes('announcements')) throw new Error('FORBIDDEN')

      const body = await req.json().catch(() => null)
      if (!body || typeof body !== 'object') throw new Error('Invalid request body')

      const title = typeof body.title === 'string' ? body.title.trim() : ''
      const message = typeof body.message === 'string' ? body.message.trim() : ''
      const audienceLabelInput = typeof body.audience === 'string' ? body.audience.trim() : ''
      const priority =
        typeof body.priority === 'string' && PRIORITIES.has(body.priority)
          ? body.priority
          : 'NORMAL'

      if (!title || title.length < 3) throw new Error('Title must be at least 3 characters')
      if (title.length > 120) throw new Error('Title must be at most 120 characters')
      if (!message || message.length < 3) throw new Error('Message must be at least 3 characters')
      if (message.length > 2000) throw new Error('Message must be at most 2000 characters')
      if (!audienceLabelInput) throw new Error('Audience is required')

      // Audience whitelist: school-wide tags, or one of the teacher's OWN
      // class-teacher classes (re-derived from the session — a client cannot
      // broadcast to a class it is not responsible for).
      let audience: string
      if (AUDIENCE_TAGS[audienceLabelInput]) {
        audience = AUDIENCE_TAGS[audienceLabelInput]
      } else {
        const ownClass = ctx.classTeacherOf.find(
          (c) => c.label.toLowerCase() === audienceLabelInput.toLowerCase(),
        )
        if (!ownClass) throw new Error('Audience must be a school-wide group or one of your classes')
        audience = `CLASS:${ownClass.label}`
      }

      const notification = await db.notification.create({
        data: {
          schoolId: ctx.schoolId,
          title,
          message,
          audience,
          priority,
          senderId: ctx.userId,
        },
      })

      await auditTeacherAction(
        user,
        ctx.schoolId,
        'TEACHER_ANNOUNCEMENT_PUBLISHED',
        `"${title}" → ${audience} (notification ${notification.id})`,
      )

      return {
        id: notification.id,
        title: notification.title,
        audience: notification.audience,
        priority: notification.priority,
        createdAt: notification.createdAt.toISOString(),
      }
    },
    { roles: ['TEACHER'] },
  )
}
