'use client'

/**
 * TodayClasses (TWC-FE-4) — the REAL teaching day, rebuilt on the aggregate
 * API. The left panel lists the teacher's own timetable cells for today's
 * weekday (the mock `lib/mock/academics` schedule and the fake
 * ClassPerformanceChart are gone); the right panel is Today's Lessons — one
 * card per curriculum assignment with the scheduled topic and pace, opening
 * the Lesson Planner.
 *
 * Period states are derived on the client from the device clock and refresh
 * quietly every 30s; the CURRENT period is highlighted with restraint.
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, CalendarDays, Clock, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import {
  formatTime,
  periodsWithState,
  type PeriodWithState,
} from './hooks/use-teacher-dashboard'
import type { CurriculumAssignment, LessonTopicState, TeacherDashboardData } from './types'

interface TodayClassesProps {
  data: TeacherDashboardData
  onNavigate: (key: string) => void
}

export function TodayClasses({ data, onNavigate }: TodayClassesProps) {
  // Re-derive period states on a quiet 30s cadence (no API refetch — the
  // timetable came in the single dashboard aggregate; only "now" moves).
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(t)
  }, [])

  const periods = periodsWithState(data.today.periods, now)
  const current = periods.find((p) => p.state === 'current')

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
      {/* Today's schedule — spans 2 of 3 columns on large screens */}
      <GlassCard hover={false} className="p-3.5 sm:p-4 lg:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarDays className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-sm font-bold tracking-tight">Today&rsquo;s Schedule</h2>
              <p className="truncate text-[11px] text-muted-foreground">
                {data.today.weekday} ·{' '}
                {periods.length > 0
                  ? `${periods.length} teaching period${periods.length === 1 ? '' : 's'}`
                  : 'no classes scheduled'}
              </p>
            </div>
          </div>
          {current && (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-1.5 w-1.5" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          )}
        </div>

        {periods.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center">
            <Clock className="mb-2 h-6 w-6 text-muted-foreground/40" aria-hidden />
            <p className="text-sm font-medium">No classes scheduled today</p>
            <p className="mt-0.5 max-w-[260px] text-xs text-muted-foreground">
              Your timetable has no teaching periods for {data.today.weekday}.
            </p>
          </div>
        ) : (
          <ul className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-0.5">
            {periods.map((p, i) => (
              <PeriodRow key={`${p.period}-${i}`} p={p} i={i} />
            ))}
          </ul>
        )}
      </GlassCard>

      {/* Today's Lessons — the curriculum the teacher should be teaching */}
      <TodayLessons curriculum={data.curriculum} onNavigate={onNavigate} />
    </div>
  )
}

function PeriodRow({ p, i }: { p: PeriodWithState; i: number }) {
  const isNow = p.state === 'current'
  const isPast = p.state === 'completed'
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative flex items-center gap-3 overflow-hidden rounded-xl border p-2.5 transition-colors',
        isNow && 'border-emerald-500/40 bg-emerald-500/[0.06]',
        !isNow && 'border-border/70 bg-background/40',
        isPast && 'opacity-60',
      )}
    >
      {isNow && <span className="absolute inset-y-0 left-0 w-0.5 bg-emerald-500" aria-hidden />}
      {/* Time tile — the period window, e.g. 08:30 over 09:15 */}
      <div
        className={cn(
          'flex h-11 w-16 shrink-0 flex-col items-center justify-center rounded-lg',
          isNow ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-muted/60 text-foreground/70',
        )}
        aria-label={`${formatTime(p.startTime)} to ${formatTime(p.endTime)}`}
      >
        <span className="text-[11px] font-bold leading-none tabular-nums">
          {p.startTime ?? '—'}
        </span>
        <span className="mt-1 text-[9px] font-medium uppercase leading-none tabular-nums text-muted-foreground">
          {p.endTime ?? '—'}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p
            className={cn(
              'truncate text-sm font-semibold',
              isPast && 'text-muted-foreground line-through decoration-muted-foreground/40',
            )}
          >
            {p.subjectName}
          </p>
          {isNow && (
            <span className="rounded bg-emerald-500/15 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Now
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {p.classLabel}
          {p.room ? (
            <>
              {' · '}
              <MapPin className="inline h-3 w-3 align-[-2px]" aria-hidden /> {p.room}
            </>
          ) : null}
        </p>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
          isPast ? 'bg-muted/60 text-muted-foreground' : 'bg-muted/60 text-foreground/70',
        )}
      >
        P{p.period}
      </span>
    </motion.li>
  )
}

const TOPIC_BADGES: Record<LessonTopicState, { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' | 'primary' }> = {
  completed: { label: 'Completed', variant: 'success' },
  today: { label: 'Today', variant: 'primary' },
  'in-progress': { label: 'In progress', variant: 'info' },
  'needs-rescheduling': { label: 'Needs rescheduling', variant: 'warning' },
  upcoming: { label: 'Upcoming', variant: 'neutral' },
}

function TodayLessons({ curriculum, onNavigate }: {
  curriculum: CurriculumAssignment[]
  onNavigate: (key: string) => void
}) {
  return (
    <GlassCard hover={false} className="flex flex-col p-3.5 sm:p-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <BookOpen className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-sm font-bold tracking-tight">Today&rsquo;s Lessons</h2>
          <p className="truncate text-[11px] text-muted-foreground">
            {curriculum.length > 0
              ? `${curriculum.length} assignment${curriculum.length === 1 ? '' : 's'} · curriculum pace`
              : 'curriculum pace'}
          </p>
        </div>
      </div>

      {curriculum.length === 0 ? (
        <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center">
          <BookOpen className="mb-2 h-6 w-6 text-muted-foreground/40" aria-hidden />
          <p className="text-sm font-medium">No curriculum mapped</p>
          <p className="mt-0.5 max-w-[240px] text-xs text-muted-foreground">
            Your teaching assignments will appear here once a curriculum is mapped for them.
          </p>
        </div>
      ) : (
        <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-0.5">
          {curriculum.map((c, i) => {
            const topic = c.todayTopic
            // `in` guard keeps an unexpected server status from crashing the row.
            const badge = topic && topic.status in TOPIC_BADGES ? TOPIC_BADGES[topic.status] : null
            return (
              <motion.button
                key={`${c.classId}-${c.subjectId}`}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(0.05 + i * 0.05, 0.25), ease: [0.22, 1, 0.36, 1] }}
                onClick={() => onNavigate('lesson-planner')}
                className="w-full rounded-xl border border-border/70 bg-background/40 p-3 text-left transition-colors hover:border-primary/30 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-muted-foreground">
                      {c.classLabel} · {c.subjectName}
                    </p>
                    {topic ? (
                      <>
                        <p className="mt-0.5 truncate text-sm font-semibold">{topic.topicName}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{topic.unitName}</p>
                      </>
                    ) : (
                      <p className="mt-1 text-xs italic text-muted-foreground">
                        {c.todayReason ?? 'No topic scheduled for today'}
                      </p>
                    )}
                  </div>
                  {badge && (
                    <StatusBadge
                      status={badge.label}
                      variant={badge.variant}
                      className="shrink-0 px-2 py-0.5 text-[10px]"
                    />
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {c.progress.completed}/{c.progress.total} topics · {c.progress.pct}%
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                    Open Lesson Planner <ArrowRight className="h-3 w-3" aria-hidden />
                  </span>
                </div>
              </motion.button>
            )
          })}
        </div>
      )}
    </GlassCard>
  )
}
