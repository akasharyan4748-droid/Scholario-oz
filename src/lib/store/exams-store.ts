'use client'

/**
 * exams-store — Zustand store for the Examinations module.
 *
 * This is THE functional engine. All exam CRUD, marks entry, result
 * calculation, and submission/lock state live here and persist to
 * localStorage so data survives refreshes.
 *
 * P0 Pipeline:
 *   createExam → enterMarks → submitMarks → calculateResults → gradeSheet → PDF
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  class2AAttendance,
  classSections,
} from '@/lib/mock/attendance'
import {
  EXAMS as SEED_EXAMS,
  type Exam,
  type ExamType,
  type ExamStatus,
  type ResultStatus,
  type ExamSubject,
  type ExamClassConfig,
  type ScheduleEntry,
  type StudentMark,
  type SubjectMarks,
  calculateResult,
  getExamMarksProgress,
  PASSING_PERCENTAGE,
  GRADE_BOUNDARIES,
  getGradeForPercentage,
  ACADEMIC_SESSION,
  DEFAULT_SUBJECTS_2A,
} from '@/lib/mock/exams-data'

// ──────────────────────────────────────────────────────────────────────
// STORE TYPES
// ──────────────────────────────────────────────────────────────────────

interface ExamsStoreState {
  exams: Exam[]

  // CRUD
  createExam: (data: CreateExamInput) => string
  updateExam: (id: string, updates: Partial<Exam>) => void
  deleteExam: (id: string) => void
  getExam: (id: string) => Exam | undefined

  // Marks
  setStudentMark: (examId: string, classId: string, subjectId: string, studentId: string, marks: number | null, isAbsent: boolean) => void
  submitMarks: (examId: string, classId: string, subjectId: string) => void
  lockMarks: (examId: string) => void
  declareResults: (examId: string) => void

  // Reset
  resetToSeed: () => void
}

export interface CreateExamInput {
  name: string
  type: ExamType
  session: string
  startDate: string
  endDate: string
  classIds: string[]
  subjects: ExamSubject[]
  schedule: ScheduleEntry[]
}

// ──────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────

function buildEmptyMarksForClass(classId: string, subjects: ExamSubject[]): SubjectMarks[] {
  const classSection = classSections.find((c) => c.id === classId)
  if (!classSection) return []

  return subjects.map((sub) => ({
    subjectId: sub.id,
    subjectName: sub.name,
    maxMarks: sub.maxMarks,
    marks: class2AAttendance.map((s) => ({
      studentId: s.rollNo,
      studentName: s.name,
      rollNo: s.rollNo,
      marksObtained: null,
      isAbsent: false,
    })),
  }))
}

// ──────────────────────────────────────────────────────────────────────
// STORE
// ──────────────────────────────────────────────────────────────────────

export const useExamsStore = create<ExamsStoreState>()(
  persist(
    (set, get) => ({
      exams: SEED_EXAMS,

      createExam: (data) => {
        const id = `EX-${Date.now().toString().slice(-6)}`
        const classConfigs: ExamClassConfig[] = data.classIds.map((classId) => {
          const classSection = classSections.find((c) => c.id === classId)
          return {
            classId,
            className: classSection?.name || classId,
            subjects: data.subjects,
            marks: buildEmptyMarksForClass(classId, data.subjects),
          }
        })

        const newExam: Exam = {
          id,
          name: data.name,
          type: data.type,
          session: data.session as any,
          startDate: data.startDate,
          endDate: data.endDate,
          classes: data.classIds.map((id) => classSections.find((c) => c.id === id)?.name || id),
          status: 'Draft',
          resultStatus: 'Not Started',
          classConfigs,
          schedule: data.schedule,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({ exams: [...state.exams, newExam] }))
        return id
      },

      updateExam: (id, updates) => {
        set((state) => ({
          exams: state.exams.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }))
      },

      deleteExam: (id) => {
        set((state) => ({
          exams: state.exams.filter((e) => e.id !== id),
        }))
      },

      getExam: (id) => get().exams.find((e) => e.id === id),

      setStudentMark: (examId, classId, subjectId, studentId, marks, isAbsent) => {
        set((state) => ({
          exams: state.exams.map((exam) => {
            if (exam.id !== examId) return exam

            // Check if marks are locked
            if (exam.resultStatus === 'Result Declared') return exam

            return {
              ...exam,
              resultStatus: 'Marks Entry' as ResultStatus,
              classConfigs: exam.classConfigs.map((cc) => {
                if (cc.classId !== classId) return cc
                return {
                  ...cc,
                  marks: cc.marks.map((sm) => {
                    if (sm.subjectId !== subjectId) return sm
                    return {
                      ...sm,
                      marks: sm.marks.map((m) => {
                        if (m.studentId !== studentId) return m
                        return { ...m, marksObtained: marks, isAbsent }
                      }),
                    }
                  }),
                }
              }),
            }
          }),
        }))
      },

      submitMarks: (examId, classId, subjectId) => {
        // Marks submission moves the exam's resultStatus to 'Under Verification'
        // if ALL subjects for ALL classes have marks entered
        set((state) => {
          const exam = state.exams.find((e) => e.id === examId)
          if (!exam) return state

          // Check if ALL marks are entered across all classes and subjects
          let allComplete = true
          for (const cc of exam.classConfigs) {
            for (const sm of cc.marks) {
              const entered = sm.marks.filter((m) => m.marksObtained !== null || m.isAbsent).length
              if (entered < sm.marks.length) {
                allComplete = false
                break
              }
            }
            if (!allComplete) break
          }

          return {
            exams: state.exams.map((e) =>
              e.id === examId
                ? {
                    ...e,
                    resultStatus: allComplete ? 'Under Verification' as ResultStatus : 'Marks Entry' as ResultStatus,
                  }
                : e
            ),
          }
        })
      },

      lockMarks: (examId) => {
        // Move from 'Under Verification' to 'Result Ready'
        set((state) => ({
          exams: state.exams.map((e) =>
            e.id === examId && e.resultStatus === 'Under Verification'
              ? { ...e, resultStatus: 'Result Ready' as ResultStatus }
              : e
          ),
        }))
      },

      declareResults: (examId) => {
        // Move from 'Result Ready' to 'Result Declared' — marks become immutable
        set((state) => ({
          exams: state.exams.map((e) =>
            e.id === examId && e.resultStatus === 'Result Ready'
              ? { ...e, resultStatus: 'Result Declared' as ResultStatus, status: 'Completed' as ExamStatus }
              : e
          ),
        }))
      },

      resetToSeed: () => {
        set({ exams: SEED_EXAMS })
      },
    }),
    {
      name: 'scholario-exams-store',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} }
        }
        return window.localStorage
      }),
      partialize: (state) => ({ exams: state.exams }),
    }
  )
)

// ──────────────────────────────────────────────────────────────────────
// RE-EXPORT CALCULATION FUNCTIONS (so components import from one place)
// ──────────────────────────────────────────────────────────────────────

export {
  calculateResult,
  getExamMarksProgress,
  getGradeForPercentage,
  PASSING_PERCENTAGE,
  GRADE_BOUNDARIES,
  ACADEMIC_SESSION,
}

// ──────────────────────────────────────────────────────────────────────
// DERIVED ANALYTICS — works on the store's current exams
// ──────────────────────────────────────────────────────────────────────

export function getExamAnalyticsFromStore(exam: Exam) {
  const classConfig = exam.classConfigs[0]
  if (!classConfig) return null

  const results = class2AAttendance.map((student) => {
    return calculateResult(exam, classConfig.classId, student.rollNo)
  }).filter(Boolean)

  if (results.length === 0) return null

  const passed = results.filter((r) => r!.passed).length
  const passRate = results.length > 0 ? (passed / results.length) * 100 : 0

  const gradeDist: Record<string, number> = {}
  results.forEach((r) => {
    const grade = r!.grade
    gradeDist[grade] = (gradeDist[grade] || 0) + 1
  })

  const subjectPerf: { subject: string; avg: number }[] = []
  for (const sm of classConfig.marks) {
    const enteredMarks = sm.marks.filter((m) => m.marksObtained !== null && !m.isAbsent)
    if (enteredMarks.length === 0) continue
    const avg = enteredMarks.reduce((s, m) => s + (m.marksObtained || 0), 0) / enteredMarks.length
    const pct = (avg / sm.maxMarks) * 100
    subjectPerf.push({ subject: sm.subjectName, avg: Math.round(pct * 10) / 10 })
  }

  const toppers = [...results]
    .sort((a, b) => b!.percentage - a!.percentage)
    .slice(0, 5)
    .map((r, i) => ({
      rank: i + 1,
      studentId: class2AAttendance[i].rollNo,
      name: class2AAttendance[i].name,
      rollNo: class2AAttendance[i].rollNo,
      percentage: r!.percentage,
      total: r!.totalObtained,
      maxTotal: r!.totalMax,
      grade: r!.grade,
    }))

  return {
    totalStudents: results.length,
    passed,
    passRate: Math.round(passRate * 10) / 10,
    gradeDistribution: gradeDist,
    subjectPerformance: subjectPerf,
    toppers,
    averagePercentage: Math.round((results.reduce((s, r) => s + r!.percentage, 0) / results.length) * 10) / 10,
  }
}

// ──────────────────────────────────────────────────────────────────────
// GRADE SHEET DATA — from store exam
// ──────────────────────────────────────────────────────────────────────

export function getGradeSheetData(exam: Exam) {
  const classConfig = exam.classConfigs[0]
  if (!classConfig) return null

  const subjectNames = classConfig.subjects.map((s) => s.name)
  const rows = class2AAttendance.map((student) => {
    const result = calculateResult(exam, classConfig.classId, student.rollNo)
    const marks = classConfig.marks.map((sm) => {
      const mark = sm.marks.find((m) => m.studentId === student.rollNo)
      return mark?.isAbsent ? 'AB' : mark?.marksObtained ?? '—'
    })
    return { student, result, marks }
  }).sort((a, b) => (b.result?.percentage || 0) - (a.result?.percentage || 0))

  return { subjectNames, rows }
}
