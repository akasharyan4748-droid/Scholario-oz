'use client'

/**
 * FocusTab — the FOCUS TIMER (spec §29–§32), consuming the module-level
 * focus store so the timer SURVIVES every tab switch.
 *
 *   · SETUP  (idle)   — preset cards Focus 25 / 45 / 60 + Custom (5–120),
 *                        "What are you studying?" (today's open tasks,
 *                        subjects, or a quick session) and [Start Focus].
 *   · RUNNING (focus) — distraction-free: huge tabular-nums countdown
 *                        (role=timer, aria-live="off" so it never nags),
 *                        context line, Pause/Resume, Finish (records the
 *                        real elapsed minutes), Stop (confirm dialog that
 *                        records honestly if ≥1 min).
 *   · BREAK            — 5-minute countdown, [Skip break] back to setup,
 *                        [Start next focus] repeats the last context.
 *
 * No dashboards around the running timer (§32) — one quiet card. Phase
 * changes are announced politely via a screen-reader-only live region.
 */

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  Coffee,
  Pause,
  Play,
  SkipForward,
  Square,
  Timer as TimerIcon,
  X,
  Zap,
} from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '../../shell/page-header'
import { subjectColor } from '../timetable/subject-colors'
import { useDismissOnEscape } from '@/hooks/use-dismiss-on-escape'
import { cn } from '@/lib/utils'
import { tasksDueOn, useStudentLearningStore, type PlannerTask } from '@/lib/store/student-learning-store'
import { useFocusStore, type FocusContext } from './focus-store'
import { todayKey } from './shared'

const PRESETS: Array<{ minutes: number; label: string }> = [
  { minutes: 25, label: 'Focus 25' },
  { minutes: 45, label: 'Focus 45' },
  { minutes: 60, label: 'Focus 60' },
]

const CUSTOM_MIN = 5
const CUSTOM_MAX = 120

type Selection = 'preset-25' | 'preset-45' | 'preset-60' | 'custom' | null

function selectionFor(minutes: number): Selection {
  if (minutes === 25) return 'preset-25'
  if (minutes === 45) return 'preset-45'
  if (minutes === 60) return 'preset-60'
  return 'custom'
}

/** mm:ss (or h:mm:ss beyond an hour). */
function clockOf(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function FocusTab() {
  const phase = useFocusStore((s) => s.phase)

  // Polite phase announcements (the countdown itself stays aria-live="off").
  const [announce, setAnnounce] = useState('')
  useEffect(() => {
    if (phase === 'focus') setAnnounce('Focus session started.')
    else if (phase === 'break') setAnnounce('Focus complete. Time for a short break.')
    else setAnnounce('Timer ready.')
  }, [phase])

  return (
    <div className="space-y-5">
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      {phase === 'focus' ? <RunningView /> : phase === 'break' ? <BreakView /> : <SetupView />}
    </div>
  )
}

// ─── SETUP (§30/§31) ──────────────────────────────────────────────────

function SetupView() {
  const tasks = useStudentLearningStore((s) => s.tasks)
  const resources = useStudentLearningStore((s) => s.resources)
  const startFocus = useFocusStore((s) => s.startFocus)

  const [selection, setSelection] = useState<Selection>(null)
  const [customText, setCustomText] = useState('')
  const [ctx, setCtx] = useState<FocusContext | null>(null)

  const todayTasks = useMemo(() => tasksDueOn(tasks, todayKey()), [tasks])
  const subjects = useMemo(
    () => Array.from(new Set([...resources.map((r) => r.subject), ...tasks.map((t) => t.subject)])).filter(Boolean),
    [resources, tasks],
  )

  const customMinutes = Number(customText)
  const customValid =
    customText.trim() !== '' && Number.isFinite(customMinutes) && customMinutes >= CUSTOM_MIN && customMinutes <= CUSTOM_MAX
  const minutes =
    selection === 'preset-25' ? 25 : selection === 'preset-45' ? 45 : selection === 'preset-60' ? 60 : selection === 'custom' && customValid ? Math.round(customMinutes) : null

  const selectPreset = (m: number) => {
    setSelection(selectionFor(m))
  }

  const pickTask = (t: PlannerTask) => {
    const next: FocusContext = { kind: 'task', taskId: t.id, subject: t.subject, topic: t.topic, title: t.title }
    setCtx(ctx && ctx.kind === 'task' && ctx.taskId === t.id ? null : next)
    // Choosing a task helpfully loads ITS planned duration (§31).
    setSelection(selectionFor(t.durationMin))
    if (selectionFor(t.durationMin) === 'custom') setCustomText(String(t.durationMin))
  }

  const start = () => {
    if (minutes == null) return
    startFocus(minutes, ctx ?? undefined)
  }

  return (
    <GlassCard hover={false} className="on-card p-4 sm:p-6">
      {/* ── Focus length (§30) ── */}
      <SectionLabel hint={minutes ? `${minutes} min selected` : 'pick a length'}>Focus length</SectionLabel>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PRESETS.map((p) => {
          const active = selection === selectionFor(p.minutes)
          return (
            <button
              key={p.minutes}
              type="button"
              onClick={() => selectPreset(p.minutes)}
              aria-pressed={active}
              className={cn(
                'flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 sm:min-h-[4.5rem]',
                active
                  ? 'border-violet-500/50 bg-violet-500/10 shadow-xs'
                  : 'border-border bg-card/40 hover:bg-accent/40',
              )}
            >
              <span
                className={cn(
                  'text-xl font-bold tabular-nums',
                  active ? 'text-violet-700 dark:text-violet-400' : 'text-foreground',
                )}
              >
                {p.minutes}
              </span>
              <span className={cn('text-[10px] font-medium', active ? 'text-violet-700 dark:text-violet-400' : 'text-muted-foreground')}>
                {p.label.split(' ')[0]} · min
              </span>
            </button>
          )
        })}

        {/* Custom (5–120 min) */}
        <button
          type="button"
          onClick={() => setSelection('custom')}
          aria-pressed={selection === 'custom'}
          className={cn(
            'flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 sm:min-h-[4.5rem]',
            selection === 'custom'
              ? 'border-violet-500/50 bg-violet-500/10 shadow-xs'
              : 'border-dashed border-border bg-card/40 hover:bg-accent/40',
          )}
        >
          <input
            type="text"
            inputMode="numeric"
            value={customText}
            onChange={(e) => {
              setSelection('custom')
              setCustomText(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))
            }}
            onFocus={() => setSelection('custom')}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Custom focus minutes, ${CUSTOM_MIN} to ${CUSTOM_MAX}`}
            placeholder="30"
            className={cn(
              'w-16 rounded-lg border-0 bg-transparent text-center text-xl font-bold tabular-nums outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0',
              selection === 'custom' ? 'text-violet-700 dark:text-violet-400' : 'text-foreground',
            )}
          />
          <span className={cn('text-[10px] font-medium', selection === 'custom' ? 'text-violet-700 dark:text-violet-400' : 'text-muted-foreground')}>
            Custom · {CUSTOM_MIN}–{CUSTOM_MAX} min
          </span>
        </button>
      </div>
      {selection === 'custom' && customText !== '' && !customValid && (
        <p className="mt-2 text-[11px] font-medium text-amber-600 dark:text-amber-500">
          Enter {CUSTOM_MIN}–{CUSTOM_MAX} minutes.
        </p>
      )}

      {/* ── Timer context (§31) ── */}
      <div className="mt-6">
        <SectionLabel hint="optional">What are you studying?</SectionLabel>

        <div className="mt-3 space-y-2.5">
          {todayTasks.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Today&apos;s tasks
              </p>
              <div className="flex flex-wrap gap-1.5">
                {todayTasks.map((t) => {
                  const active = ctx?.kind === 'task' && ctx.taskId === t.id
                  const sc = t.subject ? subjectColor(t.subject) : null
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => pickTask(t)}
                      aria-pressed={active}
                      className={cn(
                        'inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:min-h-9',
                        active
                          ? 'bg-violet-600 text-white shadow-xs'
                          : 'bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                    >
                      {sc && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', active ? 'bg-white' : sc.dot)} aria-hidden />}
                      <span className="truncate">{t.title}</span>
                      <span className="shrink-0 tabular-nums opacity-70">{t.durationMin}m</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Subjects</p>
            <div className="flex flex-wrap gap-1.5">
              {subjects.map((s) => {
                const active = ctx?.kind === 'subject' && ctx.subject === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setCtx(active ? null : { kind: 'subject', subject: s })}
                    aria-pressed={active}
                    className={cn(
                      'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:min-h-9',
                      active
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-white' : subjectColor(s).dot)} aria-hidden />
                    {s}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => setCtx(ctx?.kind === 'quick' ? null : { kind: 'quick' })}
                aria-pressed={ctx?.kind === 'quick'}
                className={cn(
                  'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:min-h-9',
                  ctx?.kind === 'quick'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Zap className="h-3 w-3" aria-hidden />
                Quick session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Start (§62 — disabled until a duration is chosen, never fake) ── */}
      <div className="mt-6 border-t border-border/60 pt-4">
        <button
          type="button"
          onClick={start}
          disabled={minutes == null}
          aria-disabled={minutes == null}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-auto"
        >
          <Play className="h-4 w-4" aria-hidden />
          {minutes == null ? 'Choose a focus length' : `Start Focus · ${minutes} min`}
        </button>
        {ctx?.kind === 'task' && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Linked to today&apos;s plan — finishing moves the task to in progress.
          </p>
        )}
      </div>
    </GlassCard>
  )
}

// ─── RUNNING (§32 focus mode) ──────────────────────────────────────────

function contextLine(ctx: FocusContext | null): { eyebrow: string; title: string } {
  if (!ctx || ctx.kind === 'quick') {
    return { eyebrow: 'Quick session', title: ctx?.title || 'Focused study' }
  }
  if (ctx.kind === 'task') {
    return {
      eyebrow: 'From your plan',
      title: ctx.title || 'Study task',
    }
  }
  return {
    eyebrow: 'Subject session',
    title: [ctx.subject, ctx.topic].filter(Boolean).join(' · ') || 'Focused study',
  }
}

function RunningView() {
  const remainingSec = useFocusStore((s) => s.remainingSec)
  const plannedMinutes = useFocusStore((s) => s.plannedMinutes)
  const elapsedSec = useFocusStore((s) => s.elapsedSec)
  const paused = useFocusStore((s) => s.paused)
  const context = useFocusStore((s) => s.context)
  const pause = useFocusStore((s) => s.pause)
  const resume = useFocusStore((s) => s.resume)
  const finishEarly = useFocusStore((s) => s.finishEarly)
  const stop = useFocusStore((s) => s.stop)

  const [confirmOpen, setConfirmOpen] = useState(false)
  useDismissOnEscape(() => setConfirmOpen(false), confirmOpen)

  const plannedSec = plannedMinutes * 60
  const pct = plannedSec > 0 ? Math.min(100, Math.round((elapsedSec / plannedSec) * 100)) : 0
  const elapsedMin = Math.floor(elapsedSec / 60)
  const line = contextLine(context)

  return (
    <GlassCard hover={false} className="on-card flex flex-col items-center px-4 py-8 sm:px-8 sm:py-10">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400">
        <TimerIcon className="h-3 w-3" aria-hidden />
        {paused ? 'Paused' : 'Focusing'}
      </span>

      {/* The countdown — role=timer, silent to screen readers while ticking */}
      <p
        role="timer"
        aria-live="off"
        aria-label={`Time remaining ${clockOf(remainingSec)}`}
        className="mt-5 font-display text-5xl font-extrabold tabular-nums tracking-tight text-foreground sm:text-6xl"
      >
        {clockOf(remainingSec)}
      </p>

      <div
        className="mt-4 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Focus progress, ${elapsedMin} of ${plannedMinutes} minutes elapsed`}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-1000', paused ? 'bg-violet-400' : 'bg-violet-600')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-[11px] tabular-nums text-muted-foreground">
        {elapsedMin} of {plannedMinutes} min elapsed
      </p>

      {/* Context line (§31) */}
      <div className="mt-6 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{line.eyebrow}</p>
        <p className="mt-0.5 max-w-xs truncate text-sm font-medium text-foreground">{line.title}</p>
        {context?.subject && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {context.subject}
            {context.topic ? ` · ${context.topic}` : ''}
          </p>
        )}
      </div>

      {/* Controls — Pause/Resume · Finish · Stop */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={paused ? resume : pause}
          className="inline-flex h-12 min-w-32 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
        >
          {paused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button
          type="button"
          onClick={finishEarly}
          className="inline-flex h-12 min-w-32 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:text-emerald-400"
        >
          <Check className="h-4 w-4" aria-hidden />
          Finish
        </button>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl border border-border bg-card/50 px-5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <Square className="h-3.5 w-3.5" aria-hidden />
          Stop
        </button>
      </div>

      <p className="mt-5 text-center text-[11px] text-muted-foreground">
        {paused ? 'Paused time doesn&apos;t count as study time.' : 'Finish records the minutes you actually studied.'}
      </p>

      {/* Stop confirmation — honest about what will be recorded */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Stop focus session"
            onClick={() => setConfirmOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full overflow-hidden rounded-t-2xl border border-border bg-background shadow-premium-lg sm:max-w-sm sm:rounded-2xl"
            >
              <div className="px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold leading-snug">Stop this session?</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {elapsedMin >= 1
                        ? `${elapsedMin} min studied so far will be saved to your study time.`
                        : 'Under a minute studied — nothing will be recorded.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(false)}
                    aria-label="Close stop confirmation"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9 sm:w-9"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-border/60 bg-muted/20 px-4 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card/60 px-4 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9"
                >
                  Keep focusing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmOpen(false)
                    stop()
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-rose-600 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 sm:h-9"
                >
                  Stop session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}

// ─── BREAK (§29 short break) ───────────────────────────────────────────

function BreakView() {
  const remainingSec = useFocusStore((s) => s.remainingSec)
  const plannedMinutes = useFocusStore((s) => s.plannedMinutes)
  const context = useFocusStore((s) => s.context)
  const skipBreak = useFocusStore((s) => s.skipBreak)
  const startFocus = useFocusStore((s) => s.startFocus)

  const line = contextLine(context)

  return (
    <GlassCard hover={false} className="on-card flex flex-col items-center px-4 py-8 sm:px-8 sm:py-10">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
        <Coffee className="h-3 w-3" aria-hidden />
        Break
      </span>

      <p
        role="timer"
        aria-live="off"
        aria-label={`Break time remaining ${clockOf(remainingSec)}`}
        className="mt-5 font-display text-5xl font-extrabold tabular-nums tracking-tight text-foreground sm:text-6xl"
      >
        {clockOf(remainingSec)}
      </p>
      <p className="mt-1.5 text-[11px] text-muted-foreground">A short break before the next focus.</p>

      <div className="mt-6 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Next up</p>
        <p className="mt-0.5 max-w-xs truncate text-sm font-medium text-foreground">{line.title}</p>
        <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">{plannedMinutes} min focus</p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => startFocus(plannedMinutes, context ?? undefined)}
          className="inline-flex h-12 min-w-40 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
        >
          <Play className="h-4 w-4" aria-hidden />
          Start next focus
        </button>
        <button
          type="button"
          onClick={skipBreak}
          className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl border border-border bg-card/50 px-5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <SkipForward className="h-4 w-4" aria-hidden />
          Skip break
        </button>
      </div>
    </GlassCard>
  )
}
