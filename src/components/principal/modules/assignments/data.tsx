'use client'

// Mock data, constants, and helper functions for the Assignments module.
// All page sections import from this single source of truth.

import { subjects } from '@/lib/mock/school'
import { students } from '@/lib/mock/students'
import { assignments, type Assignment } from '@/lib/mock/academics'

/** StatusBadge variant per assignment status (Pending / Submitted / Graded). */
export const statusVariant: Record<string, 'warning' | 'info' | 'success'> = {
  Pending: 'warning',
  Submitted: 'info',
  Graded: 'success',
}

/** Resolve the subject color token from the school subjects mock, with a
 *  sensible default if the subject isn't in the catalog. */
export const subjectColor = (subject: string): string => {
  const s = subjects.find((x) => x.name === subject)
  return s?.color ?? 'oklch(0.55 0.14 162)'
}

// Submission analytics
export const submissionRateBySubject = [
  { name: 'Math', rate: 86 },
  { name: 'English', rate: 92 },
  { name: 'Science', rate: 78 },
  { name: 'Social', rate: 84 },
  { name: 'Hindi', rate: 88 },
  { name: 'CS', rate: 94 },
]

export const gradeDistribution = [
  { name: 'A+ (≥90%)', value: 6, color: 'oklch(0.55 0.14 162)' },
  { name: 'A (80-89%)', value: 9, color: 'oklch(0.65 0.16 75)' },
  { name: 'B+ (70-79%)', value: 4, color: 'oklch(0.7 0.15 200)' },
  { name: 'B (60-69%)', value: 2, color: 'oklch(0.6 0.18 300)' },
]

/** Mock count of pending submissions across assignments (display-only). */
export const PENDING_SUBS = 24

/** Derived average score across all graded assignments, as a percentage. */
const gradedAssignments = assignments.filter(
  (a) => a.status === 'Graded' && a.obtainedMarks != null
)
export const avgScore =
  gradedAssignments.length > 0
    ? Math.round(
        gradedAssignments.reduce(
          (acc, a) => acc + ((a.obtainedMarks ?? 0) / a.marks) * 100,
          0
        ) / gradedAssignments.length
      )
    : 0

/** Initial rubric criteria shown in the Create Assignment dialog. */
export const INITIAL_RUBRIC: { name: string; marks: number }[] = [
  { name: 'Content Knowledge', marks: 8 },
  { name: 'Presentation', marks: 5 },
  { name: 'Creativity', marks: 4 },
  { name: 'On-time submission', marks: 3 },
]

/** Initial form state for the Create Assignment dialog. */
export const INITIAL_FORM = {
  title: '',
  subject: 'Mathematics',
  className: 'Class 2-A',
  dueDate: '',
  marks: 20,
  description: '',
}

// Mock student submissions for an assignment
export function makeStudentSubmissions(a: Assignment) {
  return students.slice(0, 12).map((s, i) => {
    const seed = (parseInt(a.id.replace(/\D/g, '')) || 1) + i
    const r = (seed * 7) % 10
    if (a.status === 'Pending') {
      return {
        ...s,
        aStatus: r < 6 ? 'Submitted' : 'Pending',
        obtained: 0,
        remark: '',
        submittedAt: r < 6 ? `2025-11-${26 + (i % 3)} ${8 + (i % 6)}:${(i * 13) % 60 < 10 ? '0' : ''}${(i * 13) % 60}` : undefined,
        fileName: r < 6 ? `${s.name.replace(/\s/g, '_')}_${a.id}.pdf` : undefined,
      } as const
    }
    if (a.status === 'Submitted') {
      return {
        ...s,
        aStatus: 'Submitted',
        obtained: 0,
        remark: '',
        submittedAt: `2025-11-${26 + (i % 3)} ${8 + (i % 6)}:${(i * 13) % 60 < 10 ? '0' : ''}${(i * 13) % 60}`,
        fileName: `${s.name.replace(/\s/g, '_')}_${a.id}.pdf`,
      } as const
    }
    // Graded
    const pct = 0.7 + (r / 10) * 0.28
    const obtained = Math.round(a.marks * pct)
    return {
      ...s,
      aStatus: 'Graded',
      obtained,
      remark: ['Excellent work!', 'Good attempt, revise concepts.', 'Outstanding presentation!', 'Needs improvement in clarity.'][i % 4],
      submittedAt: `2025-11-${24 + (i % 3)} ${9 + (i % 5)}:${(i * 17) % 60 < 10 ? '0' : ''}${(i * 17) % 60}`,
      fileName: `${s.name.replace(/\s/g, '_')}_${a.id}.pdf`,
    } as const
  })
}
