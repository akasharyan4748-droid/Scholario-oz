'use client'

/**
 * useTeacherDashboard (TWC-FE-4) — the single data hook for the Teacher
 * Dashboard, mirroring the useStudentDashboard discipline:
 *
 *   • ONE fetch to GET /api/teacher/dashboard ({ ok, data } envelope,
 *     `cache: 'no-store'`, same-origin credentials — the erp_session cookie).
 *   • A 401 routes through the shared signOut() (server revocation + client
 *     reset) instead of a dead-end retry that can never succeed.
 *   • Initial load → loading state (layout-matched skeletons render it).
 *   • Reload failure with data already on screen → the STALE data is KEPT
 *     and only a quiet inline error strip is surfaced — never a full-page
 *     error over a perfectly readable dashboard.
 *
 * Period states (CURRENT / COMPLETED / UPCOMING) are derived on the CLIENT
 * from the teacher's own device clock — the server supplies the timetable
 * rows, the browser knows "now".
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { signOut } from '@/lib/signout'
import type { TeacherDashboardData, TeacherPeriod } from '../types'

// A dead server session cannot be retried — reset auth ONCE, land on login.
let sessionExpiredInFlight = false

function handleExpiredSession(): void {
  if (sessionExpiredInFlight) return
  sessionExpiredInFlight = true
  void signOut().finally(() => {
    window.setTimeout(() => {
      sessionExpiredInFlight = false
    }, 2000)
  })
}

async function dashboardRequest(): Promise<TeacherDashboardData> {
  const r = await fetch('/api/teacher/dashboard', {
    cache: 'no-store',
    credentials: 'same-origin',
  })
  if (r.status === 401) {
    handleExpiredSession()
    throw new Error('Your session has expired. Please sign in again.')
  }
  let json: unknown = null
  try {
    json = await r.json()
  } catch {
    /* non-JSON error body — fall through to the generic message */
  }
  const envelope = json as { ok?: unknown; error?: unknown; data?: TeacherDashboardData } | null
  if (!r.ok || !envelope || envelope.ok !== true) {
    const message =
      envelope && typeof envelope.error === 'string'
        ? envelope.error
        : `Request failed (${r.status})`
    throw new Error(message)
  }
  return envelope.data as TeacherDashboardData
}

export interface TeacherDashboardState {
  data: TeacherDashboardData | null
  /** True only while the FIRST fetch is in flight (no data on screen yet). */
  loading: boolean
  /** Fatal error — no data could be loaded at all (full retry card). */
  error: string | null
  /** A reload failed but stale data is still rendered (quiet strip only). */
  staleError: string | null
  reload: () => void
}

export function useTeacherDashboard(): TeacherDashboardState {
  const [data, setData] = useState<TeacherDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [staleError, setStaleError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const mounted = useRef(true)
  const dataRef = useRef<TeacherDashboardData | null>(null)
  dataRef.current = data

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const hadData = dataRef.current != null
    if (hadData) setStaleError(null)
    setLoading(!hadData)
    dashboardRequest()
      .then((d) => {
        if (cancelled || !mounted.current) return
        setData(d)
        setError(null)
        setStaleError(null)
      })
      .catch((e: unknown) => {
        if (cancelled || !mounted.current) return
        const message = e instanceof Error ? e.message : 'Dashboard could not load.'
        if (hadData) {
          // Keep the stale aggregate on screen — only flag the failed refresh.
          setStaleError(message)
        } else {
          setError(message)
        }
      })
      .finally(() => {
        if (!cancelled && mounted.current) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, staleError, reload }
}

// ─── Client-side time helpers ────────────────────────────────────────

export type PeriodState = 'completed' | 'current' | 'upcoming'

export interface PeriodWithState extends TeacherPeriod {
  state: PeriodState
}

/** "08:30" → minutes since midnight (null when unparseable). */
function toMinutes(hhmm: string | null): number | null {
  if (!hhmm) return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

/** "08:30" → "8:30 AM" (en-IN friendly 12-hour display). */
export function formatTime(hhmm: string | null): string {
  const mins = toMinutes(hhmm)
  if (mins == null) return '—'
  const h24 = Math.floor(mins / 60)
  const min = mins % 60
  const ampm = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${String(min).padStart(2, '0')} ${ampm}`
}

export function formatTimeRange(start: string | null, end: string | null): string {
  if (start == null && end == null) return '—'
  if (end == null) return formatTime(start)
  if (start == null) return formatTime(end)
  return `${formatTime(start)} – ${formatTime(end)}`
}

/** Today's periods with client-clock states (current / completed / upcoming). */
export function periodsWithState(
  periods: TeacherPeriod[],
  now = new Date(),
): PeriodWithState[] {
  const nowMins = now.getHours() * 60 + now.getMinutes()
  return periods.map((p) => {
    const start = toMinutes(p.startTime)
    const end = toMinutes(p.endTime)
    let state: PeriodState = 'upcoming'
    if (start != null && end != null) {
      if (end <= nowMins) state = 'completed'
      else if (start <= nowMins && nowMins < end) state = 'current'
    }
    return { ...p, state }
  })
}

/** "Good morning / afternoon / evening" from the device clock. */
export function greeting(now = new Date()): string {
  const h = now.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/** "just now" / "2h ago" / "Yesterday" / "4 Sep" — notice-board relative date. */
export function relativeTime(iso: string, now = new Date()): string {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const mins = Math.floor((now.getTime() - t) / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
