'use client'

/**
 * Learning (L2D) — API client helpers. Every call uses the { ok, data } /
 * { ok: false, error } envelope, same-origin credentials (erp_session
 * cookie) and no-store caching. Errors surface as plain Error objects so
 * callers can render the concise retry state (spec §44).
 */

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    cache: 'no-store',
    credentials: 'same-origin',
    headers: init?.body ? { 'Content-Type': 'application/json', ...init?.headers } : init?.headers,
  })
  if (!r.ok) {
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
