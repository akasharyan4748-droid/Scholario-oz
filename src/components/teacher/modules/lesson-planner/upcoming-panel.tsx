'use client'

/**
 * lesson-planner/upcoming-panel — the compact right rail. "Upcoming" lists
 * the next scheduled topics (server-capped at 5, today included — today's
 * row is highlighted in amber) with name, date range and periods. Below it,
 * "Schedule basis" states where the dates come from: syllabus board, session
 * anchor, and the class timetable pace — all from the plan payload.
 */

import { CalendarCheck, CalendarDays } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { HubEmptyState } from '@/components/teacher/modules/shared/hub-stat-cards'
import { cn } from '@/lib/utils'
import type { LessonPlanPayload } from './api'
import { formatDayLong, formatDayRange } from './shared'

export function UpcomingPanel({ plan }: { plan: LessonPlanPayload }) {
  const items = plan.nextUp

  return (
    <GlassCard hover={false} className="overflow-hidden p-0">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          Upcoming
        </p>
        <p className="text-[11px] tabular-nums text-muted-foreground">next {items.length}</p>
      </div>

      {items.length === 0 ? (
        <HubEmptyState
          icon={CalendarCheck}
          title="Nothing scheduled ahead"
          hint="Every topic in this curriculum is complete."
          className="py-8"
        />
      ) : (
        <div className="divide-y divide-border/60">
          {items.map((topic) => {
            const isToday = topic.status === 'today'
            return (
              <div key={topic.id} className="px-4 py-2.5">
                <p className="min-w-0 truncate text-sm font-medium" title={topic.topicName}>
                  {topic.topicName}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
                  <span
                    className={cn(
                      'font-medium tabular-nums',
                      isToday && 'text-amber-600 dark:text-amber-400',
                    )}
                  >
                    {isToday ? 'Today' : formatDayRange(topic.startDate, topic.endDate)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">Unit {topic.unitNo}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{topic.periodsNeeded} periods</span>
                </p>
              </div>
            )
          })}
        </div>
      )}
    </GlassCard>
  )
}

export function ScheduleBasisCard({ plan }: { plan: LessonPlanPayload }) {
  const { pace, sourceBoard, sessionStart } = plan
  const rows: [label: string, value: string][] = [
    ['Syllabus', sourceBoard],
    ['Session from', formatDayLong(sessionStart)],
    ['Pace', `${pace.periodsPerWeek} periods / week · ${pace.periodMinutes} min`],
    ['Teaching days', `${pace.teachingDaysPerWeek} days / week`],
  ]

  return (
    <GlassCard hover={false} className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Schedule basis
      </p>
      <dl className="mt-2.5 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 text-[11px] text-muted-foreground">{label}</dt>
            <dd className="min-w-0 truncate text-right text-xs font-medium" title={value}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 border-t border-border/60 pt-2.5 text-[10px] leading-relaxed text-muted-foreground/80">
        Dates follow the class timetable and school holidays. Marking topics complete keeps the
        plan on pace.
      </p>
    </GlassCard>
  )
}
