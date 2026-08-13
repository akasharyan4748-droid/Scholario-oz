// ──────────────────────────────────────────────────────────────────────
// use-exam-settings — React hooks for the Examination Settings API.
// All settings are school-scoped and persisted to the DB.
// ──────────────────────────────────────────────────────────────────────

'use client'

import { useState, useEffect, useCallback } from 'react'

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

// ─── Exam Types ───────────────────────────────────────────────────────

export interface ExamTypeConfigDTO {
  id: string
  name: string
  code: string | null
  enabled: boolean
  sortOrder: number
}

export function useExamTypes() {
  const [types, setTypes] = useState<ExamTypeConfigDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api<ExamTypeConfigDTO[]>('/api/exams/settings/types')
      .then((d) => !cancelled && setTypes(d))
      .catch(() => !cancelled && setTypes([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [reloadKey])

  const create = useCallback(async (data: { name: string; code?: string }) => {
    await api('/api/exams/settings/types', { method: 'POST', body: JSON.stringify(data) })
    reload()
  }, [reload])

  const update = useCallback(async (id: string, data: { name?: string; code?: string; enabled?: boolean }) => {
    await api(`/api/exams/settings/types/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    reload()
  }, [reload])

  const remove = useCallback(async (id: string) => {
    await api(`/api/exams/settings/types/${id}`, { method: 'DELETE' })
    reload()
  }, [reload])

  return { types, loading, reload, create, update, remove }
}

// ─── Grade Scales ─────────────────────────────────────────────────────

export interface GradeScaleDTO {
  id: string
  grade: string
  minPct: number
  maxPct: number
  color: string | null
  sortOrder: number
}

export function useGradeScales() {
  const [scales, setScales] = useState<GradeScaleDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api<GradeScaleDTO[]>('/api/exams/settings/grades')
      .then((d) => !cancelled && setScales(d))
      .catch(() => !cancelled && setScales([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [reloadKey])

  const create = useCallback(async (data: { grade: string; minPct: number; maxPct: number; color?: string }) => {
    await api('/api/exams/settings/grades', { method: 'POST', body: JSON.stringify(data) })
    reload()
  }, [reload])

  const update = useCallback(async (id: string, data: { grade?: string; minPct?: number; maxPct?: number; color?: string }) => {
    await api(`/api/exams/settings/grades/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    reload()
  }, [reload])

  const remove = useCallback(async (id: string) => {
    await api(`/api/exams/settings/grades/${id}`, { method: 'DELETE' })
    reload()
  }, [reload])

  return { scales, loading, reload, create, update, remove }
}

// ─── Exam Rules ───────────────────────────────────────────────────────

export function useExamRules() {
  const [rules, setRules] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api<Record<string, string>>('/api/exams/settings/rules')
      .then((d) => !cancelled && setRules(d))
      .catch(() => !cancelled && setRules({}))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [reloadKey])

  const save = useCallback(async (updatedRules: Record<string, string>) => {
    await api('/api/exams/settings/rules', { method: 'PUT', body: JSON.stringify({ rules: updatedRules }) })
    reload()
  }, [reload])

  return { rules, loading, reload, save }
}

// ─── Admit Card Config ────────────────────────────────────────────────

export interface AdmitCardConfigDTO {
  showPhoto: boolean
  showRollNumber: boolean
  showRoom: boolean
  showSeatNumber: boolean
  showTimetable: boolean
  showInstructions: boolean
  showQrCode: boolean
}

export function useAdmitCardConfig() {
  const [config, setConfig] = useState<AdmitCardConfigDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api<AdmitCardConfigDTO>('/api/exams/settings/admit-card')
      .then((d) => !cancelled && setConfig(d))
      .catch(() => !cancelled && setConfig(null))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [reloadKey])

  const save = useCallback(async (updated: Partial<AdmitCardConfigDTO>) => {
    await api('/api/exams/settings/admit-card', { method: 'PUT', body: JSON.stringify(updated) })
    reload()
  }, [reload])

  return { config, loading, reload, save }
}

// ─── Report Card Config ───────────────────────────────────────────────

export interface ReportCardConfigDTO {
  showAttendance: boolean
  showRank: boolean
  showPercentage: boolean
  showGrade: boolean
  showCoScholastic: boolean
  showRemarks: boolean
  showClassTeacherSign: boolean
  showPrincipalSign: boolean
}

export function useReportCardConfig() {
  const [config, setConfig] = useState<ReportCardConfigDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api<ReportCardConfigDTO>('/api/exams/settings/report-card')
      .then((d) => !cancelled && setConfig(d))
      .catch(() => !cancelled && setConfig(null))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [reloadKey])

  const save = useCallback(async (updated: Partial<ReportCardConfigDTO>) => {
    await api('/api/exams/settings/report-card', { method: 'PUT', body: JSON.stringify(updated) })
    reload()
  }, [reload])

  return { config, loading, reload, save }
}
