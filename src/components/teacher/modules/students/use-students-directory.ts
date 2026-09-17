'use client'

/**
 * use-students-directory — the data layer for the Student Directory.
 *
 * Two sequential server calls, both through /api/teacher/students:
 *   1. (no params) the authorized class list — the only classes whose
 *      students may be exposed to this teacher;
 *   2. ?classId=… the roster for the selected class (server-validated
 *      against that same authorized set).
 *
 * Fetch discipline mirrors use-lesson-planner: `{ cache: 'no-store',
 * credentials: 'same-origin' }`, a `{ ok, data }` envelope, and a 401 that
 * routes through the shared signOut() exactly once. Every rendered value
 * (roster, attendance summaries, counts) comes from the server payload —
 * nothing is derived or fabricated client-side beyond search/filter views.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { signOut } from '@/lib/signout'
import type { ClassRosterDTO, ClassSummaryDTO } from './types'

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

async function dirRequest<T>(url: string): Promise<T> {
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

const ERROR_MESSAGES: Record<string, string> = {
  NOT_FOUND: 'That class does not exist.',
  FORBIDDEN: "You don't have access to this class.",
  UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  NO_TEACHER_RECORD: 'Your teacher profile could not be loaded.',
  NO_SCHOOL: 'Your school could not be resolved.',
}

function friendlyError(e: unknown): string {
  const raw = e instanceof Error ? e.message : ''
  return ERROR_MESSAGES[raw] ?? 'The student directory could not load.'
}

export interface StudentsDirectoryState {
  classes: ClassSummaryDTO[]
  classesLoading: boolean
  classesError: string | null
  /** the currently selected authorized class (first one by default) */
  selectedClassId: string | null
  selectedClass: ClassSummaryDTO | null
  roster: ClassRosterDTO | null
  rosterLoading: boolean
  rosterError: string | null
  /** switch the directory to another authorized class */
  selectClass: (classId: string) => void
  /** re-fetch the class list and the current roster */
  reload: () => void
}

export function useStudentsDirectory(): StudentsDirectoryState {
  const [classes, setClasses] = useState<ClassSummaryDTO[]>([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [classesError, setClassesError] = useState<string | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [roster, setRoster] = useState<ClassRosterDTO | null>(null)
  const [rosterLoading, setRosterLoading] = useState(false)
  const [rosterError, setRosterError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const mounted = useRef(true)
  const selectedRef = useRef<string | null>(null)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    selectedRef.current = selectedClassId
  }, [selectedClassId])

  // 1. the authorized class list (mount + every reload)
  useEffect(() => {
    let cancelled = false
    setClassesLoading(true)
    setClassesError(null)
    dirRequest<{ classes: ClassSummaryDTO[] }>('/api/teacher/students')
      .then((d) => {
        if (cancelled || !mounted.current) return
        setClasses(d.classes)
        // keep the current selection when it is still authorized, otherwise
        // fall back to the first class (the default directory view)
        const stillValid = selectedRef.current && d.classes.some((c) => c.classId === selectedRef.current)
        setSelectedClassId(stillValid ? selectedRef.current : (d.classes[0]?.classId ?? null))
      })
      .catch((e: unknown) => {
        if (cancelled || !mounted.current) return
        setClassesError(friendlyError(e))
      })
      .finally(() => {
        if (!cancelled && mounted.current) setClassesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  // 2. the roster for the selected class (selection + every reload)
  useEffect(() => {
    if (!selectedClassId) {
      setRoster(null)
      setRosterError(null)
      return
    }
    let cancelled = false
    setRosterLoading(true)
    setRosterError(null)
    setRoster(null) // a directory switch is a context switch — never show
    // one class's roster under another class's label, even dimmed.
    dirRequest<ClassRosterDTO>(`/api/teacher/students?classId=${encodeURIComponent(selectedClassId)}`)
      .then((d) => {
        if (cancelled || !mounted.current) return
        setRoster(d)
      })
      .catch((e: unknown) => {
        if (cancelled || !mounted.current) return
        setRosterError(friendlyError(e))
      })
      .finally(() => {
        if (!cancelled && mounted.current) setRosterLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedClassId, tick])

  const selectClass = useCallback((classId: string) => {
    setSelectedClassId((cur) => (cur === classId ? cur : classId))
  }, [])

  const reload = useCallback(() => setTick((t) => t + 1), [])

  const selectedClass =
    classes.find((c) => c.classId === selectedClassId) ?? null

  return {
    classes,
    classesLoading,
    classesError,
    selectedClassId,
    selectedClass,
    roster,
    rosterLoading,
    rosterError,
    selectClass,
    reload,
  }
}
