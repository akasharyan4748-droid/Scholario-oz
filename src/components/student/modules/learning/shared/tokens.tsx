'use client'

/**
 * learning/shared/tokens — the Learning module's semantic token system.
 *
 * Colour has meaning (§5), never decoration:
 *   · SUBJECT colour comes from the canonical Timetable system (subjectColor)
 *     — one identity for a subject across the whole workspace.
 *   · RESOURCE TYPE carries a controlled type language:
 *       video/interactive → sky/cyan   (digital content)
 *       notes             → teal       (reading)
 *       pdf               → orange     (documents)
 *       worksheet         → amber      (practice)
 *       quiz              → fuchsia    (challenge)
 *       deck              → violet     (cognitive tools)
 *   · DIFFICULTY is a quiet label, never a big badge.
 */

import {
  PlayCircle, FileText, StickyNote, ClipboardList, HelpCircle, MousePointerClick,
  Layers, Clock, FileBadge2, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ResourceType, Difficulty, LearningResource, ResourceProgress } from '@/lib/store/learning-types'

export interface TypeToken {
  label: string
  icon: LucideIcon
  /** Small icon tile surface. */
  tile: string
  /** Thin text accent (labels). */
  text: string
}

const TYPE_TOKENS: Record<ResourceType, TypeToken> = {
  video: { label: 'Video', icon: PlayCircle, tile: 'border-sky-500/25 bg-sky-500/[0.09] text-sky-600 dark:text-sky-400', text: 'text-sky-600 dark:text-sky-400' },
  interactive: { label: 'Interactive', icon: MousePointerClick, tile: 'border-cyan-500/25 bg-cyan-500/[0.09] text-cyan-600 dark:text-cyan-400', text: 'text-cyan-600 dark:text-cyan-400' },
  pdf: { label: 'PDF', icon: FileBadge2, tile: 'border-orange-500/25 bg-orange-500/[0.09] text-orange-600 dark:text-orange-400', text: 'text-orange-600 dark:text-orange-400' },
  notes: { label: 'Notes', icon: StickyNote, tile: 'border-teal-500/25 bg-teal-500/[0.09] text-teal-600 dark:text-teal-400', text: 'text-teal-600 dark:text-teal-400' },
  worksheet: { label: 'Worksheet', icon: ClipboardList, tile: 'border-amber-500/25 bg-amber-500/[0.09] text-amber-600 dark:text-amber-400', text: 'text-amber-600 dark:text-amber-400' },
  quiz: { label: 'Quiz', icon: HelpCircle, tile: 'border-fuchsia-500/25 bg-fuchsia-500/[0.09] text-fuchsia-600 dark:text-fuchsia-400', text: 'text-fuchsia-600 dark:text-fuchsia-400' },
  deck: { label: 'Flashcards', icon: Layers, tile: 'border-violet-500/25 bg-violet-500/[0.09] text-violet-600 dark:text-violet-400', text: 'text-violet-600 dark:text-violet-400' },
}

export function typeToken(type: ResourceType): TypeToken {
  return TYPE_TOKENS[type] ?? TYPE_TOKENS.notes
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: 'Beginner',
  core: 'Core',
  challenge: 'Challenge',
}

/** One honest metadata line for a resource (§12 — small, useful). */
export function resourceMeta(r: LearningResource): string {
  const bits: string[] = []
  if (r.durationMin) bits.push(`${r.durationMin} min`)
  if (r.pages) bits.push(`${r.pages} pages`)
  if (r.questions?.length) bits.push(`${r.questions.length} questions`)
  if (!bits.length) bits.push(r.topic)
  return bits.join(' · ')
}

/** The primary action label for a resource given the student's progress. */
export function primaryAction(r: LearningResource, progress?: ResourceProgress): string {
  if (r.type === 'quiz') return progress?.quizScore ? 'Retake quiz' : 'Start quiz'
  if (r.type === 'deck') return 'Review deck'
  if (progress?.pct === 100) return 'Review again'
  if (progress && progress.pct > 0) return 'Continue'
  return r.type === 'video' ? 'Watch' : 'Open'
}

/** Progress bar segment with semantic colour (emerald = completion). */
export function ProgressBar({ pct, className }: { pct: number; className?: string }) {
  return (
    <span className={cn('block h-1.5 overflow-hidden rounded-full bg-muted', className)} aria-hidden>
      <span
        className={cn('block h-full rounded-full transition-all duration-500', pct >= 100 ? 'bg-emerald-500' : 'bg-primary')}
        style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
      />
    </span>
  )
}

/** Duration/format helper shared by planner + hub. */
export function fmtMin(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`
}

export { Clock }
