/**
 * Mock marks hooks — mirror the real API hook contracts.
 * All mutations go through the Zustand mock marks store.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMockMarksStore } from './mock-marks-data'
import { useStudentsStore } from '@/lib/store/students-store'
import type { ExamDTO, ExamMarkDTO, MarkStatus } from './types'

export function useMarksMock(examId: string | null, classId: string | null, subjectId: string | null) {
  const marks = useMockMarksStore((s) => examId && classId && subjectId ? s.getMarks(examId, classId, subjectId) : [])
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
    try {
      const count = submit(examId, filter.classId ?? '', filter.subjectId ?? '')
      return { submitted: count }
    } finally { setLoading(false) }
  }, [submit])
  return { submit: submitFn, loading }
}

export function useVerifyMarksMock() {
  const verify = useMockMarksStore((s) => s.verifyMarks)
  const [loading, setLoading] = useState(false)
  const verifyFn = useCallback(async (examId: string, filter: { classId?: string; subjectId?: string }): Promise<{ verified: number }> => {
    setLoading(true)
    try {
      const count = verify(examId, filter.classId ?? '', filter.subjectId ?? '')
      return { verified: count }
    } finally { setLoading(false) }
  }, [verify])
  return { verify: verifyFn, loading }
}

export function useLockMarksMock() {
  const lock = useMockMarksStore((s) => s.lockMarks)
  const [loading, setLoading] = useState(false)
  const lockFn = useCallback(async (examId: string, filter: { classId?: string; subjectId?: string }): Promise<{ locked: number }> => {
    setLoading(true)
    try {
      const count = lock(examId, filter.classId ?? '', filter.subjectId ?? '')
      return { locked: count }
    } finally { setLoading(false) }
  }, [lock])
  return { lock: lockFn, loading }
}

export function useDeclareResultsMock() {
  const [loading, setLoading] = useState(false)
  const declare = useCallback(async (examId: string): Promise<{ declared: boolean }> => {
    setLoading(true)
    try { return { declared: true } } finally { setLoading(false) }
  }, [])
  return { declare, loading }
}

export function usePublishResultsMock() {
  const [loading, setLoading] = useState(false)
  const publish = useCallback(async (examId: string): Promise<{ published: boolean; notificationsSent: number }> => {
    setLoading(true)
    try { return { published: true, notificationsSent: 0 } } finally { setLoading(false) }
  }, [])
  return { publish, loading }
}

/** Initialize mock marks for an exam (call when exam workspace loads). */
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
