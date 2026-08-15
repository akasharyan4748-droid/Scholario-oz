'use client'

// Mock data, constants, and exam-related types for the Examinations module.
// All page sections import from this single source of truth.

import { students } from '@/lib/mock/students'
import { examResults, type Exam } from '@/lib/mock/academics'

/** StatusBadge variant per exam "type" (kept for parity with the original module). */
export const examTypeVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary'> = {
  'Mid Term': 'info',
  'Unit Test': 'primary',
  'Final': 'danger',
  'Surprise': 'warning',
}

/** StatusBadge variant per exam "status" (used in cards + details dialog). */
export const examStatusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  'Scheduled': 'info',
  'Ongoing': 'warning',
  'Completed': 'neutral',
  'Result Declared': 'success',
}

/** Tailwind gradient button className reused across the module's primary CTAs. */
export const emeraldGradientBtn =
  'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'

/** Form state for the Create Exam dialog. */
export interface CreateExamForm {
  name: string
  type: Exam['type']
  startDate: string
  endDate: string
  classes: string
  subjects: number
}

export const initialCreateExamForm: CreateExamForm = {
  name: '',
  type: 'Unit Test',
  startDate: '',
  endDate: '',
  classes: 'Class 1–10',
  subjects: 5,
}

export const examTypeOptions: Exam['type'][] = ['Unit Test', 'Mid Term', 'Final', 'Surprise']

export const examClassOptions = [
  'Class 1–10',
  'Class 1–12',
  'Class 10, Class 12',
  'Class 2-A',
]

export const generateClassOptions = ['Class 2-A', 'Class 2-B', 'Class 2-C']

/** Steps shown in the result-generation "generating" loader. */
export const resultGenerationSteps = [
  'Aggregating marks',
  'Applying grade scale',
  'Ranking 18 students',
  'Generating report cards',
]

export interface GradeSheetRow {
  id: string
  roll: string
  name: string
  avatar: string
  marks: number[]
  total: number
  maxTotal: number
  pct: number
  grade: string
  rank: number
}

/** Mock grade sheet for "UT3 Class 2-A" — derived deterministically from the
 *  student roster + examResults mock so the table is stable across renders. */
export const gradeSheet: GradeSheetRow[] = students
  .slice(0, 12)
  .map((s, i) => {
    const subjMarks = examResults.studentResults.map((r, idx) => {
      const seed = (i + 1) * 7 + idx * 3
      const delta = ((seed * 13) % 11) - 5
      return Math.max(30, Math.min(50, r.obtained + delta))
    })
    const total = subjMarks.reduce((a, b) => a + b, 0)
    const maxTotal = examResults.maxTotal
    const pct = (total / maxTotal) * 100
    const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : 'C'
    return {
      id: s.id,
      roll: s.rollNo,
      name: s.name,
      avatar: s.avatar,
      marks: subjMarks,
      total,
      maxTotal,
      pct: Math.round(pct * 10) / 10,
      grade,
      rank: 0,
    }
  })
  .sort((a, b) => b.total - a.total)
  .map((s, i) => ({ ...s, rank: i + 1 }))

/** Subject column labels for the grade sheet table. */
export const gradeSheetSubjects = examResults.studentResults.map((r) => r.subject)
