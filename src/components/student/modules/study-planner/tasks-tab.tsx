'use client'

/**
 * TasksTab — the planner's TO-DO SYSTEM (spec §23/§24).
 *
 * SMART TASK CREATION, honestly (§24): NO fake AI — a clean two-level
 * form instead. The QUICK ADD bar needs only a title (defaults: today,
 * 20 min, origin 'manual'); the "Details" expander reveals the optional
 * fields (subject chips from the store's real subjects, native date +
 * time inputs, duration, priority, type). Advanced details are optional,
 * never required (§23: "Do NOT make users fill 15 fields").
 *
 * Rows carry the full status system — Circle → PlayCircle → CheckCircle2
 * cycle (§23 Not started / In progress / Completed), a kebab with
 * Skip / Delete / revert, honest overdue chips (rose), origin chips
 * ("From resource" / "Revision") and priority pills. Every number and
 * label derives from the canonical learning store (§61).
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  MoreHorizontal,
  PlayCircle,
  Plus,
  RotateCcw,
  SkipForward,
  Trash2,
} from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '../../shell/page-header'
import { subjectColor } from '../timetable/subject-colors'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  useStudentLearningStore,
  type PlannerTask,
  type TaskType,
} from '@/lib/store/student-learning-store'
import {
  PriorityPill,
  TypeMark,
  isOverdue,
  isOpen,
  timeLabel,
  timeToMin,
  todayKey,
} from './shared'

type Filter = 'today' | 'upcoming' | 'completed' | 'all'

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
]

const DURATIONS = [10, 15, 20, 25, 30, 45, 60]
const TYPES: TaskType[] = ['study', 'revision', 'practice', 'reading', 'project']
const PRIORITIES: PlannerTask['priority'][] = ['high', 'medium', 'low']

const EMPTY_FOR: Record<Filter, string> = {
  today: 'Your day is clear.',
  upcoming: 'No upcoming tasks.',
  completed: 'No completed tasks yet.',
  all: 'No tasks yet — add one above.',
}

const PRIORITY_CHIP = {
  selected: 'bg-primary text-primary-foreground shadow-xs',
  idle: 'bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground',
}

const FIELD_CLASSES =
  'w-full rounded-xl border border-border bg-card/50 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10'

function byDue(a: PlannerTask, b: PlannerTask): number {
  if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1
  return timeToMin(a.dueTime) - timeToMin(b.dueTime)
}

export function TasksTab() {
  const tasks = useStudentLearningStore((s) => s.tasks)
  const resources = useStudentLearningStore((s) => s.resources)
  const addTask = useStudentLearningStore((s) => s.addTask)
  const setTaskStatus = useStudentLearningStore((s) => s.setTaskStatus)
  const deleteTask = useStudentLearningStore((s) => s.deleteTask)

  const tKey = todayKey()

  // ── Quick add (title only) + optional details expander ──
  const [title, setTitle] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [dueDate, setDueDate] = useState(tKey)
  const [dueTime, setDueTime] = useState('')
  const [durationMin, setDurationMin] = useState(20)
  const [priority, setPriority] = useState<PlannerTask['priority']>('medium')
  const [type, setType] = useState<TaskType>('study')

  const [filter, setFilter] = useState<Filter>('today')

  // Subjects actually known to the store — chips, never a hardcoded list.
  const subjects = useMemo(
    () => Array.from(new Set([...resources.map((r) => r.subject), ...tasks.map((t) => t.subject)])).filter(Boolean),
    [resources, tasks],
  )

  const filtered = useMemo(() => {
    switch (filter) {
      case 'today':
        return tasks.filter((t) => t.dueDate === tKey).sort(byDue)
      case 'upcoming':
        return tasks.filter((t) => isOpen(t) && t.dueDate > tKey).sort(byDue)
      case 'completed':
        return tasks.filter((t) => t.status === 'completed').sort(byDue)
      case 'all':
      default:
        return tasks.slice().sort(byDue)
    }
  }, [tasks, filter, tKey])

  const counts = {
    today: tasks.filter((t) => t.dueDate === tKey).length,
    upcoming: tasks.filter((t) => isOpen(t) && t.dueDate > tKey).length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    all: tasks.length,
  }

  const quickAdd = () => {
    const clean = title.trim()
    if (!clean) return
    addTask({
      title: clean,
      subject,
      type,
      priority,
      dueDate,
      dueTime: dueTime || undefined,
      durationMin,
      origin: 'manual',
    })
    toast.success('Task added', { description: `${clean} · ${durationMin} min · ${dueDate === tKey ? 'today' : dueDate}` })
    setTitle('')
    // Keep the details open if the student is batching — the fields persist.
  }

  // ── Status cycle: Circle → PlayCircle → CheckCircle2 (§23) ──
  const cycleStatus = (t: PlannerTask) => {
    if (t.status === 'not-started') {
      setTaskStatus(t.id, 'in-progress')
      toast.info('Task in progress', { description: t.title })
    } else if (t.status === 'in-progress') {
      setTaskStatus(t.id, 'completed')
      toast.success('Task completed', { description: t.title })
    }
    // Completed tasks show a static check — revert lives in the kebab.
  }

  return (
    <div className="space-y-5">
      {/* ── Quick add bar (§23/§24 — clean form, no fake AI) ── */}
      <GlassCard hover={false} className="on-card p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Plus
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') quickAdd()
              }}
              placeholder="Add a study task — e.g. Revise fractions"
              aria-label="Task title"
              className={cn(FIELD_CLASSES, 'h-11 pl-9 sm:h-10')}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={quickAdd}
              disabled={title.trim() === ''}
              className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:flex-none"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add
            </button>
            <button
              type="button"
              onClick={() => setDetailsOpen((o) => !o)}
              aria-expanded={detailsOpen}
              aria-controls="task-details"
              className="inline-flex h-11 items-center justify-center gap-1 rounded-xl border border-border bg-card/50 px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-10"
            >
              Details
              <ChevronDown
                className={cn('h-3.5 w-3.5 transition-transform', detailsOpen && 'rotate-180')}
                aria-hidden
              />
            </button>
          </div>
        </div>

        {detailsOpen && (
          <motion.div
            id="task-details"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 space-y-3 border-t border-border/60 pt-3"
          >
            <p className="text-[11px] text-muted-foreground">
              Optional details — the quick add already uses today, {durationMin} min, medium priority.
            </p>

            <fieldset>
              <legend className="mb-1.5 text-xs font-medium text-foreground">Subject</legend>
              <div className="flex flex-wrap gap-1.5">
                {subjects.map((s) => {
                  const active = subject === s
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSubject(active ? '' : s)}
                      aria-pressed={active}
                      className={cn(
                        'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:min-h-9',
                        active
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-white' : subjectColor(s).dot)} aria-hidden />
                      {s}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label htmlFor="ta-date" className="mb-1.5 block text-xs font-medium text-foreground">
                  Date
                </label>
                <input
                  id="ta-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={cn(FIELD_CLASSES, 'h-11 sm:h-10')}
                />
              </div>
              <div>
                <label htmlFor="ta-time" className="mb-1.5 block text-xs font-medium text-foreground">
                  Time
                </label>
                <input
                  id="ta-time"
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className={cn(FIELD_CLASSES, 'h-11 sm:h-10')}
                />
              </div>
              <div>
                <label htmlFor="ta-duration" className="mb-1.5 block text-xs font-medium text-foreground">
                  Duration
                </label>
                <select
                  id="ta-duration"
                  value={durationMin}
                  onChange={(e) => setDurationMin(Number(e.target.value))}
                  className={cn(FIELD_CLASSES, 'h-11 sm:h-10')}
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} min
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ta-type" className="mb-1.5 block text-xs font-medium text-foreground">
                  Type
                </label>
                <select
                  id="ta-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as TaskType)}
                  className={cn(FIELD_CLASSES, 'h-11 capitalize sm:h-10')}
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <fieldset>
              <legend className="mb-1.5 text-xs font-medium text-foreground">Priority</legend>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITIES.map((p) => {
                  const active = priority === p
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      aria-pressed={active}
                      className={cn(
                        'inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-[11px] font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:min-h-9',
                        active ? PRIORITY_CHIP.selected : PRIORITY_CHIP.idle,
                      )}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          </motion.div>
        )}
      </GlassCard>

      {/* ── Filter chips (real counts) ── */}
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Task filters">
        {FILTERS.map((f) => {
          const active = filter === f.key
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={active}
              className={cn(
                'inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:min-h-9',
                active
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-muted/50 text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {f.label}
              <span className="tabular-nums opacity-70">{counts[f.key]}</span>
            </button>
          )
        })}
      </div>

      {/* ── Task rows ── */}
      <section className="space-y-2">
        <SectionLabel hint={`${filtered.length} shown`}>Tasks</SectionLabel>

        {filtered.length === 0 ? (
          <GlassCard hover={false} className="on-card flex min-h-20 items-center justify-center p-6">
            <p className="text-sm text-muted-foreground">{EMPTY_FOR[filter]}</p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {filtered.map((t, i) => {
              const overdue = isOverdue(t, tKey)
              const sc = t.subject ? subjectColor(t.subject) : null
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.2), duration: 0.2 }}
                >
                  <GlassCard className="on-card p-3 sm:p-3.5">
                    <div className="flex items-start gap-2.5">
                      {/* Status cycle — Circle → PlayCircle → CheckCircle2 */}
                      {t.status === 'completed' ? (
                        <span
                          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center text-emerald-600 dark:text-emerald-400"
                          title="Completed"
                        >
                          <CheckCircle2 className="h-5 w-5" aria-hidden />
                          <span className="sr-only">Completed</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => cycleStatus(t)}
                          aria-label={
                            t.status === 'not-started'
                              ? `Mark ${t.title} as in progress`
                              : `Mark ${t.title} as completed`
                          }
                          className={cn(
                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                            t.status === 'in-progress'
                              ? 'text-sky-600 hover:bg-sky-500/10 dark:text-sky-400'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                          )}
                        >
                          {t.status === 'not-started' ? (
                            <Circle className="h-5 w-5" aria-hidden />
                          ) : (
                            <PlayCircle className="h-5 w-5" aria-hidden />
                          )}
                        </button>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p
                            className={cn(
                              'text-[13px] font-medium leading-tight',
                              t.status === 'completed' && 'line-through text-muted-foreground',
                              t.status === 'skipped' && 'text-muted-foreground',
                            )}
                          >
                            {t.title}
                          </p>
                          {overdue && (
                            <span className="inline-flex items-center whitespace-nowrap rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-400">
                              Overdue
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
                          <TypeMark type={t.type} />
                          {sc && (
                            <span className="inline-flex items-center gap-1">
                              <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} aria-hidden />
                              {t.subject}
                              {t.topic ? ` · ${t.topic}` : ''}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Clock3 className="h-3 w-3" aria-hidden />
                            {t.durationMin} min
                          </span>
                          {t.origin === 'resource' && (
                            <span className="inline-flex items-center whitespace-nowrap rounded-full bg-cyan-500/10 px-1.5 py-px text-[10px] font-medium text-cyan-700 dark:text-cyan-400">
                              From resource
                            </span>
                          )}
                          {t.origin === 'revision' && (
                            <span className="inline-flex items-center whitespace-nowrap rounded-full bg-amber-500/10 px-1.5 py-px text-[10px] font-medium text-amber-700 dark:text-amber-400">
                              Revision
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <div className="hidden text-right sm:block">
                          <p
                            className={cn(
                              'text-[11px] font-medium tabular-nums',
                              overdue ? 'text-rose-600 dark:text-rose-400' : 'text-foreground/80',
                            )}
                          >
                            {timeLabel(t.dueTime) || '—'}
                          </p>
                          <p
                            className={cn(
                              'text-[10px] tabular-nums',
                              overdue ? 'text-rose-600/80 dark:text-rose-400/80' : 'text-muted-foreground',
                            )}
                          >
                            {t.dueDate === tKey ? 'Today' : t.dueDate.split('-').reverse().join('/')}
                          </p>
                        </div>
                        <PriorityPill priority={t.priority} />

                        {/* Kebab — Skip / revert / Delete */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label={`More actions for ${t.title}`}
                              className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9 sm:w-9"
                            >
                              <MoreHorizontal className="h-4 w-4" aria-hidden />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {isOpen(t) && (
                              <DropdownMenuItem onClick={() => {
                                setTaskStatus(t.id, 'skipped')
                                toast.info('Task skipped', { description: t.title })
                              }}>
                                <SkipForward />
                                Skip
                              </DropdownMenuItem>
                            )}
                            {t.status !== 'not-started' && (
                              <DropdownMenuItem onClick={() => {
                                setTaskStatus(t.id, 'not-started')
                                toast.info('Back to not started', { description: t.title })
                              }}>
                                <RotateCcw />
                                Not started
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                deleteTask(t.id)
                                toast.info('Task deleted', { description: t.title })
                              }}
                              className="text-rose-600 dark:text-rose-400"
                            >
                              <Trash2 />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Mobile due line — compact, honest overdue tint */}
                    <div className="mt-1.5 flex items-center gap-1.5 pl-10 text-[11px] sm:hidden">
                      <CalendarDays className={cn('h-3 w-3', overdue ? 'text-rose-500' : 'text-muted-foreground')} aria-hidden />
                      <span className={cn('tabular-nums', overdue ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-muted-foreground')}>
                        {t.dueDate === tKey ? 'Today' : t.dueDate.split('-').reverse().join('/')}
                        {t.dueTime ? ` · ${timeLabel(t.dueTime)}` : ''}
                      </span>
                    </div>
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
