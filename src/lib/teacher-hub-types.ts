/**
 * teacher-hub-types — the shared DTO contract for the three Teacher Hub
 * modules (Parent Connect / Student Behavior / Student Mentoring).
 *
 * Pure types + tiny config maps: NO server imports — this file is safe for
 * client components. Server routes in /api/teacher/** serialize rows into
 * these shapes; frontend modules consume them verbatim.
 *
 * Dates are ISO strings. Statuses are lowercase strings (SQLite has no
 * enums) — the unions below document the allowed values.
 */

// ---------- shared ----------

export interface StudentRef {
  id: string
  name: string
  rollNo: string | null
  classLabel: string // e.g. "Grade 9 - A"
  classId: string | null
}

export type FollowUpKind = 'parent-connect' | 'behavior' | 'mentoring'
export type FollowUpPriority = 'low' | 'normal' | 'high'
export type FollowUpStatus = 'open' | 'done' | 'cancelled'

export interface FollowUpItem {
  id: string
  kind: FollowUpKind
  reason: string
  note: string | null
  dueDate: string
  priority: FollowUpPriority
  status: FollowUpStatus
  student: StudentRef | null
  conversationId: string | null
  recordId: string | null
  sessionId: string | null
  createdAt: string
}

// ---------- Parent Connect ----------

export type ConversationCategory =
  | 'general'
  | 'academic'
  | 'attendance'
  | 'behavior'
  | 'wellbeing'
  | 'urgent'

export interface ConversationSummary {
  id: string
  category: ConversationCategory
  pinned: boolean
  createdAt: string
  lastMessageAt: string | null
  /** parent messages the teacher has not read yet */
  unread: number
  parent: { id: string; name: string; phone: string | null }
  student: StudentRef
  lastMessage: { body: string; fromTeacher: boolean; createdAt: string } | null
  openFollowUp: { id: string; dueDate: string; priority: FollowUpPriority } | null
}

export interface ThreadMessage {
  id: string
  fromTeacher: boolean
  senderName: string
  body: string
  createdAt: string
  /** when the RECIPIENT read it (null = not read yet) */
  readAt: string | null
}

export interface ThreadPayload {
  conversation: {
    id: string
    category: ConversationCategory
    pinned: boolean
    createdAt: string
    parent: { id: string; name: string; phone: string | null }
    student: StudentRef
    teacher: { name: string }
  }
  messages: ThreadMessage[]
}

export interface MessageTemplateItem {
  id: string
  label: string
  body: string
  category: string
}

/** A student the teacher may start a conversation about (has a linked guardian user). */
export interface ParentLinkableStudent {
  student: StudentRef
  guardianName: string | null
  guardianPhone: string | null
  parentUserId: string | null
  existingConversationId: string | null
}

export interface ParentConnectStats {
  total: number
  /** conversation with a message in the last 21 days */
  active: number
  unread: number
  followUpsOpen: number
  /** open follow-ups due today or earlier */
  followUpsDue: number
  /** % of parent messages (last 90 days) followed by a teacher reply — null when no parent messages */
  replyRate: number | null
}

export interface ParentConnectPayload {
  teacher: { name: string; classLabel: string }
  conversations: ConversationSummary[]
  followUps: FollowUpItem[]
  templates: MessageTemplateItem[]
  students: ParentLinkableStudent[]
  stats: ParentConnectStats
}

// ---------- Student Behavior ----------

export type BehaviorType = 'positive' | 'observation' | 'concern'
export type BehaviorStatus = 'open' | 'monitoring' | 'resolved'

export interface BehaviorCategoryItem {
  key: string
  label: string
  kind: 'any' | 'positive' | 'concern'
}

export interface BehaviorRecordItem {
  id: string
  date: string
  /** category key — resolve the label client-side via categories list */
  category: string
  type: BehaviorType
  description: string
  actionTaken: string | null
  followUpRequired: boolean
  followUpDate: string | null
  status: BehaviorStatus
  parentNotified: boolean
  /** teacher/staff-only note — never rendered on any parent/student surface */
  privateNote: string | null
  recordedBy: { id: string; name: string }
  student: StudentRef
}

export interface BehaviorStats {
  studentsObserved: number
  positive: number
  observation: number
  concern: number
  /** type=concern AND status != resolved */
  openConcerns: number
  followUpsOpen: number
  followUpsDue: number
  total: number
}

export interface BehaviorPayload {
  scopeLabel: string
  categories: BehaviorCategoryItem[]
  records: BehaviorRecordItem[]
  followUps: FollowUpItem[]
  /** students the teacher may record observations for */
  students: StudentRef[]
  stats: BehaviorStats
}

export interface StudentBehaviorProfile {
  student: StudentRef
  records: BehaviorRecordItem[]
  counts: { positive: number; observation: number; concern: number; open: number }
  followUps: FollowUpItem[]
  mentoring: { isMentee: boolean; status: string | null }
  conversationId: string | null
}

// ---------- Student Mentoring ----------

export type MenteeStatus = 'on-track' | 'watch' | 'needs-support' | 'critical'
export type SupportType =
  | 'academic'
  | 'attendance'
  | 'social'
  | 'wellbeing'
  | 'career'
  | 'general'
export type SessionType =
  | 'academic'
  | 'wellbeing'
  | 'attendance'
  | 'career'
  | 'personal-development'
  | 'general'
export type GoalStatus = 'not-started' | 'in-progress' | 'on-track' | 'achieved' | 'paused'

export interface MenteeItem {
  id: string
  status: MenteeStatus
  supportType: SupportType
  notes: string | null
  active: boolean
  createdAt: string
  student: StudentRef
  lastSessionAt: string | null
  nextFollowUpAt: string | null
  goals: { total: number; achieved: number; inProgress: number }
  sessionCount: number
}

export interface SessionItem {
  id: string
  date: string
  type: SessionType
  discussion: string
  actionItems: string[]
  durationMinutes: number | null
  followUpDate: string | null
  student: StudentRef
}

export interface GoalItem {
  id: string
  title: string
  target: string | null
  reviewDate: string | null
  status: GoalStatus
  createdAt: string
  student: StudentRef
}

export interface MentoringStats {
  activeMentees: number
  sessionsThisMonth: number
  followUpsOpen: number
  followUpsDue: number
  /** status in (needs-support, critical) AND active */
  needingSupport: number
  totalSessions: number
}

export interface MentoringPayload {
  teacher: { name: string; classLabel: string }
  assignments: MenteeItem[]
  sessions: SessionItem[]
  goals: GoalItem[]
  followUps: FollowUpItem[]
  /** students the teacher may add as mentees / log sessions for */
  students: StudentRef[]
  stats: MentoringStats
}

// ---------- client-side config (labels / tones shared by the modules) ----------

export const FOLLOW_UP_PRIORITY_LABELS: Record<FollowUpPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
}

export const MENTEE_STATUS_LABELS: Record<MenteeStatus, string> = {
  'on-track': 'On Track',
  watch: 'Watch',
  'needs-support': 'Needs Support',
  critical: 'Critical',
}

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  academic: 'Academic',
  wellbeing: 'Wellbeing',
  attendance: 'Attendance',
  career: 'Career',
  'personal-development': 'Personal Development',
  general: 'General',
}

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  'on-track': 'On Track',
  achieved: 'Achieved',
  paused: 'Paused',
}

export const SUPPORT_TYPE_LABELS: Record<SupportType, string> = {
  academic: 'Academic Support',
  attendance: 'Attendance Support',
  social: 'Social Support',
  wellbeing: 'Wellbeing Check-in',
  career: 'Career Guidance',
  general: 'General Support',
}

export const BEHAVIOR_TYPE_LABELS: Record<BehaviorType, string> = {
  positive: 'Positive',
  observation: 'Observation',
  concern: 'Concern',
}

export const BEHAVIOR_STATUS_LABELS: Record<BehaviorStatus, string> = {
  open: 'Open',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
}

export const CONVERSATION_CATEGORY_LABELS: Record<ConversationCategory, string> = {
  general: 'General',
  academic: 'Academic',
  attendance: 'Attendance',
  behavior: 'Behaviour',
  wellbeing: 'Wellbeing',
  urgent: 'Urgent',
}
