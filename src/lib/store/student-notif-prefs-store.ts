'use client'

// ============================================================
// STUDENT NOTIFICATION PREFERENCES STORE (shared slice)
// ------------------------------------------------------------
// One tiny persisted store shared by the Notifications module
// (read state + Mark all read) and the Settings module (toggle
// switches + privacy). Tenant-scoped like every other store.
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createTenantScopedStorage } from '@/lib/tenant/tenant-storage'

/** Channel switches — rendered in Settings → Notification Preferences. */
export interface StudentNotifPrefs {
  homework: boolean
  exams: boolean
  fees: boolean
  library: boolean
  messages: boolean
  announcements: boolean
}

interface StudentNotifPrefsState {
  /** Notification ids the student has read (module feed read state). */
  readIds: string[]
  prefs: StudentNotifPrefs
  privacy: { showAchievements: boolean }
  markRead: (id: string) => void
  markAllRead: (ids: string[]) => void
  setPref: (key: keyof StudentNotifPrefs, value: boolean) => void
  setShowAchievements: (value: boolean) => void
}

export const useStudentNotifPrefsStore = create<StudentNotifPrefsState>()(
  persist(
    (set) => ({
      readIds: [],
      prefs: { homework: true, exams: true, fees: true, library: true, messages: true, announcements: true },
      privacy: { showAchievements: true },

      markRead: (id) =>
        set((s) => (s.readIds.includes(id) ? s : { readIds: [...s.readIds, id] })),

      markAllRead: (ids) =>
        set((s) => ({ readIds: Array.from(new Set([...s.readIds, ...ids])) })),

      setPref: (key, value) =>
        set((s) => ({ prefs: { ...s.prefs, [key]: value } })),

      setShowAchievements: (value) =>
        set((s) => ({ privacy: { showAchievements: value } })),
    }),
    {
      name: 'scholario-student-notif-prefs-v1',
      storage: createTenantScopedStorage('scholario-student-notif-prefs-v1'),
      version: 1,
      partialize: (s) => ({
        readIds: s.readIds,
        prefs: s.prefs,
        privacy: s.privacy,
      }),
    },
  ),
)
