import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import { audienceAllows, audienceLabel } from '@/lib/notices'
import {
  requireTeacher,
  authorizedStudentWhere,
  toStudentRef,
  toFollowUpItem,
} from '@/lib/teacher-hub'
import type {
  ConversationSummary,
} from '@/lib/teacher-hub-types'
import type { CommunicationHubPayload } from '@/components/teacher/modules/communication/types'

export const runtime = 'nodejs'

// GET /api/teacher/communication — the Communication Hub in ONE server-resolved
// call. The hub is the single teacher messaging surface (parents + staff +
// announcements), so this payload carries everything its panes render:
//   · conversations  the teacher's FULL ParentConversation list with unread
//                    counts, last-message previews and open follow-ups (the
//                    engine behind /api/teacher/parent-connect — threads are
//                    opened through that route)
//   · directConversations  Message rows between the teacher and staff
//                    counterparts, grouped into one summary per person
//   · followUps      open parent-communication follow-ups (items, not counts)
//   · announcements  Notification rows this role may see (audienceAllows,
//                    class fan-outs deduped — same rule as the bell feed)
//   · sent messages  her ParentMessages + direct Message rows, merged
//   · students       in-scope students with a linked guardian (message dialog)
//   · staffDirectory same-school staff the teacher may message
//   · stats          honest counts only — no fabricated rates
//
// The announcement list is NOT display-capped: the summary card's count must
// equal the number of rows actually visible to the teacher.
const ANNOUNCEMENT_FETCH_WINDOW = 200
const CONVERSATION_FETCH_WINDOW = 200
const MESSAGE_HISTORY_TAKE = 400
const DIRECT_FETCH_WINDOW = 200
const SENT_TAKE = 8
const CATEGORIES = ['general', 'academic', 'attendance', 'behavior', 'wellbeing', 'urgent']
const ACTIVE_WINDOW_MS = 21 * 86_400_000
const STAFF_ROLES = ['TEACHER', 'PRINCIPAL', 'COORDINATOR', 'MANAGEMENT']

const ROLE_LABELS: Record<string, string> = {
  TEACHER: 'Teacher',
  PRINCIPAL: 'Principal',
  COORDINATOR: 'Coordinator',
  MANAGEMENT: 'Management',
  STUDENT: 'Student',
  PARENT: 'Parent',
}

export async function GET() {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)

      const [
        announcementRows,
        conversations,
        followUpRows,
        templates,
        scopeStudents,
        sentParentRows,
        sentDirectRows,
        directRows,
        staffDirectory,
      ] = await Promise.all([
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
            parent: { select: { id: true, name: true, phone: true } },
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
          take: CONVERSATION_FETCH_WINDOW,
        }),
        db.teacherFollowUp.findMany({
          where: {
            schoolId: ctx.schoolId,
            teacherId: ctx.userId,
            kind: 'parent-connect',
            status: 'open',
          },
          include: {
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
          orderBy: { dueDate: 'asc' },
          take: 50,
        }),
        db.messageTemplate.findMany({
          where: { schoolId: ctx.schoolId, kind: 'parent-connect', isActive: true },
          orderBy: { sortOrder: 'asc' },
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
        // Every direct message involving the teacher (both directions) —
        // grouped client-side-of-the-server into one summary per counterpart.
        db.message.findMany({
          where: {
            schoolId: ctx.schoolId,
            OR: [{ senderId: ctx.userId }, { recipientId: ctx.userId }],
          },
          orderBy: { createdAt: 'desc' },
          take: DIRECT_FETCH_WINDOW,
          include: {
            sender: { select: { id: true, name: true, role: true } },
            recipient: { select: { id: true, name: true, role: true } },
          },
        }),
        db.user.findMany({
          where: {
            schoolId: ctx.schoolId,
            role: { in: STAFF_ROLES },
            status: 'ACTIVE',
            id: { not: ctx.userId },
          },
          select: { id: true, name: true, role: true },
          orderBy: [{ role: 'asc' }, { name: 'asc' }],
          take: 100,
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

      // ── Parent conversations: unread counts (exact via groupBy), last
      //    message previews and the nearest open follow-up (same construction
      //    as /api/teacher/parent-connect so the two stay interchangeable). ──
      const conversationIds = conversations.map((c) => c.id)
      const unreadByConversation = new Map<string, number>()
      const lastMessageByConversation = new Map<
        string,
        { id: string; conversationId: string; senderId: string; body: string; createdAt: Date }
      >()
      if (conversationIds.length) {
        const [unreadGroups, recentMessages] = await Promise.all([
          db.parentMessage.groupBy({
            by: ['conversationId'],
            where: {
              conversationId: { in: conversationIds },
              senderId: { not: ctx.userId },
              readAt: null,
            },
            _count: { _all: true },
          }),
          db.parentMessage.findMany({
            where: { conversationId: { in: conversationIds } },
            orderBy: { createdAt: 'desc' },
            take: MESSAGE_HISTORY_TAKE,
            select: { id: true, conversationId: true, senderId: true, body: true, createdAt: true },
          }),
        ])
        for (const g of unreadGroups) {
          unreadByConversation.set(g.conversationId, g._count._all)
        }
        for (const m of recentMessages) {
          if (!lastMessageByConversation.has(m.conversationId)) {
            lastMessageByConversation.set(m.conversationId, m)
          }
        }
      }
      const followUpByConversation = new Map<string, (typeof followUpRows)[number]>()
      for (const f of followUpRows) {
        if (f.conversationId && !followUpByConversation.has(f.conversationId)) {
          followUpByConversation.set(f.conversationId, f)
        }
      }

      const conversationRows: ConversationSummary[] = conversations.map((c) => {
        const last = lastMessageByConversation.get(c.id)
        const openFollowUp = followUpByConversation.get(c.id)
        return {
          id: c.id,
          category: (CATEGORIES.includes(c.category) ? c.category : 'general') as ConversationSummary['category'],
          pinned: c.pinned,
          createdAt: c.createdAt.toISOString(),
          lastMessageAt: c.lastMessageAt ? c.lastMessageAt.toISOString() : null,
          unread: unreadByConversation.get(c.id) ?? 0,
          parent: {
            id: c.parent.id,
            name: c.parent.name ?? 'Guardian',
            phone: c.parent.phone ?? null,
          },
          student: toStudentRef(c.student),
          lastMessage: last
            ? {
                body: last.body,
                fromTeacher: last.senderId === ctx.userId,
                createdAt: last.createdAt.toISOString(),
              }
            : null,
          openFollowUp: openFollowUp
            ? {
                id: openFollowUp.id,
                dueDate: openFollowUp.dueDate.toISOString(),
                priority: openFollowUp.priority as 'low' | 'normal' | 'high',
              }
            : null,
        }
      })
      conversationRows.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        const at = a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0
        const bt = b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0
        return bt - at
      })

      // ── Direct conversations: group Message rows by counterpart. Rows are
      //    newest-first, so the first row seen per counterpart is the last
      //    message of that thread. ──
      const directByCounterpart = new Map<string, CommunicationHubPayload['directConversations'][number]>()
      for (const m of directRows) {
        const fromMe = m.senderId === ctx.userId
        const counterpart = fromMe ? m.recipient : m.sender
        if (!counterpart) continue
        const existing = directByCounterpart.get(counterpart.id)
        if (!existing) {
          directByCounterpart.set(counterpart.id, {
            counterpartId: counterpart.id,
            counterpartName: counterpart.name ?? 'User',
            counterpartRole: counterpart.role,
            lastMessage: {
              id: m.id,
              subject: m.subject,
              body: m.body,
              fromMe,
              createdAt: m.createdAt.toISOString(),
            },
            lastMessageAt: m.createdAt.toISOString(),
            unread: !fromMe && !m.read ? 1 : 0,
            awaitingReply: !fromMe,
          })
        } else if (!fromMe && !m.read) {
          existing.unread++
        }
      }
      const directConversations = [...directByCounterpart.values()].sort(
        (a, b) => Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt),
      )

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
            m.recipient?.role && ROLE_LABELS[m.recipient.role]
              ? ROLE_LABELS[m.recipient.role]
              : 'Direct message',
          preview: (m.subject ? `${m.subject} — ` : '') + m.body.replace(/\s+/g, ' ').trim(),
          createdAt: m.createdAt.toISOString(),
        })),
      ].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))

      // ── Honest stats (every number is a real count for THIS teacher) ──
      const [parentSent, directSent] = await Promise.all([
        db.parentMessage.count({
          where: { schoolId: ctx.schoolId, senderId: ctx.userId },
        }),
        db.message.count({
          where: { schoolId: ctx.schoolId, senderId: ctx.userId },
        }),
      ])

      const now = Date.now()
      const endOfToday = new Date()
      endOfToday.setHours(23, 59, 59, 999)
      const followUpItems = followUpRows.map(toFollowUpItem)

      const unreadParent = conversationRows.reduce((sum, c) => sum + c.unread, 0)
      const unreadDirect = directConversations.reduce((sum, c) => sum + c.unread, 0)
      const parentActive = conversationRows.filter(
        (c) => c.lastMessageAt != null && Date.parse(c.lastMessageAt) >= now - ACTIVE_WINDOW_MS,
      ).length
      const directActive = directConversations.filter(
        (c) => Date.parse(c.lastMessageAt) >= now - ACTIVE_WINDOW_MS,
      ).length
      const parentAwaiting = conversationRows.filter(
        (c) => c.lastMessage != null && !c.lastMessage.fromTeacher,
      ).length
      const directAwaiting = directConversations.filter((c) => c.awaitingReply).length

      const stats = {
        unreadMessages: unreadParent + unreadDirect,
        unreadParentMessages: unreadParent,
        unreadDirectMessages: unreadDirect,
        activeConversations: parentActive + directActive,
        needsReply: parentAwaiting + directAwaiting,
        conversations: conversationRows.length,
        directConversations: directConversations.length,
        followUpsOpen: followUpItems.length,
        followUpsDue: followUpRows.filter((f) => f.dueDate.getTime() <= endOfToday.getTime()).length,
        announcements: announcements.length,
        announcementsUnread: announcements.filter((a) => a.readAt == null).length,
        messagesSent: parentSent + directSent,
        messagesSentToParents: parentSent,
        messagesSentDirect: directSent,
      }

      // ── Linkable students (same annotation as the parent-connect engine) ──
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
        conversations: conversationRows,
        directConversations,
        followUps: followUpItems,
        announcements,
        sentMessages: sentMessages.slice(0, SENT_TAKE),
        students,
        templates: templates.map((t) => ({
          id: t.id,
          label: t.label,
          body: t.body,
          category: t.category,
        })),
        staffDirectory: staffDirectory.map((s) => ({
          id: s.id,
          name: s.name ?? 'Staff member',
          role: s.role,
          roleLabel: ROLE_LABELS[s.role] ?? s.role,
        })),
      }
      return payload
    },
    { roles: ['TEACHER'] },
  )
}
