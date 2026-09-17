'use client'

/**
 * analytics/hooks — data transport for GET /api/teacher/analytics.
 *
 * Same discipline as the other teacher modules: no-store + same-origin
 * fetch, {ok,data} envelope, 401 → signOut. The first load renders the
 * module skeleton (data === null). A failed REFRESH never wipes a
 * readable module — the previous payload stays on screen and only the
 * returned `staleError` surfaces (quiet strip), matching the dashboard
 * hook's contract.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { signOut } from '@/lib/signout'
import type { AnalyticsPayload } from './types'

async function requestAnalytics(): Promise<AnalyticsPayload> {
  const res = await fetch('/api/teacher/analytics', {
    cache: 'no-store',
    credentials: 'same-origin',
  })
  if (res.status === 401) {
    void signOut()
    throw new Error('Your session has expired. Please sign in again.')
  }
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  const body = (await res.json()) as { ok?: boolean; data?: AnalyticsPayload; error?: string }
  if (!body.ok || !body.data) throw new Error(body.error || 'Failed to load analytics')
  return body.data
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [staleError, setStaleError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const dataRef = useRef<AnalyticsPayload | null>(null)
  dataRef.current = data

  const reload = useCallback(() => setReloadToken((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    const hadData = dataRef.current != null
    if (hadData) setStaleError(null)
    requestAnalytics()
      .then((payload) => {
        if (cancelled) return
        setData(payload)
        setError(null)
        setStaleError(null)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        const message = e instanceof Error ? e.message : 'Failed to load analytics'
        if (hadData) {
          // Keep the last payload on screen — only flag the failed refresh.
          setStaleError(message)
        } else {
          setError(message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  return { data, error, staleError, reload }
}
