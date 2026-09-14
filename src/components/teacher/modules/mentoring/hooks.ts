'use client'

/**
 * Student Mentoring (TH-FE-3) — the single data hook + mutation helpers.
 *
 * ONE fetch to /api/teacher/mentoring (the whole workspace aggregate),
 * { cache: 'no-store', credentials: 'same-origin' }, 401 → shared signOut()
 * path — mirrors src/components/student/modules/dashboard/data.ts.
 *
 * Every mutation POST/PATCHes the real API, then reload()s the aggregate so
 * stats, tabs and the Teacher Hub follow-up badge stay truthful. Values are
 * NEVER read from the client's URL/localStorage — the server resolves the
 * teacher and her scope from the erp_session cookie.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { signOut } from '@/lib/signout'
import { useTeacherHubStore } from '@/lib/store/teacher-hub-store'
import type {
  FollowUpItem,
  GoalItem,
  GoalStatus,
  MenteeItem,
  MenteeStatus,
  MentoringPayload,
  SessionItem,
  SessionType,
  SupportType,
} from '@/lib/teacher-hub-types'

// ─── inputs ──────────────────────────────────────────────────────────

export interface AddMenteeInput {
  studentId: string
  status?: MenteeStatus
  supportType?: SupportType
  notes?: string
}

export interface UpdateMenteeInput {
  status?: MenteeStatus
  supportType?: SupportType
  notes?: string | null
  active?: boolean
}

export interface LogSessionInput {
  studentId: string
  date?: string
  type?: SessionType
  discussion: string
  actionItems?: string[]
  durationMinutes?: number
  followUpDate?: string
}

export interface AddGoalInput {
  studentId: string
  title: string
  target?: string
  reviewDate?: string
  status?: GoalStatus
}

export interface UpdateFollowUpInput {
  status?: 'done' | 'cancelled' | 'open'
  dueDate?: string
  note?: string
}

// ─── envelope client ({ ok, data } / { ok: false, error }) ───────────

interface Envelope<T> {
  ok?: unknown
  data?: unknown
  error?: unknown
}

/** Parse an already status-checked response body into the data envelope. */
async function readEnvelope<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as Envelope<T> | null
  if (!body || typeof body !== 'object' || body.ok !== true || !('data' in body)) {
    throw new Error(
      body && typeof body.error === 'string' ? body.error : 'Unexpected response from the server.',
    )
  }
  return body.data as T
}

async function mentoringFetch<T>(url: string, init?: RequestInit): Promise<T> {
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
      const body = (await res.json()) as Envelope<T>
      if (body && typeof body.error === 'string') message = body.error
    } catch {
      /* non-JSON error body — keep the concise fallback */
    }
    throw new Error(message)
  }
  return readEnvelope<T>(res)
}

// ─── the hook ────────────────────────────────────────────────────────

export interface MentoringState {
  data: MentoringPayload | null
  /** true while the first load is still in flight (no data yet) */
  loading: boolean
  error: string | null
  reload: () => void
  addMentee: (input: AddMenteeInput) => Promise<MenteeItem>
  updateMentee: (id: string, patch: UpdateMenteeInput) => Promise<MenteeItem>
  logSession: (input: LogSessionInput) => Promise<SessionItem>
  addGoal: (input: AddGoalInput) => Promise<GoalItem>
  updateGoalStatus: (id: string, status: GoalStatus) => Promise<GoalItem>
  updateFollowUp: (id: string, patch: UpdateFollowUpInput) => Promise<FollowUpItem>
}

export function useMentoring(): MentoringState {
  const [data, setData] = useState<MentoringPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch('/api/teacher/mentoring', { cache: 'no-store', credentials: 'same-origin' })
      .then(async (res) => {
        if (res.status === 401) {
          void signOut()
          throw new Error('Your session has expired. Please sign in again.')
        }
        if (!res.ok) throw new Error(`Mentoring workspace could not load (${res.status}).`)
        return readEnvelope<MentoringPayload>(res)
      })
      .then((payload) => {
        if (cancelled || !mounted.current) return
        setData(payload)
        // Publish the real open follow-up count to the Teacher Hub store.
        // setCounts defaults UNspecified keys to 0 — so pass the current
        // parentUnread through explicitly to never clobber the sidebar badge.
        const hub = useTeacherHubStore.getState()
        hub.setCounts({ parentUnread: hub.parentUnread, followUpsOpen: payload.stats.followUpsOpen })
      })
      .catch((e: unknown) => {
        if (cancelled || !mounted.current) return
        setError(e instanceof Error ? e.message : 'Mentoring workspace could not load.')
      })
      .finally(() => {
        if (!cancelled && mounted.current) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])

  const addMentee = useCallback(
    async (input: AddMenteeInput): Promise<MenteeItem> => {
      const d = await mentoringFetch<{ mentee: MenteeItem }>(
        '/api/teacher/mentoring/assignments',
        { method: 'POST', body: JSON.stringify(input) },
      )
      reload()
      return d.mentee
    },
    [reload],
  )

  const updateMentee = useCallback(
    async (id: string, patch: UpdateMenteeInput): Promise<MenteeItem> => {
      const d = await mentoringFetch<{ mentee: MenteeItem }>(
        `/api/teacher/mentoring/assignments/${id}`,
        { method: 'PATCH', body: JSON.stringify(patch) },
      )
      reload()
      return d.mentee
    },
    [reload],
  )

  const logSession = useCallback(
    async (input: LogSessionInput): Promise<SessionItem> => {
      const d = await mentoringFetch<{ session: SessionItem }>(
        '/api/teacher/mentoring/sessions',
        { method: 'POST', body: JSON.stringify(input) },
      )
      reload()
      return d.session
    },
    [reload],
  )

  const addGoal = useCallback(
    async (input: AddGoalInput): Promise<GoalItem> => {
      const d = await mentoringFetch<{ goal: GoalItem }>('/api/teacher/mentoring/goals', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      reload()
      return d.goal
    },
    [reload],
  )

  const updateGoalStatus = useCallback(
    async (id: string, status: GoalStatus): Promise<GoalItem> => {
      const d = await mentoringFetch<{ goal: GoalItem }>(
        `/api/teacher/mentoring/goals/${id}`,
        { method: 'PATCH', body: JSON.stringify({ status }) },
      )
      reload()
      return d.goal
    },
    [reload],
  )

  const updateFollowUp = useCallback(
    async (id: string, patch: UpdateFollowUpInput): Promise<FollowUpItem> => {
      const d = await mentoringFetch<{ followUp: FollowUpItem }>(
        `/api/teacher/follow-ups/${id}`,
        { method: 'PATCH', body: JSON.stringify(patch) },
      )
      reload()
      return d.followUp
    },
    [reload],
  )

  return {
    data,
    loading,
    error,
    reload,
    addMentee,
    updateMentee,
    logSession,
    addGoal,
    updateGoalStatus,
    updateFollowUp,
  }
}
