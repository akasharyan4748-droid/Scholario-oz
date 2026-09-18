'use client'

/**
 * Student Directory (Task 2-c) — the module's data hook.
 *
 * ONE fetch to GET /api/teacher/students returns every authorized class
 * and its full roster (identity, guardian contact, attendance summary,
 * latest exam marks). The hook owns only the selected class — every
 * rendered value comes from the server payload; search/filter views are
 * derived in the grid, never fabricated here.
 *
 * Fetch discipline mirrors the house pattern (communication/marks):
 * `{ cache: 'no-store', credentials: 'same-origin' }`, a `{ ok, data }`
 * envelope, and a 401 that routes through the shared signOut() exactly
 * once.
 */

import { useEffect, useMemo, useState } from 'react'
import { signOut } from '@/lib/signout'
import type { DirectoryPayload } from './types'

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

async function directoryFetch(): Promise<DirectoryPayload> {
  const res = await fetch('/api/teacher/students', {
    cache: 'no-store',
    credentials: 'same-origin',
  })
  if (res.status === 401) {
    handleExpiredSession()
    throw new Error('Your session has expired. Please sign in again.')
  }
  let json: unknown = null
  try {
    json = await res.json()
  } catch {
    /* non-JSON error body — fall through to the generic message */
  }
  const envelope = json as { ok?: unknown; error?: unknown; data?: DirectoryPayload } | null
  if (!res.ok || !envelope || envelope.ok !== true) {
    const message =
      envelope && typeof envelope.error === 'string' && envelope.error
        ? envelope.error
        : `Request failed (${res.status})`
    throw new Error(message)
  }
  return envelope.data as DirectoryPayload
}

export function useStudentDirectory() {
  const [data, setData] = useState<DirectoryPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [classId, setClassId] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(null)
    directoryFetch()
      .then((payload) => {
        if (cancelled) return
        setData(payload)
        // Keep the current selection when it is still authorized; default
        // to the class-teacher class, else the first assigned class.
        setClassId((prev) => {
          if (prev && payload.classes.some((c) => c.id === prev)) return prev
          return payload.classes.find((c) => c.isClassTeacher)?.id ?? payload.classes[0]?.id ?? null
        })
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      })
    return () => {
      cancelled = true
    }
  }, [reload])

  const activeClass = useMemo(
    () => data?.classes.find((c) => c.id === classId) ?? null,
    [data, classId],
  )
  const students = useMemo(
    () => (classId ? data?.studentsByClass[classId] ?? [] : []),
    [data, classId],
  )

  return {
    data,
    error,
    reload: () => setReload((r) => r + 1),
    classId,
    setClassId,
    activeClass,
    students,
  }
}
