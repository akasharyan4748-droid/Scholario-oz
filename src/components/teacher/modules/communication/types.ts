/**
 * communication/types — the DTO contract for the Communication Hub module.
 *
 * Server routes in /api/teacher/communication/** serialize rows into these
 * shapes; the frontend consumes them verbatim. Kept inside the module folder
 * (not src/lib) because this contract is owned by the Communication Hub —
 * the shared hub DTOs it builds on live in src/lib/teacher-hub-types.ts,
 * which is imported read-only here.
 *
 * Dates are ISO strings. No mock arrays anywhere — every value on screen
 * comes from the API payload.
 */

import type {
  ConversationCategory,
  MessageTemplateItem,
  ParentLinkableStudent,
  StudentRef,
} from '@/lib/teacher-hub-types'

/** A school announcement visible to this teacher (audience-filtered, class-fan
 * outs deduped by the server the same way /api/notifications-feed does). */
export interface CommunicationAnnouncement {
  id: string
  title: string
  message: string
  /** raw audience tag ("ALL" | "TEACHERS" | "CLASS:Grade 9 - A" | …) */
  audience: string
  /** human label for the audience chip ("Whole school", "Grade 9 - A"…) */
  audienceLabel: string
  /** true when the announcement targets one of the teacher's own classes */
  ownClass: boolean
  /** NORMAL | HIGH | URGENT */
  priority: string
  createdAt: string
  senderName: string
  /** the teacher's own acknowledgement (NotificationRead) — null = unread */
  readAt: string | null
}

/** Compact conversation preview row (from the teacher's ParentConversation
 * rows — the full threads live in the Parent Connect module). */
export interface CommunicationConversation {
  id: string
  category: ConversationCategory
  pinned: boolean
  /** parent messages the teacher has not read yet */
  unread: number
  parent: { name: string }
  student: StudentRef
  lastMessage: { body: string; fromTeacher: boolean; createdAt: string } | null
  lastMessageAt: string | null
  /** the latest message in the thread is from the parent (teacher owes a reply) */
  awaitingReply: boolean
}

/** One message the teacher has sent (a ParentMessage inside a parent thread,
 * or a direct Message row to a student/colleague). */
export interface SentMessageItem {
  id: string
  /** 'parent' = ParentMessage in a Parent Connect thread · 'direct' = Message row */
  channel: 'parent' | 'direct'
  recipientName: string
  /** e.g. "Parent of Aarav Sharma · Grade 9 - A" or "Student" */
  contextLabel: string
  preview: string
  createdAt: string
}

/** Every number here is derived from real DB rows for THIS teacher. */
export interface CommunicationStats {
  /** unread direct Messages + unread parent messages addressed to the teacher */
  unreadMessages: number
  unreadParentMessages: number
  unreadDirectMessages: number
  /** announcements visible to the teacher's role (deduped) */
  announcements: number
  announcementsUnread: number
  /** ParentMessages + direct Messages the teacher has sent */
  messagesSent: number
  messagesSentToParents: number
  messagesSentDirect: number
  /** conversations whose latest message is from the parent */
  awaitingReply: number
  /** open parent-connect follow-ups */
  openFollowUps: number
  conversations: number
}

export interface CommunicationHubPayload {
  teacher: {
    name: string
    /** e.g. "Class Teacher · Grade 9 - A" (falls back to "Teacher") */
    scopeLabel: string
    /** labels of the classes this teacher is class teacher of */
    classLabels: string[]
  }
  stats: CommunicationStats
  /** newest-first preview rows (top 6) — full list length in stats.conversations */
  conversations: CommunicationConversation[]
  totalConversations: number
  /** visible to the teacher, newest first (top 12) */
  announcements: CommunicationAnnouncement[]
  /** newest first (top 8) */
  sentMessages: SentMessageItem[]
  /** in-scope students with a linked guardian — powers the Message Parent dialog */
  students: ParentLinkableStudent[]
  /** school-approved quick templates (MessageTemplate rows, kind parent-connect) */
  templates: MessageTemplateItem[]
}
