'use client'

// ============================================================
// STUDENT NOTIFICATION PREFERENCES STORE v2 (SS-1)
// ------------------------------------------------------------
// Channel switches for the student notification surfaces. The channel
// KEYS mirror src/lib/user-preferences.ts (server truth) and every key
// has a REAL consumer:
//   · messages / announcements → server-enforced in /api/notifications-feed
//   · timetable / exams / fees / library → gate the student Notices feed
//     (client-side filter of the same derived items)
// The old client-only keys (homework — module removed) are gone; the
// dead privacy.showAchievements switch (Achievements module long gone)
// was removed with them.
//
// Persistence: SERVER (UserPreference row via PUT /api/student/settings)
// — this store is the client cache. StudentPanel hydrates it once from
// the server; setPref updates optimistically, PUTs immediately, and
// reverts on failure. readIds (feed read state) stay client-local —
// they're per-device reading progress, not a preference.
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createTenantScopedStorage } from '@/lib/tenant/tenant-storage'

/** Channel switches — MUST mirror server NotificationPrefs. */
export interface StudentNotifPrefs {
  timetable: boolean
  exams: boolean
  fees: boolean
  library: boolean
  messages: boolean
  announcements: boolean
}

/** Study-surface switches — MUST mirror server LearningPrefs. */
export interface StudentLearningPrefs {
  flashcardReminders: boolean
  plannerReminders: boolean
}

export const DEFAULT_STUDENT_NOTIF_PREFS: StudentNotifPrefs = {
  timetable: true,
  exams: true,
  fees: true,
  library: true,
  messages: true,
  announcements: true,
}

export const DEFAULT_STUDENT_LEARNING_PREFS: StudentLearningPrefs = {
  flashcardReminders: true,
  plannerReminders: true,
}

/** Feed kind (Notices module) → channel key. */
export const NOTIF_KIND_TO_PREF: Record<string, keyof StudentNotifPrefs> = {
  timetable: 'timetable',
  exam: 'exams',
  fee: 'fees',
  library: 'library',
  message: 'messages',
  announcement: 'announcements',
}

type SyncState = 'idle' | 'saving' | 'error'

interface StudentNotifPrefsState {
  /** Notification ids the student has read (module feed read state). */
  readIds: string[]
  prefs: StudentNotifPrefs
  /** Learning prefs (same server row — one cache for /api/student/settings). */
  learning: StudentLearningPrefs
  learningSync: 'idle' | 'saving' | 'error'
  /** Server sync state for the toggle UI ("Saving…" / revert on error). */
  sync: SyncState
  markRead: (id: string) => void
  markAllRead: (ids: string[]) => void
  /** Replace prefs wholesale (server hydration). */
  hydrate: (prefs: Partial<StudentNotifPrefs>) => void
  /** Optimistic toggle + immediate server PUT; reverts on failure. */
  setPref: (key: keyof StudentNotifPrefs, value: boolean) => void
  /** Learning-domain variant (PUT { learning: { key } }). */
  setLearningPref: (key: keyof StudentLearningPrefs, value: boolean) => void
}

export const useStudentNotifPrefsStore = create<StudentNotifPrefsState>()(
  persist(
    (set) => ({
      readIds: [],
      prefs: { ...DEFAULT_STUDENT_NOTIF_PREFS },
      learning: { ...DEFAULT_STUDENT_LEARNING_PREFS },
      learningSync: 'idle',
      sync: 'idle',

      markRead: (id) =>
        set((s) => (s.readIds.includes(id) ? s : { readIds: [...s.readIds, id] })),

      markAllRead: (ids) =>
        set((s) => ({ readIds: Array.from(new Set([...s.readIds, ...ids])) })),

      hydrate: (incoming) =>
        set((s) => ({
          prefs: { ...s.prefs, ...incoming },
          sync: 'idle',
        })),

      setPref: (key, value) => {
        const previous = useStudentNotifPrefsStore.getState().prefs
        set((s) => ({ prefs: { ...s.prefs, [key]: value }, sync: 'saving' }))
        fetch('/api/student/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notifications: { [key]: value } }),
        })
          .then((r) => {
            if (!r.ok) throw new Error('save failed')
            set({ sync: 'idle' })
          })
          .catch(() => {
            // Revert the optimistic value — the server did not accept it.
            set({ prefs: previous, sync: 'error' })
            setTimeout(() => {
              if (useStudentNotifPrefsStore.getState().sync === 'error') set({ sync: 'idle' })
            }, 2600)
          })
      },

      setLearningPref: (key, value) => {
        const previous = useStudentNotifPrefsStore.getState().learning
        set((s) => ({ learning: { ...s.learning, [key]: value }, learningSync: 'saving' }))
        fetch('/api/student/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ learning: { [key]: value } }),
        })
          .then((r) => {
            if (!r.ok) throw new Error('save failed')
            set({ learningSync: 'idle' })
          })
          .catch(() => {
            set({ learning: previous, learningSync: 'error' })
            setTimeout(() => {
              if (useStudentNotifPrefsStore.getState().learningSync === 'error') set({ learningSync: 'idle' })
            }, 2600)
          })
      },
    }),
    {
      name: 'scholario-student-notif-prefs-v1',
      storage: createTenantScopedStorage('scholario-student-notif-prefs-v1'),
      version: 2,
      // v1 → v2: drop the removed 'homework' channel; add 'timetable'.
      migrate: (state) => {
        const old = ((state ?? {}) as { prefs?: Record<string, boolean> }).prefs ?? {}
        return {
          ...(state as Record<string, unknown>),
          prefs: {
            timetable: true,
            exams: old.exams ?? true,
            fees: old.fees ?? true,
            library: old.library ?? true,
            messages: old.messages ?? true,
            announcements: old.announcements ?? true,
          },
        }
      },
      partialize: (s) => ({
        readIds: s.readIds,
        prefs: s.prefs,
        learning: s.learning,
      }),
    },
  ),
)

/**
 * One-shot server hydration for the student workspace (called from
 * StudentPanel mount + the Settings module): server prefs supersede the
 * localStorage cache for BOTH domains.
 */
export async function hydrateNotifPrefsFromServer(): Promise<void> {
  try {
    const r = await fetch('/api/student/settings', { cache: 'no-store' })
    if (!r.ok) return
    const j = await r.json()
    const data = j?.data
    const notifications = data?.notifications
    if (notifications && typeof notifications === 'object') {
      useStudentNotifPrefsStore.getState().hydrate(notifications)
    }
    const learning = data?.learning
    if (learning && typeof learning === 'object') {
      useStudentNotifPrefsStore.setState((s) => ({ learning: { ...s.learning, ...learning } }))
    }
  } catch {
    /* offline: the localStorage cache stays in charge */
  }
}
