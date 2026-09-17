import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import { audienceAllows, audienceLabel } from '@/lib/notices'
import {
  requireTeacher,
  authorizedStudentWhere,
  toStudentRef,
} from '@/lib/teacher-hub'
import type { CommunicationHubPayload } from '@/components/teacher/modules/communication/types'

export const runtime = 'nodejs'

// GET /api/teacher/communication — the Communication Hub in ONE server-
// resolved call. Everything the teacher sees on screen is derived here from
// real rows, scoped by the session (school + teacher):
//   · announcements  Notification rows this role may see (audienceAllows,
//                    class fan-outs deduped — same rule as the bell feed)
//   · conversations  the teacher's own ParentConversation rows with unread
//                    counts + last-message previews (READ-ONLY preview —
//                    the threads themselves live in Parent Connect)
//   · sent messages  her ParentMessages + direct Message rows, merged
//   · students       in-scope students with a linked guardian (message dialog)
//   · stats          honest counts only — no fabricated rates
//
// The announcement list is NOT display-capped: the summary card's count must
// equal the number of rows actually visible to the teacher, so every visible
// announcement is returned (bounded only by the fetch window, which covers
// far more rows than a school realistically produces).
const ANNOUNCEMENT_FETCH_WINDOW = 200
// Conversation window mirrors Parent Connect (take 200): the stat must count
// every thread the teacher owns, not a display page.
const CONVERSATION_TAKE = 6
const CONVERSATION_FETCH_WINDOW = 200
const SENT_TAKE = 8
const CATEGORIES = ['general', 'academic', 'attendance', 'behavior', 'wellbeing', 'urgent']

export async function GET() {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)

      const [announcementRows, conversations, sentParentRows, sentDirectRows, scopeStudents, templates] =
        await Promise.all([
          db.notification.findMany({
            where: { schoolId: ctx.schoolId },
            orderBy: { createdAt: 'desc' },
            take: ANNOUNCEMENT_FETCH_WINDOW,
            include: {
              sender: { select: { name: true } },
              reads: { where: { userId: ctx.userId }, select: { readAt: true } },
            },
          }),
          db.parentConversation.findMany({
            where: { schoolId: ctx.schoolId, teacherId: ctx.userId },
            include: {
              parent: { select: { id: true, name: true } },
              student: {
                select: {
                  id: true,
                  rollNo: true,
                  classId: true,
                  class: { select: { name: true, section: true } },
                  user: { select: { name: true } },
                },
              },
              // Prisma relation take:1 + desc order = the latest message only.
              messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
            orderBy: { lastMessageAt: 'desc' },
            take: CONVERSATION_FETCH_WINDOW,
          }),
          db.parentMessage.findMany({
            where: { schoolId: ctx.schoolId, senderId: ctx.userId },
            orderBy: { createdAt: 'desc' },
            take: SENT_TAKE,
            include: {
              conversation: {
                include: {
                  parent: { select: { name: true } },
                  student: {
                    select: {
                      id: true,
                      rollNo: true,
                      classId: true,
                      class: { select: { name: true, section: true } },
                      user: { select: { name: true } },
                    },
                  },
                },
              },
            },
          }),
          db.message.findMany({
            where: { schoolId: ctx.schoolId, senderId: ctx.userId },
            orderBy: { createdAt: 'desc' },
            take: SENT_TAKE,
            include: { recipient: { select: { name: true, role: true } } },
          }),
          db.student.findMany({
            where: { guardianId: { not: null }, ...authorizedStudentWhere(ctx) },
            include: {
              class: { select: { name: true, section: true } },
              user: { select: { name: true } },
            },
            orderBy: { rollNo: 'asc' },
            take: 300,
          }),
          db.messageTemplate.findMany({
            where: { schoolId: ctx.schoolId, kind: 'parent-connect', isActive: true },
            orderBy: { sortOrder: 'asc' },
          }),
        ])

      // ── Announcements: audience filter + class-fanout dedupe (bell-feed rule) ──
      const ownClassKeys = new Set(
        ctx.classTeacherOf.map((c) => c.label.trim().toLowerCase()),
      )
      const seenBroadcasts = new Set<string>()
      const announcements = [] as CommunicationHubPayload['announcements']
      for (const row of announcementRows) {
        if (!(await audienceAllows(row.audience, user))) continue
        const key = `${row.title}\u0000${row.message}`
        if (seenBroadcasts.has(key)) continue
        seenBroadcasts.add(key)
        const audience = row.audience ?? 'ALL'
        announcements.push({
          id: row.id,
          title: row.title,
          message: row.message,
          audience,
          audienceLabel: audienceLabel(audience),
          ownClass:
            audience.toUpperCase().startsWith('CLASS:') &&
            ownClassKeys.has(audience.slice(6).trim().toLowerCase()),
          priority: row.priority,
          createdAt: row.createdAt.toISOString(),
          senderName: row.sender?.name ?? 'School office',
          readAt: row.reads[0]?.readAt ? row.reads[0].readAt.toISOString() : null,
        })
      }

      // ── Conversations: unread counts (exact via groupBy) + preview rows ──
      const conversationIds = conversations.map((c) => c.id)
      const unreadGroups = conversationIds.length
        ? await db.parentMessage.groupBy({
            by: ['conversationId'],
            where: {
              conversationId: { in: conversationIds },
              senderId: { not: ctx.userId },
              readAt: null,
            },
            _count: { _all: true },
          })
        : []
      const unreadByConversation = new Map(
        unreadGroups.map((g) => [g.conversationId, g._count._all]),
      )

      const conversationRows = conversations.map((c) => {
        const last = c.messages[0] ?? null
        return {
          id: c.id,
          category: (CATEGORIES.includes(c.category) ? c.category : 'general') as CommunicationHubPayload['conversations'][number]['category'],
          pinned: c.pinned,
          unread: unreadByConversation.get(c.id) ?? 0,
          parent: { name: c.parent.name ?? 'Guardian' },
          student: toStudentRef(c.student),
          lastMessage: last
            ? {
                body: last.body,
                fromTeacher: last.senderId === ctx.userId,
                createdAt: last.createdAt.toISOString(),
              }
            : null,
          lastMessageAt: c.lastMessageAt ? c.lastMessageAt.toISOString() : null,
          awaitingReply: last != null && last.senderId !== ctx.userId,
        }
      })
      // Pinned first, then most recent activity (same order as Parent Connect).
      conversationRows.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        const at = a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0
        const bt = b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0
        return bt - at
      })

      // ── Sent messages: parent-thread messages + direct rows, merged ──
      const sentMessages: CommunicationHubPayload['sentMessages'] = [
        ...sentParentRows.map((m) => ({
          id: m.id,
          channel: 'parent' as const,
          recipientName: m.conversation.parent.name ?? 'Guardian',
          contextLabel: `Parent of ${m.conversation.student.user?.name ?? 'student'} · ${toStudentRef(m.conversation.student).classLabel}`,
          preview: m.body.replace(/\s+/g, ' ').trim(),
          createdAt: m.createdAt.toISOString(),
        })),
        ...sentDirectRows.map((m) => ({
          id: m.id,
          channel: 'direct' as const,
          recipientName: m.recipient?.name ?? 'Recipient',
          contextLabel:
            m.recipient?.role === 'STUDENT'
              ? 'Student'
              : m.recipient?.role === 'PARENT'
                ? 'Parent'
                : m.recipient?.role === 'TEACHER'
                  ? 'Teacher'
                  : 'Direct message',
          preview: (m.subject ? `${m.subject} — ` : '') + m.body.replace(/\s+/g, ' ').trim(),
          createdAt: m.createdAt.toISOString(),
        })),
      ].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))

      // ── Honest stats (every number is a real count for THIS teacher) ──
      const [unreadDirect, parentSent, directSent, openFollowUps] = await Promise.all([
        db.message.count({
          where: { schoolId: ctx.schoolId, recipientId: ctx.userId, read: false },
        }),
        db.parentMessage.count({
          where: { schoolId: ctx.schoolId, senderId: ctx.userId },
        }),
        db.message.count({
          where: { schoolId: ctx.schoolId, senderId: ctx.userId },
        }),
        db.teacherFollowUp.count({
          where: {
            schoolId: ctx.schoolId,
            teacherId: ctx.userId,
            kind: 'parent-connect',
            status: 'open',
          },
        }),
      ])

      const unreadParent = conversationRows.reduce((sum, c) => sum + c.unread, 0)
      const awaitingReply = conversationRows.filter((c) => c.awaitingReply).length

      const stats = {
        unreadMessages: unreadParent + unreadDirect,
        unreadParentMessages: unreadParent,
        unreadDirectMessages: unreadDirect,
        announcements: announcements.length,
        announcementsUnread: announcements.filter((a) => a.readAt == null).length,
        messagesSent: parentSent + directSent,
        messagesSentToParents: parentSent,
        messagesSentDirect: directSent,
        awaitingReply,
        openFollowUps,
        conversations: conversationRows.length,
      }

      // ── Linkable students (same annotation as Parent Connect) ──
      const conversationByStudentParent = new Map<string, string>()
      for (const c of conversations) {
        const key = `${c.studentId}\u0000${c.parentId}`
        if (!conversationByStudentParent.has(key)) conversationByStudentParent.set(key, c.id)
      }
      const students = scopeStudents.map((s) => ({
        student: toStudentRef(s),
        guardianName: s.guardianName ?? null,
        guardianPhone: s.guardianPhone ?? null,
        parentUserId: s.guardianId ?? null,
        existingConversationId: s.guardianId
          ? conversationByStudentParent.get(`${s.id}\u0000${s.guardianId}`) ?? null
          : null,
      }))

      const scopeLabel =
        (ctx.classTeacherOf.length
          ? `Class Teacher · ${ctx.classTeacherOf.map((c) => c.label).join(' · ')}`
          : null) ?? 'Teacher'

      const payload: CommunicationHubPayload = {
        teacher: {
          name: ctx.name,
          scopeLabel,
          classLabels: ctx.classTeacherOf.map((c) => c.label),
        },
        stats,
        conversations: conversationRows.slice(0, CONVERSATION_TAKE),
        totalConversations: conversationRows.length,
        announcements,
        sentMessages: sentMessages.slice(0, SENT_TAKE),
        students,
        templates: templates.map((t) => ({
          id: t.id,
          label: t.label,
          body: t.body,
          category: t.category,
        })),
      }
      return payload
    },
    { roles: ['TEACHER'] },
  )
}
