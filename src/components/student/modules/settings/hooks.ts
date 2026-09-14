'use client'

/**
 * SS-1 — Settings data hooks.
 *
 * Small, focused hooks for the server-backed settings surfaces. All of
 * them derive identity from the erp_session cookie (the API routes
 * resolve the caller server-side — nothing here sends ids).
 */
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useCurrentUser } from '@/lib/store/current-user-store'

// ─── Avatar upload / removal ────────────────────────────────────────

export function useAvatarUpload() {
  const me = useCurrentUser((s) => s.me)
  const refresh = useCurrentUser((s) => s.refresh)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)

  const upload = useCallback(
    async (file: File): Promise<boolean> => {
      setUploading(true)
      try {
        const form = new FormData()
        form.append('file', file)
        const r = await fetch('/api/profile/avatar', { method: 'POST', body: form })
        const j = await r.json().catch(() => null)
        if (!r.ok || !j?.ok) throw new Error(j?.error || 'Upload failed')
        await refresh()
        toast.success('Photo updated')
        return true
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Couldn\u2019t upload that photo — try another image.')
        return false
      } finally {
        setUploading(false)
      }
    },
    [refresh],
  )

  const remove = useCallback(async (): Promise<boolean> => {
    setRemoving(true)
    try {
      const r = await fetch('/api/profile/avatar', { method: 'DELETE' })
      const j = await r.json().catch(() => null)
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'Remove failed')
      await refresh()
      toast.success('Photo removed')
      return true
    } catch {
      toast.error('Couldn\u2019t remove the photo right now.')
      return false
    } finally {
      setRemoving(false)
    }
  }, [refresh])

  return {
    avatarUrl: me?.avatarUrl ?? null,
    uploading,
    removing,
    upload,
    remove,
  }
}

// ─── Devices / sessions ─────────────────────────────────────────────

export interface SessionRow {
  id: string
  isCurrent: boolean
  createdAt: string
  expiresAt: string
  ipAddress: string | null
  browser: string
  os: string
  deviceType: 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown'
}

export function useSessions() {
  const [sessions, setSessions] = useState<SessionRow[] | null>(null)
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError(false)
    try {
      const r = await fetch('/api/auth/sessions', { cache: 'no-store' })
      if (!r.ok) throw new Error('failed')
      const j = await r.json()
      setSessions(j?.data?.sessions ?? [])
    } catch {
      setError(true)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const revokeOne = useCallback(async (id: string) => {
    setBusy(true)
    try {
      const r = await fetch(`/api/auth/sessions/${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error()
      toast.success('Device signed out')
      await load()
    } catch {
      toast.error('Couldn\u2019t sign out that device.')
    } finally {
      setBusy(false)
    }
  }, [load])

  const revokeOthers = useCallback(async () => {
    setBusy(true)
    try {
      const r = await fetch('/api/auth/sessions', { method: 'DELETE' })
      const j = await r.json().catch(() => null)
      if (!r.ok || !j?.ok) throw new Error()
      const n = j?.data?.signedOut ?? 0
      toast.success(n > 0 ? `Signed out ${n} other device${n > 1 ? 's' : ''}` : 'No other devices were signed in')
      await load()
    } catch {
      toast.error('Couldn\u2019t sign out other devices.')
    } finally {
      setBusy(false)
    }
  }, [load])

  return { sessions, error, busy, reload: load, revokeOne, revokeOthers }
}

// ─── Support ────────────────────────────────────────────────────────

export interface OfficeInfo {
  schoolName: string
  phone: string | null
  email: string | null
  address: string | null
}

export function useOfficeInfo() {
  const [office, setOffice] = useState<OfficeInfo | null>(null)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setError(false)
    try {
      const r = await fetch('/api/student/support', { cache: 'no-store' })
      if (!r.ok) throw new Error()
      const j = await r.json()
      setOffice(j?.data?.office ?? null)
    } catch {
      setError(true)
    }
  }, [])

  useEffect(() => { load() }, [load])
  return { office, error, reload: load }
}

export async function sendSupportRequest(payload: {
  category: string
  subject: string
  body: string
}): Promise<{ ok: true; deliveredTo: string } | { ok: false; error: string }> {
  try {
    const r = await fetch('/api/student/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const j = await r.json().catch(() => null)
    if (!r.ok || !j?.ok) return { ok: false, error: j?.error || 'Couldn\u2019t send right now — try again.' }
    return { ok: true, deliveredTo: j?.data?.deliveredTo ?? 'School office' }
  } catch {
    return { ok: false, error: 'Network error — please try again.' }
  }
}
