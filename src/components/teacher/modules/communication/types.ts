/**
 * communication/types — the DTO contract for the Communication Hub module.
 *
 * Server routes in /api/teacher/communication/** serialize rows into these
 * shapes; the frontend consumes them verbatim. The hub is the single
 * teacher-facing messaging surface: parent threads (ParentConversation —
 * the former Parent Connect module, absorbed here), direct staff threads
 * (Message rows) and school announcements.
 *
 * Dates are ISO strings. No mock arrays anywhere — every value on screen
 * comes from the API payload.
 */

import type {
  ConversationSummary,
  FollowUpItem,
  MessageTemplateItem,
  ParentLinkableStudent,
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

/** A direct (staff) conversation — Message rows between the teacher and one
 * counterpart, grouped server-side into a single summary row. */
export interface DirectConversationSummary {
  /** User.id of the teacher's counterpart */
  counterpartId: string
  counterpartName: string
  /** TEACHER | PRINCIPAL | COORDINATOR | MANAGEMENT | STUDENT | PARENT */
  counterpartRole: string
  lastMessage: {
    id: string
    subject: string
    body: string
    fromMe: boolean
    createdAt: string
  } | null
  lastMessageAt: string
  /** received messages the teacher has not read yet */
  unread: number
  /** the latest message in the thread is from the counterpart (teacher owes a reply) */
  awaitingReply: boolean
}

/** A staff member the teacher may message (same school, active). */
export interface StaffDirectoryEntry {
  id: string
  name: string
  /** raw role constant */
  role: string
  /** human label ("Teacher", "Principal", …) */
  roleLabel: string
}

/** One message in a direct staff thread. */
export interface DirectThreadMessage {
  id: string
  subject: string
  body: string
  fromMe: boolean
  senderName: string
  read: boolean
  createdAt: string
}

/** GET /api/teacher/communication/direct/[userId] */
export interface DirectThreadPayload {
  counterpart: { id: string; name: string; role: string }
  messages: DirectThreadMessage[]
}

/** One message the teacher has sent (a ParentMessage inside a parent thread,
 * or a direct Message row to a staff member/student). */
export interface SentMessageItem {
  id: string
  /** 'parent' = ParentMessage in a parent thread · 'direct' = Message row */
  channel: 'parent' | 'direct'
  recipientName: string
  /** e.g. "Parent of Aarav Sharma · Grade 9 - A" or "Principal" */
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
  /** parent + direct conversations with activity in the last 21 days */
  activeConversations: number
  /** conversations whose latest message is from the other side (parent or staff) */
  needsReply: number
  /** parent conversations */
  conversations: number
  /** direct staff conversations */
  directConversations: number
  /** open follow-ups (kind parent-connect) */
  followUpsOpen: number
  /** open follow-ups due today or earlier */
  followUpsDue: number
  /** announcements visible to the teacher's role (deduped) */
  announcements: number
  announcementsUnread: number
  /** ParentMessages + direct Messages the teacher has sent */
  messagesSent: number
  messagesSentToParents: number
  messagesSentDirect: number
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
  /** the teacher's parent conversations (full list, pinned first) */
  conversations: ConversationSummary[]
  /** direct staff conversations grouped by counterpart (newest first) */
  directConversations: DirectConversationSummary[]
  /** open follow-ups on parent conversations (due-date order) */
  followUps: FollowUpItem[]
  /** visible to the teacher, newest first */
  announcements: CommunicationAnnouncement[]
  /** newest first (top 8) */
  sentMessages: SentMessageItem[]
  /** in-scope students with a linked guardian — powers the Message Parent dialog */
  students: ParentLinkableStudent[]
  /** school-approved quick templates (MessageTemplate rows, kind parent-connect) */
  templates: MessageTemplateItem[]
  /** same-school staff the teacher may message */
  staffDirectory: StaffDirectoryEntry[]
}
