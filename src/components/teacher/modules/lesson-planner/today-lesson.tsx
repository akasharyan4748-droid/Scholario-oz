'use client'

/**
 * lesson-planner/today-lesson — the hero. The FIRST thing the teacher sees:
 * date heading, unit chip, the big topic name, its description, pace/window
 * chips, a status badge and the primary "Mark Completed" control. When the
 * topic is already done it degrades to a quiet "Completed · <date>" state
 * with a small Undo link. When nothing is scheduled today, the server's
 * honest reason ("School holiday — Janmashtami", "No classes scheduled
 * today"…) is shown in a calm empty card — never a fabricated topic.
 */

import { CalendarOff, CalendarRange, Check, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { HubEmptyState } from '@/components/teacher/modules/shared/hub-stat-cards'
import { cn } from '@/lib/utils'
import type { LessonPlanPayload } from './api'
import { formatDayHeading, formatDayRange, formatDayShort, TOPIC_STATUS } from './shared'

interface TodayLessonCardProps {
  plan: LessonPlanPayload
  /** True while THIS topic's completion toggle is in flight. */
  pending: boolean
  onToggleCompletion: (topicId: string, completed: boolean) => void
}

export function TodayLessonCard({ plan, pending, onToggleCompletion }: TodayLessonCardProps) {
  const { today } = plan
  const topic = today.topic

  return (
    <GlassCard hover={false} className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Today · {formatDayHeading(today.date)}
        </p>
        {topic && (
          <span className={cn(TOPIC_STATUS[topic.status].chip, 'px-2.5 py-1 text-[11px]')}>
            {TOPIC_STATUS[topic.status].label}
          </span>
        )}
      </div>

      {topic ? (
        <>
          <span className="mt-3 flex w-fit max-w-full items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            <span className="truncate">
              Unit {topic.unitNo} · {topic.unitName}
            </span>
          </span>

          <h2 className="mt-2 font-display text-lg font-bold tracking-tight sm:text-xl">
            {topic.topicName}
          </h2>

          {topic.description && (
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {topic.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
              {topic.periodsNeeded} periods
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              <CalendarRange className="h-3 w-3 shrink-0" aria-hidden="true" />
              {formatDayRange(topic.startDate, topic.endDate)}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {topic.status === 'completed' ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Completed
                  {topic.completedOn ? ` · ${formatDayShort(topic.completedOn)}` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => onToggleCompletion(topic.id, false)}
                  disabled={pending}
                  className="text-xs font-medium text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground disabled:opacity-50"
                >
                  Undo
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onToggleCompletion(topic.id, true)}
                disabled={pending}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {pending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                Mark Completed
              </button>
            )}
          </div>
        </>
      ) : (
        <HubEmptyState
          icon={CalendarOff}
          title={today.reason ?? 'No lesson scheduled for today'}
          className="py-8"
        />
      )}
    </GlassCard>
  )
}
