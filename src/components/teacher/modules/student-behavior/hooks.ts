'use client'

/**
 * Student Behavior — data hooks + API mutations.
 *
 * ONE aggregate fetch (GET /api/teacher/behavior) plus one profile fetch
 * per open student (GET /api/teacher/behavior/student/[id]). Same
 * discipline as the student dashboard data layer
 * (src/components/student/modules/dashboard/data.ts):
 *
 *   · { cache: 'no-store', credentials: 'same-origin' } — the httpOnly
 *     erp_session cookie is the ONLY auth source; ids are never read on
 *     the client, the server resolves teacher / school / scope.
 *   · { ok, data } / { ok: false, error } envelope handling.
 *   · 401 → signOut() exactly once — a dead server session cannot be
 *     retried, the user lands on the login screen instead of a dead end.
 *   · honest error strings + a working retry on every surface.
 *
 * Reloads are QUIET: the first load drives the module skeleton; later
 * reloads keep the current data on screen while refreshing in the
 * background (no skeleton flash after a mutation).
 *
 * Nothing is published to the teacher-hub store — the Communication Hub owns
 * the shared hub state; this module keeps its data to itself.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { signOut } from '@/lib/signout'
import type {
  BehaviorPayload,
  BehaviorRecordItem,
  BehaviorStatus,
  BehaviorType,
  FollowUpItem,
  StudentBehaviorProfile,
} from '@/lib/teacher-hub-types'

// ---------- transport ----------

let reAuthInFlight = false

/** A dead server session cannot be retried — reset auth ONCE, land on login. */
function handleExpiredSession(): void {
  if (reAuthInFlight) return
  reAuthInFlight = true
  void signOut()
    .catch(() => {
      // Even the sign-out path failed (server unreachable) — fall back to a
      // client-only reset so the shell returns to the login screen.
      try {
        window.localStorage.removeItem('scholario-auth')
        window.location.reload()
      } catch {
        /* nothing more we can honestly do here */
      }
    })
    .finally(() => {
      // Allow a future login to go through this path again if needed.
      window.setTimeout(() => {
        reAuthInFlight = false
      }, 2000)
    })
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    cache: 'no-store',
    credentials: 'same-origin',
    headers: init?.body ? { 'Content-Type': 'application/json', ...init?.headers } : init?.headers,
  })
  if (!r.ok) {
    if (r.status === 401) {
      handleExpiredSession()
      throw new Error('Your session has expired. Please sign in again.')
    }
    let message = `Request failed (${r.status})`
    try {
      const j: unknown = await r.json()
      if (j && typeof j === 'object' && typeof (j as { error?: unknown }).error === 'string') {
        message = (j as { error: string }).error
      }
    } catch {
      /* non-JSON error body — keep the concise fallback */
    }
    throw new Error(message)
  }
  const j: unknown = await r.json()
  if (!j || typeof j !== 'object' || (j as { ok?: unknown }).ok !== true || !('data' in j)) {
    throw new Error('Unexpected response from the server.')
  }
  return (j as { data: T }).data
}

// ---------- aggregate: the whole Behavior workspace ----------

export interface BehaviorState {
  data: BehaviorPayload | null
  /** first load only — drives the module skeleton */
  loading: boolean
  /** quiet reloads (after a mutation) — data stays on screen */
  refreshing: boolean
  error: string | null
  reload: () => void
}

export function useBehavior(): BehaviorState {
  const [data, setData] = useState<BehaviorPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const hasData = useRef(false)

  useEffect(() => {
    let cancelled = false
    setError(null)
    if (hasData.current) setRefreshing(true)
    else setLoading(true)
    request<BehaviorPayload>('/api/teacher/behavior')
      .then((d) => {
        hasData.current = true
        if (!cancelled) setData(d)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Behavior records could not load.')
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
          setRefreshing(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, refreshing, error, reload }
}

// ---------- per-student profile ----------

export interface StudentProfileState {
  data: StudentBehaviorProfile | null
  loading: boolean
  error: string | null
  reload: () => void
}

export function useStudentBehaviorProfile(studentId: string | null): StudentProfileState {
  const [data, setData] = useState<StudentBehaviorProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  // A new target always starts from a clean slate (no stale student flash).
  useEffect(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [studentId])

  useEffect(() => {
    if (!studentId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    request<StudentBehaviorProfile>(
      `/api/teacher/behavior/student/${encodeURIComponent(studentId)}`,
    )
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'This profile could not load.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [studentId, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, reload }
}

// ---------- mutations ----------

export interface CreateBehaviorBody {
  studentId: string
  /** yyyy-mm-dd — omitted → server stamps today */
  date?: string
  category: string
  type: BehaviorType
  description: string
  actionTaken?: string
  followUpRequired?: boolean
  /** required when followUpRequired — the server auto-creates the follow-up */
  followUpDate?: string
  /** staff-only note, never rendered on any parent/student surface */
  privateNote?: string
}

export async function createBehaviorRecord(body: CreateBehaviorBody): Promise<BehaviorRecordItem> {
  const { record } = await request<{ record: BehaviorRecordItem }>('/api/teacher/behavior', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return record
}

export interface PatchBehaviorBody {
  status?: BehaviorStatus
  followUpDate?: string | null
  parentNotified?: boolean
}

export async function patchBehaviorRecord(
  id: string,
  body: PatchBehaviorBody,
): Promise<BehaviorRecordItem> {
  const { record } = await request<{ record: BehaviorRecordItem }>(
    `/api/teacher/behavior/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(body) },
  )
  return record
}

/** Mark a behavior follow-up done (shared /api/teacher/follow-ups endpoint). */
export async function completeFollowUp(id: string): Promise<FollowUpItem> {
  const { followUp } = await request<{ followUp: FollowUpItem }>(
    `/api/teacher/follow-ups/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify({ status: 'done' }) },
  )
  return followUp
}
