'use client'

/**
 * use-lesson-planner — the data layer for the Lesson Planner (Automatic
 * Curriculum Execution).
 *
 * ONE aggregate fetch (GET /api/teacher/lesson-planner[?classId=&subjectId=])
 * mirrors the parent-connect hook discipline: `{ cache: 'no-store',
 * credentials: 'same-origin' }`, a 401 that routes through the shared
 * signOut(), and a `{ ok, data }` envelope. Teaching intents POST to
 * /api/teacher/lesson-planner/[topicId] and return the REFRESHED payload
 * for that topic's scope — the hook replaces its state with it and never
 * re-GETs. A lightweight ?summary=1 call publishes the sidebar badge
 * (totalPendingToday) on mount and after every successful intent.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { signOut } from '@/lib/signout'
import { useTeacherHubStore } from '@/lib/store/teacher-hub-store'
import type {
  LessonIntent,
  LessonPlannerPayload,
  LessonPlannerSummary,
  ScheduledTopicDTO,
} from '@/lib/lesson-planner-types'

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

async function lpRequest<T>(url: string, init?: RequestInit): Promise<T> {
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
      envelope && typeof envelope.error === 'string' && envelope.error
        ? envelope.error
        : `Request failed (${r.status})`
    throw new Error(message)
  }
  return envelope.data as T
}

// ─── intent error vocabulary (server codes → human sentences) ─────────

const INTENT_ERROR_MESSAGES: Record<string, string> = {
  NOT_PLANNED_TODAY: "This lesson isn't scheduled for today yet",
  ALREADY_COMPLETED: 'Already completed',
  NOT_COMPLETED: 'Nothing to undo',
  FORBIDDEN: "You don't teach this class",
  NOT_FOUND: 'Lesson not found',
  BAD_INTENT: 'That action is not supported',
  UNAUTHORIZED: 'Your session has expired. Please sign in again.',
}

function friendlyIntentError(e: unknown): string {
  const raw = e instanceof Error ? e.message : ''
  return INTENT_ERROR_MESSAGES[raw] ?? 'The action could not be applied.'
}

// ─── topic lookup (toast copy + dialog refresh) ───────────────────────

/** Find a scheduled topic by id anywhere in the payload's unit map. */
export function findTopicInPayload(
  payload: LessonPlannerPayload,
  topicId: string,
): ScheduledTopicDTO | null {
  const units = payload.selected?.curriculum?.units ?? []
  for (const unit of units) {
    const hit = unit.topics.find((t) => t.id === topicId)
    if (hit) return hit
  }
  return null
}

function intentSuccessToast(intent: LessonIntent, topicName: string | null): void {
  const name = topicName ?? 'the lesson'
  switch (intent) {
    case 'start':
      toast.success(`Started '${name}'`)
      break
    case 'complete':
      toast.success(`Marked '${name}' as completed`)
      break
    case 'undo':
      toast.success(`Reopened '${name}'`)
      break
    case 'flag':
      toast.success(`Flagged '${name}' for rescheduling`)
      break
    case 'unflag':
      toast.success(`Cleared the reschedule flag for '${name}'`)
      break
  }
}

// ─── the hook ─────────────────────────────────────────────────────────

export interface LessonPlannerState {
  payload: LessonPlannerPayload | null
  loading: boolean
  error: string | null
  /** the teaching intent currently in flight (single-flight UI lock) */
  acting: LessonIntent | null
  /** select a class+subject scope (both must be an active assignment) */
  load: (classId?: string, subjectId?: string) => void
  reload: () => void
  /** POST an intent; replaces the payload with the refreshed scope. Resolves false after an error toast. */
  applyIntent: (
    topicId: string,
    intent: LessonIntent,
    reason?: string,
  ) => Promise<boolean>
}

export function useLessonPlanner(): LessonPlannerState {
  const [payload, setPayload] = useState<LessonPlannerPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acting, setActing] = useState<LessonIntent | null>(null)
  const [scope, setScope] = useState<{ classId?: string; subjectId?: string }>({})
  const [tick, setTick] = useState(0)

  const mounted = useRef(true)
  const payloadRef = useRef<LessonPlannerPayload | null>(null)
  const actingRef = useRef<LessonIntent | null>(null)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // Latest payload readable from applyIntent without stale closures.
  useEffect(() => {
    payloadRef.current = payload
  }, [payload])

  // Sidebar badge: teacher-wide pending-today count, published after the
  // first load and after every successful intent. Best-effort only.
  const refreshBadge = useCallback(async () => {
    try {
      const summary = await lpRequest<LessonPlannerSummary>(
        '/api/teacher/lesson-planner?summary=1',
      )
      useTeacherHubStore.getState().setLessonPlansPending(summary.totalPendingToday)
    } catch {
      /* never block the planner on a badge refresh */
    }
  }, [])

  useEffect(() => {
    void refreshBadge()
  }, [refreshBadge])

  // Payload load — keyed on the selected scope + the reload tick.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (scope.classId && scope.subjectId) {
      params.set('classId', scope.classId)
      params.set('subjectId', scope.subjectId)
    }
    const qs = params.toString()
    lpRequest<LessonPlannerPayload>(`/api/teacher/lesson-planner${qs ? `?${qs}` : ''}`)
      .then((d) => {
        if (!cancelled && mounted.current) setPayload(d)
      })
      .catch((e: unknown) => {
        if (cancelled || !mounted.current) return
        setError(e instanceof Error ? e.message : 'Lesson Planner could not load.')
      })
      .finally(() => {
        if (!cancelled && mounted.current) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [scope, tick])

  const load = useCallback((classId?: string, subjectId?: string) => {
    setScope((cur) => {
      const next = classId && subjectId ? { classId, subjectId } : {}
      const same =
        (cur.classId ?? null) === (next.classId ?? null) &&
        (cur.subjectId ?? null) === (next.subjectId ?? null)
      if (same) return cur // selecting the visible scope is a no-op
      return next
    })
  }, [])

  const reload = useCallback(() => setTick((t) => t + 1), [])

  const applyIntent = useCallback(
    async (topicId: string, intent: LessonIntent, reason?: string): Promise<boolean> => {
      if (actingRef.current) return false // single-flight lock
      actingRef.current = intent
      setActing(intent)
      const topic = payloadRef.current
        ? findTopicInPayload(payloadRef.current, topicId)
        : null
      try {
        const data = await lpRequest<LessonPlannerPayload>(
          `/api/teacher/lesson-planner/${topicId}`,
          {
            method: 'POST',
            body: JSON.stringify(reason ? { intent, reason } : { intent }),
          },
        )
        actingRef.current = null
        if (mounted.current) setPayload(data)
        intentSuccessToast(intent, topic?.topicName ?? null)
        void refreshBadge()
        return true
      } catch (e: unknown) {
        actingRef.current = null
        toast.error(friendlyIntentError(e))
        return false
      } finally {
        if (mounted.current) setActing(null)
      }
    },
    [refreshBadge],
  )

  return { payload, loading, error, acting, load, reload, applyIntent }
}
