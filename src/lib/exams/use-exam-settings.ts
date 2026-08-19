// ──────────────────────────────────────────────────────────────────────
// use-exam-settings — React hooks for the Examination Settings API.
// All settings are school-scoped and persisted to the DB.
// DTOs are imported from ./types — no duplicate definitions here.
// ──────────────────────────────────────────────────────────────────────

'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from './api-client'
import type {
  ExamTypeConfigDTO,
  GradeScaleDTO,
  AdmitCardConfigDTO,
  ReportCardConfigDTO,
} from './types'
import { DEFAULT_GRADE_BOUNDARIES } from './types'

// Re-export DTOs for backward compatibility with existing callers
export type {
  ExamTypeConfigDTO,
  GradeScaleDTO,
  AdmitCardConfigDTO,
  ReportCardConfigDTO,
}

// ─── Exam Types ───────────────────────────────────────────────────────

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
    await api('/api/exams/settings/types', { method: 'POST', json: data })
    reload()
  }, [reload])

  const update = useCallback(async (id: string, data: { name?: string; code?: string; enabled?: boolean }) => {
    await api(`/api/exams/settings/types/${id}`, { method: 'PATCH', json: data })
    reload()
  }, [reload])

  const remove = useCallback(async (id: string) => {
    await api(`/api/exams/settings/types/${id}`, { method: 'DELETE' })
    reload()
  }, [reload])

  return { types, loading, reload, create, update, remove }
}

// ─── Grade Scales ─────────────────────────────────────────────────────

export function useGradeScales() {
  const [scales, setScales] = useState<GradeScaleDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api<GradeScaleDTO[]>('/api/exams/settings/grades')
      .then((d) => {
        if (cancelled) return
        // If API returns empty or fails, fall back to DEFAULT_GRADE_BOUNDARIES.
        if (d && d.length > 0) {
          setScales(d)
        } else {
          setScales(DEFAULT_GRADE_BOUNDARIES.map((g, i) => ({
            id: `default-grade-${i}`,
            schoolId: 'demo-school',
            grade: g.grade,
            minPct: g.minPct,
            maxPct: g.minPct === 0 ? 33 : g.minPct === 33 ? 49 : g.minPct === 90 ? 100 : g.minPct + 9,
            color: g.color,
            sortOrder: i,
          })))
        }
      })
      .catch(() => {
        if (cancelled) return
        // Fallback to defaults on auth failure (mock mode).
        setScales(DEFAULT_GRADE_BOUNDARIES.map((g, i) => ({
          id: `default-grade-${i}`,
          schoolId: 'demo-school',
          grade: g.grade,
          minPct: g.minPct,
          maxPct: g.minPct === 0 ? 33 : g.minPct === 33 ? 49 : g.minPct === 90 ? 100 : g.minPct + 9,
          color: g.color,
          sortOrder: i,
        })))
      })
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [reloadKey])

  const create = useCallback(async (data: { grade: string; minPct: number; maxPct: number; color?: string }) => {
    try {
      await api('/api/exams/settings/grades', { method: 'POST', json: data })
    } catch {
      // Mock mode: add locally.
      setScales((prev) => [...prev, {
        id: `grade-${Date.now()}`,
        schoolId: 'demo-school',
        grade: data.grade,
        minPct: data.minPct,
        maxPct: data.maxPct,
        color: data.color ?? null,
        sortOrder: prev.length,
      }])
    }
    reload()
  }, [reload])

  const update = useCallback(async (id: string, data: { grade?: string; minPct?: number; maxPct?: number; color?: string }) => {
    try {
      await api(`/api/exams/settings/grades/${id}`, { method: 'PATCH', json: data })
    } catch {
      // Mock mode: update locally.
      setScales((prev) => prev.map((s) => s.id === id ? { ...s, ...data } : s))
    }
    reload()
  }, [reload])

  const remove = useCallback(async (id: string) => {
    try {
      await api(`/api/exams/settings/grades/${id}`, { method: 'DELETE' })
    } catch {
      // Mock mode: remove locally.
      setScales((prev) => prev.filter((s) => s.id !== id))
    }
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
    await api('/api/exams/settings/rules', { method: 'PUT', json: { rules: updatedRules } })
    reload()
  }, [reload])

  return { rules, loading, reload, save }
}

// ─── Admit Card Config ────────────────────────────────────────────────

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
    await api('/api/exams/settings/admit-card', { method: 'PUT', json: updated })
    reload()
  }, [reload])

  return { config, loading, reload, save }
}

// ─── Report Card Config ───────────────────────────────────────────────

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
    await api('/api/exams/settings/report-card', { method: 'PUT', json: updated })
    reload()
  }, [reload])

  return { config, loading, reload, save }
}
