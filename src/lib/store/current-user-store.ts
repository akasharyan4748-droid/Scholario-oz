'use client'

// ============================================================
// SS-1 — CURRENT USER (server identity) store
// ------------------------------------------------------------
// The client auth-store carries the demo profile (which PANEL renders);
// the SERVER identity (erp_session → /api/auth/me) is the truth for
// account-level surfaces: avatar, email, session context, last login.
// AppShell populates this once on mount; Settings, the student sidebar
// identity block and the profile dropdown read from it.
// ============================================================

import { create } from 'zustand'

export interface MeSessionInfo {
  createdAt: string
  expiresAt: string
  userAgent: string | null
  ipAddress: string | null
  device: { browser: string; os: string; device: 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown' }
}

export interface MeUser {
  id: string
  email: string
  name: string
  role: string
  schoolId: string | null
  avatarUrl: string | null
  phone: string | null
  status: string
  school?: {
    id: string
    name: string
    slug: string
    code: string
    themeColor: string
    accentColor: string
    logoUrl: string | null
    academicYear: string
    plan: string
  } | null
}

interface CurrentUserState {
  me: MeUser | null
  session: MeSessionInfo | null
  lastLoginAt: string | null
  loading: boolean
  error: boolean
  /** Fetch (or re-fetch) /api/auth/me. Safe to call repeatedly. */
  refresh: () => Promise<void>
  /** Drop the cached identity (after sign-out). */
  clear: () => void
}

export const useCurrentUser = create<CurrentUserState>((set) => ({
  me: null,
  session: null,
  lastLoginAt: null,
  loading: false,
  error: false,
  refresh: async () => {
    if (useCurrentUser.getState().loading) return
    set({ loading: true, error: false })
    try {
      const r = await fetch('/api/auth/me', { cache: 'no-store' })
      if (!r.ok) throw new Error('unauthenticated')
      const j = await r.json()
      const data = j?.data ?? j
      set({
        me: data?.user ?? null,
        session: data?.session ?? null,
        lastLoginAt: data?.lastLoginAt ?? null,
        loading: false,
      })
    } catch {
      set({ me: null, session: null, lastLoginAt: null, loading: false, error: true })
    }
  },
  clear: () => set({ me: null, session: null, lastLoginAt: null, error: false }),
}))
