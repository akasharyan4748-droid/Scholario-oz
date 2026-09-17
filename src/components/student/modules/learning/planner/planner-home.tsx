'use client'

/**
 * learning/planner/planner-home — the Study Planner (§21–§26/§68).
 *
 * Local tabs: Today | Tasks | Calendar | Goals | Focus (§52 — compact local
 * chips, not ten global tabs). Today leads with the daily goal + the plan;
 * Tasks carries the full system (quick add + edit + statuses); Calendar
 * overlays the student's own tasks/sessions with REAL exam dates from the
 * canonical academics dataset; Goals tracks real derived progress; Focus is
 * the timer (own component).
 */

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Archive, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, Flame,
  ListTodo, Pencil, Plus, SkipForward, Target, Trash2, Zap,
} from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { exams } from '@/lib/mock/academics'
import {
  useLearningStore, minutesOn, streakOf, minutesSinceMonday, goalProgress, openTasksToday,
} from '@/lib/store/learning-store'
import { subjectColor } from '../../timetable/subject-colors'
import { SectionLabel } from '../../../shell/page-header'
import { fmtMin } from '../shared/tokens'
import { Focus } from './focus'
import { parseQuickAdd } from './quick-add'
import type { StudyTask, StudyGoal, TaskStatus, Priority, TaskType } from '@/lib/store/learning-types'

const SUBJECTS = ['Mathematics', 'English', 'Science', 'Hindi', 'Social Studies', 'Computer Science', 'General']
const TYPES: TaskType[] = ['reading', 'practice', 'revision', 'quiz', 'notes', 'other']
const PRIORITIES: Priority[] = ['low', 'normal', 'high']

const TYPE_LABEL: Record<TaskType, string> = {
  reading: 'Read', practice: 'Practice', revision: 'Revise', quiz: 'Quiz', notes: 'Notes', other: 'Study',
}

const PRIORITY_DOT: Record<Priority, string> = {
  low: 'bg-muted-foreground/30',
  normal: 'bg-sky-500',
  high: 'bg-rose-500',
}

function isoToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type PlannerTab = 'today' | 'tasks' | 'calendar' | 'goals' | 'focus'

const TABS: { key: PlannerTab; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'goals', label: 'Goals' },
  { key: 'focus', label: 'Focus' },
]

export function PlannerHome() {
  const tasks = useLearningStore((s) => s.tasks)
  const goals = useLearningStore((s) => s.goals)
  const sessions = useLearningStore((s) => s.sessions)
  const dailyGoalMin = useLearningStore((s) => s.dailyGoalMin)
  const addTask = useLearningStore((s) => s.addTask)
  const updateTask = useLearningStore((s) => s.updateTask)
  const setTaskStatus = useLearningStore((s) => s.setTaskStatus)
  const deleteTask = useLearningStore((s) => s.deleteTask)
  const setDailyGoalMin = useLearningStore((s) => s.setDailyGoalMin)
  const addGoal = useLearningStore((s) => s.addGoal)
  const archiveGoal = useLearningStore((s) => s.archiveGoal)
  const resources = useLearningStore((s) => s.resources)
  const progress = useLearningStore((s) => s.progress)
  const cards = useLearningStore((s) => s.cards)
  const decks = useLearningStore((s) => s.decks)

  const today = useMemo(() => isoToday(), [])
  const [tab, setTab] = useState<PlannerTab>('today')
  const [quickAdd, setQuickAdd] = useState('')
  const [editTask, setEditTask] = useState<StudyTask | null>(null)
  const [goalDialog, setGoalDialog] = useState(false)
  const [goalForm, setGoalForm] = useState<{ title: string; kind: StudyGoal['kind']; target: number; deadline: string }>({
    title: '', kind: 'time', target: 60, deadline: addDaysIso(isoToday(), 7),
  })

  const todayList = useMemo(() => openTasksToday(tasks, today), [tasks, today])
  const todayDone = useMemo(() => tasks.filter((t) => t.date === today && t.status === 'done'), [tasks, today])
  const plannedMin = todayList.reduce((sum, t) => sum + t.durationMin, 0)
  const studiedMin = useMemo(() => minutesOn(sessions, today), [sessions, today])
  const streak = useMemo(() => streakOf(sessions), [sessions])
  const weekMin = useMemo(() => minutesSinceMonday(sessions), [sessions])
  const upcoming = useMemo(
    () => tasks.filter((t) => t.date > today && (t.status === 'todo' || t.status === 'in_progress')).slice(0, 4),
    [tasks, today],
  )

  const submitQuickAdd = () => {
    if (!quickAdd.trim()) return
    const parsed = parseQuickAdd(quickAdd)
    if (!parsed.title) {
      toast.error('Add a little more detail', { description: 'Try: “Revise fractions tomorrow 30 min”' })
      return
    }
    addTask({
      title: parsed.title.charAt(0).toUpperCase() + parsed.title.slice(1),
      subject: parsed.subject ?? 'General',
      type: parsed.type,
      date: parsed.date,
      durationMin: parsed.durationMin,
      priority: parsed.priority,
    })
    setQuickAdd('')
    toast.success('Task added', {
      description: `${parsed.title.charAt(0).toUpperCase() + parsed.title.slice(1)} · ${parsed.date === today ? 'today' : new Date(`${parsed.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · ${fmtMin(parsed.durationMin)}`,
    })
  }

  /* ── TODAY (§22/§68) ── */
  const renderToday = () => (
    <div className="space-y-5">
      {/* Daily goal + streak */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <GlassCard hover={false} className="on-card p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Today&apos;s study goal</p>
            <div className="flex items-center gap-1.5">
              {[30, 45, 60, 90].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDailyGoalMin(m)}
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    dailyGoalMin === m ? 'bg-primary/10 text-primary' : 'text-muted-foreground/70 hover:text-foreground',
                  )}
                  aria-pressed={dailyGoalMin === m}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-end gap-3">
            <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
              {studiedMin}<span className="text-lg font-semibold text-muted-foreground"> / {dailyGoalMin} min</span>
            </p>
            {studiedMin >= dailyGoalMin && (
              <span className="mb-1 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" aria-hidden /> Goal met
              </span>
            )}
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div
              className={cn('h-full rounded-full transition-all duration-700', studiedMin >= dailyGoalMin ? 'bg-emerald-500' : 'bg-primary')}
              style={{ width: `${Math.min(100, (studiedMin / dailyGoalMin) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {fmtMin(weekMin)} this week · {todayList.length} task{todayList.length === 1 ? '' : 's'} still planned
            {todayDone.length > 0 && ` · ${todayDone.length} done`}
          </p>
        </GlassCard>
        <GlassCard hover={false} className="on-card flex items-center gap-4 p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/25" aria-hidden>
            <Flame className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xl font-bold tabular-nums tracking-tight text-foreground">{streak}-day streak</p>
            <p className="text-[11px] text-muted-foreground">One focused session a day keeps it alive.</p>
          </div>
        </GlassCard>
      </div>

      {/* Today's plan (§22) */}
      <section aria-label="Today's plan">
        <SectionLabel hint={`${fmtMin(plannedMin)} planned`}>Today&apos;s plan</SectionLabel>
        {todayList.length === 0 ? (
          <div className="mt-2 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-8 text-center">
            <p className="text-xs font-semibold text-foreground/70">{todayDone.length > 0 ? 'Your day is clear — everything done.' : 'Your day is clear.'}</p>
            <p className="text-[11px] text-muted-foreground">Add something above, or start a focus session.</p>
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            {todayList.map((t) => (
              <TaskRow key={t.id} task={t} onEdit={setEditTask} onStatus={setTaskStatus} onDelete={deleteTask} highlightDate={false} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming (§68) */}
      {upcoming.length > 0 && (
        <section aria-label="Upcoming">
          <SectionLabel>Upcoming</SectionLabel>
          <div className="mt-2 divide-y divide-border/60 rounded-xl border border-border/60 bg-card/40">
            {upcoming.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setEditTask(t)}
                className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {t.date === addDaysIso(today, 1) ? 'Tomorrow' : new Date(`${t.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', subjectColor(t.subject).dot)} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground/85">{t.title}</span>
                <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{fmtMin(t.durationMin)}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )

  /* ── TASKS (§23) ── */
  const renderTasks = () => {
    const groups: { label: string; items: StudyTask[] }[] = [
      { label: 'Overdue', items: tasks.filter((t) => t.date < today && (t.status === 'todo' || t.status === 'in_progress')) },
      { label: 'Today', items: tasks.filter((t) => t.date === today && t.status !== 'done' && t.status !== 'skipped') },
      { label: 'Upcoming', items: tasks.filter((t) => t.date > today && (t.status === 'todo' || t.status === 'in_progress')) },
      { label: 'Completed', items: tasks.filter((t) => t.status === 'done' || t.status === 'skipped').slice(0, 8) },
    ]
    return (
      <div className="space-y-5">
        <QuickAddBar value={quickAdd} onChange={setQuickAdd} onSubmit={submitQuickAdd} />
        {groups.map((g) => (
          <section key={g.label} aria-label={g.label}>
            <SectionLabel hint={`${g.items.length}`}>{g.label}</SectionLabel>
            {g.items.length === 0 ? (
              <p className="mt-2 rounded-xl border border-dashed border-border px-4 py-4 text-center text-[11px] text-muted-foreground">
                {g.label === 'Completed' ? 'Nothing completed yet.' : 'Nothing here.'}
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {g.items.map((t) => (
                  <TaskRow key={t.id} task={t} onEdit={setEditTask} onStatus={setTaskStatus} onDelete={deleteTask} highlightDate={g.label !== 'Today'} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    )
  }

  /* ── CALENDAR (§25) — real exam dates + own tasks/sessions ── */
  const renderCalendar = () => {
    const year = Number(today.slice(0, 4))
    const month = Number(today.slice(5, 7))
    const first = new Date(year, month - 1, 1)
    const daysInMonth = new Date(year, month, 0).getDate()
    const lead = (first.getDay() + 6) % 7 // Monday-first
    const cells: (string | null)[] = [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => `${today.slice(0, 7)}-${String(i + 1).padStart(2, '0')}`),
    ]
    const relevantExams = exams.filter((e) => e.startDate?.startsWith(today.slice(0, 7)))
    return (
      <GlassCard hover={false} className="on-card p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold tracking-tight text-foreground">
            {first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden /> study</span>
            <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden /> exam</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Study calendar">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">{d}</div>
          ))}
          {cells.map((iso, i) => {
            if (!iso) return <span key={`e-${i}`} aria-hidden className="aspect-square" />
            const dayTasks = tasks.filter((t) => t.date === iso && t.status !== 'skipped')
            const dayExams = relevantExams.filter((e) => e.startDate === iso || e.endDate === iso)
            const studied = minutesOn(sessions, iso)
            const isToday = iso === today
            return (
              <button
                key={iso}
                type="button"
                onClick={() => { const t = dayTasks[0]; if (t) setEditTask(t) }}
                aria-label={`${iso}: ${dayTasks.length} tasks${dayExams.length ? `, ${dayExams[0].name}` : ''}${studied ? `, ${studied} min studied` : ''}`}
                className={cn(
                  'relative flex aspect-square flex-col items-center justify-center rounded-lg text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isToday ? 'ring-1 ring-foreground/40' : '',
                  dayTasks.length || dayExams.length ? 'cursor-pointer hover:bg-muted/50' : 'text-muted-foreground/70',
                )}
              >
                <span className="tabular-nums leading-none">{Number(iso.slice(8))}</span>
                <span className="mt-1 flex h-1.5 items-center gap-1" aria-hidden>
                  {dayTasks.slice(0, 3).map((t) => (
                    <span key={t.id} className={cn('h-1.5 w-1.5 rounded-full', t.status === 'done' ? 'bg-emerald-500' : subjectColor(t.subject).dot)} />
                  ))}
                  {dayExams.map((e) => (
                    <span key={e.id} className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  ))}
                </span>
                {studied > 0 && (
                  <span className="absolute bottom-0.5 text-[8px] font-bold tabular-nums text-muted-foreground/60">{studied}m</span>
                )}
              </button>
            )
          })}
        </div>
        {relevantExams.length > 0 && (
          <div className="mt-3.5 space-y-1.5 border-t border-border/70 pt-3">
            {relevantExams.map((e) => (
              <p key={e.id} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                <span className="font-semibold text-foreground/80">{e.name}</span>
                <span className="truncate">{e.type} · {new Date(`${e.startDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </p>
            ))}
          </div>
        )}
      </GlassCard>
    )
  }

  /* ── GOALS (§26) ── */
  const renderGoals = () => {
    const active = goals.filter((g) => !g.archived)
    const archived = goals.filter((g) => g.archived)
    const ctx = { sessions, cards, decks, tasks, resources, progress }
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <SectionLabel hint={`${active.length} active`}>Study goals</SectionLabel>
          <Button size="sm" variant="outline" className="h-7 gap-1" onClick={() => setGoalDialog(true)}>
            <Plus className="h-3.5 w-3.5" aria-hidden /> New goal
          </Button>
        </div>
        {active.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">
            No active goals — set one and watch real progress land here.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
            {active.map((g) => {
              const current = goalProgress(g, ctx)
              const pct = Math.min(100, Math.round((current / g.target) * 100))
              const done = current >= g.target
              return (
                <GlassCard key={g.id} hover={false} className="on-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{g.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {g.kind === 'time' ? `${fmtMin(g.target)} ${g.scope === 'week' ? 'this week' : 'total'}` : `${g.target} ${g.unit}`}
                        {g.deadline && ` · by ${new Date(`${g.deadline}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground/60 hover:text-muted-foreground" onClick={() => { archiveGoal(g.id); toast.info('Goal archived') }} aria-label="Archive goal">
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center gap-2.5">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                      <div className={cn('h-full rounded-full transition-all duration-700', done ? 'bg-emerald-500' : 'bg-primary')} style={{ width: `${Math.max(2, pct)}%` }} />
                    </div>
                    <span className={cn('shrink-0 text-[11px] font-bold tabular-nums', done ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground/80')}>
                      {g.kind === 'time' ? fmtMin(current) : current}/{g.kind === 'time' ? fmtMin(g.target) : g.target}
                    </span>
                  </div>
                  {done && <p className="mt-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Goal reached — nicely done.</p>}
                </GlassCard>
              )
            })}
          </div>
        )}
        {archived.length > 0 && (
          <p className="text-[11px] text-muted-foreground">{archived.length} archived</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Local section chips (§52) */}
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-2" role="tablist" aria-label="Study planner sections">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              tab === t.key ? 'bg-white shadow-sm text-foreground dark:bg-white/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
          {tab === 'today' && (
            <>
              <QuickAddBar value={quickAdd} onChange={setQuickAdd} onSubmit={submitQuickAdd} />
              {renderToday()}
            </>
          )}
          {tab === 'tasks' && renderTasks()}
          {tab === 'calendar' && renderCalendar()}
          {tab === 'goals' && renderGoals()}
          {tab === 'focus' && <Focus />}
        </motion.div>
      </AnimatePresence>

      {/* ── Task edit dialog (§23 — advanced details optional) ── */}
      <TaskEditDialog
        task={editTask}
        onClose={() => setEditTask(null)}
        onSave={(patch) => { if (editTask) { updateTask(editTask.id, patch); toast.success('Task updated'); setEditTask(null) } }}
        onDelete={() => { if (editTask) { deleteTask(editTask.id); toast.info('Task deleted'); setEditTask(null) } }}
      />

      {/* ── New goal dialog (§26) ── */}
      <Dialog open={goalDialog} onOpenChange={(open) => !open && setGoalDialog(false)}>
        <DialogContent className="on-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New study goal</DialogTitle>
            <DialogDescription>Progress tracks itself from your real study activity.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="grid gap-1.5">
              <Label htmlFor="goal-title">Goal</Label>
              <Input
                id="goal-title"
                value={goalForm.title}
                onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                placeholder='e.g. "Study 5 hours this week"'
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Kind</Label>
                <Select value={goalForm.kind} onValueChange={(v) => {
                  const kind = v as StudyGoal['kind']
                  const defaults: Record<StudyGoal['kind'], { target: number; unit: StudyGoal['unit'] }> = {
                    time: { target: 300, unit: 'minutes' },
                    tasks: { target: 10, unit: 'tasks' },
                    resources: { target: 5, unit: 'resources' },
                    cards: { target: 20, unit: 'cards' },
                  }
                  setGoalForm({ ...goalForm, kind, target: defaults[kind].target })
                }}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">Study time</SelectItem>
                    <SelectItem value="tasks">Tasks completed</SelectItem>
                    <SelectItem value="resources">Resources finished</SelectItem>
                    <SelectItem value="cards">Cards mastered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="goal-target">Target</Label>
                <Input
                  id="goal-target"
                  type="number"
                  min={1}
                  value={goalForm.target}
                  onChange={(e) => setGoalForm({ ...goalForm, target: Number(e.target.value) })}
                  className="text-sm tabular-nums"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="goal-deadline">Deadline (optional)</Label>
              <Input
                id="goal-deadline"
                type="date"
                value={goalForm.deadline}
                onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setGoalDialog(false)}>Cancel</Button>
            <Button
              disabled={!goalForm.title.trim()}
              onClick={() => {
                const unitMap: Record<StudyGoal['kind'], StudyGoal['unit']> = { time: 'minutes', tasks: 'tasks', resources: 'resources', cards: 'cards' }
                addGoal({
                  title: goalForm.title.trim(),
                  kind: goalForm.kind,
                  target: goalForm.target,
                  unit: unitMap[goalForm.kind],
                  scope: goalForm.kind === 'time' ? 'week' : 'term',
                  deadline: goalForm.deadline || undefined,
                })
                toast.success('Goal created')
                setGoalDialog(false)
                setGoalForm({ title: '', kind: 'time', target: 60, deadline: addDaysIso(isoToday(), 7) })
              }}
            >
              Create goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ── Quick-add bar (§23: "Revise fractions tomorrow 30 min") ───────── */

function QuickAddBar({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Zap className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-amber-500" aria-hidden />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder='Quick add — “Revise fractions tomorrow 30 min”'
          className="h-10 pl-9 text-xs"
          aria-label="Quick add task"
        />
      </div>
      <Button size="sm" className="h-10 gap-1" onClick={onSubmit} disabled={!value.trim()}>
        <Plus className="h-4 w-4" aria-hidden /> Add
      </Button>
    </div>
  )
}

/* ── Task row (compact, §22) ───────────────────────────────────────── */

function TaskRow({ task, onEdit, onStatus, onDelete, highlightDate }: {
  task: StudyTask
  onEdit: (t: StudyTask) => void
  onStatus: (id: string, status: TaskStatus) => void
  onDelete: (id: string) => void
  highlightDate: boolean
}) {
  const sc = subjectColor(task.subject)
  const done = task.status === 'done'
  const skipped = task.status === 'skipped'
  return (
    <div className={cn(
      'group flex items-center gap-3 rounded-xl border bg-card/50 px-3.5 py-3 transition-colors',
      done ? 'border-emerald-500/20 bg-emerald-500/[0.04]' : skipped ? 'border-border/60 opacity-60' : 'border-border',
    )}>
      <button
        type="button"
        onClick={() => onStatus(task.id, done ? 'todo' : 'done')}
        aria-label={done ? 'Mark as not done' : 'Mark as done'}
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border hover:border-primary/50',
        )}
      >
        {done && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}
      </button>
      <span className={cn('h-8 w-[3px] shrink-0 rounded-full', done ? 'bg-emerald-500/40' : sc.dot)} aria-hidden />
      <button type="button" onClick={() => onEdit(task)} className="min-w-0 flex-1 text-left">
        <p className={cn('truncate text-sm font-medium', done ? 'text-muted-foreground line-through' : 'text-foreground')}>
          {task.title}
        </p>
        <p className="mt-0.5 flex items-center gap-2 truncate text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_DOT[task.priority])} aria-hidden />
            {task.subject}{task.topic ? ` · ${task.topic}` : ''}
          </span>
          {task.startTime && <span className="tabular-nums">{task.startTime}</span>}
          <span className="tabular-nums">{fmtMin(task.durationMin)}</span>
          {highlightDate && task.date !== isoToday() && (
            <span className="tabular-nums">{new Date(`${task.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
          )}
        </p>
      </button>
      <div className="flex shrink-0 items-center gap-0.5">
        {!done && !skipped && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 hover:text-muted-foreground" onClick={() => onStatus(task.id, 'skipped')} aria-label="Skip task">
            <SkipForward className="h-3.5 w-3.5" />
          </Button>
        )}
        {skipped && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60" onClick={() => onStatus(task.id, 'todo')} aria-label="Restore task">
            <ListTodo className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 hover:text-foreground" onClick={() => onEdit(task)} aria-label="Edit task">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-500" onClick={() => onDelete(task.id)} aria-label="Delete task">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

/* ── Task edit dialog (§23 advanced fields, optional) ──────────────── */

function TaskEditDialog({ task, onClose, onSave, onDelete }: {
  task: StudyTask | null
  onClose: () => void
  onSave: (patch: Partial<StudyTask>) => void
  onDelete: () => void
}) {
  const [form, setForm] = useState<Partial<StudyTask>>({})
  const [lastId, setLastId] = useState<string | null>(null)
  if (task && task.id !== lastId) {
    setLastId(task.id)
    setForm({
      title: task.title,
      subject: task.subject,
      topic: task.topic,
      type: task.type,
      date: task.date,
      startTime: task.startTime,
      durationMin: task.durationMin,
      priority: task.priority,
      notes: task.notes,
    })
  }
  return (
    <Dialog open={!!task} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="on-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>Details are optional — the plan stays light.</DialogDescription>
        </DialogHeader>
        {task && (
          <div className="grid gap-4 py-1">
            <div className="grid gap-1.5">
              <Label htmlFor="t-title">Title</Label>
              <Input id="t-title" value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} className="text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Subject</Label>
                <Select value={form.subject ?? 'General'} onValueChange={(v) => setForm({ ...form, subject: v })}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Kind</Label>
                <Select value={form.type ?? 'other'} onValueChange={(v) => setForm({ ...form, type: v as TaskType })}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="t-date">Date</Label>
                <Input id="t-date" type="date" value={form.date ?? ''} onChange={(e) => setForm({ ...form, date: e.target.value })} className="text-sm" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="t-time">Time</Label>
                <Input id="t-time" type="time" value={form.startTime ?? ''} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="text-sm" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="t-min">Minutes</Label>
                <Input id="t-min" type="number" min={5} step={5} value={form.durationMin ?? 20} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })} className="text-sm tabular-nums" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Priority</Label>
                <Select value={form.priority ?? 'normal'} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="t-topic">Topic (optional)</Label>
                <Input id="t-topic" value={form.topic ?? ''} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="text-sm" />
              </div>
            </div>
          </div>
        )}
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" className="gap-1.5 text-rose-500 hover:bg-rose-500/10" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onSave(form)} disabled={!form.title?.trim()}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
