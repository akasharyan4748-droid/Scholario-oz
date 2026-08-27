/**
 * Mock outcomes store — derives promotion/compartment/retest outcomes
 * from the canonical marks store.
 *
 * Outcomes are NOT independently mocked. They are computed from the
 * marks data using the standard rules:
 *   - All subjects passed → PROMOTED
 *   - 1 subject failed → COMPARTMENT
 *   - 2 subjects failed → RETEST
 *   - 3+ subjects failed → NOT_PROMOTED
 *   - ABSENT in all subjects → NOT_PROMOTED
 *
 * For Completed/Ongoing exams with declared results, outcomes auto-compute
 * on first access. Principal can override any outcome with a reason.
 */

import { create } from 'zustand'
import { useMockMarksStore } from './mock-marks-data'
import { useMockAuditStore } from './mock-audit-data'
import { getGradeForPercentage } from './types'
import type { ExamDTO } from './types'

export type Outcome = 'PROMOTED' | 'COMPARTMENT' | 'RETEST' | 'NOT_PROMOTED'

export interface StudentOutcome {
  id: string
  examId: string
  studentId: string
  studentName: string
  studentRollNo: string | null
  classId: string
  className: string
  outcome: Outcome
  reason: string | null
  overrideBy: string | null
  notes: string | null
  percentage: number
  grade: string
  passed: boolean
  subjectsFailed: number
  subjectsCount: number
  isAbsentInAll: boolean
  createdAt: string
  updatedAt: string
}

interface MockOutcomesState {
  outcomes: StudentOutcome[]
  /** Initialize + auto-compute outcomes for an exam (if marks exist). */
  initOutcomes: (exam: ExamDTO) => void
  /** Compute outcomes for a class from marks. */
  computeForClass: (examId: string, classId: string) => number
  /** Override a student's outcome. */
  overrideOutcome: (examId: string, studentId: string, outcome: Outcome, reason: string) => boolean
  /** Get outcomes for a class. */
  getOutcomes: (examId: string, classId: string) => StudentOutcome[]
}

/** Compute a single student's outcome from their marks. */
function computeOutcome(
  studentId: string,
  studentName: string,
  studentRollNo: string | null,
  classId: string,
  className: string,
  marks: any[],
  subjects: any[],
): { outcome: Outcome; percentage: number; grade: string; passed: boolean; subjectsFailed: number; subjectsCount: number; isAbsentInAll: boolean } {
  let totalObtained = 0
  let totalMax = 0
  let subjectsFailed = 0
  let subjectsCount = 0
  let absentCount = 0

  for (const subj of subjects) {
    const mark = marks.find((m) => m.studentId === studentId && m.subjectId === subj.subjectId)
    if (!mark) continue
    subjectsCount++
    if (mark.status === 'ABSENT' || mark.marksObtained === null) {
      absentCount++
      subjectsFailed++
      totalMax += subj.maxMarks
      continue
    }
    totalObtained += mark.marksObtained
    totalMax += subj.maxMarks
    const pct = subj.maxMarks > 0 ? (mark.marksObtained / subj.maxMarks) * 100 : 0
    if (pct < 33) subjectsFailed++
  }

  const isAbsentInAll = absentCount === subjectsCount && subjectsCount > 0
  const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100 * 100) / 100 : 0
  const { grade } = getGradeForPercentage(percentage, [])

  let outcome: Outcome
  if (isAbsentInAll) {
    outcome = 'NOT_PROMOTED'
  } else if (subjectsFailed === 0) {
    outcome = 'PROMOTED'
  } else if (subjectsFailed === 1) {
    outcome = 'COMPARTMENT'
  } else if (subjectsFailed === 2) {
    outcome = 'RETEST'
  } else {
    outcome = 'NOT_PROMOTED'
  }

  return { outcome, percentage, grade, passed: subjectsFailed === 0, subjectsFailed, subjectsCount, isAbsentInAll }
}

export const useMockOutcomesStore = create<MockOutcomesState>()((set, get) => ({
  outcomes: [],

  initOutcomes: (exam) => {
    const existing = get().outcomes.filter((o) => o.examId === exam.id)
    if (existing.length > 0) return

    const marksStore = useMockMarksStore.getState()
    const allMarks = marksStore.marks.filter((m) => m.examId === exam.id)
    if (allMarks.length === 0) return

    const newOutcomes: StudentOutcome[] = []
    const now = new Date().toISOString()

    for (const examClass of exam.classes) {
      const classSubjects = exam.subjects.filter((s: any) => s.classId === examClass.classId)
      const classMarks = allMarks.filter((m) => m.classId === examClass.classId)
      const studentIds = new Set(classMarks.map((m) => m.studentId))

      for (const studentId of studentIds) {
        const studentMarks = classMarks.filter((m) => m.studentId === studentId)
        const firstMark = studentMarks[0]
        if (!firstMark) continue
        const result = computeOutcome(
          studentId,
          firstMark.studentName,
          firstMark.studentRollNo,
          examClass.classId,
          examClass.className,
          classMarks,
          classSubjects,
        )
        newOutcomes.push({
          id: `outcome-${exam.id}-${studentId}`,
          examId: exam.id,
          studentId,
          studentName: firstMark.studentName,
          studentRollNo: firstMark.studentRollNo,
          classId: examClass.classId,
          className: examClass.className,
          outcome: result.outcome,
          reason: null,
          overrideBy: null,
          notes: null,
          percentage: result.percentage,
          grade: result.grade,
          passed: result.passed,
          subjectsFailed: result.subjectsFailed,
          subjectsCount: result.subjectsCount,
          isAbsentInAll: result.isAbsentInAll,
          createdAt: now,
          updatedAt: now,
        })
      }
    }

    set((state) => ({ outcomes: [...state.outcomes, ...newOutcomes] }))
  },

  computeForClass: (examId, classId) => {
    // Trigger marks init if needed via the marks store.
    const marksStore = useMockMarksStore.getState()
    const allMarks = marksStore.marks.filter((m) => m.examId === examId && m.classId === classId)
    if (allMarks.length === 0) return 0

    // Remove existing outcomes for this class+exam (re-compute).
    set((state) => ({
      outcomes: state.outcomes.filter((o) => !(o.examId === examId && o.classId === classId)),
    }))

    // We need the exam to get subjects — use the marks store's meta cache.
    // Since we don't have the exam object here, derive from marks.
    const classMarks = allMarks.filter((m) => m.classId === classId)
    const studentIds = new Set(classMarks.map((m) => m.studentId))
    const now = new Date().toISOString()
    const newOutcomes: StudentOutcome[] = []

    // Group marks by subject to build a pseudo-subjects list.
    const subjectMap = new Map<string, { subjectId: string; maxMarks: number }>()
    for (const m of classMarks) {
      if (!subjectMap.has(m.subjectId)) {
        // We don't have maxMarks here directly — use 100 as fallback.
        // The marks store has the exam meta; for accuracy we'd need it.
        // For now, use the exam's subjects via the initOutcomes path.
        subjectMap.set(m.subjectId, { subjectId: m.subjectId, maxMarks: 100 })
      }
    }
    const pseudoSubjects = Array.from(subjectMap.values())

    const className = (classMarks[0] as { className?: string })?.className ?? ''

    for (const studentId of studentIds) {
      const studentMarks = classMarks.filter((m) => m.studentId === studentId)
      const firstMark = studentMarks[0]
      if (!firstMark) continue
      const result = computeOutcome(
        studentId,
        firstMark.studentName,
        firstMark.studentRollNo,
        classId,
        className,
        classMarks,
        pseudoSubjects,
      )
      newOutcomes.push({
        id: `outcome-${examId}-${studentId}`,
        examId,
        studentId,
        studentName: firstMark.studentName,
        studentRollNo: firstMark.studentRollNo,
        classId,
        className,
        outcome: result.outcome,
        reason: null,
        overrideBy: null,
        notes: null,
        percentage: result.percentage,
        grade: result.grade,
        passed: result.passed,
        subjectsFailed: result.subjectsFailed,
        subjectsCount: result.subjectsCount,
        isAbsentInAll: result.isAbsentInAll,
        createdAt: now,
        updatedAt: now,
      })
    }

    set((state) => ({ outcomes: [...state.outcomes, ...newOutcomes] }))

    // Record audit event.
    useMockAuditStore.getState().recordEvent({
      examId,
      action: 'OUTCOME_OVERRIDDEN',
      summary: `Outcomes computed for ${className} — ${newOutcomes.length} students`,
      entityType: 'class',
      entityId: `${examId}:${classId}`,
      metadata: {
        className,
        promoted: newOutcomes.filter((o) => o.outcome === 'PROMOTED').length,
        compartment: newOutcomes.filter((o) => o.outcome === 'COMPARTMENT').length,
        retest: newOutcomes.filter((o) => o.outcome === 'RETEST').length,
        notPromoted: newOutcomes.filter((o) => o.outcome === 'NOT_PROMOTED').length,
      },
      userId: 'principal',
      userName: 'Principal',
      userRole: 'PRINCIPAL',
      oldValue: null,
      newValue: 'computed',
    })

    return newOutcomes.length
  },

  overrideOutcome: (examId, studentId, outcome, reason) => {
    const existing = get().outcomes.find((o) => o.examId === examId && o.studentId === studentId)
    if (!existing) return false
    const oldOutcome = existing.outcome
    set((state) => ({
      outcomes: state.outcomes.map((o) =>
        o.examId === examId && o.studentId === studentId
          ? { ...o, outcome, reason, overrideBy: 'principal', updatedAt: new Date().toISOString() }
          : o,
      ),
    }))
    useMockAuditStore.getState().recordEvent({
      examId,
      action: 'OUTCOME_OVERRIDDEN',
      summary: `Outcome overridden for ${existing.studentName}: ${oldOutcome} → ${outcome}`,
      entityType: 'student',
      entityId: `${examId}:${studentId}`,
      metadata: { studentName: existing.studentName, className: existing.className, oldOutcome, newOutcome: outcome, reason },
      userId: 'principal',
      userName: 'Principal',
      userRole: 'PRINCIPAL',
      oldValue: oldOutcome,
      newValue: outcome,
    })
    return true
  },

  getOutcomes: (examId, classId) => {
    return get().outcomes.filter((o) => o.examId === examId && o.classId === classId)
  },
}))
