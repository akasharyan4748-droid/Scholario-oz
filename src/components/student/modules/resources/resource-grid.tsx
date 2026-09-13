'use client'

/**
 * ResourceGrid — the discovery grid (spec §11/§12/§13/§54).
 *
 * Functional resource cards: TYPE badge · title · subject·topic (with the
 * subjectColor dot) · size fact + difficulty + source teacher · progress
 * bar + % while in progress · Completed check state · ONE primary action
 * (Continue when in progress, Open otherwise — both open the detail) ·
 * a secondary kebab menu with Bookmark toggle / Add to planner / Mark
 * complete. Every action writes the canonical store (§62 no dead buttons).
 * Responsive: 1 col mobile → 2 tablet → 3 desktop → 4 very wide.
 */

import { motion } from 'framer-motion'
import {
  Bookmark,
  BookmarkCheck,
  CalendarPlus,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  PlayCircle,
  Search,
} from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { subjectColor } from '../timetable/subject-colors'
import { cn } from '@/lib/utils'
import { useStudentLearningStore, type LearningResource } from '@/lib/store/student-learning-store'
import { DifficultyPill, TypeChip, sizeLabelOf, BTN_VIOLET, BTN_OUTLINE } from './type-meta'
import { useResourceActions } from './actions'

interface ResourceGridProps {
  items: LearningResource[]
  onOpen: (id: string) => void
}

export function ResourceGrid({ items, onOpen }: ResourceGridProps) {
  const progress = useStudentLearningStore((s) => s.progress)
  const bookmarks = useStudentLearningStore((s) => s.bookmarks)
  const actions = useResourceActions()

  if (items.length === 0) {
    return (
      <GlassCard hover={false} className="on-card px-6 py-12 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
          <Search className="h-5 w-5" aria-hidden />
        </div>
        <p className="text-sm font-semibold">No resources found</p>
        <p className="mt-1 text-xs text-muted-foreground">Try a different search or filter.</p>
      </GlassCard>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4">
      {items.map((r, i) => {
        const pct = progress[r.id]?.pct ?? 0
        const inProgress = pct > 0 && pct < 100
        const completed = pct >= 100
        const isSaved = bookmarks.includes(r.id)
        const sc = subjectColor(r.subject)
        return (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.25), duration: 0.25 }}
            whileHover={{ y: -2 }}
            className="h-full"
          >
            <GlassCard
              hover={false}
              className={cn(
                'on-card flex h-full flex-col gap-2.5 p-4 transition-all hover:shadow-xs',
                completed ? 'border-emerald-500/30' : 'hover:border-primary/30',
              )}
            >
              {/* TYPE badge · saved mark · secondary actions */}
              <div className="flex items-start justify-between gap-1">
                <div className="flex min-h-11 items-center sm:min-h-0">
                  <TypeChip type={r.type} />
                </div>
                <div className="flex items-center">
                  {isSaved && (
                    <span
                      className="flex h-11 w-9 items-center justify-center text-amber-500 sm:h-7 sm:w-7"
                      title="Saved for later"
                    >
                      <BookmarkCheck className="h-3.5 w-3.5" aria-hidden />
                      <span className="sr-only">Saved for later</span>
                    </span>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={`More actions for ${r.title}`}
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:h-9 sm:w-9"
                      >
                        <MoreHorizontal className="h-4 w-4" aria-hidden />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => actions.bookmark(r)}>
                        {isSaved ? <BookmarkCheck /> : <Bookmark />}
                        {isSaved ? 'Remove bookmark' : 'Bookmark'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => actions.addToPlanner(r)}>
                        <CalendarPlus />
                        Add to planner
                      </DropdownMenuItem>
                      {!completed && (
                        <DropdownMenuItem onClick={() => actions.complete(r)}>
                          <CheckCircle2 />
                          Mark complete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Body — title · subject·topic · metadata (opens detail) */}
              <button type="button" onClick={() => onOpen(r.id)} className="min-w-0 flex-1 text-left">
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{r.title}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', sc.dot)} aria-hidden />
                  <span className="truncate">
                    {r.subject} · {r.topic}
                  </span>
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="tabular-nums">{sizeLabelOf(r)}</span>
                  <DifficultyPill difficulty={r.difficulty} />
                  <span className="truncate">By {r.source}</span>
                </div>
              </button>

              {/* Progress / completion — real state only */}
              {inProgress && (
                <div className="flex items-center gap-2">
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${r.title} progress`}
                  >
                    <motion.div
                      className="h-full rounded-full bg-violet-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold tabular-nums text-violet-600 dark:text-violet-400">
                    {pct}%
                  </span>
                </div>
              )}
              {completed && (
                <p className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  Completed
                </p>
              )}

              {/* Primary action */}
              <div className="mt-auto flex items-center justify-end border-t border-border/60 pt-2.5">
                <button
                  type="button"
                  onClick={() => onOpen(r.id)}
                  aria-label={`${inProgress ? 'Continue' : 'Open'} ${r.title}`}
                  className={inProgress ? BTN_VIOLET : BTN_OUTLINE}
                >
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
  )
}
