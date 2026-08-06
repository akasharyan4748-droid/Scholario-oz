import { students } from '@/lib/mock/students'

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
    if (r < 5) return { rollNo: s.rollNo, name: s.name, status: 'Submitted', submittedAt: `2024-11-${26 + (i % 3)} ${8 + (i % 6)}:${(i * 13) % 60 < 10 ? '0' : ''}${(i * 13) % 60}`, fileName: `${s.name.replace(/\s/g, '_')}_HW.pdf` }
    if (r < 8) return { rollNo: s.rollNo, name: s.name, status: 'Reviewed', submittedAt: `2024-11-${26 + (i % 3)} ${9 + (i % 5)}:${(i * 17) % 60 < 10 ? '0' : ''}${(i * 17) % 60}`, fileName: `${s.name.replace(/\s/g, '_')}_HW.pdf`, rating: 3 + (i % 3), remark: ['Good work, neatly done!', 'Try to show working clearly.', 'Excellent presentation!'][i % 3] }
    if (r < 9) return { rollNo: s.rollNo, name: s.name, status: 'Late', submittedAt: `2024-11-29 ${10 + (i % 6)}:${(i * 11) % 60 < 10 ? '0' : ''}${(i * 11) % 60}`, fileName: `${s.name.replace(/\s/g, '_')}_HW.pdf` }
    return { rollNo: s.rollNo, name: s.name, status: 'Pending' }
  })
}

export interface HomeworkForm {
  title: string
  subject: string
  className: string
  description: string
  dueDate: string
  attachment: string
}

export const initialHomeworkForm: HomeworkForm = {
  title: '', subject: 'Mathematics', className: 'Class 2-A',
  description: '', dueDate: '', attachment: '',
}
