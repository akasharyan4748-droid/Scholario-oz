'use client'

/**
 * learning/planner/timer-runtime — the focus timer's LIVE runtime.
 *
 * A tiny NON-persisted store so the timer SURVIVES section switches (the
 * student can check the Hub mid-session and the clock keeps running).
 * Pure runtime: phase, endsAt, pause bookkeeping, cycle position. When a
 * focus phase completes, the component records the study session in the
 * canonical learning store (§31/§33 — the persisted trail).
 */

import { create } from 'zustand'
import type { FocusMode } from '@/lib/store/learning-types'

export type TimerPhase = 'idle' | 'focus' | 'break'

export interface TimerContext {
  subject: string
  topic?: string
  taskId?: string
  title?: string
}

interface TimerRuntimeState {
  phase: TimerPhase
  mode: FocusMode
  /** Focus duration of the current cycle (minutes). */
  focusMin: number
  breakMin: number
  /** Cycle position: completed focus sessions this sitting (0–4+). */
  cycle: number
  /** Whether breaks auto-start (pomodoro rhythm). */
  autoStart: boolean
  context: TimerContext | null
  /** Wall-clock end of the current phase (null while idle/paused). */
  endsAt: number | null
  /** Remaining ms while paused. */
  pausedRemainMs: number | null
  paused: boolean
  /** Total focused ms logged this sitting (for the session record). */
  focusedMs: number

  configure: (input: { mode: FocusMode; focusMin: number; breakMin: number; autoStart: boolean }) => void
  setContext: (ctx: TimerContext | null) => void
  start: () => void
  pause: () => void
  resume: () => void
  /** End the current phase immediately (skip to what is next). */
  skip: () => 'focus-done' | 'break-done' | 'stopped'
  stop: () => void
  /** Called by the ticking component when a phase's clock reaches zero. */
  completePhase: () => 'focus-done' | 'break-done' | 'stopped'
  /** Start the READY-but-not-running next focus block. */
  beginNext: () => void
}

export const MODE_PRESETS: Record<Exclude<FocusMode, 'custom'>, number> = {
  focus25: 25,
  focus45: 45,
  focus60: 60,
}

export const useTimerRuntime = create<TimerRuntimeState>()((set, get) => ({
  phase: 'idle',
  mode: 'focus25',
  focusMin: 25,
  breakMin: 5,
  cycle: 0,
  autoStart: true,
  context: null,
  endsAt: null,
  pausedRemainMs: null,
  paused: false,
  focusedMs: 0,

  configure: ({ mode, focusMin, breakMin, autoStart }) =>
    set((s) =>
      s.phase === 'idle'
        ? { mode, focusMin, breakMin, autoStart }
        : s, // never mutate a running timer's length
    ),

  setContext: (ctx) => set({ context: ctx }),

  start: () =>
    set((s) => {
      if (s.phase !== 'idle') return s
      return {
        phase: 'focus',
        endsAt: Date.now() + s.focusMin * 60_000,
        paused: false,
        pausedRemainMs: null,
        cycle: 0,
        focusedMs: 0,
      }
    }),

  pause: () =>
    set((s) => {
      if (s.phase === 'idle' || s.paused || s.endsAt == null) return s
      return { paused: true, pausedRemainMs: s.endsAt - Date.now(), endsAt: null }
    }),

  resume: () =>
    set((s) => {
      if (s.phase === 'idle' || !s.paused || s.pausedRemainMs == null) return s
      return { paused: false, endsAt: Date.now() + s.pausedRemainMs, pausedRemainMs: null }
    }),

  skip: () => {
    const s = get()
    if (s.phase === 'focus') return s.completePhase()
    if (s.phase === 'break') return get().completePhase()
    return 'stopped'
  },

  stop: () =>
    set({
      phase: 'idle',
      endsAt: null,
      pausedRemainMs: null,
      paused: false,
      context: null,
    }),

  completePhase: () => {
    const s = get()
    if (s.phase === 'focus') {
      const focusedMs = s.focusedMs + s.focusMin * 60_000
      const nextCycle = s.cycle + 1
      // Long break after every 4th focus block (classic pomodoro rhythm).
      const isLong = nextCycle % 4 === 0
      const breakMin = isLong ? Math.max(s.breakMin, 15) : s.breakMin
      // The break ALWAYS ticks (auto-start only governs the NEXT focus).
      set({ phase: 'break', cycle: nextCycle, focusedMs, endsAt: Date.now() + breakMin * 60_000, paused: false, pausedRemainMs: null })
      return 'focus-done'
    }
    if (s.phase === 'break') {
      if (s.autoStart) {
        set({ phase: 'focus', endsAt: Date.now() + s.focusMin * 60_000, paused: false, pausedRemainMs: null })
      } else {
        // Next focus READY but not running — the UI offers "Begin block".
        set({ phase: 'focus', endsAt: null, paused: false, pausedRemainMs: null })
      }
      return 'break-done'
    }
    return 'stopped'
  },

  /** Begin the next focus block after an auto-start=false rhythm. */
  beginNext: () =>
    set((s) =>
      s.phase === 'focus' && s.endsAt == null
        ? { endsAt: Date.now() + s.focusMin * 60_000, paused: false, pausedRemainMs: null }
        : s,
    ),
}))

/** mm:ss for the display. */
export function fmtClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
