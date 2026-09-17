'use client'

/**
 * upcoming-list — the right-hand rail. The next ~8 pending topics with
 * relative dates (flagged rows carry the rose badge), then the recently
 * taught topics (muted, emerald check). Every row opens the lesson dialog.
 */

import { CheckCircle2, History } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import type { CurriculumDTO, ScheduledTopicDTO } from '@/lib/lesson-planner-types'
import {
  LESSON_STATUS_CONFIG,
  formatLessonDateShort,
  localTodayISO,
  relativeLessonDate,
} from './vocabulary'

/** Thin-scrollbar utilities (the house recipe — no global CSS needed). */
const THIN_SCROLLBAR =
  '[scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent'

interface UpcomingListProps {
  curriculum: CurriculumDTO
  onOpenTopic: (topic: ScheduledTopicDTO) => void
}

export function UpcomingList({ curriculum, onOpenTopic }: UpcomingListProps) {
  const today = localTodayISO()
  const upcoming = curriculum.upcoming
  const recent = curriculum.recent.slice(0, 5)

  return (
    <div className="space-y-4">
      <GlassCard hover={false} className="overflow-hidden p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-2.5">
          <p className="text-xs font-semibold text-foreground">Upcoming</p>
          <p className="text-[10px] tabular-nums text-muted-foreground">
            next {upcoming.length} lesson{upcoming.length === 1 ? '' : 's'}
          </p>
        </div>

        {upcoming.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">
            No upcoming lessons scheduled yet.
          </p>
        ) : (
          <div className={cn('max-h-[22rem] overflow-y-auto', THIN_SCROLLBAR)}>
            {upcoming.map((topic) => {
              const flagged = topic.status === 'NEEDS_RESCHEDULING'
              const config = LESSON_STATUS_CONFIG[topic.status]
              const Icon = config.icon
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => onOpenTopic(topic)}
                  className="flex min-h-11 w-full items-start gap-2.5 border-b border-border/30 px-4 py-2 text-left transition-colors last:border-b-0 hover:bg-muted/40"
                >
                  <span className="w-[5.5rem] shrink-0 pt-px text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {relativeLessonDate(topic.plannedDate, today)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-foreground">
                      {topic.topicName}
                    </span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      Unit {topic.unitOrder} · {topic.unitName}
                    </span>
                  </span>
                  {flagged ? (
                    <span className="mt-px inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-500/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                      <History className="h-2.5 w-2.5" aria-hidden="true" />
                      Flagged
                    </span>
                  ) : (
                    <Icon
                      className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', config.tone)}
                      aria-hidden="true"
                    />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </GlassCard>

      {/* recently taught */}
      <GlassCard hover={false} className="overflow-hidden p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-2.5">
          <p className="text-xs font-semibold text-foreground">Recently taught</p>
          <p className="text-[10px] text-muted-foreground">last {recent.length}</p>
        </div>

        {recent.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">
            No lessons completed yet — today&rsquo;s lesson will appear here once
            you mark it taught.
          </p>
        ) : (
          <div className="divide-y divide-border/30">
            {recent.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => onOpenTopic(topic)}
                className="flex min-h-11 w-full items-center gap-2.5 px-4 py-2 text-left transition-colors hover:bg-muted/40"
              >
                <CheckCircle2
                  className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {topic.topicName}
                </span>
                <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                  {formatLessonDateShort(topic.completedOn ?? topic.plannedDate)}
                </span>
              </button>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
