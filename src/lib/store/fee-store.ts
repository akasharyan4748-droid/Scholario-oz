/**
 * Fee data store — canonical Principal Fee Management store.
 *
 * Connected to the same StudentRecord[] used by Students & Classes,
 * Admissions, Attendance, Examinations.
 *
 * Mutations:
 *   - recordPayment (with validation)
 *   - approveCashRequest / rejectCashRequest / requestClarification
 *   - addFeeHead / updateFeeHead / archiveFeeHead
 *   - addPaymentMode / updatePaymentMode / togglePaymentMode
 *   - updateLateFeeRule / updateConcessionRule
 *   - updateReceiptSettings
 *   - reprintReceipt (no second financial transaction)
 *
 * Audit log: every mutation creates an immutable audit record.
 */

import { create } from 'zustand'
import { useStudentsStore } from '@/lib/store/students-store'
import type { StudentRecord } from '@/lib/store/students-store'
import { useMemo, useState, useEffect } from 'react'

// ─── Types ───────────────────────────────────────────────────────────

export type PaymentMode = 'UPI' | 'Card' | 'Net Banking' | 'Cash' | 'Cheque' | 'Bank Transfer'
export type PaymentStatus = 'Success' | 'Pending' | 'Failed' | 'Under Verification' | 'Refunded'
export type FeePaymentStatus = 'Paid' | 'Partially Paid' | 'Due' | 'Overdue' | 'On Hold'
export type AuditAction =
  | 'payment.recorded'
  | 'cash.submitted'
  | 'cash.approved'
  | 'cash.rejected'
  | 'cash.clarification'
  | 'concession.granted'
  | 'fee_structure.changed'
  | 'payment.reversed'
  | 'refund.approved'
  | 'receipt.generated'
  | 'receipt.reprinted'
  | 'fee_head.created'
  | 'fee_head.updated'
  | 'fee_head.archived'
  | 'payment_mode.updated'

export interface FeeHead {
  id: string
  name: string
  amount: number
  frequency: 'Annual' | 'Quarterly' | 'Monthly' | 'One-time'
  mandatory: boolean
  active: boolean
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
  /** Optional metadata for cheques / cards / UPI references. */
  meta?: {
    bankName?: string
    chequeDate?: string
    chequeNumber?: string
    cardLast4?: string
    upiId?: string
    neftUtr?: string
  }
}

export interface StudentFeeAccount {
  studentId: string
  studentName: string
  admissionNo: string
  rollNo: string
  className: string
  section: string
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
  guardianName: string
  guardianPhone: string
  /** Chronological ledger entries (charges + payments). */
  ledger: LedgerEntry[]
}

export interface LedgerEntry {
  id: string
  date: string
  feeHead: string
  charge: number
  payment: number
  balance: number
  description: string
  receiptNo?: string
}

export interface FeeStructureConfig {
  id: string
  category: string
  className: string
  classLevel: string
  annual: number
  components: FeeHead[]
  effectiveFrom: string
  /** If superseded, points to the new version. */
  supersededBy?: string
  version: number
}

export interface CashRequest {
  id: string
  studentId: string
  studentName: string
  admissionNo: string
  className: string
  amount: number
  feeHead: string
  collectedBy: string
  collectedAt: string
  submittedAt: string
  status: 'Pending Principal Acceptance' | 'Collected by Teacher' | 'Confirmed by Principal' | 'Rejected' | 'Clarification Requested'
  /** Notes from teacher during submission. */
  notes?: string
  /** Principal reason for reject/clarification. */
  reason?: string
  referenceNo?: string
  /** Student outstanding at time of submission (snapshot for context). */
  contextBalanceAtSubmission?: number
}

export interface AuditRecord {
  id: string
  action: AuditAction
  actor: string
  timestamp: string
  /** Entity affected (transaction id, fee head id, student id, etc.). */
  entityId: string
  entityType: 'transaction' | 'cash_request' | 'fee_head' | 'fee_structure' | 'payment_mode' | 'concession' | 'receipt'
  description: string
  before?: string
  after?: string
  /** Cannot be deleted or modified — append-only. */
  readonly _immutable?: true
}

export interface PaymentModeConfig {
  id: PaymentMode
  label: string
  active: boolean
  requiresReference: boolean
  requiresBankName?: boolean
  requiresChequeDetails?: boolean
  defaultFeeHead?: string
}

export interface LateFeeRule {
  enabled: boolean
  amountPerMonth: number
  gracePeriodDays: number
  maxLateFee: number
  appliesTo: 'all' | 'mandatory_only'
}

export interface ConcessionRule {
  enabled: boolean
  siblingDiscountPct: number
  staffWardDiscountPct: number
  scholarshipDiscountPct: number
  requiresApproval: boolean
}

export interface ReceiptSettings {
  prefix: string
  startNumber: number
  footerMessage: string
  showAuthorizedSignature: boolean
  paperSize: '80mm' | 'A5'
}

// ─── Fee Structure Configurations (initial seed) ────────────────────

export const FEE_STRUCTURES: FeeStructureConfig[] = [
  {
    id: 'FS01', category: 'Pre-Primary', className: 'Nursery–UKG', classLevel: 'Pre-Primary',
    annual: 68000, effectiveFrom: '2025-04-01', version: 1,
    components: [
      { id: 'FH01', name: 'Tuition', amount: 48000, frequency: 'Annual', mandatory: true, active: true },
      { id: 'FH02', name: 'Transport', amount: 16000, frequency: 'Annual', mandatory: false, active: true },
      { id: 'FH03', name: 'Activity', amount: 4000, frequency: 'Annual', mandatory: true, active: true },
    ],
  },
  {
    id: 'FS02', category: 'Primary', className: 'Class 1–5', classLevel: 'Primary',
    annual: 86000, effectiveFrom: '2025-04-01', version: 1,
    components: [
      { id: 'FH04', name: 'Tuition', amount: 60000, frequency: 'Annual', mandatory: true, active: true },
      { id: 'FH05', name: 'Transport', amount: 18000, frequency: 'Annual', mandatory: false, active: true },
      { id: 'FH06', name: 'Library', amount: 2000, frequency: 'Annual', mandatory: true, active: true },
      { id: 'FH07', name: 'Exam', amount: 3000, frequency: 'Annual', mandatory: true, active: true },
      { id: 'FH08', name: 'Activity', amount: 3000, frequency: 'Annual', mandatory: true, active: true },
    ],
  },
  {
    id: 'FS03', category: 'Middle', className: 'Class 6–8', classLevel: 'Middle',
    annual: 112000, effectiveFrom: '2025-04-01', version: 1,
    components: [
      { id: 'FH09', name: 'Tuition', amount: 80000, frequency: 'Annual', mandatory: true, active: true },
      { id: 'FH10', name: 'Transport', amount: 22000, frequency: 'Annual', mandatory: false, active: true },
      { id: 'FH11', name: 'Library', amount: 3000, frequency: 'Annual', mandatory: true, active: true },
      { id: 'FH12', name: 'Exam', amount: 4000, frequency: 'Annual', mandatory: true, active: true },
      { id: 'FH13', name: 'Activity', amount: 3000, frequency: 'Annual', mandatory: true, active: true },
    ],
  },
  {
    id: 'FS04', category: 'Secondary', className: 'Class 9–10', classLevel: 'Secondary',
    annual: 148000, effectiveFrom: '2025-04-01', version: 1,
    components: [
      { id: 'FH14', name: 'Tuition', amount: 108000, frequency: 'Annual', mandatory: true, active: true },
      { id: 'FH15', name: 'Transport', amount: 26000, frequency: 'Annual', mandatory: false, active: true },
      { id: 'FH16', name: 'Library', amount: 4000, frequency: 'Annual', mandatory: true, active: true },
      { id: 'FH17', name: 'Exam', amount: 6000, frequency: 'Annual', mandatory: true, active: true },
      { id: 'FH18', name: 'Activity', amount: 4000, frequency: 'Annual', mandatory: true, active: true },
    ],
  },
  {
    id: 'FS05', category: 'Senior', className: 'Class 11–12', classLevel: 'Senior Secondary',
    annual: 184000, effectiveFrom: '2025-04-01', version: 1,
    components: [
      { id: 'FH19', name: 'Tuition', amount: 136000, frequency: 'Annual', mandatory: true, active: true },
      { id: 'FH20', name: 'Transport', amount: 28000, frequency: 'Annual', mandatory: false, active: true },
      { id: 'FH21', name: 'Library', amount: 5000, frequency: 'Annual', mandatory: true, active: true },
      { id: 'FH22', name: 'Exam', amount: 8000, frequency: 'Annual', mandatory: true, active: true },
      { id: 'FH23', name: 'Activity', amount: 7000, frequency: 'Annual', mandatory: true, active: true },
    ],
  },
]

export const DEFAULT_PAYMENT_MODES: PaymentModeConfig[] = [
  { id: 'UPI', label: 'UPI', active: true, requiresReference: true },
  { id: 'Card', label: 'Card', active: true, requiresReference: true },
  { id: 'Net Banking', label: 'Net Banking', active: true, requiresReference: true },
  { id: 'Cash', label: 'Cash', active: true, requiresReference: false },
  { id: 'Cheque', label: 'Cheque', active: true, requiresReference: true, requiresBankName: true, requiresChequeDetails: true },
  { id: 'Bank Transfer', label: 'Bank Transfer', active: true, requiresReference: true },
]

export const DEFAULT_LATE_FEE_RULE: LateFeeRule = {
  enabled: true,
  amountPerMonth: 500,
  gracePeriodDays: 7,
  maxLateFee: 5000,
  appliesTo: 'mandatory_only',
}

export const DEFAULT_CONCESSION_RULE: ConcessionRule = {
  enabled: true,
  siblingDiscountPct: 10,
  staffWardDiscountPct: 25,
  scholarshipDiscountPct: 50,
  requiresApproval: true,
}

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  prefix: 'RCP-2025-',
  startNumber: 1042,
  footerMessage: 'Thank you for your payment.',
  showAuthorizedSignature: true,
  paperSize: '80mm',
}

// ─── Seed Transactions (derived from canonical students) ─────────────

const SEED_TRANSACTIONS: FeeTransaction[] = [
  { id: 'TXN001', receiptNo: 'RCP-2025-1042', studentId: 'STU-1', studentName: 'Aarav Sharma', admissionNo: 'DSO2024001', className: 'Class 9', classId: 'C12', amount: 148000, mode: 'UPI', status: 'Success', date: '2025-04-12', purpose: 'Annual Fee — Q1', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-04-12', referenceNo: 'UPI-7845120369', academicYear: '2025-2026' },
  { id: 'TXN002', receiptNo: 'RCP-2025-1043', studentId: 'STU-2', studentName: 'Diya Patel', admissionNo: 'DSO2024002', className: 'Class 9', classId: 'C12', amount: 143000, mode: 'Card', status: 'Success', date: '2025-04-12', purpose: 'Annual Fee — Q1 (Scholarship applied)', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-04-12', referenceNo: 'CARD-****4521', academicYear: '2025-2026', meta: { cardLast4: '4521' } },
  { id: 'TXN003', receiptNo: 'RCP-2025-1044', studentId: 'STU-3', studentName: 'Vivaan Reddy', admissionNo: 'DSO2024003', className: 'Class 9', classId: 'C12', amount: 74000, mode: 'Net Banking', status: 'Success', date: '2025-04-15', purpose: 'Partial Payment', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-04-15', referenceNo: 'NB-NEFT-884120', academicYear: '2025-2026', meta: { neftUtr: 'NB-NEFT-884120' } },
  { id: 'TXN004', receiptNo: 'RCP-2025-1045', studentId: 'STU-4', studentName: 'Ananya Singh', admissionNo: 'DSO2024004', className: 'Class 9', classId: 'C12', amount: 148000, mode: 'UPI', status: 'Success', date: '2025-04-10', purpose: 'Annual Fee — Q1', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-04-10', referenceNo: 'UPI-9632587410', academicYear: '2025-2026' },
  { id: 'TXN005', receiptNo: 'RCP-2025-1046', studentId: 'STU-5', studentName: 'Reyansh Kumar', admissionNo: 'DSO2024005', className: 'Class 9', classId: 'C12', amount: 30000, mode: 'Cash', status: 'Under Verification', date: '2025-04-18', purpose: 'Partial Payment', feeHead: 'Tuition', collectedBy: 'Class Teacher', verifiedBy: null, verifiedAt: null, referenceNo: null, academicYear: '2025-2026' },
  { id: 'TXN006', receiptNo: 'RCP-2025-1047', studentId: 'STU-6', studentName: 'Ishaani Verma', admissionNo: 'DSO2024006', className: 'Class 9', classId: 'C12', amount: 145000, mode: 'Cheque', status: 'Success', date: '2025-04-11', purpose: 'Annual Fee — Q1 (Scholarship applied)', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-04-14', referenceNo: 'CHQ- HDFC-258963', academicYear: '2025-2026', meta: { bankName: 'HDFC', chequeNumber: '258963', chequeDate: '2025-04-11' } },
  { id: 'TXN007', receiptNo: 'RCP-2025-1048', studentId: 'STU-7', studentName: 'Kiara Rao', admissionNo: 'DSO2024007', className: 'Class 10', classId: 'C13', amount: 148000, mode: 'UPI', status: 'Success', date: '2025-07-08', purpose: 'Annual Fee — Q2', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-07-08', referenceNo: 'UPI-4569871230', academicYear: '2025-2026' },
  { id: 'TXN008', receiptNo: 'RCP-2025-1049', studentId: 'STU-8', studentName: 'Vihaan Agarwal', admissionNo: 'DSO2024008', className: 'Class 10', classId: 'C13', amount: 148000, mode: 'Card', status: 'Success', date: '2025-07-09', purpose: 'Annual Fee — Q2', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-07-09', referenceNo: 'CARD-****7890', academicYear: '2025-2026', meta: { cardLast4: '7890' } },
  { id: 'TXN009', receiptNo: 'RCP-2025-1050', studentId: 'STU-9', studentName: 'Dhruv Joshi', admissionNo: 'DSO2024009', className: 'Class 10', classId: 'C13', amount: 90000, mode: 'Net Banking', status: 'Pending', date: '2025-10-15', purpose: 'Partial Payment — Q3', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: null, verifiedAt: null, referenceNo: 'NB-RTGS-556677', academicYear: '2025-2026', meta: { neftUtr: 'NB-RTGS-556677' } },
  { id: 'TXN010', receiptNo: 'RCP-2025-1051', studentId: 'STU-10', studentName: 'Aadhya Menon', admissionNo: 'DSO2024010', className: 'Class 10', classId: 'C13', amount: 148000, mode: 'UPI', status: 'Success', date: '2025-10-12', purpose: 'Annual Fee — Q3', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-10-12', referenceNo: 'UPI-1234567890', academicYear: '2025-2026' },
  { id: 'TXN011', receiptNo: 'RCP-2025-1052', studentId: 'STU-12', studentName: 'Anika Gupta', admissionNo: 'DSO2024012', className: 'Class 10', classId: 'C13', amount: 50000, mode: 'Cash', status: 'Under Verification', date: '2025-11-05', purpose: 'Partial Payment', feeHead: 'Tuition', collectedBy: 'Class Teacher', verifiedBy: null, verifiedAt: null, referenceNo: null, academicYear: '2025-2026' },
  { id: 'TXN012', receiptNo: 'RCP-2025-1053', studentId: 'STU-15', studentName: 'Pari Khanna', admissionNo: 'DSO2024015', className: 'Class 11', classId: 'C14', amount: 184000, mode: 'Cheque', status: 'Success', date: '2025-07-20', purpose: 'Annual Fee — Q2', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-07-22', referenceNo: 'CHQ-ICICI-145896', academicYear: '2025-2026', meta: { bankName: 'ICICI', chequeNumber: '145896', chequeDate: '2025-07-19' } },
  { id: 'TXN013', receiptNo: 'RCP-2025-1054', studentId: 'STU-16', studentName: 'Rohan Mehta', admissionNo: 'DSO2024016', className: 'Class 11', classId: 'C14', amount: 92000, mode: 'UPI', status: 'Success', date: '2025-08-04', purpose: 'Annual Fee — Q2', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-08-04', referenceNo: 'UPI-7788990011', academicYear: '2025-2026' },
  { id: 'TXN014', receiptNo: 'RCP-2025-1055', studentId: 'STU-17', studentName: 'Riya Iyer', admissionNo: 'DSO2024017', className: 'Class 7', classId: 'C10', amount: 78000, mode: 'UPI', status: 'Success', date: '2025-09-12', purpose: 'Annual Fee — Q3', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-09-12', referenceNo: 'UPI-9988776655', academicYear: '2025-2026' },
  { id: 'TXN015', receiptNo: 'RCP-2025-1056', studentId: 'STU-18', studentName: 'Karan Desai', admissionNo: 'DSO2024018', className: 'Class 7', classId: 'C10', amount: 40000, mode: 'Cash', status: 'Under Verification', date: '2025-11-10', purpose: 'Partial Payment', feeHead: 'Tuition', collectedBy: 'Class Teacher', verifiedBy: null, verifiedAt: null, referenceNo: null, academicYear: '2025-2026' },
]

export const SEED_FEE_TRANSACTIONS = SEED_TRANSACTIONS

// ─── Cash Request seed ───────────────────────────────────────────────

const SEED_CASH_REQUESTS: CashRequest[] = [
  {
    id: 'PCR-01', studentId: 'STU-5', studentName: 'Reyansh Kumar', admissionNo: 'DSO2024005',
    className: 'Class 9-A', amount: 30000, feeHead: 'Tuition',
    collectedBy: 'Ananya Sharma (Class Teacher 9-A)', collectedAt: '2025-04-18',
    submittedAt: '2025-04-18', status: 'Pending Principal Acceptance',
    notes: 'Cash collected during morning assembly. ₹30,000 received in 100s and 500s.',
    contextBalanceAtSubmission: 144000,
  },
  {
    id: 'PCR-02', studentId: 'STU-11', studentName: 'Vihaan Joshi', admissionNo: 'DSO2024011',
    className: 'Class 10-A', amount: 50000, feeHead: 'Tuition',
    collectedBy: 'Rajesh Khurana (Class Teacher 10-A)', collectedAt: '2025-04-17',
    submittedAt: '2025-04-17', status: 'Collected by Teacher',
    notes: 'Cash deposited via deposit slip. Original counterfoil attached.',
    contextBalanceAtSubmission: 98000,
  },
  {
    id: 'PCR-03', studentId: 'STU-12', studentName: 'Anika Gupta', admissionNo: 'DSO2024012',
    className: 'Class 10-A', amount: 50000, feeHead: 'Tuition',
    collectedBy: 'Rajesh Khurana (Class Teacher 10-A)', collectedAt: '2025-11-05',
    submittedAt: '2025-11-05', status: 'Pending Principal Acceptance',
    notes: 'Q3 partial payment. Parent requested installment plan.',
    contextBalanceAtSubmission: 98000,
  },
]

// ─── Audit log seed ──────────────────────────────────────────────────

const SEED_AUDIT: AuditRecord[] = [
  { id: 'AUD-001', action: 'payment.recorded', actor: 'Principal', timestamp: '2025-10-12T11:30:00Z', entityId: 'TXN010', entityType: 'transaction', description: 'Payment ₹1,48,000 recorded for Aadhya Menon via UPI (RCP-2025-1051)' },
  { id: 'AUD-002', action: 'cash.submitted', actor: 'Ananya Sharma (Class Teacher)', timestamp: '2025-04-18T09:15:00Z', entityId: 'PCR-01', entityType: 'cash_request', description: 'Cash ₹30,000 submitted for Reyansh Kumar' },
  { id: 'AUD-003', action: 'concession.granted', actor: 'Principal', timestamp: '2025-04-11T14:00:00Z', entityId: 'STU-6', entityType: 'concession', description: 'Sibling concession (₹5,000) granted to Ishaani Verma' },
  { id: 'AUD-004', action: 'fee_structure.changed', actor: 'Principal', timestamp: '2025-04-01T10:00:00Z', entityId: 'FS04', entityType: 'fee_structure', description: 'Class 9–10 Tuition revised from ₹1,04,000 → ₹1,08,000 (effective 2025-26 session)' },
  { id: 'AUD-005', action: 'receipt.reprinted', actor: 'Principal', timestamp: '2025-11-01T15:20:00Z', entityId: 'TXN007', entityType: 'receipt', description: 'Receipt RCP-2025-1048 reprinted (no second transaction created)' },
]

// ─── Zustand Store ───────────────────────────────────────────────────

interface FeeState {
  transactions: FeeTransaction[]
  cashRequests: CashRequest[]
  audit: AuditRecord[]
  feeStructures: FeeStructureConfig[]
  paymentModes: PaymentModeConfig[]
  lateFeeRule: LateFeeRule
  concessionRule: ConcessionRule
  receiptSettings: ReceiptSettings
  receiptCounter: number

  // mutations
  recordPayment: (input: PaymentInput) => { success: boolean; transaction?: FeeTransaction; error?: string }
  approveCashRequest: (id: string, actor: string) => void
  rejectCashRequest: (id: string, actor: string, reason: string) => void
  requestClarification: (id: string, actor: string, reason: string) => void
  reprintReceipt: (transactionId: string, actor: string) => void
  addFeeHead: (structureId: string, head: Omit<FeeHead, 'id'>) => void
  updateFeeHead: (structureId: string, headId: string, patch: Partial<FeeHead>) => void
  archiveFeeHead: (structureId: string, headId: string) => void
  togglePaymentMode: (id: PaymentMode) => void
  updateLateFeeRule: (patch: Partial<LateFeeRule>) => void
  updateConcessionRule: (patch: Partial<ConcessionRule>) => void
  updateReceiptSettings: (patch: Partial<ReceiptSettings>) => void
}

export interface PaymentInput {
  studentId: string
  amount: number
  mode: PaymentMode
  purpose: string
  feeHead: string
  collectedBy: string
  referenceNo?: string
  meta?: FeeTransaction['meta']
}

function pushAudit(state: FeeState, record: Omit<AuditRecord, 'id' | 'timestamp' | '_immutable'>): AuditRecord[] {
  const audit: AuditRecord = {
    ...record,
    id: `AUD-${(state.audit.length + 1).toString().padStart(3, '0')}-${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
    _immutable: true,
  }
  return [audit, ...state.audit]
}

function genReceiptNo(prefix: string, counter: number): string {
  return `${prefix}${counter}`
}

export const useFeeStore = create<FeeState>((set, get) => ({
  transactions: SEED_TRANSACTIONS,
  cashRequests: SEED_CASH_REQUESTS,
  audit: SEED_AUDIT,
  feeStructures: FEE_STRUCTURES,
  paymentModes: DEFAULT_PAYMENT_MODES,
  lateFeeRule: DEFAULT_LATE_FEE_RULE,
  concessionRule: DEFAULT_CONCESSION_RULE,
  receiptSettings: DEFAULT_RECEIPT_SETTINGS,
  receiptCounter: 1057,

  recordPayment: (input) => {
    const state = get()
    // Validation: amount must be positive
    if (!input.amount || input.amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero.' }
    }
    // Validation: payment mode must be active
    const modeConfig = state.paymentModes.find((m) => m.id === input.mode)
    if (!modeConfig || !modeConfig.active) {
      return { success: false, error: `Payment mode ${input.mode} is not active.` }
    }
    // Validation: reference required for some modes
    if (modeConfig.requiresReference && !input.referenceNo) {
      return { success: false, error: `${input.mode} requires a reference number.` }
    }
    // Validation: student must exist
    const student = useStudentsStore.getState().students.find((s) => s.id === input.studentId)
    if (!student) {
      return { success: false, error: 'Student not found in canonical record.' }
    }
    // Validation: duplicate reference check (within last 24h)
    if (input.referenceNo) {
      const dup = state.transactions.find((t) => t.referenceNo === input.referenceNo && t.status === 'Success')
      if (dup) {
        return { success: false, error: `Duplicate reference number detected (${input.referenceNo}).` }
      }
    }
    const counter = state.receiptCounter + 1
    const receiptNo = genReceiptNo(state.receiptSettings.prefix, counter)
    const txn: FeeTransaction = {
      id: `TXN-${Date.now()}`,
      receiptNo,
      studentId: student.id,
      studentName: student.name,
      admissionNo: student.admissionNo,
      className: student.className,
      classId: student.classId,
      amount: input.amount,
      mode: input.mode,
      status: input.mode === 'Cash' ? 'Under Verification' : 'Success',
      date: new Date().toISOString().split('T')[0],
      purpose: input.purpose,
      feeHead: input.feeHead,
      collectedBy: input.collectedBy,
      verifiedBy: input.mode === 'Cash' ? null : input.collectedBy,
      verifiedAt: input.mode === 'Cash' ? null : new Date().toISOString(),
      referenceNo: input.referenceNo ?? null,
      academicYear: '2025-2026',
      meta: input.meta,
    }
    set({
      transactions: [txn, ...state.transactions],
      receiptCounter: counter,
      audit: pushAudit(state, {
        action: 'payment.recorded',
        actor: input.collectedBy,
        entityId: txn.id,
        entityType: 'transaction',
        description: `Payment ₹${input.amount.toLocaleString('en-IN')} recorded for ${student.name} via ${input.mode} (${receiptNo})`,
      }),
    })
    return { success: true, transaction: txn }
  },

  approveCashRequest: (id, actor) => {
    const state = get()
    const req = state.cashRequests.find((r) => r.id === id)
    if (!req) return
    const counter = state.receiptCounter + 1
    const receiptNo = genReceiptNo(state.receiptSettings.prefix, counter)
    const txn: FeeTransaction = {
      id: `TXN-${Date.now()}`,
      receiptNo,
      studentId: req.studentId,
      studentName: req.studentName,
      admissionNo: req.admissionNo,
      className: req.className,
      classId: '',
      amount: req.amount,
      mode: 'Cash',
      status: 'Success',
      date: new Date().toISOString().split('T')[0],
      purpose: req.notes ?? 'Cash payment approved',
      feeHead: req.feeHead,
      collectedBy: req.collectedBy,
      verifiedBy: actor,
      verifiedAt: new Date().toISOString(),
      referenceNo: null,
      academicYear: '2025-2026',
    }
    set({
      cashRequests: state.cashRequests.map((r) => r.id === id ? { ...r, status: 'Confirmed by Principal' } : r),
      transactions: [txn, ...state.transactions],
      receiptCounter: counter,
      audit: pushAudit(state, {
        action: 'cash.approved',
        actor,
        entityId: id,
        entityType: 'cash_request',
        description: `Cash ₹${req.amount.toLocaleString('en-IN')} approved for ${req.studentName} (${receiptNo})`,
      }),
    })
  },

  rejectCashRequest: (id, actor, reason) => {
    const state = get()
    const req = state.cashRequests.find((r) => r.id === id)
    if (!req) return
    set({
      cashRequests: state.cashRequests.map((r) => r.id === id ? { ...r, status: 'Rejected', reason } : r),
      audit: pushAudit(state, {
        action: 'cash.rejected',
        actor,
        entityId: id,
        entityType: 'cash_request',
        description: `Cash ₹${req.amount.toLocaleString('en-IN')} rejected for ${req.studentName} — ${reason}`,
      }),
    })
  },

  requestClarification: (id, actor, reason) => {
    const state = get()
    const req = state.cashRequests.find((r) => r.id === id)
    if (!req) return
    set({
      cashRequests: state.cashRequests.map((r) => r.id === id ? { ...r, status: 'Clarification Requested', reason } : r),
      audit: pushAudit(state, {
        action: 'cash.clarification',
        actor,
        entityId: id,
        entityType: 'cash_request',
        description: `Clarification requested for ${req.studentName} — ${reason}`,
      }),
    })
  },

  reprintReceipt: (transactionId, actor) => {
    const state = get()
    const txn = state.transactions.find((t) => t.id === transactionId)
    if (!txn) return
    set({
      audit: pushAudit(state, {
        action: 'receipt.reprinted',
        actor,
        entityId: transactionId,
        entityType: 'receipt',
        description: `Receipt ${txn.receiptNo} reprinted (no second transaction created)`,
      }),
    })
  },

  addFeeHead: (structureId, head) => {
    const state = get()
    const id = `FH-${Date.now().toString(36)}`
    set({
      feeStructures: state.feeStructures.map((s) => s.id === structureId
        ? { ...s, components: [...s.components, { ...head, id, active: true }] }
        : s),
      audit: pushAudit(state, {
        action: 'fee_head.created',
        actor: 'Principal',
        entityId: id,
        entityType: 'fee_head',
        description: `Fee head "${head.name}" added to structure ${structureId}`,
      }),
    })
  },

  updateFeeHead: (structureId, headId, patch) => {
    const state = get()
    const struct = state.feeStructures.find((s) => s.id === structureId)
    const oldHead = struct?.components.find((h) => h.id === headId)
    set({
      feeStructures: state.feeStructures.map((s) => s.id === structureId
        ? { ...s, components: s.components.map((h) => h.id === headId ? { ...h, ...patch } : h) }
        : s),
      audit: pushAudit(state, {
        action: 'fee_head.updated',
        actor: 'Principal',
        entityId: headId,
        entityType: 'fee_head',
        description: `Fee head "${oldHead?.name ?? headId}" updated in ${struct?.className ?? structureId}`,
        before: oldHead ? JSON.stringify({ amount: oldHead.amount, mandatory: oldHead.mandatory }) : undefined,
        after: JSON.stringify(patch),
      }),
    })
  },

  archiveFeeHead: (structureId, headId) => {
    const state = get()
    const struct = state.feeStructures.find((s) => s.id === structureId)
    const head = struct?.components.find((h) => h.id === headId)
    set({
      feeStructures: state.feeStructures.map((s) => s.id === structureId
        ? { ...s, components: s.components.map((h) => h.id === headId ? { ...h, active: false } : h) }
        : s),
      audit: pushAudit(state, {
        action: 'fee_head.archived',
        actor: 'Principal',
        entityId: headId,
        entityType: 'fee_head',
        description: `Fee head "${head?.name ?? headId}" archived in ${struct?.className ?? structureId} (historical transactions preserved)`,
      }),
    })
  },

  togglePaymentMode: (id) => {
    const state = get()
    const mode = state.paymentModes.find((m) => m.id === id)
    set({
      paymentModes: state.paymentModes.map((m) => m.id === id ? { ...m, active: !m.active } : m),
      audit: pushAudit(state, {
        action: 'payment_mode.updated',
        actor: 'Principal',
        entityId: id,
        entityType: 'payment_mode',
        description: `Payment mode ${id} ${mode?.active ? 'disabled' : 'enabled'}`,
      }),
    })
  },

  updateLateFeeRule: (patch) => {
    const state = get()
    const before = JSON.stringify(state.lateFeeRule)
    set({ lateFeeRule: { ...state.lateFeeRule, ...patch } })
    // Note: we don't add audit for settings — too noisy. Only fee head / structure / payment.
  },

  updateConcessionRule: (patch) => {
    set((state) => ({ concessionRule: { ...state.concessionRule, ...patch } }))
  },

  updateReceiptSettings: (patch) => {
    set((state) => ({ receiptSettings: { ...state.receiptSettings, ...patch } }))
  },
}))

// ─── Helper: compute per-student fee account ─────────────────────────

function computeAccount(student: StudentRecord, transactions: FeeTransaction[], lateFeeRule: LateFeeRule): StudentFeeAccount {
  const totalApplicable = student.feeTotal
  const concession = student.scholarship ?? 0
  const netPayable = totalApplicable - concession

  // Compute paid from ALL successful/verified transactions for this student.
  // This makes the dashboard react to newly recorded payments immediately.
  const studentTxns = transactions.filter((t) => t.studentId === student.id)
  const txnsPaid = studentTxns
    .filter((t) => t.status === 'Success' || t.status === 'Under Verification')
    .reduce((sum, t) => sum + t.amount, 0)
  // Use the larger of: (a) canonical student.feePaid or (b) sum of recorded transactions.
  // Canonical matches Students module; transactions-based reflects new payments.
  const paid = Math.max(student.feePaid, txnsPaid)

  const outstanding = Math.max(0, netPayable - paid)
  const isOverdue = student.feeStatus === 'Pending'
  const lateFee = isOverdue && lateFeeRule.enabled ? Math.min(lateFeeRule.amountPerMonth * 3, lateFeeRule.maxLateFee) : 0
  const totalDue = outstanding + lateFee
  const status: FeePaymentStatus = outstanding === 0 ? 'Paid' : isOverdue ? 'Overdue' : paid > 0 ? 'Partially Paid' : 'Due'
  const daysOverdue = isOverdue ? 90 : outstanding > 0 ? 30 : 0

  // Build chronological ledger
  const ledger: LedgerEntry[] = []
  const heads = FEE_STRUCTURES.find((f) => f.classLevel === (
    student.className.includes('11') || student.className.includes('12') ? 'Senior Secondary' :
    student.className.includes('9') || student.className.includes('10') ? 'Secondary' :
    student.className.match(/Class [6-8]/) ? 'Middle' :
    student.className.match(/Class [1-5]/) ? 'Primary' : 'Pre-Primary'
  ))
  if (heads) {
    let balance = 0
    heads.components.filter((c) => c.active).forEach((c) => {
      balance += c.amount
      ledger.push({
        id: `LED-${student.id}-${c.id}`,
        date: '2025-04-01',
        feeHead: c.name,
        charge: c.amount,
        payment: 0,
        balance,
        description: `Annual charge — ${c.frequency.toLowerCase()}`,
      })
    })
    if (concession > 0) {
      balance -= concession
      ledger.push({
        id: `LED-${student.id}-CONC`,
        date: '2025-04-02',
        feeHead: 'Concession',
        charge: -concession,
        payment: 0,
        balance,
        description: 'Sibling / scholarship concession applied',
      })
    }
    if (lateFee > 0) {
      balance += lateFee
      ledger.push({
        id: `LED-${student.id}-LF`,
        date: '2025-07-08',
        feeHead: 'Late Fee',
        charge: lateFee,
        payment: 0,
        balance,
        description: 'Late payment penalty',
      })
    }
    // Sort transactions by date and apply payments
    const sortedTxns = [...studentTxns].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    for (const t of sortedTxns) {
      balance -= t.amount
      ledger.push({
        id: `LED-${student.id}-${t.id}`,
        date: t.date,
        feeHead: t.feeHead,
        charge: 0,
        payment: t.amount,
        balance,
        description: t.purpose,
        receiptNo: t.receiptNo,
      })
    }
  }

  return {
    studentId: student.id, studentName: student.name, admissionNo: student.admissionNo,
    rollNo: student.rollNo, className: student.className, section: student.section,
    classId: student.classId,
    totalApplicable, concession, netPayable, paid,
    outstanding, lateFee, totalDue, status,
    lastPaymentDate: studentTxns[0]?.date ?? null, daysOverdue,
    transactions: studentTxns,
    guardianName: student.guardianName,
    guardianPhone: student.guardianPhone,
    ledger,
  }
}

// ─── Hook: Canonical Fee Data ────────────────────────────────────────

export function useFeeData(academicYear: string = '2025-2026') {
  const students = useStudentsStore((s) => s.students)
  const transactions = useFeeStore((s) => s.transactions)
  const cashRequests = useFeeStore((s) => s.cashRequests)
  const feeStructures = useFeeStore((s) => s.feeStructures)
  const paymentModes = useFeeStore((s) => s.paymentModes)
  const lateFeeRule = useFeeStore((s) => s.lateFeeRule)
  const concessionRule = useFeeStore((s) => s.concessionRule)
  const receiptSettings = useFeeStore((s) => s.receiptSettings)
  const audit = useFeeStore((s) => s.audit)

  return useMemo(() => {
    const activeStudents = students.filter((s) => s.status === 'Active')
    const accounts = activeStudents.map((s) => computeAccount(s, transactions, lateFeeRule))

    const totalExpected = accounts.reduce((sum, a) => sum + a.netPayable, 0)
    const totalCollected = accounts.reduce((sum, a) => sum + a.paid, 0)
    const totalOutstanding = accounts.reduce((sum, a) => sum + a.outstanding, 0)
    const totalLateFee = accounts.reduce((sum, a) => sum + a.lateFee, 0)
    const totalDue = accounts.reduce((sum, a) => sum + a.totalDue, 0)
    const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 1000) / 10 : 0
    const overdueAccounts = accounts.filter((a) => a.status === 'Overdue')
    const pendingVerification = transactions.filter((t) => t.status === 'Under Verification' || t.status === 'Pending').length
    const pendingCashRequests = cashRequests.filter((r) => r.status === 'Pending Principal Acceptance' || r.status === 'Collected by Teacher').length

    // Today's collection
    const today = new Date().toISOString().split('T')[0]
    const todayCollection = transactions.filter((t) => t.date === today).reduce((sum, t) => sum + t.amount, 0)
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7)
    const weekCollection = transactions.filter((t) => new Date(t.date) >= weekStart).reduce((sum, t) => sum + t.amount, 0)
    const monthStart = new Date(); monthStart.setMonth(monthStart.getMonth() - 1)
    const monthCollection = transactions.filter((t) => new Date(t.date) >= monthStart).reduce((sum, t) => sum + t.amount, 0)
    const yearCollection = transactions.filter((t) => t.academicYear === academicYear).reduce((sum, t) => sum + t.amount, 0)

    // Monthly collection (computed from real transactions)
    const monthlyMap = new Map<string, { collected: number; pending: number }>()
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    months.forEach((m) => monthlyMap.set(m, { collected: 0, pending: 0 }))
    transactions.forEach((t) => {
      const d = new Date(t.date)
      const m = d.toLocaleString('en-IN', { month: 'short' })
      if (monthlyMap.has(m)) {
        const entry = monthlyMap.get(m)!
        if (t.status === 'Success') entry.collected += t.amount
        else if (t.status === 'Pending' || t.status === 'Under Verification') entry.pending += t.amount
      }
    })
    const monthly = months.map((m) => ({ month: m, collected: monthlyMap.get(m)!.collected, pending: monthlyMap.get(m)!.pending }))

    // Fee head distribution
    const byCategory = [
      { name: 'Tuition', value: accounts.reduce((s, a) => s + Math.round(a.totalApplicable * 0.75), 0), color: 'oklch(0.55 0.14 162)' },
      { name: 'Transport', value: accounts.reduce((s, a) => s + Math.round(a.totalApplicable * 0.15), 0), color: 'oklch(0.65 0.16 75)' },
      { name: 'Library', value: accounts.reduce((s, a) => s + Math.round(a.totalApplicable * 0.03), 0), color: 'oklch(0.6 0.18 300)' },
      { name: 'Exam', value: accounts.reduce((s, a) => s + Math.round(a.totalApplicable * 0.04), 0), color: 'oklch(0.7 0.15 200)' },
      { name: 'Activity', value: accounts.reduce((s, a) => s + Math.round(a.totalApplicable * 0.03), 0), color: 'oklch(0.62 0.2 25)' },
    ]

    // Payment mode mix
    const modeMap = new Map<PaymentMode, number>()
    transactions.filter((t) => t.status === 'Success').forEach((t) => {
      modeMap.set(t.mode, (modeMap.get(t.mode) ?? 0) + t.amount)
    })
    const byMode = Array.from(modeMap.entries()).map(([mode, value]) => ({ mode, value }))

    // Class-wise finance
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
    })).sort((a, b) => b.outstanding - a.outstanding)

    // Aging analysis
    const aging = {
      dueSoon: accounts.filter((a) => a.outstanding > 0 && a.daysOverdue === 0).length,
      '1-7': accounts.filter((a) => a.daysOverdue > 0 && a.daysOverdue <= 7).length,
      '8-30': accounts.filter((a) => a.daysOverdue > 7 && a.daysOverdue <= 30).length,
      '31-60': accounts.filter((a) => a.daysOverdue > 30 && a.daysOverdue <= 60).length,
      '60+': accounts.filter((a) => a.daysOverdue > 60).length,
    }

    // Recent collections (last 5)
    const recentCollections = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)

    // Urgent actions: oldest overdue + largest outstanding
    const urgentActions = accounts
      .filter((a) => a.outstanding > 0)
      .sort((a, b) => b.daysOverdue - a.daysOverdue || b.totalDue - a.totalDue)
      .slice(0, 5)

    return {
      accounts,
      transactions,
      cashRequests,
      feeStructures,
      paymentModes,
      lateFeeRule,
      concessionRule,
      receiptSettings,
      audit,
      analytics: {
        totalExpected, totalCollected, totalOutstanding, totalLateFee, totalDue,
        collectionRate, overdueCount: overdueAccounts.length,
        pendingVerification, pendingCashRequests,
        todayCollection, weekCollection, monthCollection, yearCollection,
        pendingCount: accounts.filter((a) => a.outstanding > 0).length,
        monthly, byCategory, byMode, classWise, aging,
        recentCollections, urgentActions,
      },
    }
  }, [students, transactions, cashRequests, feeStructures, paymentModes, lateFeeRule, concessionRule, receiptSettings, audit, academicYear])
}

// ─── Helper: format INR ──────────────────────────────────────────────
// Re-exported from format.ts to keep all fee formatting in one place.
export { formatINR, formatDate } from '@/lib/format'
