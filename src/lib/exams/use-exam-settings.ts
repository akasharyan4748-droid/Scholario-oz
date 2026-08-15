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
      .then((d) => !cancelled && setScales(d))
      .catch(() => !cancelled && setScales([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [reloadKey])

  const create = useCallback(async (data: { grade: string; minPct: number; maxPct: number; color?: string }) => {
    await api('/api/exams/settings/grades', { method: 'POST', json: data })
    reload()
  }, [reload])

  const update = useCallback(async (id: string, data: { grade?: string; minPct?: number; maxPct?: number; color?: string }) => {
    await api(`/api/exams/settings/grades/${id}`, { method: 'PATCH', json: data })
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
