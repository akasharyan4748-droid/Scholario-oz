'use client'

/**
 * Learning (L2D) — Planner tab (spec §23/§24): an academic planning tool,
 * NOT a productivity dashboard. REAL task CRUD (add with optional subject
 * + due date, complete toggle, delete), an honest Today view (due today +
 * overdue), upcoming tasks, and a real client-side focus timer. No
 * Productivity Score, no fake stats.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Plus, Loader2, Trash2, CheckCircle2, Circle, CalendarDays, Timer as TimerIcon,
  Pause, RotateCcw, AlertTriangle, ListTodo, Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { apiDelete, apiFetch, apiPatch, apiPost } from './api'
import type { StudyTaskItem } from './types'

// ─── Helpers ─────────────────────────────────────────────────────────

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfToday(): Date {
  const d = startOfToday()
  d.setDate(d.getDate() + 1)
  return d
}

function isToday(iso: string | null): boolean {
  if (!iso) return false
  const t = new Date(iso).getTime()
  return t >= startOfToday().getTime() && t < endOfToday().getTime()
}

function isOverdue(iso: string | null, completed: boolean): boolean {
  if (!iso || completed) return false
  return new Date(iso).getTime() < startOfToday().getTime()
}

function formatDue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function formatDueTime(iso: string): string {
  const d = new Date(iso)
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  const today = isToday(iso)
  return `${today ? 'Today' : formatDue(iso)} · ${time}`
}

// ─── Planner tab ─────────────────────────────────────────────────────

export function PlannerTab() {
  const [tasks, setTasks] = useState<StudyTaskItem[] | null>(null)
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Add-task form state
  const [title, setTitle] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [adding, setAdding] = useState(false)

  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false
    setError(null)
    apiFetch<{ tasks: StudyTaskItem[]; subjects: Array<{ id: string; name: string }> }>(
      '/api/student/study-tasks',
      { signal: controller.signal },
    )
      .then((d) => {
        if (cancelled) return
        setTasks(d.tasks)
        setSubjects(d.subjects)
      })
      .catch((e: unknown) => {
        if (cancelled || (e instanceof DOMException && e.name === 'AbortError')) return
        setError(e instanceof Error ? e.message : 'Could not load your planner.')
      })
    return () => { cancelled = true; controller.abort() }
  }, [reloadKey])

  const addTask = useCallback(async () => {
    const trimmed = title.trim()
    if (!trimmed || adding) return
    setAdding(true)
    try {
      await apiPost<StudyTaskItem>('/api/student/study-tasks', {
        title: trimmed,
        subjectId: subjectId || undefined,
        dueDate: dueDate ? new Date(`${dueDate}T17:00:00`).toISOString() : undefined,
      })
      setTitle('')
      setSubjectId('')
      setDueDate('')
      setReloadKey((k) => k + 1)
      toast.success('Task added')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add the task.')
    } finally {
      setAdding(false)
    }
  }, [title, subjectId, dueDate, adding])

  const toggleComplete = useCallback(async (task: StudyTaskItem) => {
    if (busyIds.has(task.id)) return
    setBusyIds((s) => new Set(s).add(task.id))
    // Optimistic toggle; rollback on failure.
    const next = task.completedAt ? null : new Date().toISOString()
    setTasks((prev) =>
      prev ? prev.map((t) => (t.id === task.id ? { ...t, completedAt: next } : t)) : prev,
    )
    try {
      await apiPatch(`/api/student/study-tasks/${task.id}`, { completed: !task.completedAt })
    } catch {
      setTasks((prev) =>
        prev ? prev.map((t) => (t.id === task.id ? { ...t, completedAt: task.completedAt } : t)) : prev,
      )
      toast.error('Could not update the task.')
    } finally {
      setBusyIds((s) => {
        const copy = new Set(s)
        copy.delete(task.id)
        return copy
      })
    }
  }, [busyIds])

  const deleteTask = useCallback(async (task: StudyTaskItem) => {
    if (confirmDelete !== task.id) {
      // Two-step inline confirm — no accidental deletes.
      setConfirmDelete(task.id)
      if (confirmTimer.current) clearTimeout(confirmTimer.current)
      confirmTimer.current = setTimeout(() => setConfirmDelete(null), 2500)
      return
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current)
    setConfirmDelete(null)
    if (busyIds.has(task.id)) return
    setBusyIds((s) => new Set(s).add(task.id))
    try {
      await apiDelete(`/api/student/study-tasks/${task.id}`)
      setTasks((prev) => (prev ? prev.filter((t) => t.id !== task.id) : prev))
    } catch {
      toast.error('Could not delete the task.')
    } finally {
      setBusyIds((s) => {
        const copy = new Set(s)
        copy.delete(task.id)
        return copy
      })
    }
  }, [confirmDelete, busyIds])

  // ── Honest grouping (real due data only) ──────────────────────────
  const groups = useMemo(() => {
    if (!tasks) return null
    const active = tasks.filter((t) => !t.completedAt)
    return {
      overdue: active.filter((t) => isOverdue(t.dueDate, false)),
      today: active.filter((t) => isToday(t.dueDate)),
      upcoming: active.filter(
        (t) => !isToday(t.dueDate) && !isOverdue(t.dueDate, false) && t.dueDate,
      ),
      undated: active.filter((t) => !t.dueDate),
      completed: tasks.filter((t) => t.completedAt),
    }
  }, [tasks])

  if (error && !tasks) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-16 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </div>
        <p className="text-sm font-medium">Couldn&apos;t load your planner</p>
        <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)} className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Try again
        </Button>
      </div>
    )
  }
  if (!tasks || !groups) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading planner">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Add task (spec §24: "Revise Fractions" + optional link) ─── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        aria-label="Add a study task"
        className="rounded-xl border border-border bg-card p-4 shadow-2xs"
      >
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
          onSubmit={(e) => { e.preventDefault(); addTask() }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a study task…"
            aria-label="Task title"
            maxLength={200}
            className="h-9 flex-1 text-sm"
          />
          <div className="flex gap-2">
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              aria-label="Optional subject"
              className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:w-32 sm:flex-none"
            >
              <option value="">No subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-label="Optional due date"
              className="h-9 w-36 flex-none text-xs"
            />
            <Button type="submit" size="sm" disabled={!title.trim() || adding} className="h-9 gap-1 flex-none">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
              Add
            </Button>
          </div>
        </form>
      </motion.section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* ── Tasks (2/3 width on desktop) ──────────────────────────── */}
        <div className="space-y-5 lg:col-span-2">
          {/* Today — due today + overdue (spec §23) */}
          {(groups.overdue.length > 0 || groups.today.length > 0) && (
            <section className="space-y-2.5" aria-label="Today">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                <CalendarDays className="h-4 w-4 text-amber-500" aria-hidden /> Today
              </h2>
              {groups.overdue.map((t) => (
                <TaskRow key={t.id} task={t} overdue onToggle={toggleComplete} onDelete={deleteTask}
                  busy={busyIds.has(t.id)} confirm={confirmDelete === t.id} />
              ))}
              {groups.today.map((t) => (
                <TaskRow key={t.id} task={t} onToggle={toggleComplete} onDelete={deleteTask}
                  busy={busyIds.has(t.id)} confirm={confirmDelete === t.id} />
              ))}
            </section>
          )}

          {/* Upcoming */}
          {(groups.upcoming.length > 0 || groups.undated.length > 0) && (
            <section className="space-y-2.5" aria-label="Upcoming tasks">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                <ListTodo className="h-4 w-4 text-primary" aria-hidden /> Upcoming
              </h2>
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {groups.upcoming.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={toggleComplete} onDelete={deleteTask}
                    busy={busyIds.has(t.id)} confirm={confirmDelete === t.id} />
                ))}
                {groups.undated.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={toggleComplete} onDelete={deleteTask}
                    busy={busyIds.has(t.id)} confirm={confirmDelete === t.id} />
                ))}
              </div>
            </section>
          )}

          {/* Completed */}
          {groups.completed.length > 0 && (
            <section className="space-y-2.5" aria-label="Completed tasks">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
                Completed · {groups.completed.length}
              </h2>
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {groups.completed.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={toggleComplete} onDelete={deleteTask}
                    busy={busyIds.has(t.id)} confirm={confirmDelete === t.id} />
                ))}
              </div>
            </section>
          )}

          {tasks.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card/50 px-4 py-10 text-center">
              <ListTodo className="h-5 w-5 text-muted-foreground/50" aria-hidden />
              <p className="text-sm text-muted-foreground">No study tasks yet. Add your first one above.</p>
            </div>
          )}
        </div>

        {/* ── Focus timer (real client-side timer, spec §23) ─────────── */}
        <div className="lg:col-span-1">
          <FocusTimer />
        </div>
      </div>
    </div>
  )
}

// ─── Task row ────────────────────────────────────────────────────────

function TaskRow({
  task, overdue, busy, confirm, onToggle, onDelete,
}: {
  task: StudyTaskItem
  overdue?: boolean
  busy: boolean
  confirm: boolean
  onToggle: (t: StudyTaskItem) => void
  onDelete: (t: StudyTaskItem) => void
}) {
  const done = !!task.completedAt
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors',
        done
          ? 'border-border/60 bg-muted/20'
          : overdue
            ? 'border-rose-500/25 bg-rose-500/5'
            : 'border-border/70 bg-card/60 hover:bg-muted/30',
      )}
    >
      <button
        type="button"
        aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
        aria-pressed={done}
        disabled={busy}
        onClick={() => onToggle(task)}
        className={cn(
          'shrink-0 rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
          done ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/50 hover:text-primary',
        )}
      >
        {done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-medium', done && 'text-muted-foreground line-through')}>
          {task.title}
        </p>
        <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          {task.subjectName && <span>{task.subjectName}</span>}
          {task.dueDate && (
            <>
              {task.subjectName && <span aria-hidden>·</span>}
              <span className={cn(overdue && !done && 'font-semibold text-rose-600 dark:text-rose-400')}>
                {overdue ? `Overdue — ${formatDue(task.dueDate)}` : formatDueTime(task.dueDate)}
              </span>
            </>
          )}
        </p>
      </div>
      <button
        type="button"
        aria-label={confirm ? `Confirm deleting "${task.title}"` : `Delete "${task.title}"`}
        disabled={busy}
        onClick={() => onDelete(task)}
        className={cn(
          'shrink-0 rounded-md p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
          confirm
            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            : 'text-muted-foreground/40 hover:text-rose-600 dark:hover:text-rose-400',
        )}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  )
}

// ─── Focus timer (real pomodoro — no fake stats) ─────────────────────

const FOCUS_SECONDS = 25 * 60

function FocusTimer() {
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false)
          toast.success('Focus session complete — take a short break.')
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [running])

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const pct = ((FOCUS_SECONDS - secondsLeft) / FOCUS_SECONDS) * 100

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      aria-label="Focus timer"
      className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-2xs lg:sticky lg:top-20"
    >
      <div className="flex items-center gap-1.5 self-start text-sm font-semibold">
        <TimerIcon className="h-4 w-4 text-violet-500" aria-hidden /> Focus
      </div>
      <div className="relative flex h-36 w-36 items-center justify-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/40" />
          <circle
            cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="5"
            strokeLinecap="round"
            className={cn('transition-colors', running ? 'text-violet-500' : 'text-violet-500/50')}
            strokeDasharray={`${(pct / 100) * 289} 289`}
            style={{ transition: 'stroke-dasharray 1s linear' }}
          />
        </svg>
        <div className="text-center">
          <p className="font-display text-2xl font-bold tabular-nums">{mm}:{ss}</p>
          <p className="text-[10px] text-muted-foreground">25-minute session</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setRunning((r) => !r)} className="h-8 gap-1.5">
          {running ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <Clock className="h-3.5 w-3.5" aria-hidden />}
          {running ? 'Pause' : secondsLeft === FOCUS_SECONDS ? 'Start' : 'Resume'}
        </Button>
        <Button
          variant="outline" size="sm"
          onClick={() => { setRunning(false); setSecondsLeft(FOCUS_SECONDS) }}
          className="h-8 gap-1.5"
          aria-label="Reset the focus timer"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset
        </Button>
      </div>
      <AnimatePresence>
        {secondsLeft === 0 && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
          >
            Session complete
          </motion.p>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
