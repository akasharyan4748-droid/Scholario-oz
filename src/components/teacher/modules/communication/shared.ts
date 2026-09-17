'use client'

/**
 * communication/shared — pure presentational helpers for the Communication
 * Hub. No fetching, no mock arrays: every value that ends up on screen comes
 * from the two API payloads (types in ./types.ts and
 * '@/lib/teacher-hub-types').
 */

import type { ConversationSummary } from '@/lib/teacher-hub-types'
import type { AnnouncementDTO } from './types'

// ─── Announcement priority ────────────────────────────────────────────

export type PriorityTone = 'danger' | 'warning' | 'neutral'

/** Priority → StatusBadge variant (URGENT/HIGH/NORMAL; unknown → neutral). */
export function priorityTone(priority: string): PriorityTone {
  if (priority === 'URGENT') return 'danger'
  if (priority === 'HIGH') return 'warning'
  return 'neutral'
}

export function priorityLabel(priority: string): string {
  const p = priority?.toUpperCase()
  if (p === 'URGENT') return 'Urgent'
  if (p === 'HIGH') return 'High'
  return 'Normal'
}

/** Priority dot color for the compact notice-board rows. */
export function priorityDot(priority: string): string {
  if (priority === 'URGENT') return 'bg-rose-500'
  if (priority === 'HIGH') return 'bg-amber-500'
  return 'bg-muted-foreground/40'
}

// ─── Audience ─────────────────────────────────────────────────────────

/** DB audience tag → short human label ('CLASS:Grade 9 - A' → 'Grade 9 - A'). */
export function audienceLabel(audience: string): string {
  if (audience?.startsWith('CLASS:')) {
    const rest = audience.slice(6).trim()
    return rest || 'Class'
  }
  switch (audience) {
    case 'ALL':
      return 'Whole School'
    case 'STUDENTS':
      return 'All Students'
    case 'PARENTS':
      return 'All Parents'
    case 'TEACHERS':
      return 'All Teachers'
    case 'STAFF':
      return 'All Staff'
    default:
      return audience || 'School'
  }
}

// ─── Delivery / read status ───────────────────────────────────────────

/**
 * Read rate = acknowledgements ÷ estimated recipients (capped at 100).
 * null when the server could not estimate the audience — the UI then shows
 * the plain read count without a bar, never a fabricated percentage.
 */
export function deliveryRate(a: Pick<AnnouncementDTO, 'acknowledgedBy' | 'estimatedRecipients'>): number | null {
  const est = a.estimatedRecipients
  if (est === null || est <= 0) return null
  return Math.min(100, Math.round((a.acknowledgedBy / est) * 100))
}

// ─── Conversation summary helpers ─────────────────────────────────────

/** One-line last-message preview ("You: …" for teacher-sent messages). */
export function conversationPreview(c: ConversationSummary): string {
  if (!c.lastMessage) return 'No messages yet'
  return `${c.lastMessage.fromTeacher ? 'You: ' : ''}${c.lastMessage.body.replace(/\s+/g, ' ').trim()}`
}
