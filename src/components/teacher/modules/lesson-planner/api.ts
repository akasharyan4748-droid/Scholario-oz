'use client'

/**
 * lesson-planner/api — the transport + type contract for the curriculum-driven
 * Lesson Planner (TWC-FE-1).
 *
 * Three endpoints, all `{ ok: true, data }` envelopes:
 *   GET  /api/teacher/lesson-planner                 → teaching assignments
 *   GET  /api/teacher/lesson-planner/plan?classId&subjectId → the full plan
 *   POST /api/teacher/lesson-planner/completion      → toggle a topic
 *
 * The types mirror src/lib/lesson-planner.ts (server truth) but are declared
 * here so the client bundle never imports the Prisma-backed server module.
 * A 401 routes through the shared signOut() exactly once, mirroring the
 * parent-connect / student-behavior request discipline.
 */

import { signOut } from '@/lib/signout'

// ─── Types (client contract — mirrors src/lib/lesson-planner.ts) ────────

export type TopicStatus =
  | 'completed'
  | 'today'
  | 'in-progress'
  | 'needs-rescheduling'
  | 'upcoming'

export interface TeachingAssignment {
  classId: string
  classLabel: string
  subjectId: string
  subjectName: string
  periodsPerWeek: number
}

export interface ScheduledTopic {
  id: string
  unitNo: number
  unitName: string
  topicNo: number
  topicName: string
  description: string | null
  periodsNeeded: number
  /** calendar day-key, e.g. "2026-09-11" */
  startDate: string
  endDate: string
  status: TopicStatus
  completedOn: string | null
}

export interface UnitProgress {
  unitNo: number
  unitName: string
  total: number
  completed: number
}

export interface LessonPlanPayload {
  classId: string
  classLabel: string
  subjectId: string
  subjectName: string
  sourceBoard: string
  sessionStart: string
  pace: {
    periodsPerWeek: number
    periodsPerDay: number
    periodMinutes: number
    teachingDaysPerWeek: number
  }
  progress: { completed: number; total: number; pct: number }
  units: UnitProgress[]
  topics: ScheduledTopic[]
  today: {
    date: string
    topic: ScheduledTopic | null
    reason: string | null
  }
  nextUp: ScheduledTopic[]
}

// ─── Transport ──────────────────────────────────────────────────────────

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
      envelope && typeof envelope.error === 'string'
        ? envelope.error
        : `Request failed (${r.status})`
    throw new Error(message)
  }
  return envelope.data as T
}

// ─── Endpoints ──────────────────────────────────────────────────────────

/** The teacher's ACTIVE (class, subject) pairs — the picker source. */
export async function fetchTeachingAssignments(): Promise<TeachingAssignment[]> {
  const d = await lpRequest<{ assignments: TeachingAssignment[] }>(
    '/api/teacher/lesson-planner',
  )
  return d.assignments
}

/** The full curriculum plan for one of the teacher's own assignments. */
export async function fetchLessonPlan(
  classId: string,
  subjectId: string,
): Promise<LessonPlanPayload> {
  const params = new URLSearchParams({ classId, subjectId })
  return lpRequest<LessonPlanPayload>(
    `/api/teacher/lesson-planner/plan?${params.toString()}`,
  )
}

/**
 * Mark a curriculum topic completed (or undo). Returns the persisted boolean;
 * callers must refetch the plan afterwards — the server remains the truth.
 */
export async function setTopicCompletion(
  topicId: string,
  completed: boolean,
): Promise<boolean> {
  const d = await lpRequest<{ completed: boolean }>(
    '/api/teacher/lesson-planner/completion',
    {
      method: 'POST',
      body: JSON.stringify({ topicId, completed }),
    },
  )
  return d.completed
}
