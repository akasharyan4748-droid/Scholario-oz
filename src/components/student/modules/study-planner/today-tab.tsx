'use client'

/**
 * TodayTab — "STUDY PLANNER — TODAY" (spec §22).
 *
 * The planner's default screen, fully derived from the canonical learning
 * store (§61 no fake statistics):
 *   · TODAY'S GOAL  — minutes studied today (minutesOn) against the soft
 *                     60-min daily reference + today's focus-session count
 *                     (sessions with mode 'focus-timer').
 *   · TODAY'S PLAN  — tasksDueOn(today) rows: time, title, subject chip,
 *                     duration, priority, status; [Start] preloads the
 *                     focus timer via the focus store and jumps to it,
 *                     [Done] completes, [Skip] skips.
 *   · UPCOMING      — the next 3 future open tasks, compact.
 *
 * Empty states are honest and short (§57): "Your day is clear."
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Check, Clock3, Play, SkipForward, Zap } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '../../shell/page-header'
import { subjectColor } from '../timetable/subject-colors'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  minutesOn,
  tasksDueOn,
  useStudentLearningStore,
  type PlannerTask,
} from '@/lib/store/student-learning-store'
import { useFocusStore, focusSessionsToday } from './focus-store'
import {
  DAILY_REFERENCE_MIN,
  PriorityPill,
  StatusChip,
  dueLabel,
  isOpen,
  timeLabel,
  timeToMin,
  todayKey,
} from './shared'

interface TodayTabProps {
  /** Switch the planner's local tab to the Focus timer. */
  onGoFocus: () => void
}

function byDueTime(a: PlannerTask, b: PlannerTask): number {
  return timeToMin(a.dueTime) - timeToMin(b.dueTime)
}

export function TodayTab({ onGoFocus }: TodayTabProps) {
  const tasks = useStudentLearningStore((s) => s.tasks)
  const sessions = useStudentLearningStore((s) => s.sessions)
  const setTaskStatus = useStudentLearningStore((s) => s.setTaskStatus)
  const startFocus = useFocusStore((s) => s.startFocus)

  const tKey = todayKey()
  const minutes = minutesOn(sessions, tKey)
  const focusCount = useMemo(() => focusSessionsToday(sessions), [sessions])
  const todayTasks = useMemo(
    () => tasksDueOn(tasks, tKey).slice().sort(byDueTime),
    [tasks, tKey],
  )
  const upcoming = useMemo(
    () =>
      tasks
        .filter((t) => isOpen(t) && t.dueDate > tKey)
        .sort((a, b) => (a.dueDate === b.dueDate ? byDueTime(a, b) : a.dueDate < b.dueDate ? -1 : 1))
        .slice(0, 3),
    [tasks, tKey],
  )

  const goalPct = Math.min(100, Math.round((minutes / DAILY_REFERENCE_MIN) * 100))

  const startTask = (t: PlannerTask) => {
    // Preload the focus timer with THIS task's context (§31 timer context),
    // then hand over to the Focus tab — the timer itself lives in the
    // store, so it is already running before the tab renders.
    startFocus(t.durationMin, {
      kind: 'task',
      taskId: t.id,
      subject: t.subject,
      topic: t.topic,
      title: t.title,
    })
    onGoFocus()
  }

  const completeTask = (t: PlannerTask) => {
    setTaskStatus(t.id, 'completed')
    toast.success('Task completed', { description: t.title })
  }

  const skipTask = (t: PlannerTask) => {
    setTaskStatus(t.id, 'skipped')
    toast.info('Task skipped', { description: t.title })
  }

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* ── Today's study goal — real minutes vs the soft daily reference ── */}
      <GlassCard hover={false} className="on-card p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <SectionLabel>Today&apos;s goal</SectionLabel>
          <span className="text-[11px] font-medium text-muted-foreground">
            {focusCount} focus session{focusCount === 1 ? '' : 's'} today
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <p className="text-2xl font-bold tabular-nums text-foreground">{minutes}</p>
          <p className="text-sm text-muted-foreground">/ {DAILY_REFERENCE_MIN} min</p>
          {minutes >= DAILY_REFERENCE_MIN && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              <Check className="h-3 w-3" aria-hidden />
              Reference reached
            </span>
          )}
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={goalPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Minutes studied today out of ${DAILY_REFERENCE_MIN}`}
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
            style={{ width: `${goalPct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {minutes === 0
            ? 'Minutes you actually study — from the focus timer and recorded sessions.'
            : `Every recorded session counts — ${minutes} min so far today.`}
        </p>
      </GlassCard>

      {/* ── Today's plan (§22) ── */}
      <section className="space-y-3">
        <SectionLabel hint={`${todayTasks.length} planned · ${todayTasks.reduce((sum, t) => sum + t.durationMin, 0)} min`}>
          Today&apos;s plan
        </SectionLabel>

        {todayTasks.length === 0 ? (
          <GlassCard hover={false} className="on-card flex min-h-20 items-center justify-center p-6">
            <p className="text-sm text-muted-foreground">Your day is clear.</p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((t, i) => {
              const sc = subjectColor(t.subject)
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.2), duration: 0.2 }}
                >
                  <GlassCard className="on-card p-3 sm:p-3.5">
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span className="w-[4.4rem] shrink-0 pt-0.5 text-right text-[11px] font-semibold tabular-nums text-muted-foreground">
                          {t.dueTime ? timeLabel(t.dueTime) : '—'}
                        </span>
                        <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', sc.dot)} aria-hidden />
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium leading-tight text-foreground">{t.title}</p>
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {t.subject}
                            {t.topic ? ` · ${t.topic}` : ''}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-px text-[10px] font-medium tabular-nums text-muted-foreground">
                              <Clock3 className="h-3 w-3" aria-hidden />
                              {t.durationMin} min
                            </span>
                            <PriorityPill priority={t.priority} />
                            {t.status !== 'not-started' && <StatusChip status={t.status} />}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                        <button
                          type="button"
                          onClick={() => startTask(t)}
                          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:text-violet-400 sm:h-9"
                        >
                          <Play className="h-3.5 w-3.5" aria-hidden />
                          Start
                        </button>
                        <button
                          type="button"
                          onClick={() => completeTask(t)}
                          aria-label={`Mark ${t.title} as done`}
                          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:text-emerald-400 sm:h-9"
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden />
                          Done
                        </button>
                        <button
                          type="button"
                          onClick={() => skipTask(t)}
                          aria-label={`Skip ${t.title}`}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9 sm:w-9"
                        >
                          <SkipForward className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Upcoming — next 3 future open tasks ── */}
      {upcoming.length > 0 && (
        <section className="space-y-3">
          <SectionLabel hint="next 3">Upcoming</SectionLabel>
          <GlassCard hover={false} className="on-card divide-y divide-border/60 p-0">
            {upcoming.map((t) => {
              const sc = subjectColor(t.subject)
              return (
                <div key={t.id} className="flex min-h-11 items-center gap-2.5 px-3 py-2.5">
                  <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', sc.dot)} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium leading-tight text-foreground">{t.title}</p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {t.subject}
                      {t.topic ? ` · ${t.topic}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="tabular-nums">{t.durationMin} min</span>
                    <span className="font-medium">{dueLabel(t.dueDate, tKey)}</span>
                  </div>
                </div>
              )
            })}
          </GlassCard>
        </section>
      )}

      {/* Quiet honest hint — no dashboard noise (§32/§66) */}
      {todayTasks.length === 0 && (
        <p className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-violet-500" aria-hidden />
          Start a focus session from the Focus tab, or add a task in Tasks.
        </p>
      )}
    </div>
  )
}
