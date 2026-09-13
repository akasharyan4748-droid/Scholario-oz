'use client'

/**
 * shared — the Study Planner module's meta system (spec §21–§34).
 *
 * Everything here maps a REAL value from the canonical
 * `student-learning-store` to its semantic presentation, following the
 * Learning OS multi-accent conventions (never colour alone — §59):
 *   · priority   rose=high · amber=medium · neutral=low
 *   · type       violet=study · amber=revision · sky=practice ·
 *                cyan=reading · neutral=project (icon + label)
 *   · status     neutral=not started · sky=in progress ·
 *                emerald=completed · muted=skipped
 *
 * Also owns the planner's small honest helpers (today key, due-time
 * parsing/formatting, overdue check) shared by every tab.
 */

import {
  BookOpen,
  BookOpenText,
  History,
  Lightbulb,
  PencilLine,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlannerTask, TaskStatus, TaskType } from '@/lib/store/student-learning-store'

// ─── Local tabs (§52: advanced functionality lives INSIDE the section) ──

export type PlannerTab = 'today' | 'tasks' | 'calendar' | 'goals' | 'focus'

export const PLANNER_TABS: Array<{ key: PlannerTab; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'goals', label: 'Goals' },
  { key: 'focus', label: 'Focus' },
]

/** Soft daily study reference (§22 "Today's study goal: 45 / 60 min"). */
export const DAILY_REFERENCE_MIN = 60

/** Short break length after a focus session (§29). */
export const BREAK_MIN = 5

// ─── Date / time helpers (local-time, store-compatible keys) ──────────

/** Local-time YYYY-MM-DD — matches the store's task dueDate / session keys. */
export function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Local-time YYYY-MM-DD for a Date object (no UTC drift). */
export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Minutes since midnight for sorting; untimed tasks sort to the end. */
export function timeToMin(t?: string): number {
  if (!t) return 24 * 60 + 59
  const m12 = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (m12) {
    let h = parseInt(m12[1], 10) % 12
    if (m12[3].toUpperCase() === 'PM') h += 12
    return h * 60 + parseInt(m12[2], 10)
  }
  const m24 = t.match(/^(\d{1,2}):(\d{2})$/)
  if (m24) return parseInt(m24[1], 10) * 60 + parseInt(m24[2], 10)
  return 24 * 60 + 59
}

/** Display form for a due time — native "HH:MM" input values become "07:00 PM". */
export function timeLabel(t?: string): string {
  if (!t) return ''
  if (/am|pm/i.test(t)) return t
  const m = t.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return t
  const h = parseInt(m[1], 10)
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${String(h12).padStart(2, '0')}:${m[2]} ${ampm}`
}

/** Compact due-date label relative to today: "Today" · "Tomorrow" · "in 3d" · "3d ago". */
export function dueLabel(dueDate: string, today: string): string {
  if (dueDate === today) return 'Today'
  const d = new Date(dueDate + 'T00:00:00')
  const t = new Date(today + 'T00:00:00')
  const diff = Math.round((d.getTime() - t.getTime()) / 86_400_000)
  if (diff === 1) return 'Tomorrow'
  if (diff > 1) return `in ${diff}d`
  if (diff === -1) return 'Yesterday'
  return `${-diff}d ago`
}

/** An open task whose due date has passed (§23 honest overdue state). */
export function isOverdue(task: PlannerTask, today: string): boolean {
  return (
    task.dueDate < today &&
    (task.status === 'not-started' || task.status === 'in-progress')
  )
}

/** Tasks still open (not completed / skipped). */
export function isOpen(task: PlannerTask): boolean {
  return task.status === 'not-started' || task.status === 'in-progress'
}

// ─── Priority ───────────────────────────────────────────────────────

export const PRIORITY_META: Record<PlannerTask['priority'], { label: string; chip: string }> = {
  high: { label: 'High', chip: 'bg-rose-500/10 text-rose-700 dark:text-rose-400' },
  medium: { label: 'Medium', chip: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  low: { label: 'Low', chip: 'bg-muted text-muted-foreground' },
}

export function PriorityPill({ priority, className }: { priority: PlannerTask['priority']; className?: string }) {
  const meta = PRIORITY_META[priority]
  return (
    <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-1.5 py-px text-[10px] font-medium', meta.chip, className)}>
      {meta.label}
    </span>
  )
}

// ─── Task type ──────────────────────────────────────────────────────

export const TYPE_META: Record<TaskType, { icon: LucideIcon; label: string }> = {
  study: { icon: BookOpen, label: 'Study' },
  revision: { icon: History, label: 'Revision' },
  practice: { icon: PencilLine, label: 'Practice' },
  reading: { icon: BookOpenText, label: 'Reading' },
  project: { icon: Lightbulb, label: 'Project' },
}

/** Compact type mark — icon + label, never colour alone. */
export function TypeMark({ type, className }: { type: TaskType; className?: string }) {
  const meta = TYPE_META[type]
  const Icon = meta.icon
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap text-[11px] text-muted-foreground', className)}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {meta.label}
    </span>
  )
}

// ─── Status ─────────────────────────────────────────────────────────

export const STATUS_META: Record<TaskStatus, { label: string; chip: string }> = {
  'not-started': { label: 'Not started', chip: 'bg-muted text-muted-foreground' },
  'in-progress': { label: 'In progress', chip: 'bg-sky-500/10 text-sky-700 dark:text-sky-400' },
  completed: { label: 'Completed', chip: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  skipped: { label: 'Skipped', chip: 'bg-muted text-muted-foreground' },
}

export function StatusChip({ status, className }: { status: TaskStatus; className?: string }) {
  const meta = STATUS_META[status]
  return (
    <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold', meta.chip, className)}>
      {meta.label}
    </span>
  )
}
