'use client'

/**
 * Dashboard V2 (SD-3) — the single data hook + client-side time helpers.
 *
 * ONE apiFetch to /api/student/dashboard (PHASE 29 — no request waterfall).
 * The hook exposes loading / error / retry; a 401 routes through the
 * shared session-expiry path (apiFetch → signOut) instead of a dead-end.
 *
 * Period states (CURRENT / NEXT / UPCOMING / COMPLETED) are derived on the
 * CLIENT from the student's own device clock — the server supplies the
 * timetable rows, the browser knows "now".
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from '../learning/api'
import type { DashboardClass, DashboardData } from './types'

export interface DashboardState {
  data: DashboardData | null
  loading: boolean
  error: string | null
  reload: () => void
}

export function useStudentDashboard(): DashboardState {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    apiFetch<DashboardData>('/api/student/dashboard')
      .then((d) => { if (!cancelled && mounted.current) setData(d) })
      .catch((e: unknown) => {
        if (cancelled || !mounted.current) return
        setError(e instanceof Error ? e.message : 'Dashboard could not load.')
      })
      .finally(() => { if (!cancelled && mounted.current) setLoading(false) })
    return () => { cancelled = true }
  }, [tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, reload }
}

// ─── Client-side time helpers ────────────────────────────────────────

export type PeriodState = 'completed' | 'current' | 'next' | 'upcoming'

export interface ClassWithState extends DashboardClass {
  state: PeriodState
  /** Minutes from now until the period starts (future) or ends (past). */
  minutesUntil: number | null
}

/** "08:30" → minutes since midnight (null when unparseable). */
function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim())
  if (!m) return null
  const h = Number(m[1]); const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

/** "08:30" → "8:30 AM" (en-IN friendly 12-hour display). */
export function formatTime(hhmm: string): string {
  const mins = toMinutes(hhmm)
  if (mins == null) return hhmm
  const h24 = Math.floor(mins / 60)
  const min = mins % 60
  const ampm = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${String(min).padStart(2, '0')} ${ampm}`
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`
}

/** Today's classes from the server week, with client-clock states. */
export function classesWithState(week: Record<string, DashboardClass[]>, now = new Date()): ClassWithState[] {
  const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()]
  const rows = week[weekday] ?? []
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const firstUpcomingIdx = rows.findIndex((c) => {
    const end = toMinutes(c.endTime)
    return end != null && end > nowMins
  })
  return rows.map((c, i) => {
    const start = toMinutes(c.startTime)
    const end = toMinutes(c.endTime)
    let state: PeriodState = 'upcoming'
    if (start != null && end != null) {
      if (end <= nowMins) state = 'completed'
      else if (start <= nowMins && nowMins < end) state = 'current'
      else if (firstUpcomingIdx >= 0 && i === firstUpcomingIdx) state = 'next'
    }
    const minutesUntil =
      state === 'current' && end != null ? end - nowMins
      : state !== 'completed' && start != null ? start - nowMins
      : null
    return { ...c, state, minutesUntil }
  })
}

/** "Good morning / afternoon / evening" from the device clock. */
export function greeting(now = new Date()): string {
  const h = now.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/** Whole days until an ISO date (negative once passed). */
export function daysUntil(iso: string, now = new Date()): number {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return Number.NaN
  return Math.ceil((t - now.getTime()) / 86_400_000)
}

/** "due today" / "due tomorrow" / "due 18 Sep" — planner-style label. */
export function dueLabel(iso: string | null, now = new Date()): string {
  if (!iso) return ''
  const d = daysUntil(iso, now)
  if (Number.isNaN(d)) return ''
  if (d < 0) return `overdue by ${Math.abs(d)} day${Math.abs(d) === 1 ? '' : 's'}`
  if (d === 0) return 'due today'
  if (d === 1) return 'due tomorrow'
  if (d <= 6) return `due in ${d} days`
  return `due ${new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
}
