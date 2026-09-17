'use client'

/**
 * use-communication-hub — the data layer for the Communication Hub.
 *
 * Two independent server calls, both real:
 *   1. GET /api/announcements — the school's published announcements with
 *      read counts and estimated recipients (drives the Announcements tab,
 *      the notice board and the delivery-rate bars);
 *   2. GET /api/teacher/parent-connect — the teacher's REAL parent-messaging
 *      aggregate (conversations summary, linkable students, stats).
 *
 * Fetch discipline mirrors use-students-directory: `{ cache: 'no-store',
 * credentials: 'same-origin' }`, a `{ ok, data }` envelope, and a 401 that
 * routes through the shared signOut() exactly once. No POSTs exist here by
 * design: school-wide announcements are principal-only (the API rejects
 * teachers with FORBIDDEN) and parent messaging happens in Parent Connect.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { signOut } from '@/lib/signout'
import type { ParentConnectPayload } from '@/lib/teacher-hub-types'
import type { AnnouncementDTO } from './types'

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

async function hubRequest<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: 'no-store', credentials: 'same-origin' })
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
      envelope && typeof envelope.error === 'string' && envelope.error
        ? envelope.error
        : `Request failed (${r.status})`
    throw new Error(message)
  }
  return envelope.data as T
}

// ─── server code → human sentences ────────────────────────────────────

const ANNOUNCEMENT_ERRORS: Record<string, string> = {
  FORBIDDEN: 'You are not allowed to view announcements.',
  UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  NO_SCHOOL: 'Your school could not be resolved.',
}

const PARENT_ERRORS: Record<string, string> = {
  FORBIDDEN: 'Parent messaging is not available for your account.',
  UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  NO_TEACHER_RECORD: 'Your teacher profile could not be loaded.',
  NO_SCHOOL: 'Your school could not be resolved.',
}

function friendlyError(e: unknown, map: Record<string, string>, fallback: string): string {
  const raw = e instanceof Error ? e.message : ''
  return map[raw] ?? (raw || fallback)
}

export interface CommunicationHubState {
  /** published school announcements, newest first (server order) */
  announcements: AnnouncementDTO[]
  announcementsLoading: boolean
  announcementsError: string | null
  /** the teacher's real Parent Connect aggregate (null until loaded) */
  parent: ParentConnectPayload | null
  parentLoading: boolean
  parentError: string | null
  /** re-fetch both sources */
  reload: () => void
}

export function useCommunicationHub(): CommunicationHubState {
  const [announcements, setAnnouncements] = useState<AnnouncementDTO[]>([])
  const [announcementsLoading, setAnnouncementsLoading] = useState(true)
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null)
  const [parent, setParent] = useState<ParentConnectPayload | null>(null)
  const [parentLoading, setParentLoading] = useState(true)
  const [parentError, setParentError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // 1. school announcements (mount + every reload)
  useEffect(() => {
    let cancelled = false
    setAnnouncementsLoading(true)
    setAnnouncementsError(null)
    hubRequest<{ announcements: AnnouncementDTO[] }>('/api/announcements')
      .then((d) => {
        if (cancelled || !mounted.current) return
        setAnnouncements(Array.isArray(d.announcements) ? d.announcements : [])
      })
      .catch((e: unknown) => {
        if (cancelled || !mounted.current) return
        setAnnouncementsError(friendlyError(e, ANNOUNCEMENT_ERRORS, 'Announcements could not load.'))
      })
      .finally(() => {
        if (!cancelled && mounted.current) setAnnouncementsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  // 2. the parent-connect aggregate (mount + every reload)
  useEffect(() => {
    let cancelled = false
    setParentLoading(true)
    setParentError(null)
    hubRequest<ParentConnectPayload>('/api/teacher/parent-connect')
      .then((d) => {
        if (cancelled || !mounted.current) return
        setParent(d)
      })
      .catch((e: unknown) => {
        if (cancelled || !mounted.current) return
        setParentError(friendlyError(e, PARENT_ERRORS, 'Parent messaging could not load.'))
      })
      .finally(() => {
        if (!cancelled && mounted.current) setParentLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])

  return {
    announcements,
    announcementsLoading,
    announcementsError,
    parent,
    parentLoading,
    parentError,
    reload,
  }
}
