'use client'

/**
 * shared — the Flashcards module's meta system (spec §15–§18).
 *
 * The old mock-typed configs are gone; everything here maps a REAL value
 * from the canonical `student-learning-store` to its semantic presentation
 * (multi-accent semantics, never colour alone — §59):
 *   · status    neutral=new · amber=learning · sky=reviewing · emerald=mastered
 *   · difficulty emerald=easy · amber=medium · rose=hard
 *   · quality    rose=again · amber=hard · sky=good · emerald=easy
 *
 * `previewIntervalOf` is an EXACT mirror of the store's `reviewCard`
 * SM-2-lite math so the quality buttons always show the interval that
 * WILL result — never a static fake label (§17/§61).
 */

import { cn } from '@/lib/utils'
import type { Difficulty, LearningCard, ReviewQuality } from '@/lib/store/student-learning-store'

// ─── Card status ──────────────────────────────────────────────────

export const STATUS_META: Record<LearningCard['status'], { label: string; chip: string }> = {
  new: { label: 'New', chip: 'bg-muted text-muted-foreground' },
  learning: { label: 'Learning', chip: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  reviewing: { label: 'Reviewing', chip: 'bg-sky-500/10 text-sky-700 dark:text-sky-400' },
  mastered: { label: 'Mastered', chip: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
}

/** Status chip — labelled text with its semantic tint (never colour alone). */
export function StatusChip({ status, className }: { status: LearningCard['status']; className?: string }) {
  const meta = STATUS_META[status]
  return (
    <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold', meta.chip, className)}>
      {meta.label}
    </span>
  )
}

// ─── Difficulty ───────────────────────────────────────────────────

export const DIFFICULTY_META: Record<Difficulty, string> = {
  easy: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  hard: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
}

/** Difficulty pill — small, labelled, capitalized. */
export function DifficultyPill({ difficulty, className }: { difficulty: Difficulty; className?: string }) {
  return (
    <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-1.5 py-px text-[10px] font-medium capitalize', DIFFICULTY_META[difficulty], className)}>
      {difficulty}
    </span>
  )
}

// ─── Review quality (SM-2-lite) ───────────────────────────────────

export const QUALITY_META: Record<ReviewQuality, { label: string; btn: string }> = {
  again: {
    label: 'Again',
    btn: 'border-rose-500/30 bg-rose-500/[0.06] text-rose-700 hover:bg-rose-500/15 focus-visible:ring-rose-500/40 dark:text-rose-400',
  },
  hard: {
    label: 'Hard',
    btn: 'border-amber-500/30 bg-amber-500/[0.06] text-amber-700 hover:bg-amber-500/15 focus-visible:ring-amber-500/40 dark:text-amber-400',
  },
  good: {
    label: 'Good',
    btn: 'border-sky-500/30 bg-sky-500/[0.06] text-sky-700 hover:bg-sky-500/15 focus-visible:ring-sky-500/40 dark:text-sky-400',
  },
  easy: {
    label: 'Easy',
    btn: 'border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-700 hover:bg-emerald-500/15 focus-visible:ring-emerald-500/40 dark:text-emerald-400',
  },
}

export const QUALITY_ORDER: ReviewQuality[] = ['again', 'hard', 'good', 'easy']

/**
 * The interval that WILL result if `quality` is chosen for `card` —
 * mirrors the store's `reviewCard` exactly:
 *   again → card returns in 10 minutes (interval resets to 0)
 *   hard  → max(1, round(interval × 1.2)) days
 *   good  → interval === 0 ? 1 : round(interval × ease) days
 *   easy  → interval === 0 ? 3 : round(interval × ease × 1.3) days
 */
export function previewIntervalOf(card: Pick<LearningCard, 'interval' | 'ease'>, quality: ReviewQuality): string {
  switch (quality) {
    case 'again':
      return '10 min'
    case 'hard':
      return `${Math.max(1, Math.round(card.interval * 1.2))}d`
    case 'good':
      return `${card.interval === 0 ? 1 : Math.round(card.interval * card.ease)}d`
    case 'easy':
      return `${card.interval === 0 ? 3 : Math.round(card.interval * card.ease * 1.3)}d`
  }
}

// ─── Due-ness helpers (same semantics as dueStatsOf / reviewQueueOf) ──

/** A card is reviewable now when it is not mastered and its due time has come (new cards are due). */
export function isDueNow(card: LearningCard, at: Date = new Date()): boolean {
  return card.status !== 'mastered' && (card.dueAt === null || new Date(card.dueAt).getTime() <= at.getTime())
}

/** Compact due label for card rows: "New" · "Due now" · "today" · "in 3d" · "—". */
export function dueLabelOf(card: LearningCard, at: Date = new Date()): string {
  if (card.status === 'new' && card.dueAt === null) return 'New'
  if (card.dueAt === null) return '—'
  const diffMs = new Date(card.dueAt).getTime() - at.getTime()
  if (diffMs <= 0) return 'Due now'
  const hours = diffMs / 3_600_000
  if (hours < 24) return 'today'
  return `in ${Math.ceil(hours / 24)}d`
}

/** True when the due label should carry the attention tint. */
export function isDueLabelHot(card: LearningCard, at: Date = new Date()): boolean {
  const label = dueLabelOf(card, at)
  return label === 'Due now' || label === 'today'
}
