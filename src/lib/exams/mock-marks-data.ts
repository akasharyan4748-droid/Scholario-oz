/**
 * Mock marks store — paper-level workflow with demo data for Classes 9-12.
 *
 * Each (exam × class × subject) paper tracks its own lifecycle independently:
 * DRAFT → SUBMITTED → VERIFIED → LOCKED.
 * Classes can be locked/declared independently of each other.
 */

import { create } from 'zustand'
import type { ExamMarkDTO, ExamDTO, MarkStatus, WorkflowStatus } from '@/lib/exams/types'

type MockMark = ExamMarkDTO

/** Paper-level status: the aggregate status of all marks for one class+subject. */
export type PaperStatus = 'DRAFT' | 'IN_PROGRESS' | 'SUBMITTED' | 'VERIFIED' | 'LOCKED'

interface MockMarksState {
  marks: MockMark[]
  /** Per-class declaration state: Set of classIds that have been declared. */
  declaredClassIds: string[]
  /** Per-class publish state: Set of classIds that have been published. */
  publishedClassIds: string[]
  /** Initialize marks for an exam. Seeds demo data for Classes 9-12. */
  initMarks: (exam: ExamDTO, students: Array<{ id: string; name: string; rollNo: string | null; classId: string; className: string }>) => void
  /** Upsert a single mark. */
  setMark: (examId: string, input: { classId: string; subjectId: string; studentId: string; marksObtained: number | null; status: MarkStatus; remarks?: string }) => MockMark | null
  /** Get marks for a specific class+subject. */
  getMarks: (examId: string, classId: string, subjectId: string) => MockMark[]
  /** Submit marks for a class+subject paper (DRAFT → SUBMITTED). */
  submitMarks: (examId: string, classId: string, subjectId: string) => number
  /** Verify marks for a class+subject paper (SUBMITTED → VERIFIED). */
  verifyMarks: (examId: string, classId: string, subjectId: string) => number
  /** Lock marks for a class+subject paper (VERIFIED → LOCKED). */
  lockMarks: (examId: string, classId: string, subjectId: string) => number
  /** Declare results for a class. */
  declareClass: (examId: string, classId: string) => boolean
  /** Publish results for a class. */
  publishClass: (examId: string, classId: string) => number
  /** Compute paper-level status for a class+subject. */
  getPaperStatus: (examId: string, classId: string, subjectId: string) => PaperStatus
  /** Check if a class has all papers locked (result ready). */
  isClassReady: (examId: string, classId: string) => boolean
  /** Check if all marks for the exam are locked. */
  allLocked: (examId: string) => boolean
}

/** Generate random marks for demo seeding. */
function randomMark(max: number): number {
  return Math.round((Math.random() * 0.4 + 0.5) * max) // 50%-90% range
}

export const useMockMarksStore = create<MockMarksState>()((set, get) => ({
  marks: [],
  declaredClassIds: [],
  publishedClassIds: [],

  initMarks: (exam, students) => {
    const existing = get().marks.filter((m) => m.examId === exam.id)
    if (existing.length > 0) return

    const newMarks: MockMark[] = []
    // Demo states for Classes 9-12: some locked, some verified, some submitted, some in-progress.
    // Map classId → grade level to determine which demo state to use.
    const demoStates = new Map<string, { subjectStates: Record<string, WorkflowStatus> }>()

    // For each exam class, determine if it's a Class 9-12 (grade 9-12).
    for (const examClass of exam.classes) {
      const grade = parseInt(examClass.gradeLevel ?? '0', 10)
      if (grade >= 9 && grade <= 12) {
        // Seed demo states: first 2 subjects locked, next 1 verified, next 1 submitted, last 1 in-progress.
        const classSubjects = exam.subjects.filter((s) => s.classId === examClass.classId)
        const states: Record<string, WorkflowStatus> = {}
        classSubjects.forEach((subj, i) => {
          if (i === 0) states[subj.subjectId] = 'LOCKED'
          else if (i === 1) states[subj.subjectId] = 'LOCKED'
          else if (i === 2) states[subj.subjectId] = 'VERIFIED'
          else if (i === 3) states[subj.subjectId] = 'SUBMITTED'
          else states[subj.subjectId] = 'DRAFT'
        })
        demoStates.set(examClass.classId, { subjectStates: states })
      }
    }

    for (const examClass of exam.classes) {
      const classStudents = students.filter((s) => s.classId === examClass.classId)
      const demoState = demoStates.get(examClass.classId)
      for (const subject of exam.subjects.filter((s) => s.classId === examClass.classId)) {
        const targetStatus = demoState?.subjectStates[subject.subjectId] ?? 'DRAFT'
        for (const student of classStudents) {
          // For demo states that are SUBMITTED or higher, fill marks. For DRAFT, fill some.
          const shouldFill = targetStatus !== 'DRAFT' || Math.random() > 0.5
          const marks = shouldFill ? randomMark(subject.maxMarks) : null
          const wfStatus: WorkflowStatus = targetStatus === 'DRAFT' && marks !== null
            ? 'DRAFT' // In-progress: marks entered but not submitted
            : targetStatus
          newMarks.push({
            id: `mark-${exam.id}-${subject.subjectId}-${student.id}`,
            examId: exam.id,
            classId: examClass.classId,
            subjectId: subject.subjectId,
            studentId: student.id,
            studentName: student.name,
            studentRollNo: student.rollNo,
            marksObtained: marks,
            status: 'PRESENT' as MarkStatus,
            workflowStatus: wfStatus,
            originalMarks: marks,
            graceMarks: 0,
            graceReason: null,
            remarks: null,
            enteredBy: targetStatus !== 'DRAFT' ? 'demo-teacher' : null,
            enteredAt: targetStatus !== 'DRAFT' ? new Date().toISOString() : null,
            verifiedBy: (targetStatus === 'VERIFIED' || targetStatus === 'LOCKED') ? 'principal' : null,
            verifiedAt: (targetStatus === 'VERIFIED' || targetStatus === 'LOCKED') ? new Date().toISOString() : null,
            lockedBy: targetStatus === 'LOCKED' ? 'principal' : null,
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
    if (existing?.workflowStatus === 'LOCKED') return null

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
      marks: existing ? state.marks.map((m) => m.id === existing.id ? updated : m) : [...state.marks, updated],
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

  declareClass: (examId, classId) => {
    if (!get().isClassReady(examId, classId)) return false
    set((state) => ({
      declaredClassIds: [...state.declaredClassIds, `${examId}:${classId}`],
    }))
    return true
  },

  publishClass: (examId, classId) => {
    const key = `${examId}:${classId}`
    if (!get().declaredClassIds.includes(key)) return 0
    if (get().publishedClassIds.includes(key)) return 0 // idempotent
    set((state) => ({
      publishedClassIds: [...state.publishedClassIds, key],
    }))
    // Count students in this class for notification count.
    const classMarks = get().marks.filter((m) => m.examId === examId && m.classId === classId)
    const studentIds = new Set(classMarks.map((m) => m.studentId))
    return studentIds.size
  },

  getPaperStatus: (examId, classId, subjectId) => {
    const marks = get().marks.filter((m) => m.examId === examId && m.classId === classId && m.subjectId === subjectId)
    if (marks.length === 0) return 'DRAFT'
    if (marks.every((m) => m.workflowStatus === 'LOCKED')) return 'LOCKED'
    if (marks.every((m) => ['VERIFIED', 'LOCKED'].includes(m.workflowStatus))) return 'VERIFIED'
    if (marks.every((m) => ['SUBMITTED', 'VERIFIED', 'LOCKED'].includes(m.workflowStatus))) return 'SUBMITTED'
    if (marks.some((m) => m.marksObtained !== null)) return 'IN_PROGRESS'
    return 'DRAFT'
  },

  isClassReady: (examId, classId) => {
    const classMarks = get().marks.filter((m) => m.examId === examId && m.classId === classId)
    if (classMarks.length === 0) return false
    return classMarks.every((m) => m.workflowStatus === 'LOCKED')
  },

  allLocked: (examId) => {
    const examMarks = get().marks.filter((m) => m.examId === examId)
    if (examMarks.length === 0) return false
    return examMarks.every((m) => m.workflowStatus === 'LOCKED')
  },
}))
