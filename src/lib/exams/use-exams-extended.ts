// ──────────────────────────────────────────────────────────────────────
// use-exams-extended — React hooks for P1 & P2 exam features.
// ──────────────────────────────────────────────────────────────────────

'use client'

import { useState, useEffect, useCallback } from 'react'
import { type ExamDTO, type MarkStatus } from './types'

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

// ─── Schedule item update ─────────────────────────────────────────────

export function useUpdateScheduleItemV2() {
  const [loading, setLoading] = useState(false)
  const update = useCallback(async (
    examId: string,
    itemId: string,
    updates: { date?: string; startTime?: string; endTime?: string; room?: string; invigilatorId?: string | null; invigilatorName?: string | null }
  ): Promise<void> => {
    setLoading(true)
    try {
      await api(`/api/exams/${examId}/schedule/items/${itemId}`, { method: 'PATCH', body: JSON.stringify(updates) })
    } finally {
      setLoading(false)
    }
  }, [])
  return { update, loading }
}

// ─── Invigilator roster ───────────────────────────────────────────────

export interface TeacherDTO {
  id: string
  name: string
  email: string | null
  department: string | null
  employeeId: string | null
  assignedCount: number
}

export function useTeachers(examId: string | null) {
  const [teachers, setTeachers] = useState<TeacherDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    if (!examId) { setTeachers([]); return }
    let cancelled = false
    setLoading(true)
    api<TeacherDTO[]>(`/api/exams/${examId}/invigilator`)
      .then((d) => !cancelled && setTeachers(d))
      .catch(() => !cancelled && setTeachers([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [examId, reloadKey])

  return { teachers, loading, reload }
}

export function useAssignInvigilator() {
  const [loading, setLoading] = useState(false)
  const assign = useCallback(async (examId: string, scheduleItemId: string, teacherId: string): Promise<void> => {
    setLoading(true)
    try {
      await api(`/api/exams/${examId}/invigilator`, { method: 'POST', body: JSON.stringify({ scheduleItemId, teacherId }) })
    } finally {
      setLoading(false)
    }
  }, [])
  return { assign, loading }
}

// ─── Seating plan ─────────────────────────────────────────────────────

export interface SeatAssignmentDTO {
  id: string
  examId: string
  classId: string
  className: string
  studentId: string
  studentName: string
  studentRollNo: string | null
  room: string
  seatNumber: number
  row: number | null
  column: number | null
}

export function useSeatingPlan(examId: string | null, classId: string | null) {
  const [seats, setSeats] = useState<SeatAssignmentDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    if (!examId) { setSeats([]); return }
    let cancelled = false
    setLoading(true)
    const url = `/api/exams/${examId}/seating${classId ? `?classId=${classId}` : ''}`
    api<SeatAssignmentDTO[]>(url)
      .then((d) => !cancelled && setSeats(d))
      .catch(() => !cancelled && setSeats([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [examId, classId, reloadKey])

  return { seats, loading, reload }
}

export function useGenerateSeating() {
  const [loading, setLoading] = useState(false)
  const generate = useCallback(async (
    examId: string,
    classId: string,
    rooms: Array<{ name: string; capacity: number }>
  ): Promise<{ generated: number }> => {
    setLoading(true)
    try {
      return await api<{ generated: number }>(`/api/exams/${examId}/seating/generate`, {
        method: 'POST',
        body: JSON.stringify({ classId, rooms }),
      })
    } finally {
      setLoading(false)
    }
  }, [])
  return { generate, loading }
}

// ─── Exam attendance ──────────────────────────────────────────────────

export interface ExamAttendanceDTO {
  id: string
  examId: string
  scheduleItemId: string | null
  classId: string
  studentId: string
  studentName: string
  studentRollNo: string | null
  subjectId: string | null
  subjectName: string | null
  date: string
  status: MarkStatus
  remarks: string | null
}

export function useExamAttendance(examId: string | null, classId: string | null) {
  const [attendance, setAttendance] = useState<ExamAttendanceDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    if (!examId) { setAttendance([]); return }
    let cancelled = false
    setLoading(true)
    const url = `/api/exams/${examId}/attendance${classId ? `?classId=${classId}` : ''}`
    api<ExamAttendanceDTO[]>(url)
      .then((d) => !cancelled && setAttendance(d))
      .catch(() => !cancelled && setAttendance([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [examId, classId, reloadKey])

  return { attendance, loading, reload }
}

export function useMarkExamAttendance() {
  const [loading, setLoading] = useState(false)
  const mark = useCallback(async (
    examId: string,
    input: {
      scheduleItemId?: string
      classId: string
      studentId: string
      subjectId?: string
      date: string
      status: MarkStatus
      remarks?: string
    }
  ): Promise<void> => {
    setLoading(true)
    try {
      await api(`/api/exams/${examId}/attendance`, { method: 'POST', body: JSON.stringify(input) })
    } finally {
      setLoading(false)
    }
  }, [])
  return { mark, loading }
}

export function useAutoMarkAttendance() {
  const [loading, setLoading] = useState(false)
  const autoMark = useCallback(async (examId: string, classId: string): Promise<{ marked: number }> => {
    setLoading(true)
    try {
      return await api<{ marked: number }>(`/api/exams/${examId}/attendance/auto`, {
        method: 'POST',
        body: JSON.stringify({ classId }),
      })
    } finally {
      setLoading(false)
    }
  }, [])
  return { autoMark, loading }
}

// ─── Grace marks ──────────────────────────────────────────────────────

export function useApplyGrace() {
  const [loading, setLoading] = useState(false)
  const apply = useCallback(async (
    examId: string,
    markId: string,
    graceMarks: number,
    reason: string
  ): Promise<void> => {
    setLoading(true)
    try {
      await api(`/api/exams/${examId}/grace`, { method: 'POST', body: JSON.stringify({ markId, graceMarks, reason }) })
    } finally {
      setLoading(false)
    }
  }, [])
  return { apply, loading }
}

// ─── Outcomes (Promotion/Compartment/Retest) ─────────────────────────

export interface ResultOutcomeDTO {
  id: string
  examId: string
  studentId: string
  studentName: string
  studentRollNo: string | null
  classId: string
  className: string
  outcome: 'PROMOTED' | 'COMPARTMENT' | 'RETEST' | 'NOT_PROMOTED'
  reason: string | null
  overrideBy: string | null
  notes: string | null
  percentage: number
  grade: string
  passed: boolean
  subjectsFailed: number
}

export function useOutcomes(examId: string | null, classId: string | null) {
  const [outcomes, setOutcomes] = useState<ResultOutcomeDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    if (!examId) { setOutcomes([]); return }
    let cancelled = false
    setLoading(true)
    const url = `/api/exams/${examId}/outcomes${classId ? `?classId=${classId}` : ''}`
    api<ResultOutcomeDTO[]>(url)
      .then((d) => !cancelled && setOutcomes(d))
      .catch(() => !cancelled && setOutcomes([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [examId, classId, reloadKey])

  return { outcomes, loading, reload }
}

export function useComputeOutcomes() {
  const [loading, setLoading] = useState(false)
  const compute = useCallback(async (examId: string, classId: string): Promise<{ autoCount: number }> => {
    setLoading(true)
    try {
      return await api<{ autoCount: number }>(`/api/exams/${examId}/outcomes/compute`, {
        method: 'POST',
        body: JSON.stringify({ classId }),
      })
    } finally {
      setLoading(false)
    }
  }, [])
  return { compute, loading }
}

export function useOverrideOutcome() {
  const [loading, setLoading] = useState(false)
  const override = useCallback(async (
    examId: string,
    studentId: string,
    outcome: 'PROMOTED' | 'COMPARTMENT' | 'RETEST' | 'NOT_PROMOTED',
    reason?: string,
    notes?: string
  ): Promise<void> => {
    setLoading(true)
    try {
      await api(`/api/exams/${examId}/outcomes/${studentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ outcome, reason, notes }),
      })
    } finally {
      setLoading(false)
    }
  }, [])
  return { override, loading }
}

// ─── CSV Import ───────────────────────────────────────────────────────

export interface CsvImportRow {
  rollNo: string
  studentName: string
  marksObtained: number | null
  status: MarkStatus
  remarks?: string
}

export interface CsvImportResult {
  accepted: number
  rejected: number
  errors: Array<{ row: number; message: string }>
  applied: Array<{ studentId: string; studentName: string; marks: number | null; status: MarkStatus }>
}

export function useImportMarksCsv() {
  const [loading, setLoading] = useState(false)
  const importCsv = useCallback(async (
    examId: string,
    classId: string,
    subjectId: string,
    rows: CsvImportRow[]
  ): Promise<CsvImportResult> => {
    setLoading(true)
    try {
      return await api<CsvImportResult>(`/api/exams/${examId}/marks/import`, {
        method: 'POST',
        body: JSON.stringify({ classId, subjectId, rows }),
      })
    } finally {
      setLoading(false)
    }
  }, [])
  return { importCsv, loading }
}

export async function downloadCsvTemplate(examId: string, classId: string, subjectId: string): Promise<void> {
  const res = await fetch(`/api/exams/${examId}/marks/template?classId=${classId}&subjectId=${subjectId}`, {
    credentials: 'include',
  })
  const body = await res.json().catch(() => null)
  if (!body?.ok) throw new Error(body?.error || 'Failed to download template')
  const { csv, filename } = body.data
  // Trigger download
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Result Publication ──────────────────────────────────────────────

export function usePublishResults() {
  const [loading, setLoading] = useState(false)
  const publish = useCallback(async (
    examId: string,
    options: { notifyStudents?: boolean; notifyParents?: boolean } = {}
  ): Promise<{ published: boolean; notificationsSent: number }> => {
    setLoading(true)
    try {
      return await api(`/api/exams/${examId}/publish`, {
        method: 'POST',
        body: JSON.stringify(options),
      })
    } finally {
      setLoading(false)
    }
  }, [])
  return { publish, loading }
}

// ─── Admit Cards Batch ────────────────────────────────────────────────

export interface AdmitCardStudent {
  id: string
  name: string
  rollNo: string
  admissionNo: string | null
  className: string
  room: string | null
  seatNumber: number | null
  schedule: Array<{
    id: string
    subjectId: string | null
    subjectName: string | null
    date: string
    startTime: string
    endTime: string
    room: string | null
    invigilatorName: string | null
  }>
}

export async function fetchAdmitCardsBatch(
  examId: string,
  classId: string,
  studentIds?: string[]
): Promise<{ exam: Partial<ExamDTO>; students: AdmitCardStudent[] }> {
  return api(`/api/exams/${examId}/admit-cards`, {
    method: 'POST',
    body: JSON.stringify({ classId, studentIds }),
  })
}
