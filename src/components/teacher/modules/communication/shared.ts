'use client'

/**
 * communication/shared — pure helpers + label maps for the Communication
 * Hub. No fetching, no mock arrays: every value that ends up on screen comes
 * from the API payload (types in ./types.ts).
 */

import type {
  CommunicationAnnouncement,
  CommunicationConversation,
} from './types'

// ─── Conversation helpers ──────────────────────────────────────────────

/** One-line last-message preview ("You: …" for teacher-sent messages). */
export function conversationPreview(c: CommunicationConversation): string {
  if (!c.lastMessage) return 'No messages yet'
  const body = c.lastMessage.body.replace(/\s+/g, ' ').trim()
  return `${c.lastMessage.fromTeacher ? 'You: ' : ''}${body}`
}

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

/** Chip tone for the conversation category (preview rows: muted by default). */
export const CATEGORY_CHIP: Record<string, string> = {
  urgent: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400',
  academic: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  attendance: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  behavior: 'border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400',
  wellbeing: 'border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  general: 'border-border bg-muted text-muted-foreground',
}

export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    general: 'General',
    academic: 'Academic',
    attendance: 'Attendance',
    behavior: 'Behaviour',
    wellbeing: 'Wellbeing',
    urgent: 'Urgent',
  }
  return labels[category] ?? 'General'
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
 * (Same interpolation contract as Parent Connect templates.)
 */
export function applyTemplateBody(body: string, studentFirst: string, teacherName: string): string {
  return body
    .replaceAll('{student}', studentFirst || '{student}')
    .replaceAll('{teacher}', teacherName)
    .replaceAll('{note}', '')
}

/** First word of a name — used for template interpolation. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

// ─── Toolbar button recipes (exact Teacher Hub classes) ────────────────

export const PRIMARY_ACTION_CLASS =
  'flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60'

export const OUTLINE_ACTION_CLASS =
  'flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/50 disabled:opacity-60'
