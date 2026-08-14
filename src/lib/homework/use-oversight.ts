// ──────────────────────────────────────────────────────────────────────
// use-homework-oversight — React hooks for the Principal Homework
// oversight dashboard. All data from /api/homework/oversight/*.
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

// ─── Compliance Metrics ──────────────────────────────────────────────

export interface ComplianceMetricsDTO {
  todaysSubmissionRate: number
  teacherCompliance: number
  overloadedClasses: number
  pendingGrievances: number
  totalActiveHomework: number
  totalStudents: number
  totalTeachers: number
}

export function useComplianceMetrics() {
  const [data, setData] = useState<ComplianceMetricsDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api<ComplianceMetricsDTO>('/api/homework/oversight/metrics')
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData(null))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [reloadKey])

  return { data, loading, reload }
}

// ─── Load Matrix ──────────────────────────────────────────────────────

export interface LoadMatrixCell {
  classId: string
  className: string
  gradeLevel: string | null
  section: string | null
  homeworkCount: number
  estimatedMinutes: number
  loadLevel: 'green' | 'amber' | 'red'
}

export function useLoadMatrix(date?: string) {
  const [data, setData] = useState<{ cells: LoadMatrixCell[]; gradeLevels: string[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const url = `/api/homework/oversight/load-matrix${date ? `?date=${date}` : ''}`
    api<{ cells: LoadMatrixCell[]; gradeLevels: string[] }>(url)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData(null))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [date, reloadKey])

  return { data, loading, reload }
}

// ─── Subject Distribution ──────────────────────────────────────────────

export interface SubjectDistributionDTO {
  subjectId: string | null
  subjectName: string
  count: number
  pct: number
}

export function useSubjectDistribution() {
  const [data, setData] = useState<SubjectDistributionDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api<SubjectDistributionDTO[]>('/api/homework/oversight/subject-distribution')
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [reloadKey])

  return { data, loading, reload }
}

// ─── Teacher Activity ─────────────────────────────────────────────────

export interface TeacherActivityDTO {
  id: string
  action: string
  teacherName: string
  homeworkTitle: string
  className: string
  subjectName: string | null
  createdAt: string
}

export function useTeacherActivity() {
  const [data, setData] = useState<TeacherActivityDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api<TeacherActivityDTO[]>('/api/homework/oversight/teacher-activity')
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [reloadKey])

  return { data, loading, reload }
}

// ─── Low Submission Alerts ─────────────────────────────────────────────

export interface LowSubmissionAlertDTO {
  classId: string
  className: string
  homeworkTitle: string
  submitted: number
  total: number
  submissionRate: number
}

export function useLowSubmissionAlerts() {
  const [data, setData] = useState<LowSubmissionAlertDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api<LowSubmissionAlertDTO[]>('/api/homework/oversight/low-submission-alerts')
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [reloadKey])

  return { data, loading, reload }
}

// ─── Policy ────────────────────────────────────────────────────────────

export interface PolicyDTO {
  id: string
  gradeLevel: string
  maxMinutesPerDay: number
  enabled: boolean
}

export function usePolicies() {
  const [data, setData] = useState<PolicyDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api<PolicyDTO[]>('/api/homework/policy')
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [reloadKey])

  const update = useCallback(async (id: string, updates: { maxMinutesPerDay?: number; enabled?: boolean }) => {
    await api('/api/homework/policy', { method: 'PATCH', body: JSON.stringify({ id, ...updates }) })
    reload()
  }, [reload])

  return { data, loading, reload, update }
}

// ─── No-Homework Dates ──────────────────────────────────────────────────

export interface NoHomeworkDateDTO {
  id: string
  date: string
  reason: string | null
}

export function useNoHomeworkDates() {
  const [data, setData] = useState<NoHomeworkDateDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api<NoHomeworkDateDTO[]>('/api/homework/no-homework-dates')
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [reloadKey])

  const add = useCallback(async (date: string, reason?: string) => {
    await api('/api/homework/no-homework-dates', { method: 'POST', body: JSON.stringify({ date, reason }) })
    reload()
  }, [reload])

  const remove = useCallback(async (id: string) => {
    await api(`/api/homework/no-homework-dates/${id}`, { method: 'DELETE' })
    reload()
  }, [reload])

  return { data, loading, reload, add, remove }
}

// ─── Grievances ─────────────────────────────────────────────────────────

export interface GrievanceDTO {
  id: string
  homeworkId: string | null
  homeworkTitle: string | null
  parentName: string | null
  studentName: string | null
  subject: string
  description: string
  category: string
  status: string
  response: string | null
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
}

export function useGrievances(status?: string) {
  const [data, setData] = useState<GrievanceDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const url = `/api/homework/grievances${status ? `?status=${status}` : ''}`
    api<GrievanceDTO[]>(url)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [status, reloadKey])

  const resolve = useCallback(async (id: string, response: string, status: 'resolved' | 'dismissed' = 'resolved') => {
    await api(`/api/homework/grievances/${id}`, { method: 'PATCH', body: JSON.stringify({ response, status }) })
    reload()
  }, [reload])

  return { data, loading, reload, resolve }
}

// ─── Assignment Repository ──────────────────────────────────────────────

export interface AssignmentRepositoryItemDTO {
  id: string
  title: string
  description: string | null
  subjectName: string | null
  className: string
  teacherName: string | null
  assignedDate: string
  dueDate: string
  status: string
  submissionCount: number
  totalStudents: number
}

export function useAssignmentRepository(filters: { teacherId?: string; subjectId?: string; classId?: string; search?: string } = {}) {
  const [data, setData] = useState<AssignmentRepositoryItemDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.teacherId) params.set('teacherId', filters.teacherId)
    if (filters.subjectId) params.set('subjectId', filters.subjectId)
    if (filters.classId) params.set('classId', filters.classId)
    if (filters.search) params.set('search', filters.search)
    api<AssignmentRepositoryItemDTO[]>(`/api/homework/oversight/assignment-repository?${params.toString()}`)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [filters.teacherId, filters.subjectId, filters.classId, filters.search, reloadKey])

  return { data, loading, reload }
}

// ─── Grading Audit ─────────────────────────────────────────────────────

export function useGradingAudit() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api<any[]>('/api/homework/oversight/grading-audit')
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [reloadKey])

  return { data, loading, reload }
}

// ─── Teacher Compliance ─────────────────────────────────────────────────

export interface TeacherComplianceRowDTO {
  teacherId: string | null
  teacherName: string
  totalHomework: number
  publishedOnTime: number
  gradedPromptly: number
  compliancePct: number
  avgGradingHours: number
}

export function useTeacherCompliance() {
  const [data, setData] = useState<TeacherComplianceRowDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api<TeacherComplianceRowDTO[]>('/api/homework/oversight/teacher-compliance')
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [reloadKey])

  return { data, loading, reload }
}

// ─── Chronic Non-Submitters ──────────────────────────────────────────────

export interface ChronicNonSubmitterDTO {
  studentId: string
  studentName: string
  rollNo: string | null
  className: string
  totalAssigned: number
  missedCount: number
  missRate: number
}

export function useChronicNonSubmitters() {
  const [data, setData] = useState<ChronicNonSubmitterDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api<ChronicNonSubmitterDTO[]>('/api/homework/oversight/chronic-non-submitters')
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [reloadKey])

  return { data, loading, reload }
}
