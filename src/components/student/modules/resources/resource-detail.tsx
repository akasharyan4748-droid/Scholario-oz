'use client'

/**
 * ResourceDetail — the accessible resource dialog (spec §10/§13/§59).
 *
 * Full metadata + live progress + the same working actions as the grid
 * (bookmark / add to planner / mark complete) + a Study primary button
 * that calls studyResource() and reports the REAL resulting percentage.
 * Quizzes, PDFs and videos are uniformly treated as study materials —
 * no fake quiz engine, no fake video player (§10/§82).
 *
 * Dialog conventions follow the Student workspace shells: role=dialog +
 * aria-modal, Escape closes (useDismissOnEscape), backdrop click closes,
 * bottom sheet on mobile / centered from sm up.
 */

import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Bookmark, BookmarkCheck, CalendarPlus, CheckCircle2, X } from 'lucide-react'
import { useDismissOnEscape } from '@/hooks/use-dismiss-on-escape'
import { subjectColor } from '../timetable/subject-colors'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import { useStudentLearningStore } from '@/lib/store/student-learning-store'
import { DifficultyPill, TypeChip, BTN_VIOLET, BTN_OUTLINE } from './type-meta'
import { useResourceActions } from './actions'

interface ResourceDetailProps {
  resourceId: string | null
  onClose: () => void
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-[13px] font-semibold">{value}</dd>
    </div>
  )
}

export function ResourceDetail({ resourceId, onClose }: ResourceDetailProps) {
  // Hooks first — never conditional (resourceId gates the render, not the hooks).
  const resource = useStudentLearningStore((s) => (resourceId ? s.resources.find((r) => r.id === resourceId) ?? null : null))
  const progressEntry = useStudentLearningStore((s) => (resourceId ? s.progress[resourceId] : undefined))
  const isSaved = useStudentLearningStore((s) => (resourceId ? s.bookmarks.includes(resourceId) : false))
  const actions = useResourceActions()
  useDismissOnEscape(onClose, resourceId != null)

  const pct = progressEntry?.pct ?? 0
  const completed = pct >= 100
  const sc = resource ? subjectColor(resource.subject) : null

  return (
    <AnimatePresence>
      {resource && sc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={resource.title}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-premium-lg sm:max-w-lg sm:rounded-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border/60 px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <TypeChip type={resource.type} />
                  <DifficultyPill difficulty={resource.difficulty} />
                  {isSaved && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      <BookmarkCheck className="h-3.5 w-3.5" aria-hidden />
                      Saved
                    </span>
                  )}
                </div>
                <h2 className="text-base font-semibold leading-snug">{resource.title}</h2>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', sc.dot)} aria-hidden />
                  {resource.subject} · {resource.topic}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close resource details"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:h-9 sm:w-9"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Body — full metadata + live progress */}
            <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              <dl className="grid grid-cols-2 gap-2.5">
                <Meta
                  label={resource.type === 'video' ? 'Length' : resource.type === 'quiz' ? 'Questions' : 'Pages'}
                  value={
                    resource.durationMin
                      ? `${resource.durationMin} min`
                      : String(resource.pages ?? resource.questions ?? '—')
                  }
                />
                <Meta label="Difficulty" value={resource.difficulty.charAt(0).toUpperCase() + resource.difficulty.slice(1)} />
                <Meta label="Source" value={resource.source} />
                <Meta label="Added" value={formatDate(resource.addedOn)} />
              </dl>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Progress</span>
                  {completed ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      Completed
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                      {pct > 0 ? `${pct}%` : 'Not started'}
                    </span>
                  )}
                </div>
                {pct > 0 && (
                  <div
                    className="h-2 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${resource.title} progress`}
                  >
                    <motion.div
                      className={cn('h-full rounded-full', completed ? 'bg-emerald-500' : 'bg-violet-500')}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Actions — every button works against the store */}
            <div className="flex flex-col-reverse gap-2 border-t border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => actions.bookmark(resource)}
                  className={BTN_OUTLINE}
                  aria-pressed={isSaved}
                >
                  {isSaved ? (
                    <BookmarkCheck className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                  ) : (
                    <Bookmark className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {isSaved ? 'Saved' : 'Save'}
                </button>
                <button type="button" onClick={() => actions.addToPlanner(resource)} className={BTN_OUTLINE}>
                  <CalendarPlus className="h-3.5 w-3.5" aria-hidden />
                  Add to plan
                </button>
                {!completed && (
                  <button type="button" onClick={() => actions.complete(resource)} className={BTN_OUTLINE}>
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    Mark complete
                  </button>
                )}
              </div>
              {completed ? (
                <span className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 px-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400 sm:h-9">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Completed
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => actions.study(resource)}
                  className={cn(BTN_VIOLET, 'w-full sm:w-auto')}
                >
                  <BookOpen className="h-3.5 w-3.5" aria-hidden />
                  Study
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
