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
import { DEFAULT_GRADE_BOUNDARIES, EXAM_TYPES } from './types'

// Default exam rules (used as fallback in mock mode).
const DEFAULT_EXAM_RULES: Record<string, string> = {
  passPercentage: '33',
  graceMaxMarks: '5',
  retestWindowDays: '7',
  resultDeclarationLockHours: '24',
  autoPromoteOnPass: 'true',
  compartmentExamEnabled: 'true',
  retestEnabled: 'true',
}

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
      .then((d) => {
        if (cancelled) return
        if (d && d.length > 0) {
          setTypes(d)
        } else {
          // Fallback to EXAM_TYPES defaults.
          setTypes(EXAM_TYPES.map((name, i) => ({
            id: `default-type-${i}`,
            schoolId: 'demo-school',
            name,
            code: name.substring(0, 3).toUpperCase(),
            enabled: true,
            sortOrder: i,
          })))
        }
      })
      .catch(() => {
        if (cancelled) return
        // Fallback to defaults on auth failure (mock mode).
        setTypes(EXAM_TYPES.map((name, i) => ({
          id: `default-type-${i}`,
          schoolId: 'demo-school',
          name,
          code: name.substring(0, 3).toUpperCase(),
          enabled: true,
          sortOrder: i,
        })))
      })
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [reloadKey])

  const create = useCallback(async (data: { name: string; code?: string }) => {
    try {
      await api('/api/exams/settings/types', { method: 'POST', json: data })
    } catch {
      // Mock mode: add locally.
      setTypes((prev) => [...prev, {
        id: `type-${Date.now()}`,
        schoolId: 'demo-school',
        name: data.name,
        code: data.code ?? data.name.substring(0, 3).toUpperCase(),
        enabled: true,
        sortOrder: prev.length,
      }])
    }
    reload()
  }, [reload])

  const update = useCallback(async (id: string, data: { name?: string; code?: string; enabled?: boolean }) => {
    try {
      await api(`/api/exams/settings/types/${id}`, { method: 'PATCH', json: data })
    } catch {
      // Mock mode: update locally.
      setTypes((prev) => prev.map((t) => t.id === id ? { ...t, ...data } : t))
    }
    reload()
  }, [reload])

  const remove = useCallback(async (id: string) => {
    try {
      await api(`/api/exams/settings/types/${id}`, { method: 'DELETE' })
    } catch {
      // Mock mode: remove locally.
      setTypes((prev) => prev.filter((t) => t.id !== id))
    }
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
      .then((d) => {
        if (cancelled) return
        if (d && Object.keys(d).length > 0) {
          setRules(d)
        } else {
          setRules(DEFAULT_EXAM_RULES)
        }
      })
      .catch(() => {
        if (cancelled) return
        // Fallback to defaults on auth failure (mock mode).
        setRules(DEFAULT_EXAM_RULES)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [reloadKey])

  const save = useCallback(async (updatedRules: Record<string, string>) => {
    try {
      await api('/api/exams/settings/rules', { method: 'PUT', json: { rules: updatedRules } })
    } catch {
      // Mock mode: update locally.
      setRules(updatedRules)
    }
    reload()
  }, [reload])

  return { rules, loading, reload, save }
}

// ─── Admit Card Config ────────────────────────────────────────────────

const DEFAULT_ADMIT_CARD_CONFIG: AdmitCardConfigDTO = {
  showPhoto: false,
  showRollNumber: true,
  showRoom: true,
  showSeatNumber: true,
  showTimetable: true,
  showInstructions: true,
  showQrCode: false,
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
      .then((d) => !cancelled && setConfig(d ?? DEFAULT_ADMIT_CARD_CONFIG))
      .catch(() => !cancelled && setConfig(DEFAULT_ADMIT_CARD_CONFIG))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [reloadKey])

  const save = useCallback(async (updated: Partial<AdmitCardConfigDTO>) => {
    try {
      await api('/api/exams/settings/admit-card', { method: 'PUT', json: updated })
    } catch {
      // Mock mode: update locally.
      setConfig((prev) => ({ ...(prev ?? DEFAULT_ADMIT_CARD_CONFIG), ...updated }))
    }
    reload()
  }, [reload])

  return { config, loading, reload, save }
}

// ─── Report Card Config ───────────────────────────────────────────────

const DEFAULT_REPORT_CARD_CONFIG: ReportCardConfigDTO = {
  showAttendance: true,
  showRank: true,
  showPercentage: true,
  showGrade: true,
  showCoScholastic: false,
  showRemarks: true,
  showClassTeacherSign: true,
  showPrincipalSign: true,
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
      .then((d) => !cancelled && setConfig(d ?? DEFAULT_REPORT_CARD_CONFIG))
      .catch(() => !cancelled && setConfig(DEFAULT_REPORT_CARD_CONFIG))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [reloadKey])

  const save = useCallback(async (updated: Partial<ReportCardConfigDTO>) => {
    try {
      await api('/api/exams/settings/report-card', { method: 'PUT', json: updated })
    } catch {
      // Mock mode: update locally.
      setConfig((prev) => ({ ...(prev ?? DEFAULT_REPORT_CARD_CONFIG), ...updated }))
    }
    reload()
  }, [reload])

  return { config, loading, reload, save }
}
