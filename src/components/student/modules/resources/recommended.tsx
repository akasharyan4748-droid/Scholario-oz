'use client'

/**
 * Recommended — "Recommended for you" (spec §14, §61/§62).
 *
 * The item list comes from recommendedOf() (real signals only: weak
 * subjects, in-progress work, bookmarks). Each card states the REAL
 * reason it is here — derived from state, never invented:
 *   in progress  → "Finish what you started"        (violet)
 *   weak subject → "Focus subject — from your latest results" (amber)
 *   bookmarked   → "Saved for later"                (cyan)
 * Primary action opens the resource detail.
 */

import { motion } from 'framer-motion'
import { Bookmark, CheckCircle2, Circle, Eye, PlayCircle, Target, type LucideIcon } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '../../shell/page-header'
import { subjectColor } from '../timetable/subject-colors'
import { cn } from '@/lib/utils'
import type { LearningResource, ResourceProgress } from '@/lib/store/student-learning-store'
import { TypeChip, sizeLabelOf, BTN_VIOLET, BTN_OUTLINE } from './type-meta'

interface RecommendedProps {
  items: LearningResource[]
  progress: Record<string, ResourceProgress>
  bookmarks: string[]
  weakSubjects: string[]
  onOpen: (id: string) => void
}

interface Reason {
  icon: LucideIcon
  label: string
  className: string
}

/** The REAL reason a resource is recommended — derived, never fabricated. */
function reasonOf(
  r: LearningResource,
  progress: Record<string, ResourceProgress>,
  bookmarks: string[],
  weakSubjects: string[],
): Reason {
  const pct = progress[r.id]?.pct ?? 0
  if (pct > 0 && pct < 100) {
    return { icon: PlayCircle, label: 'Finish what you started', className: 'text-violet-600 dark:text-violet-400' }
  }
  if (weakSubjects.includes(r.subject)) {
    return { icon: Target, label: 'Focus subject — from your latest results', className: 'text-amber-600 dark:text-amber-400' }
  }
  if (bookmarks.includes(r.id)) {
    return { icon: Bookmark, label: 'Saved for later', className: 'text-cyan-600 dark:text-cyan-400' }
  }
  return { icon: Circle, label: 'Not started yet', className: 'text-muted-foreground' }
}

export function Recommended({ items, progress, bookmarks, weakSubjects, onOpen }: RecommendedProps) {
  if (items.length === 0) return null

  return (
    <section className="space-y-3">
      <SectionLabel hint="From your activity">Recommended for you</SectionLabel>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r, i) => {
          const pct = progress[r.id]?.pct ?? 0
          const inProgress = pct > 0 && pct < 100
          const completed = pct >= 100
          const reason = reasonOf(r, progress, bookmarks, weakSubjects)
          const ReasonIcon = reason.icon
          const sc = subjectColor(r.subject)
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              whileHover={{ y: -2 }}
              className="h-full"
            >
              <GlassCard hover={false} className="on-card flex h-full flex-col gap-2 p-4 transition-shadow hover:shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <TypeChip type={r.type} />
                  {completed && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      Completed
                    </span>
                  )}
                </div>

                <button type="button" onClick={() => onOpen(r.id)} className="min-w-0 flex-1 text-left">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{r.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', sc.dot)} aria-hidden />
                    <span className="truncate">
                      {r.subject} · {r.topic}
                    </span>
                  </p>
                </button>

                <p className={cn('flex items-center gap-1.5 text-[11px] font-medium', reason.className)}>
                  <ReasonIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {reason.label}
                </p>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-2.5">
                  <span className="min-w-0 truncate text-[11px] text-muted-foreground">
                    {sizeLabelOf(r)}
                    {inProgress ? ` · ${pct}%` : ''}
                  </span>
                  <button type="button" onClick={() => onOpen(r.id)} className={inProgress ? BTN_VIOLET : BTN_OUTLINE}>
                    {inProgress ? (
                      <PlayCircle className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {inProgress ? 'Continue' : 'Open'}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
