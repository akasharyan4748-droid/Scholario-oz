import { db } from './db'

// ============================================================
// SS-1 — USER PREFERENCES (server-persisted, Settings)
// ------------------------------------------------------------
// Single source of truth for the preference payloads stored on the
// UserPreference row (JSON-encoded per domain — SQLite has no map type).
//
// Design rules (per the Settings brief):
//   · Every key must have a REAL consumer in the app — no dead switches.
//     - notifications.* → /api/notifications-feed (server-enforced for
//       MESSAGE/ANNOUNCEMENT) + the student Notices feed (client filter).
//     - learning.*     → Dashboard study surfaces (Flashcards-due KPI,
//       Up Next TASK/REVIEW rows) — hiding them is the pref's effect.
//   · No categories for modules that no longer exist (Classwork etc.).
//   · schoolId is ALWAYS derived server-side from the session user.
// ============================================================

/** Notification channels — every key maps to a real feed surface. */
export interface NotificationPrefs {
  /** Timetable publications affecting the student's class. */
  timetable: boolean
  /** Exam schedules & result announcements. */
  exams: boolean
  /** Term fee reminders. */
  fees: boolean
  /** Overdue library books & fines (informational feed items). */
  library: boolean
  /** New messages addressed to the student (server-enforced). */
  messages: boolean
  /** School announcements/notices (server-enforced). */
  announcements: boolean
}

/** Study-surface preferences — gate the Dashboard learning reminders. */
export interface LearningPrefs {
  /** Show "Flashcards Due" KPI + Up Next · REVIEW on the dashboard. */
  flashcardReminders: boolean
  /** Show Up Next · TASK (nearest planner task) on the dashboard. */
  plannerReminders: boolean
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  timetable: true,
  exams: true,
  fees: true,
  library: true,
  messages: true,
  announcements: true,
}

export const DEFAULT_LEARNING_PREFS: LearningPrefs = {
  flashcardReminders: true,
  plannerReminders: true,
}

const BOOL_KEYS = {
  notifications: Object.keys(DEFAULT_NOTIFICATION_PREFS) as (keyof NotificationPrefs)[],
  learning: Object.keys(DEFAULT_LEARNING_PREFS) as (keyof LearningPrefs)[],
}

/** Coerce an unknown JSON-parsed object into a full prefs object (unknown
 *  keys dropped, missing keys defaulted, non-booleans rejected → default). */
export function normalizeNotificationPrefs(raw: unknown): NotificationPrefs {
  const out = { ...DEFAULT_NOTIFICATION_PREFS }
  if (!raw || typeof raw !== 'object') return out
  const obj = raw as Record<string, unknown>
  for (const key of BOOL_KEYS.notifications) {
    if (typeof obj[key] === 'boolean') out[key] = obj[key] as boolean
  }
  return out
}

export function normalizeLearningPrefs(raw: unknown): LearningPrefs {
  const out = { ...DEFAULT_LEARNING_PREFS }
  if (!raw || typeof raw !== 'object') return out
  const obj = raw as Record<string, unknown>
  for (const key of BOOL_KEYS.learning) {
    if (typeof obj[key] === 'boolean') out[key] = obj[key] as boolean
  }
  return out
}

// ============================================================
// TS-SETTINGS — TEACHER preference domains
// ------------------------------------------------------------
// Teachers store their notification channels in the SAME UserPreference
// row (`notifications` column) but with teacher-shaped keys — the row is
// per-user, so a teacher never reads student keys and vice versa.
// `workspace` holds the teacher workspace defaults (default class).
// ============================================================

/** Teacher notification channels — each maps to a real surface. */
export interface TeacherNotificationPrefs {
  /** Class attendance activity (dashboard attendance cards). */
  attendance: boolean
  /** Academic activity — marks & lesson progress surfaces. */
  academic: boolean
  /** Examination duty reminders (proctoring duties). */
  examDuty: boolean
  /** Parent Connect messages (server-enforced in /api/notifications-feed). */
  parentMessages: boolean
  /** School announcements (server-enforced in /api/notifications-feed). */
  announcements: boolean
}

/** Teacher workspace defaults — consumed by module class selectors. */
export interface TeacherWorkspacePrefs {
  /** Preferred initial class for class-scoped modules (Attendance etc.). */
  defaultClassId: string | null
}

export const DEFAULT_TEACHER_NOTIFICATION_PREFS: TeacherNotificationPrefs = {
  attendance: true,
  academic: true,
  examDuty: true,
  parentMessages: true,
  announcements: true,
}

export const DEFAULT_TEACHER_WORKSPACE_PREFS: TeacherWorkspacePrefs = {
  defaultClassId: null,
}

const TEACHER_BOOL_KEYS = Object.keys(DEFAULT_TEACHER_NOTIFICATION_PREFS) as (keyof TeacherNotificationPrefs)[]

export function normalizeTeacherNotificationPrefs(raw: unknown): TeacherNotificationPrefs {
  const out = { ...DEFAULT_TEACHER_NOTIFICATION_PREFS }
  if (!raw || typeof raw !== 'object') return out
  const obj = raw as Record<string, unknown>
  for (const key of TEACHER_BOOL_KEYS) {
    if (typeof obj[key] === 'boolean') out[key] = obj[key] as boolean
  }
  return out
}

export function normalizeTeacherWorkspacePrefs(raw: unknown): TeacherWorkspacePrefs {
  const out = { ...DEFAULT_TEACHER_WORKSPACE_PREFS }
  if (!raw || typeof raw !== 'object') return out
  const obj = raw as Record<string, unknown>
  if (typeof obj.defaultClassId === 'string') out.defaultClassId = obj.defaultClassId
  else if (obj.defaultClassId === null) out.defaultClassId = null
  return out
}

export interface TeacherPreferences {
  notifications: TeacherNotificationPrefs
  workspace: TeacherWorkspacePrefs
}

/** Load (or lazily default) a teacher's preferences. Never throws. */
export async function getTeacherPreferences(userId: string): Promise<TeacherPreferences> {
  const row = await db.userPreference.findUnique({ where: { userId } })
  return {
    notifications: normalizeTeacherNotificationPrefs(safeJson(row?.notifications)),
    workspace: normalizeTeacherWorkspacePrefs(safeJson(row?.workspace)),
  }
}

/** Upsert teacher domains. Values are normalized before writing. */
export async function saveTeacherPreferences(
  userId: string,
  schoolId: string,
  patch: { notifications?: unknown; workspace?: unknown },
): Promise<TeacherPreferences> {
  const current = await getTeacherPreferences(userId)
  const notifications = patch.notifications !== undefined
    ? normalizeTeacherNotificationPrefs(patch.notifications)
    : current.notifications
  const workspace = patch.workspace !== undefined
    ? normalizeTeacherWorkspacePrefs(patch.workspace)
    : current.workspace

  await db.userPreference.upsert({
    where: { userId },
    create: {
      userId,
      schoolId,
      notifications: JSON.stringify(notifications),
      workspace: JSON.stringify(workspace),
    },
    update: {
      notifications: JSON.stringify(notifications),
      workspace: JSON.stringify(workspace),
    },
  })
  return { notifications, workspace }
}

export interface UserPreferences {
  notifications: NotificationPrefs
  learning: LearningPrefs
}

/** Load (or lazily default) a user's preferences. Read-safe, never throws
 *  on a missing row — defaults are the honest answer until first save. */
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const row = await db.userPreference.findUnique({ where: { userId } })
  return {
    notifications: normalizeNotificationPrefs(safeJson(row?.notifications)),
    learning: normalizeLearningPrefs(safeJson(row?.learning)),
  }
}

/** Upsert one or both domains. Values are normalized before writing, so a
 *  malformed body can never poison the stored JSON. */
export async function saveUserPreferences(
  userId: string,
  schoolId: string,
  patch: { notifications?: unknown; learning?: unknown },
): Promise<UserPreferences> {
  const current = await getUserPreferences(userId)
  const notifications = patch.notifications !== undefined
    ? normalizeNotificationPrefs(patch.notifications)
    : current.notifications
  const learning = patch.learning !== undefined
    ? normalizeLearningPrefs(patch.learning)
    : current.learning

  await db.userPreference.upsert({
    where: { userId },
    create: {
      userId,
      schoolId,
      notifications: JSON.stringify(notifications),
      learning: JSON.stringify(learning),
    },
    update: {
      notifications: JSON.stringify(notifications),
      learning: JSON.stringify(learning),
    },
  })
  return { notifications, learning }
}

function safeJson(s: string | null | undefined): unknown {
  if (!s) return null
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}
