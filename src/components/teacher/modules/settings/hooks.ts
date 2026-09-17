'use client'

/**
 * TS-SETTINGS — Teacher Settings data hooks.
 *
 * Avatar/sessions reuse the role-agnostic /api/profile/avatar and
 * /api/auth/sessions routes (identity resolves from the erp_session
 * cookie). Teacher preferences go through the tenant-scoped
 * /api/teacher/settings route.
 */
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useCurrentUser } from '@/lib/store/current-user-store'
import type {
  TeacherNotificationPrefs,
  TeacherWorkspacePrefs,
} from '@/lib/user-preferences'

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

// ─── Teacher preferences (/api/teacher/settings) ────────────────────

export interface SettingsClassOption {
  id: string
  label: string
  isClassTeacher: boolean
}

export interface TeacherSettingsPayload {
  notifications: TeacherNotificationPrefs
  workspace: TeacherWorkspacePrefs
  teacher: {
    employeeId: string | null
    department: string | null
    qualification: string | null
    subjects: string | null
  }
  classes: SettingsClassOption[]
  school: {
    name: string | null
    academicYear: string | null
  }
}

export function useTeacherSettings() {
  const [data, setData] = useState<TeacherSettingsPayload | null>(null)
  const [error, setError] = useState(false)
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(false)
    try {
      const r = await fetch('/api/teacher/settings', { cache: 'no-store', credentials: 'same-origin' })
      if (!r.ok) throw new Error('failed')
      const j = await r.json()
      if (j?.data) setData(j.data as TeacherSettingsPayload)
      else throw new Error('empty')
    } catch {
      setError(true)
    }
  }, [])

  useEffect(() => { load() }, [load])

  /** Optimistically patch one notification channel; revert on failure. */
  const setNotificationPref = useCallback(async (key: keyof TeacherNotificationPrefs, value: boolean) => {
    if (!data) return
    const prev = data.notifications[key]
    const next = { ...data.notifications, [key]: value }
    setData({ ...data, notifications: next })
    setSavingKey(key)
    try {
      const r = await fetch('/api/teacher/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: next }),
      })
      const j = await r.json().catch(() => null)
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'failed')
    } catch {
      setData((cur) => (cur ? { ...cur, notifications: { ...cur.notifications, [key]: prev } } : cur))
      toast.error('Couldn\u2019t save that change — reverted.')
    } finally {
      setSavingKey(null)
    }
  }, [data])

  /** Persist the default class (validated server-side). */
  const setDefaultClass = useCallback(async (classId: string | null) => {
    if (!data) return false
    const prev = data.workspace.defaultClassId
    const next = { defaultClassId: classId }
    setData({ ...data, workspace: next })
    setSavingKey('defaultClassId')
    try {
      const r = await fetch('/api/teacher/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace: next }),
      })
      const j = await r.json().catch(() => null)
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'failed')
      toast.success(classId ? 'Default class saved' : 'Default class cleared')
      return true
    } catch (e) {
      setData((cur) => (cur ? { ...cur, workspace: { defaultClassId: prev } } : cur))
      toast.error(e instanceof Error && e.message !== 'failed' ? e.message : 'Couldn\u2019t save that change — reverted.')
      return false
    } finally {
      setSavingKey(null)
    }
  }, [data])

  return { data, error, reload: load, savingKey, setNotificationPref, setDefaultClass }
}
