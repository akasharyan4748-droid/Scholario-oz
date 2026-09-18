'use client'

/**
 * communication/shared — pure helpers + label maps for the Communication
 * Hub (parent threads, direct staff threads, announcements, follow-ups).
 * No fetching, no mock arrays: every value that ends up on screen comes
 * from the API payload (types in ./types.ts and
 * src/lib/teacher-hub-types.ts).
 */

import {
  CONVERSATION_CATEGORY_LABELS,
  FOLLOW_UP_PRIORITY_LABELS,
  type ConversationCategory,
  type ConversationSummary,
  type FollowUpPriority,
} from '@/lib/teacher-hub-types'
import type { CommunicationAnnouncement, DirectConversationSummary } from './types'

// ─── Parent conversation helpers ───────────────────────────────────────

/** Chip tone per conversation category — shown in the THREAD HEADER only
 *  (restraint: not repeated on every list row). */
export const CATEGORY_TONES: Record<ConversationCategory, string> = {
  academic: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  attendance: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  behavior: 'border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400',
  wellbeing: 'border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  urgent: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400',
  general: 'border-border bg-muted text-muted-foreground',
}

/** Ordered category options for the new-message dialog (parent branch). */
export const CATEGORY_OPTIONS: { value: ConversationCategory; label: string }[] = (
  Object.keys(CONVERSATION_CATEGORY_LABELS) as ConversationCategory[]
).map((value) => ({ value, label: CONVERSATION_CATEGORY_LABELS[value] }))

/** Priority options for the follow-up dialog. */
export const PRIORITY_OPTIONS: { value: FollowUpPriority; label: string }[] = (
  Object.keys(FOLLOW_UP_PRIORITY_LABELS) as FollowUpPriority[]
).map((value) => ({ value, label: FOLLOW_UP_PRIORITY_LABELS[value] }))

/** Priority dot tone for the follow-up rows. */
export const PRIORITY_DOT: Record<FollowUpPriority, string> = {
  low: 'bg-slate-400 dark:bg-slate-500',
  normal: 'bg-amber-500',
  high: 'bg-rose-500',
}

/** Server sort order: pinned first, then lastMessageAt desc. */
export function sortConversations(list: ConversationSummary[]): ConversationSummary[] {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    const at = a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0
    const bt = b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0
    return bt - at
  })
}

/** One-line last-message preview ("You: …" for teacher-sent messages). */
export function conversationPreview(c: ConversationSummary): string {
  if (!c.lastMessage) return 'No messages yet'
  return `${c.lastMessage.fromTeacher ? 'You: ' : ''}${c.lastMessage.body.replace(/\s+/g, ' ').trim()}`
}

/** One-line preview for a direct (staff) conversation row. */
export function directPreview(c: DirectConversationSummary): string {
  if (!c.lastMessage) return 'No messages yet'
  const body = c.lastMessage.body.replace(/\s+/g, ' ').trim()
  return `${c.lastMessage.fromMe ? 'You: ' : ''}${body}`
}

// ─── Audience / role helpers ───────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  TEACHER: 'Teacher',
  PRINCIPAL: 'Principal',
  COORDINATOR: 'Coordinator',
  MANAGEMENT: 'Management',
  STUDENT: 'Student',
  PARENT: 'Parent',
}

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}

/** Compact audience chip tone for direct conversation rows. */
export function audienceTone(role: string): string {
  switch (role) {
    case 'PRINCIPAL':
    case 'MANAGEMENT':
      return 'border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400'
    case 'COORDINATOR':
      return 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400'
    case 'STUDENT':
      return 'border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400'
    default:
      return 'border-border bg-muted text-muted-foreground'
  }
}

// ─── Time helpers ──────────────────────────────────────────────────────

/**
 * Compact activity time for the conversation rows:
 * "Today · 10:32 AM" / "Yesterday · 6:05 PM" / "14 Sep 2026".
 */
export function conversationTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const time = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  const now = new Date()
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const today = startOf(now)
  if (startOf(d) === today) return `Today · ${time}`
  if (startOf(d) === today - 86_400_000) return `Yesterday · ${time}`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** First word of a name — used for template {student} interpolation. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

/** ISO timestamp → local calendar-day key ("2026-09-14"). */
export function dayKey(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Day key → divider label ("Today" / "Yesterday" / "14 Sep"). */
export function dayLabel(key: string): string {
  if (!key) return ''
  const today = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  const todayKey = `${today.getFullYear()}-${p(today.getMonth() + 1)}-${p(today.getDate())}`
  if (key === todayKey) return 'Today'
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  const yesterdayKey = `${yesterday.getFullYear()}-${p(yesterday.getMonth() + 1)}-${p(yesterday.getDate())}`
  if (key === yesterdayKey) return 'Yesterday'
  const d = new Date(`${key}T00:00:00`)
  return Number.isNaN(d.getTime())
    ? key
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/** True when the ISO timestamp falls within the last `days` days. */
export function withinDays(iso: string | null, days: number, now = Date.now()): boolean {
  if (!iso) return false
  const t = Date.parse(iso)
  return !Number.isNaN(t) && t >= now - days * 86_400_000
}

// ─── Announcement helpers ──────────────────────────────────────────────

/** Priority tone for the announcements list (dot + label). */
export function priorityTone(priority: string): { dot: string; label: string } {
  if (priority === 'URGENT') return { dot: 'bg-rose-500', label: 'Urgent' }
  if (priority === 'HIGH') return { dot: 'bg-amber-500', label: 'High' }
  return { dot: 'bg-muted-foreground/40', label: 'Normal' }
}

/** Chip tone for the audience tag on an announcement row. */
export function audienceChip(a: CommunicationAnnouncement): string {
  return a.ownClass
    ? 'border-primary/30 bg-primary/10 text-primary'
    : 'border-border bg-muted text-muted-foreground'
}

/** "Today" / "Yesterday" / "14 Sep 2026" for announcement dates. */
export function announcementDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const today = startOf(new Date())
  if (startOf(d) === today) return 'Today'
  if (startOf(d) === today - 86_400_000) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Relative clock time for the sent-messages rows ("Today · 4:20 PM" / date). */
export const sentTime = conversationTime

// ─── Templates ─────────────────────────────────────────────────────────

/**
 * Fill a school-approved template body: {student} → student's first name,
 * {teacher} → the teacher's name, {note} → '' (the teacher fills it in).
 */
export function applyTemplateBody(body: string, studentFirst: string, teacherName: string): string {
  return body
    .replaceAll('{student}', studentFirst || '{student}')
    .replaceAll('{teacher}', teacherName)
    .replaceAll('{note}', '')
}

// ─── Follow-ups ────────────────────────────────────────────────────────

export interface DueChip {
  label: string
  className: string
}

/** Due chip for a follow-up row: Overdue (rose) / Due today (amber) / date. */
export function dueChip(dueDate: string, now = new Date()): DueChip {
  const d = new Date(dueDate)
  if (Number.isNaN(d.getTime())) {
    return { label: '—', className: 'rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground' }
  }
  const due = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (due.getTime() < today.getTime()) {
    return {
      label: 'Overdue',
      className: 'rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400',
    }
  }
  if (due.getTime() === today.getTime()) {
    return {
      label: 'Due today',
      className: 'rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400',
    }
  }
  return {
    label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    className: 'rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground',
  }
}

/** yyyy-mm-dd for <input type="date"> — `days` from today. */
export function dateInputValue(days: number, now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// ─── Toolbar button recipes (exact Teacher Hub classes) ────────────────

export const PRIMARY_ACTION_CLASS =
  'flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60'

export const OUTLINE_ACTION_CLASS =
  'flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/50 disabled:opacity-60'
