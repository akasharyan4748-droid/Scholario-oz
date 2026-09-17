import { students } from '@/lib/mock/students'

// Teacher Assignments — shared types & helpers.
//
// Submission represents one student's submission row inside an assignment.
// `makeSubmissions` deterministically derives a seeded list of submissions
// for a given assignment (so grading state survives re-renders).
// `statusVariant` maps a submission status to a StatusBadge variant.

export interface Submission {
  rollNo: string
  name: string
  status: 'Pending' | 'Submitted' | 'Graded'
  obtained?: number
  file?: string
  submittedAt?: string
  remarks?: string
}

export function makeSubmissions(asgId: string, marks: number): Submission[] {
  return students.slice(0, 18).map((s, i) => {
    const seed = (parseInt(asgId.replace(/\D/g, '')) || 1) + i
    const r = (seed * 7) % 10
    if (r < 4) return { rollNo: s.rollNo, name: s.name, status: 'Graded', obtained: Math.max(0, marks - (i % 5)), file: `${s.name.replace(/\s/g, '_')}_ASG.pdf`, submittedAt: `2024-11-${24 + (i % 4)}`, remarks: ['Excellent work!', 'Good effort, watch details.', 'Outstanding creativity!'][i % 3] }
    if (r < 8) return { rollNo: s.rollNo, name: s.name, status: 'Submitted', file: `${s.name.replace(/\s/g, '_')}_ASG.pdf`, submittedAt: `2024-11-${25 + (i % 4)}` }
    return { rollNo: s.rollNo, name: s.name, status: 'Pending' }
  })
}

export type StatusVariant = 'success' | 'info' | 'warning'

export function statusVariant(s: Submission['status']): StatusVariant {
  return s === 'Graded' ? 'success' : s === 'Submitted' ? 'info' : 'warning'
}
