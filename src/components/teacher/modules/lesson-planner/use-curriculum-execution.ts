'use client'

/**
 * use-curriculum-execution — the Lesson Planner data hook (server-backed).
 *
 * Same transport discipline as Class Attendance / the Teacher Hub modules:
 *   · { cache: 'no-store', credentials: 'same-origin' } — the httpOnly
 *     erp_session cookie is the ONLY auth source.
 *   · { ok, data } envelope; 401 → signOut() once.
 *   · Actions (start / complete / postpone / skip) return the refreshed
 *     payload in one round-trip.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { signOut } from '@/lib/signout'
import type { CurriculumExecutionPayload, LessonAction } from '@/lib/curriculum-types'

let reAuthInFlight = false

function handleExpiredSession(): void {
  if (reAuthInFlight) return
  reAuthInFlight = true
  void signOut()
    .catch(() => {
      try {
        window.localStorage.removeItem('scholario-auth')
        window.location.reload()
      } catch {
        /* nothing more we can honestly do here */
      }
    })
    .finally(() => {
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

export function useCurriculumExecution() {
  const [payload, setPayload] = useState<CurriculumExecutionPayload | null>(null)
  const [loading, setLoading] = useState(true) // first load only — drives the skeleton
  const [error, setError] = useState<string | null>(null)
  const [mutating, setMutating] = useState(false)
  const [tick, setTick] = useState(0)
  const hasData = useRef(false)

  const reload = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setError(null)
    if (!hasData.current) setLoading(true)
    request<CurriculumExecutionPayload>('/api/teacher/curriculum-execution')
      .then((d) => {
        hasData.current = true
        if (cancelled) return
        setPayload(d)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'The curriculum planner could not load.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  /** Switch the (class, subject) context — revalidates server-side. */
  const select = useCallback((classId: string, subjectId: string) => {
    setMutating(true)
    request<CurriculumExecutionPayload>(
      `/api/teacher/curriculum-execution?classId=${encodeURIComponent(classId)}&subjectId=${encodeURIComponent(subjectId)}`,
    )
      .then((d) => {
        setPayload(d)
      })
      .catch((e: unknown) => {
        toast.error(e instanceof Error ? e.message : 'The curriculum could not load.')
      })
      .finally(() => setMutating(false))
  }, [])

  /** Execute a lesson action on a topic; returns the refreshed payload. */
  const act = useCallback(
    async (action: LessonAction, topicId: string): Promise<boolean> => {
      const selected = payload?.selected
      if (!selected) return false
      setMutating(true)
      try {
        const data = await request<{ payload: CurriculumExecutionPayload }>(
          '/api/teacher/curriculum-execution',
          {
            method: 'POST',
            body: JSON.stringify({
              action,
              classId: selected.classId,
              subjectId: selected.subjectId,
              topicId,
            }),
          },
        )
        setPayload(data.payload)
        const verb: Record<LessonAction, string> = {
          start: 'Lesson started',
          complete: 'Lesson completed',
          postpone: 'Lesson moved to the next teaching slot',
          skip: 'Topic skipped',
        }
        toast.success(verb[action])
        return true
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'The lesson could not be updated.')
        return false
      } finally {
        setMutating(false)
      }
    },
    [payload?.selected],
  )

  return { payload, loading, error, mutating, reload, select, act }
}
