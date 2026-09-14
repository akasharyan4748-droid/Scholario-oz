'use client'

import { useEffect, useRef } from 'react'
import { APP_VERSION } from '@/lib/app-version'

/**
 * VersionGuard — stale-tab self-heal.
 *
 * A long-lived SPA tab keeps the OLD React application running in browser
 * memory long after the server has shipped a newer build. Without a guard
 * the user sees a "reverted" product even though the code on disk is
 * current. This component closes that gap:
 *
 *  1. The bundle embeds APP_VERSION at build time (CLIENT side of truth).
 *  2. We poll GET /api/app-version (no-store) on mount, when the tab
 *     becomes visible again, and every 60s while visible.
 *  3. On a version mismatch we hard-reload the tab exactly once per
 *     server-version per browser session (sessionStorage flag prevents
 *     reload loops if a bundle cannot update).
 *  4. Network/API failures never trigger a reload — offline tabs stay put.
 */
const POLL_MS = 60_000

export function VersionGuard() {
  const healingRef = useRef(false)

  useEffect(() => {
    let disposed = false

    const check = async () => {
      if (healingRef.current) return
      try {
        const res = await fetch('/api/app-version', { cache: 'no-store' })
        if (!res.ok) return // endpoint missing/unhealthy — do nothing
        const data = (await res.json()) as { version?: unknown }
        const serverVersion = typeof data.version === 'string' ? data.version : null
        if (!serverVersion || serverVersion === APP_VERSION) return

        // Stale bundle detected — heal once per server version per session.
        if (sessionStorage.getItem(`vg-healed:${serverVersion}`) === '1') return
        healingRef.current = true
        try {
          sessionStorage.setItem(`vg-healed:${serverVersion}`, '1')
        } catch {
          // storage unavailable (private mode) — in-memory guard still applies
        }
        window.location.reload()
      } catch {
        // transient network error — retry on the next tick
      }
    }

    void check()

    const timer = window.setInterval(() => {
      if (!disposed && document.visibilityState === 'visible') void check()
    }, POLL_MS)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void check()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      disposed = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return null
}

export default VersionGuard
