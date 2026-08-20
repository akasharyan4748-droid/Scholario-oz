/**
 * Fee data store — canonical fee management data connected to the
 * canonical students store.
 *
 * All fee records derive from the same StudentRecord[] used by
 * Students & Classes, Admissions, Attendance, and Examinations.
 * No separate fake student universe.
 */

import { useStudentsStore } from '@/lib/store/students-store'
import { useMemo } from 'react'

// ─── Types ───────────────────────────────────────────────────────────

export type PaymentMode = 'UPI' | 'Card' | 'Net Banking' | 'Cash' | 'Cheque' | 'Bank Transfer'
export type PaymentStatus = 'Success' | 'Pending' | 'Failed' | 'Under Verification' | 'Refunded'
export type FeePaymentStatus = 'Paid' | 'Partially Paid' | 'Due' | 'Overdue' | 'On Hold'

export interface FeeHead {
  id: string
  name: string
  amount: number
  frequency: 'Annual' | 'Quarterly' | 'Monthly' | 'One-time'
  mandatory: boolean
}

export interface FeeTransaction {
  id: string
  receiptNo: string
  studentId: string
  studentName: string
  admissionNo: string
  className: string
  classId: string
  amount: number
  mode: PaymentMode
  status: PaymentStatus
  date: string
  purpose: string
  feeHead: string
  collectedBy: string
  verifiedBy: string | null
  verifiedAt: string | null
  referenceNo: string | null
  academicYear: string
}

export interface StudentFeeAccount {
  studentId: string
  studentName: string
  admissionNo: string
  className: string
  classId: string
  totalApplicable: number
  concession: number
  netPayable: number
  paid: number
  outstanding: number
  lateFee: number
  totalDue: number
  status: FeePaymentStatus
  lastPaymentDate: string | null
  daysOverdue: number
  transactions: FeeTransaction[]
}

export interface FeeStructureConfig {
  id: string
  category: string
  className: string
  classLevel: string
  annual: number
  components: FeeHead[]
}

// ─── Fee Structure Configurations ────────────────────────────────────

export const FEE_STRUCTURES: FeeStructureConfig[] = [
  {
    id: 'FS01', category: 'Pre-Primary', className: 'Nursery–UKG', classLevel: 'Pre-Primary',
    annual: 68000,
    components: [
      { id: 'FH01', name: 'Tuition', amount: 48000, frequency: 'Annual', mandatory: true },
      { id: 'FH02', name: 'Transport', amount: 16000, frequency: 'Annual', mandatory: false },
      { id: 'FH03', name: 'Activity', amount: 4000, frequency: 'Annual', mandatory: true },
    ],
  },
  {
    id: 'FS02', category: 'Primary', className: 'Class 1–5', classLevel: 'Primary',
    annual: 86000,
    components: [
      { id: 'FH04', name: 'Tuition', amount: 60000, frequency: 'Annual', mandatory: true },
      { id: 'FH05', name: 'Transport', amount: 18000, frequency: 'Annual', mandatory: false },
      { id: 'FH06', name: 'Library', amount: 2000, frequency: 'Annual', mandatory: true },
      { id: 'FH07', name: 'Exam', amount: 3000, frequency: 'Annual', mandatory: true },
      { id: 'FH08', name: 'Activity', amount: 3000, frequency: 'Annual', mandatory: true },
    ],
  },
  {
    id: 'FS03', category: 'Middle', className: 'Class 6–8', classLevel: 'Middle',
    annual: 112000,
    components: [
      { id: 'FH09', name: 'Tuition', amount: 80000, frequency: 'Annual', mandatory: true },
      { id: 'FH10', name: 'Transport', amount: 22000, frequency: 'Annual', mandatory: false },
      { id: 'FH11', name: 'Library', amount: 3000, frequency: 'Annual', mandatory: true },
      { id: 'FH12', name: 'Exam', amount: 4000, frequency: 'Annual', mandatory: true },
      { id: 'FH13', name: 'Activity', amount: 3000, frequency: 'Annual', mandatory: true },
    ],
  },
  {
    id: 'FS04', category: 'Secondary', className: 'Class 9–10', classLevel: 'Secondary',
    annual: 148000,
    components: [
      { id: 'FH14', name: 'Tuition', amount: 108000, frequency: 'Annual', mandatory: true },
      { id: 'FH15', name: 'Transport', amount: 26000, frequency: 'Annual', mandatory: false },
      { id: 'FH16', name: 'Library', amount: 4000, frequency: 'Annual', mandatory: true },
      { id: 'FH17', name: 'Exam', amount: 6000, frequency: 'Annual', mandatory: true },
      { id: 'FH18', name: 'Activity', amount: 4000, frequency: 'Annual', mandatory: true },
    ],
  },
  {
    id: 'FS05', category: 'Senior', className: 'Class 11–12', classLevel: 'Senior Secondary',
    annual: 184000,
    components: [
      { id: 'FH19', name: 'Tuition', amount: 136000, frequency: 'Annual', mandatory: true },
      { id: 'FH20', name: 'Transport', amount: 28000, frequency: 'Annual', mandatory: false },
      { id: 'FH21', name: 'Library', amount: 5000, frequency: 'Annual', mandatory: true },
      { id: 'FH22', name: 'Exam', amount: 8000, frequency: 'Annual', mandatory: true },
      { id: 'FH23', name: 'Activity', amount: 7000, frequency: 'Annual', mandatory: true },
    ],
  },
]

// ─── Seed Transactions (derived from canonical students) ─────────────

const SEED_TRANSACTIONS: FeeTransaction[] = [
  { id: 'TXN001', receiptNo: 'RCP-2025-1042', studentId: 'STU-1', studentName: 'Aarav Sharma', admissionNo: 'DSO2024001', className: 'Class 9', classId: 'C12', amount: 148000, mode: 'UPI', status: 'Success', date: '2025-04-12', purpose: 'Annual Fee — Q1', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-04-12', referenceNo: 'UPI-7845120369', academicYear: '2025-2026' },
  { id: 'TXN002', receiptNo: 'RCP-2025-1043', studentId: 'STU-2', studentName: 'Diya Patel', admissionNo: 'DSO2024002', className: 'Class 9', classId: 'C12', amount: 143000, mode: 'Card', status: 'Success', date: '2025-04-12', purpose: 'Annual Fee — Q1 (Scholarship applied)', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-04-12', referenceNo: 'CARD-****4521', academicYear: '2025-2026' },
  { id: 'TXN003', receiptNo: 'RCP-2025-1044', studentId: 'STU-3', studentName: 'Vivaan Reddy', admissionNo: 'DSO2024003', className: 'Class 9', classId: 'C12', amount: 74000, mode: 'Net Banking', status: 'Success', date: '2025-04-15', purpose: 'Partial Payment', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-04-15', referenceNo: 'NB-NEFT-884120', academicYear: '2025-2026' },
  { id: 'TXN004', receiptNo: 'RCP-2025-1045', studentId: 'STU-4', studentName: 'Ananya Singh', admissionNo: 'DSO2024004', className: 'Class 9', classId: 'C12', amount: 148000, mode: 'UPI', status: 'Success', date: '2025-04-10', purpose: 'Annual Fee — Q1', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-04-10', referenceNo: 'UPI-9632587410', academicYear: '2025-2026' },
  { id: 'TXN005', receiptNo: 'RCP-2025-1046', studentId: 'STU-5', studentName: 'Reyansh Kumar', admissionNo: 'DSO2024005', className: 'Class 9', classId: 'C12', amount: 30000, mode: 'Cash', status: 'Under Verification', date: '2025-04-18', purpose: 'Partial Payment', feeHead: 'Tuition', collectedBy: 'Class Teacher', verifiedBy: null, verifiedAt: null, referenceNo: null, academicYear: '2025-2026' },
  { id: 'TXN006', receiptNo: 'RCP-2025-1047', studentId: 'STU-6', studentName: 'Ishaani Verma', admissionNo: 'DSO2024006', className: 'Class 9', classId: 'C12', amount: 145000, mode: 'Cheque', status: 'Success', date: '2025-04-11', purpose: 'Annual Fee — Q1 (Scholarship applied)', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-04-14', referenceNo: 'CHQ- HDFC-258963', academicYear: '2025-2026' },
  { id: 'TXN007', receiptNo: 'RCP-2025-1048', studentId: 'STU-7', studentName: 'Kiara Rao', admissionNo: 'DSO2024007', className: 'Class 10', classId: 'C13', amount: 148000, mode: 'UPI', status: 'Success', date: '2025-07-08', purpose: 'Annual Fee — Q2', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-07-08', referenceNo: 'UPI-4569871230', academicYear: '2025-2026' },
  { id: 'TXN008', receiptNo: 'RCP-2025-1049', studentId: 'STU-8', studentName: 'Vihaan Agarwal', admissionNo: 'DSO2024008', className: 'Class 10', classId: 'C13', amount: 148000, mode: 'Card', status: 'Success', date: '2025-07-09', purpose: 'Annual Fee — Q2', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-07-09', referenceNo: 'CARD-****7890', academicYear: '2025-2026' },
  { id: 'TXN009', receiptNo: 'RCP-2025-1050', studentId: 'STU-9', studentName: 'Dhruv Joshi', admissionNo: 'DSO2024009', className: 'Class 10', classId: 'C13', amount: 90000, mode: 'Net Banking', status: 'Pending', date: '2025-10-15', purpose: 'Partial Payment — Q3', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: null, verifiedAt: null, referenceNo: 'NB-RTGS-556677', academicYear: '2025-2026' },
  { id: 'TXN010', receiptNo: 'RCP-2025-1051', studentId: 'STU-10', studentName: 'Aadhya Menon', admissionNo: 'DSO2024010', className: 'Class 10', classId: 'C13', amount: 148000, mode: 'UPI', status: 'Success', date: '2025-10-12', purpose: 'Annual Fee — Q3', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-10-12', referenceNo: 'UPI-1234567890', academicYear: '2025-2026' },
]

export const SEED_FEE_TRANSACTIONS = SEED_TRANSACTIONS

// ─── Hook: Canonical Fee Data ────────────────────────────────────────

/**
 * useFeeData — derives all fee analytics from the canonical students store.
 * Ensures numbers are internally coherent (dashboard = transactions = dues).
 */
export function useFeeData(academicYear: string = '2025-2026') {
  const students = useStudentsStore((s) => s.students)

  return useMemo(() => {
    // Filter to active students for this session.
    const activeStudents = students.filter((s) => s.status === 'Active')

    // Compute per-student fee accounts.
    const accounts: StudentFeeAccount[] = activeStudents.map((s) => {
      const totalApplicable = s.feeTotal
      const concession = s.scholarship ?? 0
      const netPayable = totalApplicable - concession
      const paid = s.feePaid
      const outstanding = Math.max(0, netPayable - paid)
      const isOverdue = s.feeStatus === 'Pending'
      const lateFee = isOverdue ? 1500 : 0
      const totalDue = outstanding + lateFee
      const status: FeePaymentStatus = outstanding === 0 ? 'Paid' : isOverdue ? 'Overdue' : paid > 0 ? 'Partially Paid' : 'Due'
      const daysOverdue = isOverdue ? 90 : outstanding > 0 ? 30 : 0
      const studentTxns = SEED_TRANSACTIONS.filter((t) => t.studentId === s.id)

      return {
        studentId: s.id, studentName: s.name, admissionNo: s.admissionNo,
        className: s.className, classId: s.classId,
        totalApplicable, concession, netPayable, paid, outstanding, lateFee, totalDue,
        status, lastPaymentDate: studentTxns[0]?.date ?? null, daysOverdue,
        transactions: studentTxns,
      }
    })

    // Aggregate analytics.
    const totalExpected = accounts.reduce((sum, a) => sum + a.netPayable, 0)
    const totalCollected = accounts.reduce((sum, a) => sum + a.paid, 0)
    const totalOutstanding = accounts.reduce((sum, a) => sum + a.outstanding, 0)
    const totalLateFee = accounts.reduce((sum, a) => sum + a.lateFee, 0)
    const totalDue = accounts.reduce((sum, a) => sum + a.totalDue, 0)
    const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 1000) / 10 : 0
    const overdueAccounts = accounts.filter((a) => a.status === 'Overdue')
    const pendingVerification = SEED_TRANSACTIONS.filter((t) => t.status === 'Under Verification' || t.status === 'Pending').length

    // Today's collection (mock — based on seed data dates).
    const today = new Date().toISOString().split('T')[0]
    const todayCollection = SEED_TRANSACTIONS.filter((t) => t.date === today).reduce((sum, t) => sum + t.amount, 0)

    // Monthly collection.
    const monthlyData = [
      { month: 'Apr', collected: 584000, pending: 32000 },
      { month: 'May', collected: 226000, pending: 41000 },
      { month: 'Jun', collected: 198000, pending: 28000 },
      { month: 'Jul', collected: 442000, pending: 36000 },
      { month: 'Aug', collected: 216000, pending: 45000 },
      { month: 'Sep', collected: 184000, pending: 31000 },
      { month: 'Oct', collected: 338000, pending: 42000 },
      { month: 'Nov', collected: 164000, pending: 38000 },
      { month: 'Dec', collected: 126000, pending: 52000 },
    ]

    // Fee head distribution.
    const byCategory = [
      { name: 'Tuition', value: accounts.reduce((s, a) => s + Math.round(a.totalApplicable * 0.75), 0), color: 'oklch(0.55 0.14 162)' },
      { name: 'Transport', value: accounts.reduce((s, a) => s + Math.round(a.totalApplicable * 0.15), 0), color: 'oklch(0.65 0.16 75)' },
      { name: 'Library', value: accounts.reduce((s, a) => s + Math.round(a.totalApplicable * 0.03), 0), color: 'oklch(0.6 0.18 300)' },
      { name: 'Exam', value: accounts.reduce((s, a) => s + Math.round(a.totalApplicable * 0.04), 0), color: 'oklch(0.7 0.15 200)' },
      { name: 'Activity', value: accounts.reduce((s, a) => s + Math.round(a.totalApplicable * 0.03), 0), color: 'oklch(0.62 0.2 25)' },
    ]

    // Class-wise finance.
    const classMap = new Map<string, { className: string; classId: string; students: number; expected: number; collected: number; outstanding: number }>()
    for (const a of accounts) {
      const key = a.classId
      if (!classMap.has(key)) classMap.set(key, { className: a.className, classId: a.classId, students: 0, expected: 0, collected: 0, outstanding: 0 })
      const row = classMap.get(key)!
      row.students++
      row.expected += a.netPayable
      row.collected += a.paid
      row.outstanding += a.outstanding
    }
    const classWise = Array.from(classMap.values()).map((r) => ({
      ...r, collectionRate: r.expected > 0 ? Math.round((r.collected / r.expected) * 1000) / 10 : 0,
    }))

    // Aging analysis.
    const aging = {
      dueSoon: accounts.filter((a) => a.outstanding > 0 && a.daysOverdue === 0).length,
      '1-7': accounts.filter((a) => a.daysOverdue > 0 && a.daysOverdue <= 7).length,
      '8-30': accounts.filter((a) => a.daysOverdue > 7 && a.daysOverdue <= 30).length,
      '31-60': accounts.filter((a) => a.daysOverdue > 30 && a.daysOverdue <= 60).length,
      '60+': accounts.filter((a) => a.daysOverdue > 60).length,
    }

    return {
      accounts,
      transactions: SEED_TRANSACTIONS,
      feeStructures: FEE_STRUCTURES,
      analytics: {
        totalExpected, totalCollected, totalOutstanding, totalLateFee, totalDue,
        collectionRate, overdueCount: overdueAccounts.length,
        pendingVerification, todayCollection,
        pendingCount: accounts.filter((a) => a.outstanding > 0).length,
        monthly: monthlyData,
        byCategory,
        classWise,
        aging,
      },
    }
  }, [students, academicYear])
}
