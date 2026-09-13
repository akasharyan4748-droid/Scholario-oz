'use client'

/**
 * focus-store — the Study Planner's FOCUS TIMER state (spec §29–§33).
 *
 * ARCHITECTURE (the hard requirement):
 *   The parent ModuleTabPanel unmounts inactive tabs, so the timer CANNOT
 *   live in component state. It lives here as a NON-persisted zustand
 *   store — module-level, outside React — and survives every tab switch
 *   (planner sub-tabs AND the Learning module tabs). It is deliberately
 *   NOT persisted: a page reload ends the session honestly rather than
 *   resurrecting a half-finished timer that "studied" while closed.
 *
 * INTERVAL OWNERSHIP — exactly ONE interval, ever:
 *   The interval is owned by THIS module (not by any component), so there
 *   can never be one interval per render. `ensureTicker()` is idempotent;
 *   `stopTicker()` clears it on pause / idle. A single 1000ms tick drives
 *   `tick()`, which advances elapsed seconds ONLY while unpaused — paused
 *   time never counts as study time.
 *
 * DOUBLE-RECORD GUARD:
 *   `recorded` flips to true in the SAME `set()` that transitions the
 *   phase away from 'focus', and every recording path re-checks
 *   `phase === 'focus' && !recorded` first. JS is single-threaded and
 *   zustand's set is synchronous, so a focus session can be recorded
 *   exactly once — whether it ends by completing, finishing early, or
 *   stopping with confirmation.
 *
 * HONESTY (§61): on completion / finish-early / stop with ≥1 min elapsed,
 * the session is written to the canonical student-learning-store via
 * recordSession({ mode: 'focus-timer' }) and a linked 'not-started' task
 * moves to 'in-progress' (§31). Under a minute → nothing recorded, and
 * the toast says so.
 */

import { create } from 'zustand'
import { toast } from 'sonner'
import {
  dateKeyOf,
  useStudentLearningStore,
  type StudySession,
} from '@/lib/store/student-learning-store'
import { BREAK_MIN, todayKey } from './shared'

export type FocusPhase = 'idle' | 'focus' | 'break'
export type FocusMode = 'preset-25' | 'preset-45' | 'preset-60' | 'custom'

/** What the timer is about — a planner task, a bare subject, or a quick session. */
export interface FocusContext {
  kind: 'task' | 'subject' | 'quick'
  taskId?: string
  subject?: string
  topic?: string
  /** Task title (task contexts) or optional quick-session label. */
  title?: string
}

interface FocusState {
  phase: FocusPhase
  mode: FocusMode
  plannedMinutes: number
  remainingSec: number
  /** Focus seconds actually counted (paused seconds excluded). */
  elapsedSec: number
  paused: boolean
  context: FocusContext | null
  startedAtISO: string | null
  /** True once this focus session's minutes reached the learning store. */
  recorded: boolean

  startFocus: (plannedMinutes: number, context?: FocusContext) => void
  pause: () => void
  resume: () => void
  /** Finish now — records elapsed minutes and moves into the break. */
  finishEarly: () => void
  /** Abandon the session — records elapsed (if ≥1 min) and returns to idle. */
  stop: () => void
  /** Leave the break early, back to setup. */
  skipBreak: () => void
  /** One ticker second. Internal — called only by the module-owned interval. */
  tick: () => void
}

function modeFor(minutes: number): FocusMode {
  if (minutes === 25) return 'preset-25'
  if (minutes === 45) return 'preset-45'
  if (minutes === 60) return 'preset-60'
  return 'custom'
}

// ── The one and only interval (module-owned) ───────────────────────────

let ticker: ReturnType<typeof setInterval> | null = null

function ensureTicker() {
  if (ticker !== null || typeof window === 'undefined') return
  ticker = setInterval(() => {
    const s = useFocusStore.getState()
    if (!s.paused && (s.phase === 'focus' || s.phase === 'break')) s.tick()
  }, 1000)
}

function stopTicker() {
  if (ticker !== null) {
    clearInterval(ticker)
    ticker = null
  }
}

// ── Session recording (writes the canonical learning store) ───────────

function contextDescr(c: FocusContext | null): string {
  if (!c) return ''
  if (c.kind === 'task') return c.title ?? 'Study task'
  if (c.kind === 'subject') return [c.subject, c.topic].filter(Boolean).join(' · ')
  return c.title ?? 'Quick session'
}

/**
 * Records one honest focus session. Returns the minutes recorded.
 * Caller MUST hold the `phase === 'focus' && !recorded` guard.
 */
function recordFocusSession(context: FocusContext | null, minutes: number): number {
  const learning = useStudentLearningStore.getState()
  learning.recordSession({
    // Quick sessions carry no subject — recorded as a general session.
    subject: context?.subject || 'General study',
    topic: context?.topic,
    taskId: context?.taskId,
    minutes,
    mode: 'focus-timer',
  })
  // §31 — a linked task that hasn't started yet is now genuinely in progress.
  if (context?.taskId) {
    const task = learning.tasks.find((t) => t.id === context.taskId)
    if (task && task.status === 'not-started') learning.setTaskStatus(context.taskId, 'in-progress')
  }
  const descr = contextDescr(context)
  toast.success(`Focus session saved — ${minutes} min`, descr ? { description: descr } : undefined)
  return minutes
}

/** Focus sessions recorded today (mode 'focus-timer') — derived, never stored. */
export function focusSessionsToday(sessions: StudySession[]): number {
  const key = todayKey()
  return sessions.filter((s) => s.mode === 'focus-timer' && dateKeyOf(s.endedAt) === key).length
}

// ── The store ──────────────────────────────────────────────────────────

const IDLE = {
  phase: 'idle' as FocusPhase,
  mode: 'preset-25' as FocusMode,
  plannedMinutes: 0,
  remainingSec: 0,
  elapsedSec: 0,
  paused: false,
  context: null,
  startedAtISO: null,
  recorded: false,
}

export const useFocusStore = create<FocusState>()((set, get) => ({
  ...IDLE,

  startFocus: (plannedMinutes, context) => {
    // Settle any in-flight session honestly before starting a new one —
    // its elapsed minutes are never silently discarded (§33/§61).
    const prev = get()
    if (prev.phase === 'focus' && !prev.recorded) {
      const prevMin = Math.round(prev.elapsedSec / 60)
      if (prevMin >= 1) recordFocusSession(prev.context, prevMin)
    }
    const minutes = Math.max(1, Math.round(plannedMinutes))
    set({
      phase: 'focus',
      mode: modeFor(minutes),
      plannedMinutes: minutes,
      remainingSec: minutes * 60,
      elapsedSec: 0,
      paused: false,
      context: context ?? { kind: 'quick' },
      startedAtISO: new Date().toISOString(),
      recorded: false,
    })
    ensureTicker()
  },

  pause: () => {
    const s = get()
    if (s.paused || s.phase === 'idle') return
    set({ paused: true })
    stopTicker()
  },

  resume: () => {
    const s = get()
    if (!s.paused || s.phase === 'idle') return
    set({ paused: false })
    ensureTicker()
  },

  finishEarly: () => {
    const s = get()
    if (s.phase !== 'focus' || s.recorded) return
    const minutes = Math.round(s.elapsedSec / 60)
    if (minutes >= 1) recordFocusSession(s.context, minutes)
    else toast.info('Focus session ended', { description: 'Under a minute — nothing recorded.' })
    // Atomically leave the focus phase → a second call can never re-record.
    set({ phase: 'break', remainingSec: BREAK_MIN * 60, paused: false, recorded: true })
    ensureTicker()
  },

  stop: () => {
    const s = get()
    if (s.phase === 'focus' && !s.recorded) {
      const minutes = Math.round(s.elapsedSec / 60)
      if (minutes >= 1) recordFocusSession(s.context, minutes)
      else toast.info('Focus session stopped', { description: 'Under a minute — nothing recorded.' })
    }
    stopTicker()
    set({ ...IDLE })
  },

  skipBreak: () => {
    stopTicker()
    set({ ...IDLE })
  },

  tick: () => {
    const s = get()
    if (s.paused) return
    if (s.phase === 'focus') {
      if (s.recorded) return
      const elapsed = s.elapsedSec + 1
      const remaining = Math.max(0, s.plannedMinutes * 60 - elapsed)
      if (remaining === 0) {
        // Natural completion — the full planned session was studied.
        const minutes = Math.max(1, Math.round(elapsed / 60))
        recordFocusSession(s.context, minutes)
        set({
          phase: 'break',
          remainingSec: BREAK_MIN * 60,
          elapsedSec: elapsed,
          paused: false,
          recorded: true,
        })
      } else {
        set({ elapsedSec: elapsed, remainingSec: remaining })
      }
    } else if (s.phase === 'break') {
      const remaining = Math.max(0, s.remainingSec - 1)
      if (remaining === 0) {
        // Break over → back to setup (context kept only inside the break
        // screen's own state; idle setup re-derives everything).
        stopTicker()
        set({ phase: 'idle', remainingSec: 0, paused: false })
      } else {
        set({ remainingSec: remaining })
      }
    }
  },
}))
