'use client'

/**
 * Learning (L2D) — API client helpers. Every call uses the { ok, data } /
 * { ok: false, error } envelope, same-origin credentials (erp_session
 * cookie) and no-store caching. Errors surface as plain Error objects so
 * callers can render the concise retry state (spec §44).
 *
 * LR-1 — 401 session-expiry dead-end fix: the client demo profile
 * (localStorage `scholario-auth`) is separate from the SERVER session
 * (erp_session cookie, 7-day TTL). When that server session expires the
 * workspace still renders, but every Learning API answers 401 — which used
 * to surface as the permanent "Couldn't load Learning" state whose retry
 * could never succeed. A 401 now routes through one graceful re-auth: the
 * shared signOut() (server revocation + client reset), which lands the
 * student back on the login screen instead of a dead-end error.
 */

let reAuthInFlight = false

/** A dead server session cannot be retried — reset auth ONCE, land on login. */
function handleExpiredSession(): void {
  if (reAuthInFlight) return
  reAuthInFlight = true
  void import('@/lib/signout')
    .then(({ signOut }) => signOut())
    .catch(() => {
      // Even the sign-out path failed (server unreachable) — fall back to
      // the client-only logout so the shell returns to the login screen.
      try {
        window.localStorage.removeItem('scholario-auth')
        window.location.reload()
      } catch {
        /* nothing more we can honestly do here */
      }
    })
    .finally(() => {
      // Allow a future login to go through this path again if needed.
      window.setTimeout(() => { reAuthInFlight = false }, 2000)
    })
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    cache: 'no-store',
    credentials: 'same-origin',
    headers: init?.body ? { 'Content-Type': 'application/json', ...init?.headers } : init?.headers,
  })
  if (!r.ok) {
    if (r.status === 401) {
      // The server session is gone/expired — no retry can fix this.
      handleExpiredSession()
      throw new Error('Your session has expired. Please sign in again.')
    }
    let message = `Request failed (${r.status})`
    try {
      const j = await r.json()
      if (j && typeof j === 'object' && 'error' in j && typeof j.error === 'string') {
        message = j.error
      }
    } catch {
      // Non-JSON error (stream/HTML) — keep the concise fallback.
    }
    throw new Error(message)
  }
  const j = await r.json()
  if (!j || typeof j !== 'object' || !('ok' in j) || j.ok !== true || !('data' in j)) {
    throw new Error('Unexpected response from the server.')
  }
  return j.data as T
}

export function apiPost<T>(url: string, body: unknown): Promise<T> {
  return apiFetch<T>(url, { method: 'POST', body: JSON.stringify(body) })
}

export function apiPatch<T>(url: string, body: unknown): Promise<T> {
  return apiFetch<T>(url, { method: 'PATCH', body: JSON.stringify(body) })
}

export function apiDelete<T>(url: string): Promise<T> {
  return apiFetch<T>(url, { method: 'DELETE' })
}
