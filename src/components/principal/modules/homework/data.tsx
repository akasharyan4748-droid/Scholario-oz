import { homeworks } from '@/lib/mock/academics'
import { students } from '@/lib/mock/students'
import { subjects } from '@/lib/mock/school'

export interface Submission {
  rollNo: string
  name: string
  status: 'Submitted' | 'Pending' | 'Late' | 'Reviewed'
  submittedAt?: string
  fileName?: string
  rating?: number
  remark?: string
}

export function makeSubmissions(hwId: string): Submission[] {
  return students.slice(0, 18).map((s, i) => {
    const seed = (parseInt(hwId.replace(/\D/g, '')) || 1) + i
    const r = (seed * 7) % 10
    if (r < 5) return { rollNo: s.rollNo, name: s.name, status: 'Submitted', submittedAt: `2025-11-${26 + (i % 3)} ${8 + (i % 6)}:${(i * 13) % 60 < 10 ? '0' : ''}${(i * 13) % 60}`, fileName: `${s.name.replace(/\s/g, '_')}_HW.pdf` }
    if (r < 8) return { rollNo: s.rollNo, name: s.name, status: 'Reviewed', submittedAt: `2025-11-${26 + (i % 3)} ${9 + (i % 5)}:${(i * 17) % 60 < 10 ? '0' : ''}${(i * 17) % 60}`, fileName: `${s.name.replace(/\s/g, '_')}_HW.pdf`, rating: 3 + (i % 3), remark: ['Good work, neatly done!', 'Try to show working clearly.', 'Excellent presentation!'][i % 3] }
    if (r < 9) return { rollNo: s.rollNo, name: s.name, status: 'Late', submittedAt: `2025-11-29 ${10 + (i % 6)}:${(i * 11) % 60 < 10 ? '0' : ''}${(i * 11) % 60}`, fileName: `${s.name.replace(/\s/g, '_')}_HW.pdf` }
    return { rollNo: s.rollNo, name: s.name, status: 'Pending' }
  })
}

export const subjectColor = (subject: string): string => {
  const s = subjects.find((x) => x.name === subject)
  return s?.color ?? 'oklch(0.55 0.14 162)'
}

// Submission rate by class (mock)
export const completionByClass = [
  { name: '2-A', rate: 78 },
  { name: '2-B', rate: 84 },
  { name: '3-A', rate: 91 },
  { name: '4-A', rate: 88 },
  { name: '5-A', rate: 73 },
  { name: '5-B', rate: 82 },
]

export const subjectDistribution = [
  { name: 'Mathematics', value: 28, color: 'oklch(0.6 0.18 300)' },
  { name: 'English', value: 22, color: 'oklch(0.55 0.14 162)' },
  { name: 'Science', value: 18, color: 'oklch(0.65 0.16 75)' },
  { name: 'Hindi', value: 14, color: 'oklch(0.62 0.2 25)' },
  { name: 'Social', value: 10, color: 'oklch(0.7 0.15 200)' },
  { name: 'Other', value: 8, color: 'oklch(0.55 0.16 250)' },
]

// Aggregate homework metrics for KPI cards
export function getHomeworkMetrics() {
  const activeCount = homeworks.filter((h) => h.status === 'Active').length
  const totalSubs = homeworks.reduce((a, h) => a + h.submissions, 0)
  const totalCapacity = homeworks.reduce((a, h) => a + h.total, 0)
  const avgCompletion = Math.round((totalSubs / totalCapacity) * 100)
  const pendingReview = homeworks.reduce((a, h) => a + (h.total - h.submissions), 0)
  return { activeCount, totalSubs, totalCapacity, avgCompletion, pendingReview }
}
