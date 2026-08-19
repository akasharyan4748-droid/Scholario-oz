/**
 * Mock marks store — mirrors the real API contract for the mock-data phase.
 *
 * All marks mutations go through here so the workspace works without a
 * real DB. The store tracks per-student marks records with the full
 * workflow lifecycle (DRAFT → SUBMITTED → VERIFIED → LOCKED).
 */

import { create } from 'zustand'
import type { ExamMarkDTO } from '@/lib/exams/types'
import type { ExamDTO } from '@/lib/exams/types'

type MockMark = ExamMarkDTO

interface MockMarksState {
  marks: MockMark[]
  /** Initialize marks for an exam based on its classes + subjects + students. */
  initMarks: (exam: ExamDTO, students: Array<{ id: string; name: string; rollNo: string | null; classId: string; className: string }>) => void
  /** Upsert a single mark. */
  setMark: (examId: string, input: { classId: string; subjectId: string; studentId: string; marksObtained: number | null; status: MarkStatus; remarks?: string }) => MockMark | null
  /** Get marks for a specific class+subject. */
  getMarks: (examId: string, classId: string, subjectId: string) => MockMark[]
  /** Submit marks for a class+subject (DRAFT → SUBMITTED). */
  submitMarks: (examId: string, classId: string, subjectId: string) => number
  /** Verify marks (SUBMITTED → VERIFIED). */
  verifyMarks: (examId: string, classId: string, subjectId: string) => number
  /** Lock marks (any → LOCKED). */
  lockMarks: (examId: string, classId: string, subjectId: string) => number
  /** Compute mark summary for an exam. */
  computeSummary: (exam: ExamDTO) => { total: number; entered: number; submitted: number; verified: number; locked: number; pct: number }
  /** Check if all marks are locked (for result readiness). */
  allLocked: (exam: ExamDTO) => boolean
}

export const useMockMarksStore = create<MockMarksState>()((set, get) => ({
  marks: [],

  initMarks: (exam, students) => {
    const existing = get().marks.filter((m) => m.examId === exam.id)
    if (existing.length > 0) return // already initialized

    const newMarks: MockMark[] = []
    for (const examClass of exam.classes) {
      const classStudents = students.filter((s) => s.classId === examClass.classId)
      for (const subject of exam.subjects.filter((s) => s.classId === examClass.classId)) {
        for (const student of classStudents) {
          newMarks.push({
            id: `mark-${exam.id}-${subject.subjectId}-${student.id}`,
            examId: exam.id,
            classId: examClass.classId,
            subjectId: subject.subjectId,
            studentId: student.id,
            studentName: student.name,
            studentRollNo: student.rollNo,
            marksObtained: null,
            status: 'PRESENT' as MarkStatus,
            workflowStatus: 'DRAFT' as WorkflowStatus,
            originalMarks: null,
            graceMarks: 0,
            graceReason: null,
            remarks: null,
            enteredBy: null,
            enteredAt: null,
            verifiedBy: null,
            verifiedAt: null,
            lockedBy: null,
          })
        }
      }
    }
    set((state) => ({ marks: [...state.marks, ...newMarks] }))
  },

  setMark: (examId, input) => {
    const existing = get().marks.find(
      (m) => m.examId === examId && m.classId === input.classId &&
      m.subjectId === input.subjectId && m.studentId === input.studentId
    )
    if (existing?.workflowStatus === 'LOCKED') return null // can't edit locked

    const updated: MockMark = {
      ...(existing ?? {
        id: `mark-${examId}-${input.subjectId}-${input.studentId}`,
        examId, classId: input.classId, subjectId: input.subjectId, studentId: input.studentId,
        studentName: '', studentRollNo: null,
      }),
      marksObtained: input.marksObtained,
      status: input.status,
      remarks: input.remarks ?? null,
      workflowStatus: existing?.workflowStatus === 'LOCKED' ? 'LOCKED' : 'DRAFT',
      originalMarks: existing?.originalMarks ?? input.marksObtained,
      enteredBy: 'current-user',
      enteredAt: new Date().toISOString(),
    }

    set((state) => ({
      marks: existing
        ? state.marks.map((m) => m.id === existing.id ? updated : m)
        : [...state.marks, updated],
    }))
    return updated
  },

  getMarks: (examId, classId, subjectId) => {
    return get().marks.filter((m) => m.examId === examId && m.classId === classId && m.subjectId === subjectId)
  },

  submitMarks: (examId, classId, subjectId) => {
    let count = 0
    set((state) => ({
      marks: state.marks.map((m) => {
        if (m.examId === examId && m.classId === classId && m.subjectId === subjectId && m.workflowStatus === 'DRAFT') {
          count++
          return { ...m, workflowStatus: 'SUBMITTED' as WorkflowStatus }
        }
        return m
      }),
    }))
    return count
  },

  verifyMarks: (examId, classId, subjectId) => {
    let count = 0
    set((state) => ({
      marks: state.marks.map((m) => {
        if (m.examId === examId && m.classId === classId && m.subjectId === subjectId && m.workflowStatus === 'SUBMITTED') {
          count++
          return { ...m, workflowStatus: 'VERIFIED' as WorkflowStatus, verifiedBy: 'principal', verifiedAt: new Date().toISOString() }
        }
        return m
      }),
    }))
    return count
  },

  lockMarks: (examId, classId, subjectId) => {
    let count = 0
    set((state) => ({
      marks: state.marks.map((m) => {
        if (m.examId === examId && m.classId === classId && m.subjectId === subjectId && m.workflowStatus === 'VERIFIED') {
          count++
          return { ...m, workflowStatus: 'LOCKED' as WorkflowStatus, lockedBy: 'principal' }
        }
        return m
      }),
    }))
    return count
  },

  computeSummary: (exam) => {
    const examMarks = get().marks.filter((m) => m.examId === exam.id)
    const total = examMarks.length
    const entered = examMarks.filter((m) => m.marksObtained !== null).length
    const submitted = examMarks.filter((m) => ['SUBMITTED', 'VERIFIED', 'LOCKED'].includes(m.workflowStatus)).length
    const verified = examMarks.filter((m) => ['VERIFIED', 'LOCKED'].includes(m.workflowStatus)).length
    const locked = examMarks.filter((m) => m.workflowStatus === 'LOCKED').length
    const pct = total > 0 ? Math.round((entered / total) * 100) : 0
    return { total, entered, submitted, verified, locked, pct }
  },

  allLocked: (exam) => {
    const examMarks = get().marks.filter((m) => m.examId === exam.id)
    if (examMarks.length === 0) return false
    return examMarks.every((m) => m.workflowStatus === 'LOCKED')
  },
}))
