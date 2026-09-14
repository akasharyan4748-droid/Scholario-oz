'use client'

// ============================================================
// SS-1 — SIGN OUT (single, complete path)
// ------------------------------------------------------------
// Signing out must do BOTH jobs: revoke the server session (the
// erp_session cookie's Session row — /api/auth/logout) and clear the
// client demo profile (auth-store logout → back to the login screen).
// Previously the client logout left the server session alive for its
// full 7-day TTL; every sign-out surface now goes through here.
// ============================================================

import { useAuth } from '@/lib/store/auth-store'
import { useCurrentUser } from '@/lib/store/current-user-store'
import { useTeacherHubStore } from '@/lib/store/teacher-hub-store'

export async function signOut(): Promise<void> {
  // Best-effort server revocation — never blocks the client reset.
  try {
    await fetch('/api/auth/logout', { method: 'POST' })
  } catch {
    /* the cookie is cleared client-side below regardless */
  }
  useCurrentUser.getState().clear()
  useAuth.getState().logout()
  // Teacher Hub live counts belong to the signed-in teacher — never let a
  // previous session's badge leak into the next user's sidebar.
  useTeacherHubStore.getState().clear()
}
