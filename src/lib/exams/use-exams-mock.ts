/**
 * Mock Examination hooks — Spec §2 / §3 / §20.
 *
 * Mirrors the contract of `use-exams.ts` (`useExamsList`, `useCreateExam`,
 * `useDeleteExam`) but reads from the in-memory mock store instead of the
 * real `/api/exams` route. This lets the Examination module render in mock
 * mode without requiring a valid DB session.
 *
 * Academic classes + subjects come from the SHARED mock academic source
 * (`useAcademicClasses`) — the same source Students & Classes uses.
 *
 * Future phase: swap these imports back to `use-exams.ts` and the UI
 * won't change.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMockExamsStore, MOCK_ACADEMIC_YEAR } from './mock-exams-data'
import { useAcademicClasses } from '@/lib/mock/academic/use-academic-classes'
import type { ExamLevelClass } from '@/lib/mock/academic'
import type { ExamDTO, CreateExamInput } from './types'

// ─── useExamsListMock — mirrors useExamsList contract ───────────────────
//
// Returns { exams, classes, academicYear, loading, error, reload }.
// `classes` is derived from the shared mock academic source (NOT from the
// API), so it's always available and always matches Students & Classes.

interface MockClassDTO {
  id: string
  name: string
  gradeLevel: string | null
  section: string | null
  stream: string | null
  studentCount: number
  subjects: Array<{ id: string; name: string; code: string | null; fullMarks: number; passMarks: number }>
}

function toClassDTOs(examClasses: ExamLevelClass[]): MockClassDTO[] {
  return examClasses.map((c) => ({
    id: c.id,
    name: c.name,
    gradeLevel: String(c.gradeLevel),
    section: null,
    stream: c.stream,
    studentCount: 0,
    subjects: c.subjects.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      fullMarks: 100,
      passMarks: 33,
    })),
  }))
}

export function useExamsListMock() {
  const exams = useMockExamsStore((s) => s.exams)
  const examLevelClasses = useAcademicClasses()
  const classes = toClassDTOs(examLevelClasses)
  const [loading] = useState(false)
  const [error] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  // reloadKey is currently a no-op for the mock store (it's reactive already),
  // but we keep it for contract parity with the real hook.
  useEffect(() => { void reloadKey }, [reloadKey])

  return { exams, classes, academicYear: MOCK_ACADEMIC_YEAR, loading, error, reload }
}

// ─── useCreateExamMock — mirrors useCreateExam contract ─────────────────

export function useCreateExamMock() {
  const createExam = useMockExamsStore((s) => s.createExam)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const create = useCallback(async (input: CreateExamInput): Promise<ExamDTO> => {
    setLoading(true)
    try {
      const exam = createExam(input)
      setError(null)
      return exam
    } catch (e: any) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [createExam])
  return { create, loading, error }
}

// ─── useDeleteExamMock — mirrors useDeleteExam contract ─────────────────

export function useDeleteExamMock() {
  const deleteExam = useMockExamsStore((s) => s.deleteExam)
  const [loading, setLoading] = useState(false)
  const del = useCallback(async (examId: string): Promise<{ deleted: boolean }> => {
    setLoading(true)
    try {
      deleteExam(examId)
      return { deleted: true }
    } finally {
      setLoading(false)
    }
  }, [deleteExam])
  return { deleteExam: del, loading }
}

// ─── useExamMock — mirrors useExam contract ──────────────────────────────
//
// Returns { exam, loading, error, reload } for a single exam by ID.
// Reads from the mock store — no /api/exams/[id] call.

export function useExamMock(examId: string | null) {
  const exam = useMockExamsStore((s) => (examId ? s.exams.find((e) => e.id === examId) ?? null : null))
  const [loading] = useState(false)
  const [error] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])
  useEffect(() => { void reloadKey }, [reloadKey])
  return { exam, loading, error, reload }
}
