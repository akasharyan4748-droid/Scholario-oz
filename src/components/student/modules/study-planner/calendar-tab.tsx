'use client'

/**
 * CalendarTab — the STUDY CALENDAR (spec §25), compact WEEK view.
 *
 * Honest scope: the current week (Mon–Sun) of REAL store data only —
 * per day the total planned minutes (tasks due that day, skipped
 * excluded) and the actual studied minutes (recorded sessions), drawn
 * as a tiny two-tone bar; school events and exam dates are NOT
 * invented (§25 "Do not invent events"). Clicking a day reveals its
 * tasks and sessions below.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock3, Timer } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '../../shell/page-header'
import { subjectColor } from '../timetable/subject-colors'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  dateKeyOf,
  minutesOn,
  useStudentLearningStore,
  type PlannerTask,
  type StudySession,
} from '@/lib/store/student-learning-store'
import { StatusChip, localDateKey, timeLabel, timeToMin, todayKey } from './shared'

const MODE_LABEL: Record<StudySession['mode'], { label: string; chip: string }> = {
  'focus-timer': { label: 'Focus', chip: 'bg-violet-500/10 text-violet-700 dark:text-violet-400' },
  planner: { label: 'Planner', chip: 'bg-sky-500/10 text-sky-700 dark:text-sky-400' },
  manual: { label: 'Manual', chip: 'bg-muted text-muted-foreground' },
}

interface DayCell {
  key: string
  label: string
  dayNum: number
  isToday: boolean
  planned: number
  actual: number
}

export function CalendarTab() {
  const tasks = useStudentLearningStore((s) => s.tasks)
  const sessions = useStudentLearningStore((s) => s.sessions)
  const tKey = todayKey()

  // ── The current week, Monday → Sunday ──
  const week = useMemo((): DayCell[] => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const key = localDateKey(d)
      const due = tasks.filter((t) => t.dueDate === key && t.status !== 'skipped')
      return {
        key,
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: key === tKey,
        planned: due.reduce((sum, t) => sum + t.durationMin, 0),
        actual: minutesOn(sessions, key),
      }
    })
  }, [tasks, sessions, tKey])

  const maxMin = Math.max(30, ...week.map((d) => Math.max(d.planned, d.actual)))

  const [selected, setSelected] = useState<string>(tKey)

  const selectedTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.dueDate === selected)
        .sort((a, b) => timeToMin(a.dueTime) - timeToMin(b.dueTime)),
    [tasks, selected],
  )
  const selectedSessions = useMemo(
    () =>
      sessions
        .filter((s) => dateKeyOf(s.endedAt) === selected)
        .sort((a, b) => (a.endedAt < b.endedAt ? 1 : -1)),
    [sessions, selected],
  )

  const selectedCell = week.find((d) => d.key === selected)
  const selectedDateLabel = selectedCell
    ? new Date(selected + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      })
    : selected

  const plannedTotal = selectedTasks
    .filter((t) => t.status !== 'skipped')
    .reduce((sum, t) => sum + t.durationMin, 0)

  return (
    <div className="space-y-5">
      {/* ── Week strip (§25) — real planned vs studied minutes ── */}
      <GlassCard hover={false} className="on-card p-3 sm:p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <SectionLabel>This week</SectionLabel>
          <span className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-3 rounded-full bg-violet-500" aria-hidden />
              Planned
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-3 rounded-full bg-emerald-500" aria-hidden />
              Studied
            </span>
          </span>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 sm:gap-1.5" role="group" aria-label="Days of this week">
          {week.map((d) => {
            const active = selected === d.key
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setSelected(d.key)}
                aria-pressed={active}
                title={`${d.label} ${d.dayNum} — ${d.planned} min planned · ${d.actual} min studied`}
                className={cn(
                  'flex min-w-0 flex-col items-center gap-1 rounded-xl border p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:p-2.5',
                  active
                    ? 'border-violet-500/40 bg-violet-500/[0.07]'
                    : 'border-border bg-card/40 hover:bg-accent/40',
                )}
              >
                <span
                  className={cn(
                    'text-[10px] font-semibold uppercase tracking-wide',
                    d.isToday ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground',
                  )}
                >
                  {d.label}
                </span>
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold tabular-nums',
                    d.isToday ? 'bg-violet-600 text-white' : 'text-foreground',
                  )}
                >
                  {d.dayNum}
                </span>

                {/* Tiny two-tone bar — planned (violet) over studied (emerald) */}
                <span className="flex w-full max-w-10 flex-col gap-0.5" aria-hidden>
                  <span className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-violet-500"
                      style={{ width: `${Math.round((d.planned / maxMin) * 100)}%` }}
                    />
                  </span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.round((d.actual / maxMin) * 100)}%` }}
                    />
                  </span>
                </span>

                <span className="text-[9px] tabular-nums text-muted-foreground">
                  {d.planned}·{d.actual}
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Minutes planned (tasks due) vs studied (recorded sessions) · tap a day for detail.
        </p>
      </GlassCard>

      {/* ── Selected day detail — tasks + sessions, store data only ── */}
      <section className="space-y-3">
        <SectionLabel
          hint={
            selectedCell
              ? `${selectedCell.isToday ? 'today · ' : ''}${plannedTotal} min planned · ${selectedCell.actual} min studied`
              : null
          }
        >
          {selectedDateLabel}
        </SectionLabel>

        {selectedTasks.length === 0 && selectedSessions.length === 0 ? (
          <GlassCard hover={false} className="on-card flex min-h-20 items-center justify-center p-6">
            <p className="text-sm text-muted-foreground">Nothing planned this day.</p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {selectedTasks.map((t, i) => (
              <TaskRow key={t.id} task={t} isToday={selected === tKey} index={i} />
            ))}
            {selectedSessions.map((s, i) => {
              const sc = subjectColor(s.subject)
              const mode = MODE_LABEL[s.mode]
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.2), duration: 0.2 }}
                >
                  <GlassCard hover={false} className="on-card flex min-h-11 items-center gap-2.5 px-3 py-2.5">
                    <span className="w-[4.4rem] shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">
                      {formatTime(s.endedAt)}
                    </span>
                    <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', sc.dot)} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium leading-tight text-foreground">
                        {s.subject}
                        {s.topic ? ` · ${s.topic}` : ''}
                      </p>
                      {s.taskId && (
                        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">Linked planner task</p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium tabular-nums text-muted-foreground">
                      <Clock3 className="h-3 w-3" aria-hidden />
                      {s.minutes} min
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        mode.chip,
                      )}
                    >
                      {s.mode === 'focus-timer' && <Timer className="mr-0.5 h-3 w-3" aria-hidden />}
                      {mode.label}
                    </span>
                  </GlassCard>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function TaskRow({ task, isToday, index }: { task: PlannerTask; isToday: boolean; index: number }) {
  const sc = task.subject ? subjectColor(task.subject) : null
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.2), duration: 0.2 }}
    >
      <GlassCard hover={false} className="on-card flex min-h-11 items-center gap-2.5 px-3 py-2.5">
        <span className="w-[4.4rem] shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">
          {task.dueTime ? timeLabel(task.dueTime) : '—'}
        </span>
        {sc && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', sc.dot)} aria-hidden />}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate text-[13px] font-medium leading-tight',
              task.status === 'completed' && 'line-through text-muted-foreground',
            )}
          >
            {task.title}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
            {isToday && task.status !== 'completed' ? 'Due today · ' : ''}
            {task.subject}
            {task.topic ? ` · ${task.topic}` : ''}
          </p>
        </div>
        <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
          {task.durationMin} min
        </span>
        <StatusChip status={task.status} />
      </GlassCard>
    </motion.div>
  )
}

