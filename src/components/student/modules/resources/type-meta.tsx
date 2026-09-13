'use client'

/**
 * type-meta — the Learning resource TYPE visual system (spec §10/§12),
 * replacing the old resources/data.tsx.
 *
 * Every resource type actually supported by the canonical learning store
 * gets: an icon, a label, and a soft tint chip. Colour is information
 * architecture (§5/§6): each type keeps ONE deterministic accent so a
 * card is recognisable at a glance — never decoration.
 *
 * This file also carries the Hub's shared compact action-button classes
 * (44px touch target on mobile, denser from `sm:` up) so Continue / Open /
 * Study look identical everywhere they appear.
 */

import { PlayCircle, FileText, StickyNote, FileQuestion, ClipboardList, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Difficulty, LearningResource, ResourceType } from '@/lib/store/student-learning-store'

export interface TypeMeta {
  icon: LucideIcon
  label: string
  /** Soft tint chip classes — static pairs that read on white cards. */
  chip: string
}

export const TYPE_META: Record<ResourceType, TypeMeta> = {
  video: { icon: PlayCircle, label: 'Video', chip: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400' },
  pdf: { icon: FileText, label: 'PDF', chip: 'bg-rose-500/10 text-rose-700 dark:text-rose-400' },
  notes: { icon: StickyNote, label: 'Notes', chip: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  quiz: { icon: FileQuestion, label: 'Quiz', chip: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  worksheet: { icon: ClipboardList, label: 'Worksheet', chip: 'bg-violet-500/10 text-violet-700 dark:text-violet-400' },
}

/** TYPE badge — icon + label, never colour alone (§59). */
export function TypeChip({ type, className }: { type: ResourceType; className?: string }) {
  const meta = TYPE_META[type]
  const Icon = meta.icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', meta.chip, className)}>
      <Icon className="h-3 w-3" aria-hidden />
      {meta.label}
    </span>
  )
}

const DIFFICULTY_META: Record<Difficulty, string> = {
  easy: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  hard: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
}

/** Difficulty pill — small, labelled, capitalized. */
export function DifficultyPill({ difficulty, className }: { difficulty: Difficulty; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-medium capitalize', DIFFICULTY_META[difficulty], className)}>
      {difficulty}
    </span>
  )
}

/** The one size fact each resource carries — "8 min" / "8 pages" / "10 questions". */
export function sizeLabelOf(r: LearningResource): string {
  if (r.durationMin) return `${r.durationMin} min`
  if (r.pages) return `${r.pages} pages`
  if (r.questions) return `${r.questions} questions`
  return ''
}

/* ── Shared compact action buttons (mobile 44px touch target) ────────── */

export const BTN_PRIMARY =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:h-9'

/** VIOLET — study focus / continue (REFINE-1 accent semantics). */
export const BTN_VIOLET =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 sm:h-9'

export const BTN_OUTLINE =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-border bg-card/50 px-3.5 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9'

export const BTN_SOFT_VIOLET =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:text-violet-400 sm:h-9'

export const BTN_SOFT_AMBER =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 dark:text-amber-400 sm:h-9'
