'use client'

/**
 * learning/planner/focus — the Focus / Study Timer (§29–§33).
 *
 *   · presets 25 / 45 / 60 + custom, pomodoro auto-rhythm (short 5,
 *     long 15 after every 4th block), auto-start toggle
 *   · CONTEXT before starting: a today's task, or a quick session with a
 *     subject (§31) — the focus screen then shows exactly that
 *   · pause / resume / skip / stop; the clock survives section switches
 *     (module-level runtime store)
 *   · every completed focus block RECORDS a real study session (§31/§33):
 *     study time, task progress, goal progress, streak, subject activity
 *   · the running screen is deliberately almost empty (§32 — no dashboards)
 */

import { useEffect, useMemo, useState } from 'react'
import { Coffee, Pause, Play, SkipForward, Square, Target, Zap } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useLearningStore, streakOf } from '@/lib/store/learning-store'
import { subjectColor } from '../../timetable/subject-colors'
import { SectionLabel } from '../../../shell/page-header'
import { fmtMin } from '../shared/tokens'
import { useTimerRuntime, MODE_PRESETS, fmtClock, type TimerContext } from './timer-runtime'

const SUBJECTS = ['Mathematics', 'English', 'Science', 'Hindi', 'Social Studies', 'Computer Science']

export function Focus() {
  const tasks = useLearningStore((s) => s.tasks)
  const sessions = useLearningStore((s) => s.sessions)
  const recordSession = useLearningStore((s) => s.recordSession)
  const setTaskStatus = useLearningStore((s) => s.setTaskStatus)
  const updateTask = useLearningStore((s) => s.updateTask)

  const phase = useTimerRuntime((s) => s.phase)
  const mode = useTimerRuntime((s) => s.mode)
  const focusMin = useTimerRuntime((s) => s.focusMin)
  const breakMin = useTimerRuntime((s) => s.breakMin)
  const autoStart = useTimerRuntime((s) => s.autoStart)
  const cycle = useTimerRuntime((s) => s.cycle)
  const context = useTimerRuntime((s) => s.context)
  const endsAt = useTimerRuntime((s) => s.endsAt)
  const paused = useTimerRuntime((s) => s.paused)
  const configure = useTimerRuntime((s) => s.configure)
  const setContext = useTimerRuntime((s) => s.setContext)
  const start = useTimerRuntime((s) => s.start)
  const pause = useTimerRuntime((s) => s.pause)
  const resume = useTimerRuntime((s) => s.resume)
  const skip = useTimerRuntime((s) => s.skip)
  const stop = useTimerRuntime((s) => s.stop)
  const completePhase = useTimerRuntime((s) => s.completePhase)
  const beginNext = useTimerRuntime((s) => s.beginNext)

  const pausedRemainMs = useTimerRuntime((s) => s.pausedRemainMs)
  const [customMin, setCustomMin] = useState(30)
  const [quickSubject, setQuickSubject] = useState('Mathematics')
  const [now, setNow] = useState(Date.now())

  const today = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  const todayTasks = useMemo(
    () => tasks.filter((t) => t.date === today && (t.status === 'todo' || t.status === 'in_progress')),
    [tasks, today],
  )

  /* The ticking clock (single interval while a phase runs). */
  useEffect(() => {
    if (phase === 'idle' || paused || endsAt == null) return
    const tick = () => setNow(Date.now())
    tick()
    const id = window.setInterval(tick, 500)
    return () => window.clearInterval(id)
  }, [phase, paused, endsAt])

  /* Phase completion — records the REAL study session exactly once. */
  useEffect(() => {
    if (phase === 'idle' || endsAt == null || paused) return
    if (now < endsAt) return
    const result = completePhase()
    if (result === 'focus-done') {
      const ctx: TimerContext | null = context
      recordSession({
        subject: ctx?.subject ?? 'General',
        topic: ctx?.topic,
        taskId: ctx?.taskId,
        durationMin: focusMin,
        mode: 'focus',
        focusMode: mode,
      })
      // Task progress (§31): mark an in-progress task done when its full
      // planned duration has now been focused.
      if (ctx?.taskId) {
        const task = tasks.find((t) => t.id === ctx.taskId)
        if (task && task.status !== 'done') {
          setTaskStatus(task.id, 'in_progress')
          const alreadyFocused = sessions
            .filter((s) => s.taskId === task.id)
            .reduce((sum, s) => sum + s.durationMin, 0)
          if (alreadyFocused + focusMin >= task.durationMin) {
            setTaskStatus(task.id, 'done')
            toast.success('Task completed', { description: task.title })
          } else {
            updateTask(task.id, { status: 'in_progress' })
          }
        }
      }
      const streak = streakOf([...sessions, { startedAt: new Date().toISOString(), durationMin: focusMin, completed: true, subject: 'x', mode: 'focus', id: 'x', endedAt: '' }])
      toast.success(`${focusMin} minutes focused`, {
        description: `${ctx ? `${ctx.subject}${ctx.topic ? ` — ${ctx.topic}` : ''} · ` : ''}${streak > 0 ? `${streak}-day streak` : 'Session recorded'}`,
      })
    }
  }, [now, endsAt, phase, paused, completePhase, context, focusMin, mode, recordSession, setTaskStatus, updateTask, tasks, sessions])

  const remainMs = endsAt != null && !paused ? Math.max(0, endsAt - now) : null
  const totalMs = phase === 'break' ? Math.max(breakMin, cycle % 4 === 0 ? 15 : breakMin) * 60_000 : focusMin * 60_000
  const displayMs = paused ? (pausedRemainMs ?? 0) : (remainMs ?? 0)
  const ringPct = totalMs > 0 ? Math.max(0, Math.min(100, (displayMs / totalMs) * 100)) : 0

  const sc = subjectColor(context?.subject ?? quickSubject)

  /* ── The running focus screen (§32: almost empty) ── */
  if (phase !== 'idle') {
    return (
      <div className="mx-auto max-w-md">
        <GlassCard hover={false} className={cn('on-card overflow-hidden p-0', phase === 'focus' && 'border-violet-500/20')}>
          <div className={cn('px-5 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.16em]', phase === 'focus' ? 'bg-violet-500/[0.07] text-violet-600 dark:text-violet-400' : 'bg-amber-500/[0.07] text-amber-600 dark:text-amber-400')}>
            {phase === 'focus' ? 'Focus' : paused ? 'Break · paused' : 'Break'}
            <span className="ml-2 font-semibold normal-case tracking-normal opacity-70">
              {phase === 'focus' ? `Block ${cycle + 1}` : `after block ${cycle}`}
            </span>
          </div>
          <div className="flex flex-col items-center gap-5 px-6 py-8">
            {/* The clock */}
            <div className="relative flex h-44 w-44 items-center justify-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
                <circle cx="50" cy="50" r="46" fill="none" strokeWidth="4" className="stroke-muted" />
                <circle
                  cx="50" cy="50" r="46" fill="none" strokeWidth="4" strokeLinecap="round"
                  className={cn('transition-[stroke-dashoffset] duration-500', phase === 'focus' ? 'stroke-violet-500' : 'stroke-amber-500')}
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={2 * Math.PI * 46 * (1 - ringPct / 100)}
                />
              </svg>
              <div className="text-center">
                <p className={cn('text-4xl font-bold tabular-nums tracking-tight', phase === 'focus' ? 'text-foreground' : 'text-amber-600 dark:text-amber-400')}>
                  {fmtClock(displayMs)}
                </p>
                {context && phase === 'focus' && (
                  <p className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} aria-hidden />
                    <span className="max-w-32 truncate">{context.topic ?? context.subject}</span>
                  </p>
                )}
              </div>
            </div>

            {phase === 'focus' ? (
              <p className="text-center text-xs text-muted-foreground">
                {context?.title ? context.title : 'Quick session'} · {fmtMin(focusMin)}
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-center text-xs text-muted-foreground">
                <Coffee className="h-3.5 w-3.5 text-amber-500" aria-hidden /> Stretch, sip water, look far away.
              </p>
            )}

            {/* Controls — pause / resume / skip / stop (§29) */}
            <div className="flex items-center gap-2">
              {phase === 'focus' && endsAt == null && !paused && (
                <Button size="default" className="gap-1.5" onClick={beginNext}>
                  <Play className="h-4 w-4" aria-hidden /> Begin block {cycle + 1}
                </Button>
              )}
              {phase === 'focus' && !paused && endsAt != null && (
                <Button variant="outline" size="icon" className="h-10 w-10" onClick={pause} aria-label="Pause">
                  <Pause className="h-4 w-4" aria-hidden />
                </Button>
              )}
              {paused && (
                <Button size="default" className="gap-1.5" onClick={resume}>
                  <Play className="h-4 w-4" aria-hidden /> Resume
                </Button>
              )}
              {(endsAt != null || paused) && (
                <Button variant="outline" size="default" className="gap-1.5" onClick={() => { const r = skip(); if (r === 'focus-done') toast.info('Block skipped — not recorded') }} aria-label="Skip to next phase">
                  <SkipForward className="h-4 w-4" aria-hidden /> Skip
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-rose-500" onClick={() => { stop(); toast.info('Focus session ended') }} aria-label="Stop session">
                <Square className="h-4 w-4" aria-hidden />
              </Button>
            </div>

            {/* Quiet cycle dots (auto rhythm visible, not loud) */}
            <div className="flex items-center gap-1.5" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-colors',
                    i < cycle % 4 || (cycle > 0 && cycle % 4 === 0) ? 'bg-violet-500' : i === cycle % 4 && phase === 'focus' ? 'bg-violet-500/50' : 'bg-muted',
                  )}
                />
              ))}
              <span className="ml-1.5 text-[10px] font-medium text-muted-foreground">{cycle} block{cycle === 1 ? '' : 's'} today</span>
            </div>
          </div>
        </GlassCard>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          The timer keeps running while you look around Learning — sessions are recorded automatically.
        </p>
      </div>
    )
  }

  /* ── Configuration screen (§30/§31) ── */
  return (
    <div className="space-y-5">
      <section aria-label="Focus timer setup">
        <SectionLabel hint={`${todayTasks.length} tasks today`}>Focus timer</SectionLabel>
        <GlassCard hover={false} className="on-card p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
            {/* WHAT are you studying? (§31) */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">What are you studying?</p>
              <div className="mt-2.5 space-y-2">
                {todayTasks.slice(0, 4).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setContext({ subject: t.subject, topic: t.topic, taskId: t.id, title: t.title })}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      context?.taskId === t.id ? 'border-primary/50 bg-primary/[0.06]' : 'border-border hover:border-primary/30',
                    )}
                  >
                    <span className={cn('h-2 w-2 shrink-0 rounded-full', subjectColor(t.subject).dot)} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-foreground">{t.title}</span>
                      <span className="block truncate text-[10px] text-muted-foreground">{t.subject}{t.topic ? ` · ${t.topic}` : ''} · {fmtMin(t.durationMin)}</span>
                    </span>
                    {context?.taskId === t.id && <Target className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />}
                  </button>
                ))}
                <div className={cn(
                  'flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors',
                  context && !context.taskId ? 'border-primary/50 bg-primary/[0.06]' : 'border-border',
                )}>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40" aria-hidden>
                    <Zap className="h-3 w-3 text-muted-foreground" />
                  </span>
                  <Select value={quickSubject} onValueChange={(v) => { setQuickSubject(v); setContext({ subject: v }) }}>
                    <SelectTrigger className="h-8 flex-1 border-0 bg-transparent px-1 text-xs shadow-none focus:ring-0" aria-label="Quick session subject">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="shrink-0 text-[10px] font-medium text-muted-foreground">quick session</span>
                </div>
              </div>
            </div>

            {/* HOW LONG? (§30) */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Session length</p>
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                {(Object.entries(MODE_PRESETS) as [keyof typeof MODE_PRESETS, number][]).map(([m, min]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => configure({ mode: m, focusMin: min, breakMin: m === 'focus60' ? 10 : 5, autoStart })}
                    className={cn(
                      'flex min-h-16 flex-col items-center justify-center rounded-xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      mode === m ? 'border-primary/50 bg-primary/[0.07] text-primary' : 'border-border text-foreground/80 hover:border-primary/30',
                    )}
                    aria-pressed={mode === m}
                  >
                    <span className="text-lg font-bold tabular-nums">{min}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide">min</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => configure({ mode: 'custom', focusMin: customMin, breakMin: 5, autoStart })}
                  className={cn(
                    'flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border px-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    mode === 'custom' ? 'border-primary/50 bg-primary/[0.07]' : 'border-border hover:border-primary/30',
                  )}
                  aria-pressed={mode === 'custom'}
                >
                  {mode === 'custom' ? (
                    <span className="text-lg font-bold tabular-nums">{customMin}</span>
                  ) : (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">custom</span>
                  )}
                </button>
              </div>
              {mode === 'custom' && (
                <div className="mt-2.5">
                  <input
                    type="range"
                    min={10}
                    max={90}
                    step={5}
                    value={customMin}
                    onChange={(e) => { const v = Number(e.target.value); setCustomMin(v); configure({ mode: 'custom', focusMin: v, breakMin: 5, autoStart }) }}
                    className="w-full accent-primary"
                    aria-label="Custom focus minutes"
                  />
                  <p className="mt-1 text-center text-[10px] font-semibold tabular-nums text-muted-foreground">{customMin} minutes</p>
                </div>
              )}
              <label className="mt-3.5 flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2">
                <input
                  type="checkbox"
                  checked={autoStart}
                  onChange={(e) => configure({ mode, focusMin, breakMin, autoStart: e.target.checked })}
                  className="h-3.5 w-3.5 accent-primary"
                />
                <span className="text-[11px] font-medium text-foreground/80">Pomodoro rhythm — auto-start breaks &amp; next block</span>
              </label>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                Short break {breakMin} min · long break 15 min after every 4th block.
              </p>
              <Button
                className="mt-3.5 w-full gap-1.5"
                size="lg"
                onClick={() => { if (!context) setContext({ subject: quickSubject }); start() }}
              >
                <Play className="h-4 w-4" aria-hidden /> Start focus — {fmtMin(focusMin)}
              </Button>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  )
}
