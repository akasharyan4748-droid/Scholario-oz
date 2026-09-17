'use client'

/**
 * Exam Proctoring (EP-6) — the module's data hooks.
 *
 * One GET feeds the duty list workspace, one GET feeds a single duty's
 * full workspace, and two POSTs write attendance / incidents. All go
 * through the envelope client with { cache: 'no-store',
 * credentials: 'same-origin' } — the httpOnly erp_session cookie is the
 * ONLY auth source, the server resolves teacher / school / scope, and
 * 401 → shared signOut() exactly once (house pattern, Class Attendance).
 *
 * After every successful save the caller refetches the duty payload so
 * drafts, counts and incident lists always reflect server truth.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { signOut } from '@/lib/signout'
import type {
  DutyDetail,
  ProctoringPayload,
  SaveAttendanceResult,
  SaveIncidentResult,
} from './shared'

// ─── envelope client ({ ok, data } / { ok: false, error }) ───────────

interface Envelope {
  ok?: unknown
  data?: unknown
  error?: unknown
}

export async function proctoringFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    cache: 'no-store',
    credentials: 'same-origin',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  })
  if (res.status === 401) {
    // A dead server session cannot be retried — one graceful re-auth.
    void signOut()
    throw new Error('Your session has expired. Please sign in again.')
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = (await res.json()) as Envelope
      if (body && typeof body.error === 'string') message = body.error
    } catch {
      /* non-JSON error body — keep the concise fallback */
    }
    throw new Error(message)
  }
  const body = (await res.json().catch(() => null)) as Envelope | null
  if (!body || typeof body !== 'object' || body.ok !== true || !('data' in body)) {
    throw new Error(
      body && typeof body.error === 'string' ? body.error : 'Unexpected response from the server.',
    )
  }
  return body.data as T
}

// ─── module payload (duties + stats + authorized schedule) ────────────

export interface ProctoringModuleState {
  data: ProctoringPayload | null
  error: string | null
  reload: () => void
}

export function useProctoringModule(): ProctoringModuleState {
  const [data, setData] = useState<ProctoringPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setError(null)
    proctoringFetch<ProctoringPayload>('/api/teacher/proctoring')
      .then((payload) => {
        if (!cancelled) setData(payload)
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load exam duties')
        }
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, error, reload }
}

// ─── one duty's full workspace ────────────────────────────────────────

export interface DutyDetailState {
  detail: DutyDetail | null
  /** refresh in place (after a save) — the panel stays visible, dimmed. */
  refreshing: boolean
  error: string | null
  reload: () => void
}

export function useDutyDetail(dutyId: string | null): DutyDetailState {
  const [detail, setDetail] = useState<DutyDetail | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  /** The duty currently on screen — decides skeleton vs quiet refresh dim. */
  const loadedIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (dutyId == null) {
      setDetail(null)
      setError(null)
      setRefreshing(false)
      loadedIdRef.current = null
      return
    }
    let cancelled = false
    setError(null)
    // First load of a duty → clear screen + skeleton. A reload of the
    // SAME duty (after a save) keeps the payload visible with a quiet dim.
    const isFirstLoad = loadedIdRef.current !== dutyId
    if (isFirstLoad) setDetail(null)
    else setRefreshing(true)
    loadedIdRef.current = dutyId
    proctoringFetch<DutyDetail>(
      `/api/teacher/proctoring/duty?id=${encodeURIComponent(dutyId)}`,
    )
      .then((payload) => {
        if (!cancelled) setDetail(payload)
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          if (isFirstLoad) setDetail(null)
          setError(e instanceof Error ? e.message : 'The duty could not load.')
        }
      })
      .finally(() => {
        if (!cancelled) setRefreshing(false)
      })
    return () => {
      cancelled = true
    }
  }, [dutyId, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { detail, refreshing, error, reload }
}

// ─── mutations (server re-validates everything) ──────────────────────

/** Save the invigilator's attendance for one of her duties. */
export async function saveDutyAttendance(
  scheduleItemId: string,
  entries: { studentId: string; status: 'PRESENT' | 'ABSENT' | 'LATE' }[],
): Promise<SaveAttendanceResult> {
  return proctoringFetch<SaveAttendanceResult>('/api/teacher/proctoring/attendance', {
    method: 'POST',
    body: JSON.stringify({ scheduleItemId, entries }),
  })
}

/** Raise one professional incident record during a duty. */
export async function reportDutyIncident(payload: {
  scheduleItemId: string
  studentId?: string | null
  incidentType: 'LATE_ARRIVAL' | 'UNFAIR_MEANS' | 'MEDICAL_ISSUE' | 'PAPER_ISSUE' | 'OTHER'
  description: string
}): Promise<SaveIncidentResult> {
  return proctoringFetch<SaveIncidentResult>('/api/teacher/proctoring/incident', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
