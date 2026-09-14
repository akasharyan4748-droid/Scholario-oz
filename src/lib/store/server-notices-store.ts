'use client'

// ============================================================
// LR-1 — Server notices store (real school announcements)
// ------------------------------------------------------------
// The student Notices module (Announcements tab + the My Feed
// "School news" slice) reads REAL announcements from
// GET /api/student/notices (Notification rows published by the
// school, audience-scoped, per-user read state). This tiny store
// caches them so every surface sees ONE copy; StudentPanel hydrates
// it on mount next to the notification-preferences hydration, and
// the Announcements tab refreshes on mount for freshness.
// ============================================================

import { create } from 'zustand'

export interface ServerNotice {
  id: string
  title: string
  message: string
  audience: string
  priority: string
  sender: string
  senderRole: string | null
  createdAt: string
  read: boolean
  readAt: string | null
}

interface ServerNoticesState {
  notices: ServerNotice[] | null
  loading: boolean
  error: boolean
  refresh: () => Promise<void>
  /** Mark one notice read (optimistic + server PATCH). */
  markRead: (id: string) => Promise<void>
}

async function fetchNotices(): Promise<ServerNotice[]> {
  const r = await fetch('/api/student/notices', { cache: 'no-store', credentials: 'same-origin' })
  if (!r.ok) throw new Error('notices unavailable')
  const j = await r.json()
  if (!j || typeof j !== 'object' || j.ok !== true || !('data' in j)) {
    throw new Error('unexpected response')
  }
  return (j.data as { notices: ServerNotice[] }).notices
}

export const useServerNotices = create<ServerNoticesState>((set, get) => ({
  notices: null,
  loading: false,
  error: false,

  refresh: async () => {
    if (get().loading) return
    set({ loading: true, error: false })
    try {
      const notices = await fetchNotices()
      set({ notices, loading: false })
    } catch {
      set({ error: true, loading: false })
    }
  },

  markRead: async (id) => {
    // Optimistic flip; the server acknowledgement is fire-and-forget but
    // failures roll the row back so the UI never claims a read that
    // wasn't persisted.
    const prev = get().notices
    set({
      notices: (prev ?? []).map((n) =>
        n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n,
      ),
    })
    try {
      await fetch('/api/notifications-feed', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id, type: 'ANNOUNCEMENT' }),
      })
    } catch {
      if (prev) set({ notices: prev })
    }
  },
}))
