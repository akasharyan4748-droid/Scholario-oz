'use client'

/**
 * parent-connect/shared — category config maps + small pure helpers for the
 * Parent Connect module. No fetching, no mock arrays: every value that ends
 * up on screen comes from the API payload (types in
 * src/lib/teacher-hub-types.ts).
 */

import {
  CONVERSATION_CATEGORY_LABELS,
  FOLLOW_UP_PRIORITY_LABELS,
  type ConversationCategory,
  type ConversationSummary,
  type FollowUpPriority,
} from '@/lib/teacher-hub-types'

// ─── Category config ──────────────────────────────────────────────────

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

/** Ordered category options for the new-conversation dialog. */
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

// ─── Conversation helpers ──────────────────────────────────────────────

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

// ─── List filters ──────────────────────────────────────────────────────

export type ListFilter = 'all' | 'unread' | 'follow-up' | 'recent'

export const LIST_FILTERS: { value: ListFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'follow-up', label: 'Needs Follow-up' },
  { value: 'recent', label: 'Recent' },
]

/** Search (parent OR student name) + filter chip predicate. */
export function filterConversations(
  list: ConversationSummary[],
  filter: ListFilter,
  query: string,
): ConversationSummary[] {
  const q = query.trim().toLowerCase()
  return list.filter((c) => {
    if (
      q &&
      !c.parent.name.toLowerCase().includes(q) &&
      !c.student.name.toLowerCase().includes(q)
    ) {
      return false
    }
    switch (filter) {
      case 'unread':
        return c.unread > 0
      case 'follow-up':
        return c.openFollowUp != null
      case 'recent':
        return withinDays(c.lastMessageAt, 7)
      default:
        return true
    }
  })
}

// ─── Templates ─────────────────────────────────────────────────────────

/**
 * Fill a school-approved template body: {student} → student's first name,
 * {teacher} → the teacher's name, {note} → '' (the teacher fills it in).
 */
export function applyTemplateBody(body: string, studentFirst: string, teacherName: string): string {
  return body.replaceAll('{student}', studentFirst || '{student}').replaceAll('{teacher}', teacherName).replaceAll('{note}', '')
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
