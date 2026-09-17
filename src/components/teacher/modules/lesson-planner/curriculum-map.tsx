'use client'

/**
 * lesson-planner/curriculum-map — the PRIMARY experience. The full unit →
 * topic schedule for the selected class + subject: sticky unit headers
 * (name + N/M completed), then one row per topic — status chip, topic name
 * (global topic number + name), the compact scheduled window ("11–17 Sep"),
 * a periods chip, and an inline "Mark complete" action that appears on
 * hover/focus (always visible on touch). Very long lists scroll inside a
 * max-height thin-scrollbar area.
 */

import { Loader2 } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import type { LessonPlanPayload, ScheduledTopic } from './api'
import { formatDayRange, groupByUnit, THIN_SCROLLBAR, TOPIC_STATUS } from './shared'

interface TopicRowProps {
  topic: ScheduledTopic
  pending: boolean
  onToggleCompletion: (topicId: string, completed: boolean) => void
}

function TopicRow({ topic, pending, onToggleCompletion }: TopicRowProps) {
  const status = TOPIC_STATUS[topic.status]
  const done = topic.status === 'completed'

  return (
    <div className="group flex flex-wrap items-center gap-x-2.5 gap-y-1.5 px-3 py-2.5 transition-colors hover:bg-muted/40 sm:px-4">
      <span className={cn('shrink-0', status.chip)}>{status.label}</span>

      <p
        className={cn('min-w-0 flex-1 truncate text-sm font-medium', done && 'text-muted-foreground')}
        title={`${topic.topicNo}. ${topic.topicName}`}
      >
        <span className="mr-1.5 tabular-nums text-muted-foreground/70">{topic.topicNo}.</span>
        {topic.topicName}
      </p>

      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
        {formatDayRange(topic.startDate, topic.endDate)}
      </span>

      <span
        className="shrink-0 rounded-full border border-border bg-muted/50 px-1.5 py-px text-[10px] font-medium tabular-nums text-muted-foreground"
        title={`${topic.periodsNeeded} periods needed`}
      >
        {topic.periodsNeeded}p
      </span>

      {!done && (
        <button
          type="button"
          onClick={() => onToggleCompletion(topic.id, true)}
          disabled={pending}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10 focus-visible:opacity-100 focus:outline-none disabled:opacity-50 dark:text-emerald-400 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        >
          {pending && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
          Mark complete
        </button>
      )}
    </div>
  )
}

interface CurriculumMapCardProps {
  plan: LessonPlanPayload
  /** Topic id whose completion toggle is currently in flight. */
  pendingTopicId: string | null
  onToggleCompletion: (topicId: string, completed: boolean) => void
}

export function CurriculumMapCard({
  plan,
  pendingTopicId,
  onToggleCompletion,
}: CurriculumMapCardProps) {
  const sections = groupByUnit(plan.topics)

  return (
    <GlassCard hover={false} className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border bg-muted/30 px-4 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Curriculum Map
        </p>
        <p className="text-[11px] text-muted-foreground">
          {plan.sourceBoard} · {plan.progress.completed}/{plan.progress.total} topics ·{' '}
          {sections.length} {sections.length === 1 ? 'unit' : 'units'}
        </p>
      </div>

      <div className={cn('max-h-[560px] overflow-y-auto', THIN_SCROLLBAR)}>
        {sections.map((section) => {
          const done = section.topics.filter((t) => t.status === 'completed').length
          return (
            <div key={section.key}>
              <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-muted/95 px-3 py-2 backdrop-blur-sm sm:px-4">
                <p
                  className="min-w-0 truncate text-xs font-semibold"
                  title={`Unit ${section.unitNo} · ${section.unitName}`}
                >
                  <span className="text-muted-foreground">Unit {section.unitNo}</span> ·{' '}
                  {section.unitName}
                </p>
                <span className="shrink-0 rounded-full border border-border bg-background px-2 py-px text-[10px] font-medium tabular-nums text-muted-foreground">
                  {done}/{section.topics.length} done
                </span>
              </div>
              <div className="divide-y divide-border/60">
                {section.topics.map((topic) => (
                  <TopicRow
                    key={topic.id}
                    topic={topic}
                    pending={pendingTopicId === topic.id}
                    onToggleCompletion={onToggleCompletion}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
