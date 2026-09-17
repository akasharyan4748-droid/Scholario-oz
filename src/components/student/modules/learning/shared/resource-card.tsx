'use client'

/**
 * learning/shared/resource-card — the functional resource card (§12/§13).
 *
 * Communicates in one glance: TYPE · TITLE · SUBJECT/TOPIC · small useful
 * metadata · progress/status · ONE primary action. Extra actions
 * (bookmark, add to planner, create flashcard, mark complete) live in a
 * quiet secondary menu — never all visible at once.
 */

import { Bookmark, BookmarkCheck, ChevronRight, MoreHorizontal, CalendarPlus, Layers, CheckCircle2, Trash2 } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { subjectColor } from '../../timetable/subject-colors'
import { typeToken, resourceMeta, primaryAction, ProgressBar } from './tokens'
import type { LearningResource, ResourceProgress } from '@/lib/store/learning-types'

interface ResourceCardProps {
  resource: LearningResource
  progress?: ResourceProgress
  bookmarked: boolean
  onOpen: (resource: LearningResource) => void
  onToggleBookmark: (id: string) => void
  onAddToPlanner: (resource: LearningResource) => void
  onCreateFlashcard?: (resource: LearningResource) => void
  onMarkComplete?: (resource: LearningResource) => void
  /** Optional reason line (recommended list — §14). */
  reason?: string
}

export function ResourceCard({
  resource, progress, bookmarked, onOpen, onToggleBookmark, onAddToPlanner, onCreateFlashcard, onMarkComplete, reason,
}: ResourceCardProps) {
  const tt = typeToken(resource.type)
  const TypeIcon = tt.icon
  const sc = subjectColor(resource.subject)
  const pct = progress?.pct ?? 0
  const done = pct >= 100

  return (
    <GlassCard hover className="on-card group flex flex-col p-3.5 sm:p-4">
      <div className="flex items-start gap-3">
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border', tt.tile)} aria-hidden>
          <TypeIcon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={cn('text-[10px] font-bold uppercase tracking-[0.12em]', tt.text)}>{tt.label}</span>
            {done && (
              <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-2.5 w-2.5" aria-hidden /> Done
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-sm font-semibold leading-snug text-foreground">{resource.title}</p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
            <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', sc.dot)} aria-hidden />
            <span className="truncate">{resource.subject} · {resource.topic}</span>
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground/70" aria-label="More actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onToggleBookmark(resource.id)}>
              {bookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
              {bookmarked ? 'Remove bookmark' : 'Bookmark'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddToPlanner(resource)}>
              <CalendarPlus className="h-3.5 w-3.5" /> Add to planner
            </DropdownMenuItem>
            {onCreateFlashcard && resource.type !== 'deck' && (
              <DropdownMenuItem onClick={() => onCreateFlashcard(resource)}>
                <Layers className="h-3.5 w-3.5" /> Create flashcard
              </DropdownMenuItem>
            )}
            {onMarkComplete && !done && resource.type !== 'quiz' && (
              <DropdownMenuItem onClick={() => onMarkComplete(resource)}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Mark complete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-2.5 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="tabular-nums">{resourceMeta(resource)}</span>
      </div>

      {(progress || reason) && (
        <div className="mt-2 space-y-1.5">
          {progress && progress.pct > 0 && (
            <div className="flex items-center gap-2">
              <ProgressBar pct={progress.pct} className="flex-1" />
              <span className="shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground">{progress.pct}%</span>
            </div>
          )}
          {reason && <p className="truncate text-[10px] font-medium text-muted-foreground/80">{reason}</p>}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <Button
          variant={progress && progress.pct > 0 && progress.pct < 100 ? 'default' : 'outline'}
          size="sm"
          className="h-7 gap-1 px-2.5 text-[11px]"
          onClick={() => onOpen(resource)}
        >
          {primaryAction(resource, progress)}
          <ChevronRight className="h-3 w-3" aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-7 w-7', bookmarked ? 'text-amber-500' : 'text-muted-foreground/50')}
          onClick={() => onToggleBookmark(resource.id)}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this resource'}
          aria-pressed={bookmarked}
        >
          {bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        </Button>
      </div>
    </GlassCard>
  )
}
