/**
 * Mock marks hooks — paper-level workflow + class-level declaration/publish.
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useMockMarksStore } from './mock-marks-data'
import { useStudentsStore } from '@/lib/store/students-store'
import type { ExamDTO, ExamMarkDTO, MarkStatus } from './types'

export function useMarksMock(examId: string | null, classId: string | null, subjectId: string | null) {
  const store = useMockMarksStore()
  const marks = (examId && classId && subjectId) ? store.getMarks(examId, classId, subjectId) : []
  return { marks, loading: false, error: null as string | null }
}

export function useSetMarkMock() {
  const setMark = useMockMarksStore((s) => s.setMark)
  const [loading, setLoading] = useState(false)
  const set = useCallback(async (examId: string, input: { classId: string; subjectId: string; studentId: string; marksObtained: number | null; status: MarkStatus; remarks?: string }): Promise<ExamMarkDTO> => {
    setLoading(true)
    try {
      const result = setMark(examId, input)
      if (!result) throw new Error('Marks are locked and cannot be edited')
      return result
    } finally { setLoading(false) }
  }, [setMark])
  return { set, loading }
}

export function useSubmitMarksMock() {
  const submit = useMockMarksStore((s) => s.submitMarks)
  const [loading, setLoading] = useState(false)
  const submitFn = useCallback(async (examId: string, filter: { classId?: string; subjectId?: string }): Promise<{ submitted: number }> => {
    setLoading(true)
    try { return { submitted: submit(examId, filter.classId ?? '', filter.subjectId ?? '') } }
    finally { setLoading(false) }
  }, [submit])
  return { submit: submitFn, loading }
}

export function useVerifyMarksMock() {
  const verify = useMockMarksStore((s) => s.verifyMarks)
  const [loading, setLoading] = useState(false)
  const verifyFn = useCallback(async (examId: string, filter: { classId?: string; subjectId?: string }): Promise<{ verified: number }> => {
    setLoading(true)
    try { return { verified: verify(examId, filter.classId ?? '', filter.subjectId ?? '') } }
    finally { setLoading(false) }
  }, [verify])
  return { verify: verifyFn, loading }
}

export function useLockMarksMock() {
  const lock = useMockMarksStore((s) => s.lockMarks)
  const [loading, setLoading] = useState(false)
  const lockFn = useCallback(async (examId: string, filter: { classId?: string; subjectId?: string }): Promise<{ locked: number }> => {
    setLoading(true)
    try { return { locked: lock(examId, filter.classId ?? '', filter.subjectId ?? '') } }
    finally { setLoading(false) }
  }, [lock])
  return { lock: lockFn, loading }
}

export function useDeclareResultsMock() {
  const declareClass = useMockMarksStore((s) => s.declareClass)
  const [loading, setLoading] = useState(false)
  const declare = useCallback(async (examId: string, classId?: string): Promise<{ declared: boolean }> => {
    setLoading(true)
    try {
      if (classId) {
        const ok = declareClass(examId, classId)
        if (!ok) throw new Error('Class is not ready (not all papers locked)')
        return { declared: true }
      }
      return { declared: true }
    } finally { setLoading(false) }
  }, [declareClass])
  return { declare, loading }
}

export function usePublishResultsMock() {
  const publishClass = useMockMarksStore((s) => s.publishClass)
  const [loading, setLoading] = useState(false)
  const publish = useCallback(async (examId: string, classId?: string): Promise<{ published: boolean; notificationsSent: number }> => {
    setLoading(true)
    try {
      if (classId) {
        const count = publishClass(examId, classId)
        if (count === 0) throw new Error('Class not declared or already published')
        return { published: true, notificationsSent: count }
      }
      return { published: true, notificationsSent: 0 }
    } finally { setLoading(false) }
  }, [publishClass])
  return { publish, loading }
}

/** Initialize mock marks when the exam workspace loads. */
export function useInitMockMarks(exam: ExamDTO | null) {
  const initMarks = useMockMarksStore((s) => s.initMarks)
  const allStudents = useStudentsStore((s) => s.students)
  useEffect(() => {
    if (!exam || exam.classes.length === 0 || exam.subjects.length === 0) return
    const students = allStudents
      .filter((s) => exam.classes.some((c) => c.classId === s.classId) && s.status === 'Active')
      .map((s) => ({ id: s.id, name: s.name, rollNo: s.rollNo, classId: s.classId, className: s.className }))
    if (students.length > 0) initMarks(exam, students)
  }, [exam, allStudents, initMarks])
}
