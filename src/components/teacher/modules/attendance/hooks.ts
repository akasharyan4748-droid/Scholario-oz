'use client'

/**
 * Class Attendance (TWC-FE-2) — the module's single data hook.
 *
 * Two GETs feed everything: the class list (once) and the board (on every
 * class / date / reload change). Both go through the envelope client with
 * { cache: 'no-store', credentials: 'same-origin' } — the httpOnly
 * erp_session cookie is the ONLY auth source, the server resolves teacher
 * / school / scope, and 401 → shared signOut() exactly once.
 *
 * Saving POSTs the explicit endpoint — baseline (class teacher) or session
 * (subject teacher) — then refetches the board so the draft, the context
 * line and the counts always reflect server truth. Viewing the board NEVER
 * writes anything; drafts live in state only.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { signOut } from '@/lib/signout'
import {
  buildDraft,
  countsParts,
  draftCounts,
  todayKey,
  type AttendanceBoard,
  type AttendanceClassInfo,
  type AttendanceDraft,
  type AttendanceStatus,
  type PrefillSource,
  type SaveBaselineResult,
  type SaveCounts,
  type SaveSessionResult,
} from './shared'

// ─── envelope client ({ ok, data } / { ok: false, error }) ───────────

interface Envelope {
  ok?: unknown
  data?: unknown
  error?: unknown
}

async function attendanceFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    cache: 'no-store',
    credentials: 'same-origin',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  })
  if (res.status === 401) {
    // A dead server session cannot be retried — one graceful re-auth.
    void signOut()
    throw new Error('Your session has expired. Please sign in again.')
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = (await res.json()) as Envelope
      if (body && typeof body.error === 'string') message = body.error
    } catch {
      /* non-JSON error body — keep the concise fallback */
    }
    throw new Error(message)
  }
  const body = (await res.json().catch(() => null)) as Envelope | null
  if (!body || typeof body !== 'object' || body.ok !== true || !('data' in body)) {
    throw new Error(
      body && typeof body.error === 'string' ? body.error : 'Unexpected response from the server.',
    )
  }
  return body.data as T
}

// ─── the hook ─────────────────────────────────────────────────────────

export interface AttendanceModuleState {
  /** classes the teacher may mark (class teacher of and/or teaches in) */
  classes: AttendanceClassInfo[] | null
  classesError: string | null
  reloadClasses: () => void
  classId: string | null
  selectClass: (classId: string) => void
  /** her own subject pick for the current class (subject-teacher mode) */
  subjectId: string | null
  selectSubject: (subjectId: string) => void
  /** viewed date, "YYYY-MM-DD" (never the future) */
  date: string
  selectDate: (date: string) => void
  board: AttendanceBoard | null
  boardLoading: boolean
  boardError: string | null
  reloadBoard: () => void
  draft: AttendanceDraft
  /** what the draft was prefilled from */
  source: PrefillSource
  /** any local edit not yet saved */
  dirty: boolean
  setStatus: (studentId: string, status: AttendanceStatus) => void
  markAllPresent: () => void
  counts: SaveCounts
  saving: boolean
  justSaved: boolean
  save: () => void
}

export function useAttendanceModule(): AttendanceModuleState {
  const [classes, setClasses] = useState<AttendanceClassInfo[] | null>(null)
  const [classesError, setClassesError] = useState<string | null>(null)
  const [classId, setClassId] = useState<string | null>(null)
  const [subjectId, setSubjectId] = useState<string | null>(null)
  const [date, setDate] = useState<string>(todayKey)
  const [board, setBoard] = useState<AttendanceBoard | null>(null)
  const [boardLoading, setBoardLoading] = useState(false)
  const [boardError, setBoardError] = useState<string | null>(null)
  const [draft, setDraft] = useState<AttendanceDraft>({})
  const [source, setSource] = useState<PrefillSource>('present')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [classesTick, setClassesTick] = useState(0)
  const [boardTick, setBoardTick] = useState(0)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── classes: where can this teacher mark attendance? ────────────────
  useEffect(() => {
    let cancelled = false
    setClassesError(null)
    // TS-SETTINGS — the teacher's saved default class (if any) wins over
    // the first assigned class. Both calls are cheap; prefs failure must
    // never block the module (fall back silently).
    Promise.all([
      attendanceFetch<{ classes: AttendanceClassInfo[] }>('/api/teacher/class-attendance'),
      fetch('/api/teacher/settings', { cache: 'no-store', credentials: 'same-origin' })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([payload, settings]) => {
        if (cancelled) return
        setClasses(payload.classes)
        const preferred = settings?.data?.workspace?.defaultClassId as string | null | undefined
        const validPreferred =
          preferred && payload.classes.some((c) => c.classId === preferred) ? preferred : null
        // Saved default class → else first assigned class; a retry keeps her pick.
        setClassId((cur) => cur ?? validPreferred ?? payload.classes[0]?.classId ?? null)
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setClassesError(e instanceof Error ? e.message : 'Classes could not load.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [classesTick])

  // ── board: roster + baseline + her sessions for classId/date ───────
  useEffect(() => {
    if (!classId) return
    let cancelled = false
    setBoardLoading(true)
    setBoardError(null)
    attendanceFetch<AttendanceBoard>(
      `/api/teacher/class-attendance/board?classId=${encodeURIComponent(classId)}&date=${date}`,
    )
      .then((payload) => {
        if (cancelled) return
        setBoard(payload)
        // Keep the current subject if she still teaches it in this class,
        // else fall back to her first subject here (subject-teacher mode).
        setSubjectId((cur) =>
          payload.subjects.some((s) => s.id === cur)
            ? cur
            : payload.subjects[0]?.id ?? null,
        )
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setBoard(null)
        setBoardError(e instanceof Error ? e.message : 'The attendance board could not load.')
      })
      .finally(() => {
        if (!cancelled) setBoardLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [classId, date, boardTick])

  // ── draft: always rebuilt from server truth on board/subject change ─
  useEffect(() => {
    if (!board) {
      setDraft({})
      setSource('present')
    } else {
      const built = buildDraft(board, subjectId)
      setDraft(built.draft)
      setSource(built.source)
    }
    setDirty(false)
  }, [board, subjectId])

  // Clear the "Saved" pill timer on unmount.
  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current)
    }
  }, [])

  const reloadClasses = useCallback(() => setClassesTick((t) => t + 1), [])
  const reloadBoard = useCallback(() => setBoardTick((t) => t + 1), [])

  const selectClass = useCallback(
    (id: string) => {
      if (classId === id) return
      // The old roster must never linger under a newly selected class.
      setBoard(null)
      setBoardError(null)
      setClassId(id)
    },
    [classId],
  )

  const selectSubject = useCallback((id: string) => {
    setSubjectId(id)
  }, [])

  const selectDate = useCallback(
    (value: string) => {
      if (!value || value === date) return
      if (value > todayKey()) return // the future is not markable (server enforces too)
      setBoard(null)
      setBoardError(null)
      setDate(value)
    },
    [date],
  )

  const setStatus = useCallback((studentId: string, status: AttendanceStatus) => {
    setDraft((prev) => (prev[studentId] === status ? prev : { ...prev, [studentId]: status }))
    setDirty(true)
  }, [])

  const markAllPresent = useCallback(() => {
    if (!board || board.students.length === 0) return
    setDraft((prev) => {
      const next = { ...prev }
      let changed = false
      for (const s of board.students) {
        if (next[s.id] !== 'PRESENT') {
          next[s.id] = 'PRESENT'
          changed = true
        }
      }
      return changed ? next : prev
    })
    setDirty(true)
    toast.success('All students marked present', {
      description: 'Review and save the attendance.',
    })
  }, [board])

  const counts: SaveCounts = useMemo(
    () => draftCounts(board?.students ?? [], draft),
    [board, draft],
  )

  const save = useCallback(async (): Promise<void> => {
    if (!board || !classId || saving || boardLoading) return
    if (board.students.length === 0) return
    if (!board.isClassTeacher && !subjectId) return
    const entries = board.students.map((s) => ({
      studentId: s.id,
      status: draft[s.id] ?? 'PRESENT',
    }))
    setSaving(true)
    try {
      if (board.isClassTeacher) {
        // Class teacher → the official daily baseline for the whole class.
        const res = await attendanceFetch<SaveBaselineResult>(
          '/api/teacher/class-attendance/baseline',
          { method: 'POST', body: JSON.stringify({ classId, date, entries }) },
        )
        toast.success('Attendance saved', {
          description: [board.label, ...countsParts(res.counts)].filter(Boolean).join(' · '),
        })
      } else {
        // Subject teacher → her OWN session for this subject (upsert).
        const res = await attendanceFetch<SaveSessionResult>(
          '/api/teacher/class-attendance/session',
          { method: 'POST', body: JSON.stringify({ classId, subjectId, date, entries }) },
        )
        toast.success('Attendance saved', {
          description: [board.label, res.subjectName, ...countsParts(res.counts)]
            .filter(Boolean)
            .join(' · '),
        })
      }
      // Refetch so the draft reflects server truth (markedBy, savedAt,
      // session existence). The current board stays visible meanwhile.
      setBoardTick((t) => t + 1)
      setJustSaved(true)
      if (savedTimer.current) clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setJustSaved(false), 2000)
    } catch (e: unknown) {
      toast.error('Attendance could not be saved', {
        description: e instanceof Error ? e.message : 'Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }, [board, classId, date, draft, saving, boardLoading, subjectId])

  return {
    classes,
    classesError,
    reloadClasses,
    classId,
    selectClass,
    subjectId,
    selectSubject,
    date,
    selectDate,
    board,
    boardLoading,
    boardError,
    reloadBoard,
    draft,
    source,
    dirty,
    setStatus,
    markAllPresent,
    counts,
    saving,
    justSaved,
    save,
  }
}
