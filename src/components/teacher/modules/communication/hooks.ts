'use client'

/**
 * communication/hooks — the data layer for the Communication Hub.
 *
 * ONE aggregate fetch (GET /api/teacher/communication) mirrors the Parent
 * Connect / student-behavior discipline: { cache: 'no-store', credentials:
 * 'same-origin' } against the { ok, data } envelope, a 401 that routes
 * through the shared signOut() instead of a dead-end, and QUIET reloads —
 * the skeleton shows on the first load only, later reloads keep the stale
 * payload on screen so mutations never flash the whole module.
 *
 * Mutations:
 *   · sendMessageToParent  POST /api/teacher/communication/message-parent
 *     (same backend tables as Parent Connect — threads stay unified)
 *   · publishAnnouncement  POST /api/teacher/communication/announcement
 *     (only reachable from the permission-gated dialog)
 *   · markAnnouncementRead PATCH /api/notifications-feed — the SAME route
 *     the bell feed uses, so the acknowledgement is shared state.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { signOut } from '@/lib/signout'
import type { ConversationCategory } from '@/lib/teacher-hub-types'
import type { CommunicationHubPayload } from './types'

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

// ─── Mutations ─────────────────────────────────────────────────────────

export interface SendMessageResult {
  conversationId: string
  parentName: string
  studentName: string
}

/** POST /api/teacher/communication/message-parent — send to a guardian
 * (server re-validates the student scope; never trusts client ids). */
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
