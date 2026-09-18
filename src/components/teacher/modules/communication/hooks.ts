'use client'

/**
 * communication/hooks — the data layer for the Communication Hub.
 *
 * ONE aggregate fetch (GET /api/teacher/communication) mirrors the
 * student-behavior discipline: { cache: 'no-store', credentials:
 * 'same-origin' } against the { ok, data } envelope, a 401 that routes
 * through the shared signOut() instead of a dead-end, and QUIET reloads —
 * the skeleton shows on the first load only, later reloads keep the stale
 * payload on screen so mutations never flash the whole module.
 *
 * Threads and mutations:
 *   · parent threads        GET/POST/PATCH /api/teacher/parent-connect… —
 *                           the SAME engine the former Parent Connect
 *                           module used (threads stay unified)
 *   · direct staff threads  GET/POST /api/teacher/communication/direct/[userId]
 *   · new parent message    POST /api/teacher/communication/message-parent
 *   · announcements         POST /api/teacher/communication/announcement
 *                           (permission-gated) + PATCH /api/notifications-feed
 *   · follow-ups            POST/PATCH /api/teacher/follow-ups…
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { signOut } from '@/lib/signout'
import type {
  ConversationCategory,
  FollowUpItem,
  FollowUpPriority,
  ThreadMessage,
  ThreadPayload,
} from '@/lib/teacher-hub-types'
import type { DirectThreadPayload, CommunicationHubPayload } from './types'

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

async function commRequest<T>(url: string, init?: RequestInit): Promise<T> {
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

export interface CommunicationHubState {
  data: CommunicationHubPayload | null
  /** true only while the FIRST load is in flight (later reloads are quiet) */
  loading: boolean
  error: string | null
  reload: () => void
}

export function useCommunicationHub(): CommunicationHubState {
  const [data, setData] = useState<CommunicationHubPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const mounted = useRef(true)
  const hasData = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    // Quiet reloads: keep the previous payload visible while refetching.
    if (!hasData.current) setLoading(true)
    setError(null)
    commRequest<CommunicationHubPayload>('/api/teacher/communication')
      .then((d) => {
        if (cancelled || !mounted.current) return
        hasData.current = true
        setData(d)
      })
      .catch((e: unknown) => {
        if (cancelled || !mounted.current) return
        setError(e instanceof Error ? e.message : 'Communication Hub could not load.')
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

// ─── Parent thread (the Parent Connect engine) ─────────────────────────

export interface ThreadState {
  thread: ThreadPayload | null
  loading: boolean
  error: string | null
  reload: () => void
}

/**
 * Loads a parent conversation's full thread. The GET marks the parent's
 * messages read server-side before returning — callers clear the
 * conversation's local unread badge once the thread arrives.
 */
export function useParentThread(conversationId: string | null): ThreadState {
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
    commRequest<ThreadPayload>(`/api/teacher/parent-connect/${conversationId}`)
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

/** POST /api/teacher/parent-connect/[conversationId] — send to a parent. */
export async function sendParentThreadMessage(
  conversationId: string,
  body: string,
): Promise<ThreadMessage> {
  const d = await commRequest<{ message: ThreadMessage }>(
    `/api/teacher/parent-connect/${conversationId}`,
    { method: 'POST', body: JSON.stringify({ body }) },
  )
  return d.message
}

/** PATCH /api/teacher/parent-connect/[conversationId] — pin / re-categorize. */
export async function patchParentConversation(
  conversationId: string,
  patch: { pinned?: boolean; category?: ConversationCategory },
): Promise<void> {
  await commRequest(`/api/teacher/parent-connect/${conversationId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export interface SendMessageResult {
  conversationId: string
  parentName: string
  studentName: string
}

/** POST /api/teacher/communication/message-parent — start (or reuse) a
 * guardian conversation and send the first message (server re-validates the
 * student scope; never trusts client ids). */
export async function sendMessageToParent(input: {
  studentId: string
  category: ConversationCategory
  message: string
}): Promise<SendMessageResult> {
  return commRequest<SendMessageResult>('/api/teacher/communication/message-parent', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

// ─── Direct staff thread ───────────────────────────────────────────────

export interface DirectThreadState {
  thread: DirectThreadPayload | null
  loading: boolean
  error: string | null
  reload: () => void
}

/**
 * Loads the direct thread with one counterpart. The GET marks the
 * counterpart's unread messages read server-side before returning.
 */
export function useDirectThread(counterpartId: string | null): DirectThreadState {
  const [thread, setThread] = useState<DirectThreadPayload | null>(null)
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
    if (!counterpartId) {
      setThread(null)
      setError(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setThread(null)
    setError(null)
    setLoading(true)
    commRequest<DirectThreadPayload>(`/api/teacher/communication/direct/${counterpartId}`)
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
  }, [counterpartId, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { thread, loading, error, reload }
}

export interface DirectMessageResult {
  id: string
  subject: string
  body: string
  fromMe: boolean
  senderName: string
  read: boolean
  createdAt: string
}

/** POST /api/teacher/communication/direct/[userId] — send to a staff member. */
export async function sendDirectMessage(
  counterpartId: string,
  input: { subject: string; body: string },
): Promise<DirectMessageResult> {
  const d = await commRequest<{ message: DirectMessageResult }>(
    `/api/teacher/communication/direct/${counterpartId}`,
    { method: 'POST', body: JSON.stringify(input) },
  )
  return d.message
}

// ─── Announcements ─────────────────────────────────────────────────────

export interface AnnouncementResult {
  id: string
  title: string
  audience: string
  priority: string
  createdAt: string
}

/** POST /api/teacher/communication/announcement — publish (permission-gated
 * on the client via the teachers-store; the server re-validates payload +
 * audience whitelist). */
export async function publishAnnouncement(input: {
  title: string
  message: string
  audience: string
  priority: string
}): Promise<AnnouncementResult> {
  return commRequest<AnnouncementResult>('/api/teacher/communication/announcement', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

/** PATCH /api/notifications-feed — persist the announcement acknowledgement
 * (the exact route the bell feed uses, so read state is shared). */
export async function markAnnouncementRead(id: string): Promise<void> {
  await commRequest('/api/notifications-feed', {
    method: 'PATCH',
    body: JSON.stringify({ id, type: 'ANNOUNCEMENT' }),
  })
}

// ─── Follow-ups (the TeacherFollowUp engine) ───────────────────────────

/** POST /api/teacher/follow-ups — create a parent-communication follow-up. */
export async function createFollowUp(input: {
  conversationId: string
  reason: string
  dueDate: string
  priority?: FollowUpPriority
  note?: string
}): Promise<FollowUpItem> {
  const d = await commRequest<{ followUp: FollowUpItem }>('/api/teacher/follow-ups', {
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
  const d = await commRequest<{ followUp: FollowUpItem }>(`/api/teacher/follow-ups/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  return d.followUp
}
