'use client'

/**
 * parent-connect/hooks — the data layer for the Parent Connect module.
 *
 * ONE aggregate fetch (GET /api/teacher/parent-connect) mirrors the
 * useStudentDashboard discipline: loading / error / retry, `{ cache:
 * 'no-store', credentials: 'same-origin' }`, and a 401 that routes through
 * the shared signOut() instead of a dead-end. A second hook loads a thread
 * (GET …/[conversationId] marks the parent's messages read server-side),
 * and thin mutation helpers POST/PATCH the same routes. The server resolves
 * the teacher, her school and her class-teacher scope — nothing about the
 * teacher is ever read from the client.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { signOut } from '@/lib/signout'
import type {
  ConversationCategory,
  FollowUpItem,
  FollowUpPriority,
  ParentConnectPayload,
  ThreadMessage,
  ThreadPayload,
} from '@/lib/teacher-hub-types'

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

async function pcRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    cache: 'no-store',
    credentials: 'same-origin',
    headers: init?.body
      ? { 'Content-Type': 'application/json', ...(init?.headers ?? {}) }
      : init?.headers,
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
  const envelope = json as { ok?: unknown; error?: unknown; data?: T } | null
  if (!r.ok || !envelope || envelope.ok !== true) {
    const message =
      envelope && typeof envelope.error === 'string'
        ? envelope.error
        : `Request failed (${r.status})`
    throw new Error(message)
  }
  return envelope.data as T
}

// ─── Aggregate payload ─────────────────────────────────────────────────

export interface ParentConnectState {
  data: ParentConnectPayload | null
  loading: boolean
  error: string | null
  reload: () => void
}

export function useParentConnect(): ParentConnectState {
  const [data, setData] = useState<ParentConnectPayload | null>(null)
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
    pcRequest<ParentConnectPayload>('/api/teacher/parent-connect')
      .then((d) => {
        if (!cancelled && mounted.current) setData(d)
      })
      .catch((e: unknown) => {
        if (cancelled || !mounted.current) return
        setError(e instanceof Error ? e.message : 'Parent Connect could not load.')
      })
      .finally(() => {
        if (!cancelled && mounted.current) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, reload }
}

// ─── Thread ────────────────────────────────────────────────────────────

export interface ThreadState {
  thread: ThreadPayload | null
  loading: boolean
  error: string | null
  reload: () => void
}

/**
 * Loads a conversation's full thread. The GET marks the parent's messages
 * read server-side before returning — callers clear the conversation's
 * local unread badge once the thread arrives.
 */
export function useThread(conversationId: string | null): ThreadState {
  const [thread, setThread] = useState<ThreadPayload | null>(null)
  const [loading, setLoading] = useState(false)
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
    if (!conversationId) {
      setThread(null)
      setError(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setThread(null)
    setError(null)
    setLoading(true)
    pcRequest<ThreadPayload>(`/api/teacher/parent-connect/${conversationId}`)
      .then((t) => {
        if (!cancelled && mounted.current) setThread(t)
      })
      .catch((e: unknown) => {
        if (cancelled || !mounted.current) return
        setError(e instanceof Error ? e.message : 'This conversation could not load.')
      })
      .finally(() => {
        if (!cancelled && mounted.current) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [conversationId, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { thread, loading, error, reload }
}

// ─── Mutations ─────────────────────────────────────────────────────────

/** POST /api/teacher/parent-connect — start (or reuse) a conversation. */
export async function startParentConversation(input: {
  studentId: string
  category: ConversationCategory
  message: string
}): Promise<string> {
  const d = await pcRequest<{ conversationId: string }>('/api/teacher/parent-connect', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return d.conversationId
}

/** POST /api/teacher/parent-connect/[conversationId] — send a message. */
export async function sendThreadMessage(conversationId: string, body: string): Promise<ThreadMessage> {
  const d = await pcRequest<{ message: ThreadMessage }>(
    `/api/teacher/parent-connect/${conversationId}`,
    { method: 'POST', body: JSON.stringify({ body }) },
  )
  return d.message
}

/** PATCH /api/teacher/parent-connect/[conversationId] — pin / re-categorize. */
export async function patchConversation(
  conversationId: string,
  patch: { pinned?: boolean; category?: ConversationCategory },
): Promise<void> {
  await pcRequest(`/api/teacher/parent-connect/${conversationId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

/** POST /api/teacher/follow-ups — create a Parent Connect follow-up. */
export async function createParentConnectFollowUp(input: {
  conversationId: string
  reason: string
  dueDate: string
  priority?: FollowUpPriority
  note?: string
}): Promise<FollowUpItem> {
  const d = await pcRequest<{ followUp: FollowUpItem }>('/api/teacher/follow-ups', {
    method: 'POST',
    body: JSON.stringify({ kind: 'parent-connect', ...input }),
  })
  return d.followUp
}

/** PATCH /api/teacher/follow-ups/[id] — complete / reschedule / cancel. */
export async function updateFollowUp(
  id: string,
  patch: { status?: 'done' | 'cancelled' | 'open'; dueDate?: string; note?: string },
): Promise<FollowUpItem> {
  const d = await pcRequest<{ followUp: FollowUpItem }>(`/api/teacher/follow-ups/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  return d.followUp
}
