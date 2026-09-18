'use client'

/**
 * teacher-hub-store — cross-cutting live counts for the three Teacher Hub
 * modules. Modules publish their real server-derived counts after each load;
 * the Teacher sidebar reads the unread count for the Communication Hub badge
 * (replacing the old hardcoded badge). One store, one truth — the badge is
 * never a mock.
 */

import { create } from 'zustand'

interface TeacherHubState {
  /** unread parent messages for the signed-in teacher (server-derived) */
  parentUnread: number
  /** open follow-ups across the Teacher Hub modules (last module to publish) */
  followUpsOpen: number
  /** partial update — omitted keys keep their value (modules publish independently) */
  setCounts: (c: { parentUnread?: number; followUpsOpen?: number }) => void
  clear: () => void
}

export const useTeacherHubStore = create<TeacherHubState>((set) => ({
  parentUnread: 0,
  followUpsOpen: 0,
  setCounts: (c) =>
    set((state) => ({
      parentUnread: c.parentUnread ?? state.parentUnread,
      followUpsOpen: c.followUpsOpen ?? state.followUpsOpen,
    })),
  clear: () => set({ parentUnread: 0, followUpsOpen: 0 }),
}))
