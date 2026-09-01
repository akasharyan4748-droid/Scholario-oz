// ──────────────────────────────────────────────────────────────────────
// use-homework — React hooks for the Homework API.
// All data comes from /api/homework/* — no localStorage, no mock data.
// ──────────────────────────────────────────────────────────────────────

'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  HomeworkDTO,
  SubmissionDTO,
  HomeworkAuditDTO,
  HomeworkAnalyticsDTO,
  CreateHomeworkInput,
} from '@/lib/homework/service'

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })
  const body = await res.json().catch(() => ({ ok: false, error: 'Network error' }))
  if (!body.ok) throw new Error(body.error || `HTTP ${res.status}`)
  return body.data as T
}

// ─── List hook ────────────────────────────────────────────────────────

interface ClassOption {
  id: string
  name: string
  gradeLevel: string | null
  section: string | null
  studentCount: number
  subjects: Array<{ id: string; name: string; code: string | null }>
}

interface TeacherOption {
  id: string
  name: string
  email: string
  department: string | null
  employeeId: string | null
}

export function useHomeworkList() {
  const [homework, setHomework] = useState<HomeworkDTO[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api<{ homework: HomeworkDTO[]; classes: ClassOption[]; teachers: TeacherOption[] }>('/api/homework')
      .then((data) => {
        if (cancelled) return
        setHomework(data.homework)
        setClasses(data.classes)
        setTeachers(data.teachers)
        setError(null)
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [reloadKey])

  return { homework, classes, teachers, loading, error, reload }
}

// ─── Single homework ─────────────────────────────────────────────────

export function useHomework(homeworkId: string | null) {
  const [homework, setHomework] = useState<HomeworkDTO | null>(null)
  const [submissions, setSubmissions] = useState<SubmissionDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    if (!homeworkId) { setHomework(null); setSubmissions([]); return }
    let cancelled = false
    setLoading(true)
    api<{ homework: HomeworkDTO; submissions: SubmissionDTO[] }>(`/api/homework/${homeworkId}?include=submissions`)
      .then((data) => {
        if (cancelled) return
        setHomework(data.homework)
        setSubmissions(data.submissions)
        setError(null)
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [homeworkId, reloadKey])

  return { homework, submissions, loading, error, reload, setHomework, setSubmissions }
}

// ─── Analytics ────────────────────────────────────────────────────────

export function useHomeworkAnalytics() {
  const [analytics, setAnalytics] = useState<HomeworkAnalyticsDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api<HomeworkAnalyticsDTO>('/api/homework?view=analytics')
      .then((d) => !cancelled && setAnalytics(d))
      .catch(() => !cancelled && setAnalytics(null))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [reloadKey])

  return { analytics, loading, reload }
}

// ─── Audit logs ──────────────────────────────────────────────────────

export function useHomeworkAudit(homeworkId: string | null) {
  const [logs, setLogs] = useState<HomeworkAuditDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    if (!homeworkId) { setLogs([]); return }
    let cancelled = false
    setLoading(true)
    api<HomeworkAuditDTO[]>(`/api/homework/${homeworkId}/audit`)
      .then((d) => !cancelled && setLogs(d))
      .catch(() => !cancelled && setLogs([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [homeworkId, reloadKey])

  return { logs, loading, reload }
}

// ─── Mutations ────────────────────────────────────────────────────────

export function useCreateHomework() {
  const [loading, setLoading] = useState(false)
  const create = useCallback(async (input: CreateHomeworkInput): Promise<HomeworkDTO> => {
    setLoading(true)
    try {
      return await api<HomeworkDTO>('/api/homework', { method: 'POST', body: JSON.stringify(input) })
    } finally {
      setLoading(false)
    }
  }, [])
  return { create, loading }
}

export function useUpdateHomework() {
  const [loading, setLoading] = useState(false)
  const update = useCallback(async (id: string, updates: Partial<CreateHomeworkInput>): Promise<HomeworkDTO> => {
    setLoading(true)
    try {
      return await api<HomeworkDTO>(`/api/homework/${id}`, { method: 'PATCH', body: JSON.stringify(updates) })
    } finally {
      setLoading(false)
    }
  }, [])
  return { update, loading }
}

export function useDeleteHomework() {
  const [loading, setLoading] = useState(false)
  const remove = useCallback(async (id: string): Promise<void> => {
    setLoading(true)
    try {
      await api(`/api/homework/${id}`, { method: 'DELETE' })
    } finally {
      setLoading(false)
    }
  }, [])
  return { remove, loading }
}

interface ActionResult { ok?: boolean; [k: string]: unknown }

export function useHomeworkAction() {
  const [loading, setLoading] = useState(false)
  const action = useCallback(async (
    id: string,
    body: { action: string; [k: string]: unknown }
  ): Promise<HomeworkDTO | SubmissionDTO> => {
    setLoading(true)
    try {
      return await api<HomeworkDTO | SubmissionDTO>(`/api/homework/${id}/action`, {
        method: 'POST',
        body: JSON.stringify(body),
      })
    } finally {
      setLoading(false)
    }
  }, [])
  return { action, loading }
}

export type { HomeworkDTO, SubmissionDTO, HomeworkAuditDTO, HomeworkAnalyticsDTO, CreateHomeworkInput, ClassOption, TeacherOption }
