// Static data, types, and initial state for the Teacher Students module.

export const progressData = [
  { name: 'UT1', v: 78 },
  { name: 'UT2', v: 82 },
  { name: 'Mid', v: 84 },
  { name: 'UT3', v: 88 },
]

export type Filter = 'all' | 'high' | 'at-risk'

export interface CashRequest {
  id: string
  studentName: string
  admissionNo: string
  class: string
  promotedClass: string
  amount: number
  mode: string
  receiver: string
  date: string
  status: string
}

export const initialCashRequests: CashRequest[] = [
  {
    id: 'REQ-01',
    studentName: 'Aarav Sharma',
    admissionNo: 'GWS2024018',
    class: 'Class 10-A',
    promotedClass: 'Class 11-A',
    amount: 65000,
    mode: 'Cash Payment',
    receiver: 'Ananya Sharma (Class Teacher)',
    date: '2025-03-28',
    status: 'Pending Acceptance',
  },
  {
    id: 'REQ-02',
    studentName: 'Ananya Rao',
    admissionNo: 'GWS2024042',
    class: 'Class 10-A',
    promotedClass: 'Class 11-A',
    amount: 65000,
    mode: 'Cash Payment',
    receiver: 'Ananya Sharma (Class Teacher)',
    date: '2025-03-27',
    status: 'Accepted & Renewed',
  },
]

// Deterministic math-score sequence used to render per-student math score chips.
export const scoreSequence = [48, 44, 38, 49, 36, 47, 42, 46, 40, 50, 32, 45, 41, 48, 39, 47, 35, 46]
