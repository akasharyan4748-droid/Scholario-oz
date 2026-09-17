'use client'

/**
 * marks/hooks — the data layer for the Marks Entry module.
 *
 * Mirrors the parent-connect/hooks discipline: every request goes out with
 * `{ cache: 'no-store', credentials: 'same-origin' }`, a 401 routes through
 * the shared signOut() instead of a dead end, and every response is read
 * through the `{ ok, data }` envelope. `useMarksExams` loads the picker
 * source once; `useMarksGrid` loads (and reloads) one exam × class ×
 * subject grid — `reload(true)` refreshes quietly (no skeleton flash) so
 * server-derived grade chips can catch up after an autosave without
 * disturbing the teacher's typing.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { signOut } from '@/lib/signout'
import type {
  GridSelection,
  MarksExamsPayload,
  MarksGrid,
  SaveEntry,
  SaveResult,
  SubmitResult,
} from './types'

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

async function marksRequest<T>(url: string, init?: RequestInit): Promise<T> {
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

// ─── Exam picker source ────────────────────────────────────────────────

export interface MarksExamsState {
  data: MarksExamsPayload | null
  loading: boolean
  error: string | null
  reload: () => void
}

/** GET /api/teacher/marks-entry — exams ∩ teacher's classes ∩ subjects. */
export function useMarksExams(): MarksExamsState {
  const [data, setData] = useState<MarksExamsPayload | null>(null)
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
    marksRequest<MarksExamsPayload>('/api/teacher/marks-entry')
      .then((d) => {
        if (!cancelled && mounted.current) setData(d)
      })
      .catch((e: unknown) => {
        if (cancelled || !mounted.current) return
        setError(e instanceof Error ? e.message : 'Marks entry could not load.')
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

// ─── Marks grid ────────────────────────────────────────────────────────

export interface MarksGridState {
  data: MarksGrid | null
  /** `examId|classId|subjectId` the current data belongs to (null while loading). */
  key: string | null
  loading: boolean
  error: string | null
  /**
   * Refetch the grid. `reload(true)` is a QUIET refresh: no skeleton, no
   * error surface — used after an autosave so grade chips catch up. A quiet
   * failure keeps the stale grid on screen.
   */
  reload: (quiet?: boolean) => void
}

/** Stable identity of one grid — shared by hook state and the drafts sync. */
export function gridKeyOf(selection: GridSelection): string {
  return `${selection.examId}|${selection.classId}|${selection.subjectId}`
}

/** GET /api/teacher/marks-entry/grid?examId=&classId=&subjectId= */
export function useMarksGrid(selection: GridSelection | null): MarksGridState {
  const examId = selection?.examId ?? null
  const classId = selection?.classId ?? null
  const subjectId = selection?.subjectId ?? null
  const [data, setData] = useState<MarksGrid | null>(null)
  const [key, setKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const quietRef = useRef(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!examId || !classId || !subjectId) {
      setData(null)
      setKey(null)
      setError(null)
      setLoading(false)
      return
    }
    const quiet = quietRef.current
    quietRef.current = false
    const fetchKey = `${examId}|${classId}|${subjectId}`
    let cancelled = false
    if (!quiet) {
      setData(null)
      setKey(null)
      setError(null)
      setLoading(true)
    }
    const query = new URLSearchParams({ examId, classId, subjectId })
    marksRequest<MarksGrid>(`/api/teacher/marks-entry/grid?${query.toString()}`)
      .then((d) => {
        if (cancelled || !mounted.current) return
        setData(d)
        setKey(fetchKey)
        if (!quiet) setError(null)
      })
      .catch((e: unknown) => {
        if (cancelled || !mounted.current || quiet) return
        setError(e instanceof Error ? e.message : 'The marks grid could not load.')
      })
      .finally(() => {
        if (!cancelled && mounted.current && !quiet) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [examId, classId, subjectId, tick])

  const reload = useCallback((quiet = false) => {
    quietRef.current = quiet
    setTick((t) => t + 1)
  }, [])

  return { data, key, loading, error, reload }
}

// ─── Mutations ─────────────────────────────────────────────────────────

/** POST /api/teacher/marks-entry/save — draft-save the given entries. */
export async function saveMarksEntries(
  selection: GridSelection,
  entries: SaveEntry[],
): Promise<SaveResult> {
  return marksRequest<SaveResult>('/api/teacher/marks-entry/save', {
    method: 'POST',
    body: JSON.stringify({
      examId: selection.examId,
      classId: selection.classId,
      subjectId: selection.subjectId,
      entries,
    }),
  })
}

/** POST /api/teacher/marks-entry/submit — DRAFT → SUBMITTED for the grid. */
export async function submitMarksSelection(selection: GridSelection): Promise<SubmitResult> {
  return marksRequest<SubmitResult>('/api/teacher/marks-entry/submit', {
    method: 'POST',
    body: JSON.stringify({
      examId: selection.examId,
      classId: selection.classId,
      subjectId: selection.subjectId,
    }),
  })
}
