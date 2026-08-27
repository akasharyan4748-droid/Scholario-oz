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
import { persist } from 'zustand/middleware'
import { useStudentsStore } from '@/lib/store/students-store'
import type { StudentRecord } from '@/lib/store/students-store'
import { useCommunicationStore } from '@/lib/store/communication-store'
// PHASE 6 — read-only access to the master fee-head catalogue from
// school-settings-store (used by bulkLinkHeadsByName to derive the
// category from the picked catalogue entry). No circular dep —
// school-settings-store doesn't import from fee-store.
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { useMemo, useState, useEffect } from 'react'
import { formatINR } from '@/lib/format'
// PHASE 5 — class catalogue lookup. Static import (no circular dep:
// the classes catalogue has no imports from any store). Used by
// countStudentsForStructure's classId path + the Coverage Matrix UI.
import { ACADEMIC_CLASSES } from '@/lib/mock/academic/classes'
// V6 MODULARIZATION — seed + default data constants live in fee-store-data
// (pure data, types imported type-only from here so there is no runtime
// cycle). The previously-public symbols are re-exported below so every
// existing `from '@/lib/store/fee-store'` import keeps working unchanged.
import {
  FREQUENCY_MULTIPLIER,
  VALID_FREQUENCIES,
  computeHeadsTotal,
  computeExamFeeTotal,
  FEE_STRUCTURES,
  SEED_VERSIONS,
  DEFAULT_PAYMENT_MODES,
  DEFAULT_LATE_FEE_RULE,
  DEFAULT_CONCESSION_RULE,
  DEFAULT_RECEIPT_SETTINGS,
  SEED_GATEWAY_CONFIG,
  SEED_BANK_ACCOUNTS,
  SEED_UPI_QR_CONFIGS,
  SEED_SETTLEMENTS,
  SEED_RECONCILIATION_RECORDS,
  SEED_WEBHOOK_EVENTS,
  SEED_TRANSACTIONS,
  SEED_FEE_TRANSACTIONS,
  SEED_CASH_REQUESTS,
  SEED_AUDIT,
  SEED_ADDITIONAL_CHARGES,
} from './fee-store-data'

// Re-exports — preserves the pre-modularization public API of this module.
export {
  FREQUENCY_MULTIPLIER,
  VALID_FREQUENCIES,
  computeHeadsTotal,
  computeExamFeeTotal,
  FEE_STRUCTURES,
  DEFAULT_PAYMENT_MODES,
  DEFAULT_LATE_FEE_RULE,
  DEFAULT_CONCESSION_RULE,
  DEFAULT_RECEIPT_SETTINGS,
  SEED_FEE_TRANSACTIONS,
}

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
  // ─── Additional Charges (Core vs Additional financial separation) ───
  | 'additional_charge.created'
  | 'additional_charge.cancelled'
  // ─── Payment infrastructure audit actions (Phase 4) ───
  | 'gateway.connected'
  | 'gateway.disconnected'
  | 'bank_account.added'
  | 'bank_account.updated'
  | 'bank_account.deactivated'
  | 'upi_qr.added'
  | 'upi_qr.updated'
  | 'settlement.recorded'
  | 'reconciliation.matched'

export type FeeHeadCategory =
  | 'Tuition' | 'Admission' | 'Annual' | 'Transport' | 'Lab' | 'Library'
  | 'Exam' | 'Activity' | 'Board' | 'Other'

/**
 * FINANCIAL CATEGORY of a payment/transaction (Core vs Additional vs Exam).
 *
 *   CORE        — money against the standard annual fee structure
 *                 (recurring heads: Tuition, Transport, Library…).
 *   EXAMINATION — money against per-examination charges (the exam fee
 *                 schedule + board/exam heads).
 *   ADDITIONAL  — money against an event-based Additional Charge
 *                 (Educational Tour, Workshop, Competition…) — tracked
 *                 SEPARATELY from core fees so the two are never mixed.
 *
 * Optional on FeeTransaction for backward compatibility: legacy
 * transactions (recorded before this field existed) derive their category
 * via `txnCategory()` (feeHead containing "exam" → EXAMINATION, else CORE).
 */
export type TransactionCategory = 'CORE' | 'EXAMINATION' | 'ADDITIONAL'

/** Resolve the financial category of any transaction (new or legacy). */
export function txnCategory(
  t: Pick<FeeTransaction, 'category' | 'additionalChargeId' | 'feeHead'>,
): TransactionCategory {
  if (t.additionalChargeId) return 'ADDITIONAL'
  if (t.category) return t.category
  if (/exam/i.test(t.feeHead ?? '')) return 'EXAMINATION'
  return 'CORE'
}

/** Coarse category of an Additional Charge (drives icon/label in the UI). */
export type AdditionalChargeCategory =
  | 'Tour' | 'Workshop' | 'Competition' | 'Camp' | 'Event' | 'Material' | 'Other'

export type AdditionalChargeStatus = 'Active' | 'Cancelled'

/**
 * ADDITIONAL CHARGE — an event-based / special financial obligation that
 * exists INDEPENDENTLY of the standard annual class Fee Structure.
 *
 * Example: "Educational Tour — Jaipur", Class 8, ₹2,500, due 15 Sep,
 * Optional. Creating it does NOT touch the Class 8 annual fee structure;
 * payments against it are recorded with category='ADDITIONAL' and never
 * reduce the student's CORE fee outstanding.
 *
 * A master-catalogue entry of kind ADDITIONAL is a reusable TEMPLATE —
 * this entity is the actual assignment/occurrence.
 */
export interface AdditionalCharge {
  id: string
  /** Display name, e.g. "Educational Tour — Jaipur". */
  name: string
  category: AdditionalChargeCategory
  /** Per-student amount (INR). */
  amount: number
  academicYear: string
  /** Canonical AcademicClassDef ids the charge applies to (e.g. ['C11']). */
  applicableClassIds: string[]
  /** Optional specific student ids — when set, ONLY these students owe the
   *  charge (overrides applicableClassIds for scoping). */
  studentIds?: string[]
  /** Payment due date (ISO yyyy-mm-dd). */
  dueDate: string
  /** Optional (student may opt out) vs Mandatory (expected of everyone). */
  mandatory: boolean
  /** Reason / description shown to parents + in the ledger. */
  description?: string
  /** Event / reference this charge belongs to ("Jaipur Educational Tour"). */
  reference?: string
  createdBy: string
  createdAt: string
  status: AdditionalChargeStatus
  /** Principal's reason when cancelling (audit trail only). */
  cancelReason?: string
}

export interface FeeHead {
  id: string
  name: string
  /** Per-period amount (e.g. ₹4,000 if Monthly). Multiplied by FREQUENCY_MULTIPLIER to get the academic-year total. */
  amount: number
  frequency: 'Annual' | 'Half-Yearly' | 'Quarterly' | 'Monthly' | 'Per Term' | 'One-Time'
  mandatory: boolean
  active: boolean
  /**
   * MASTER-CATALOGUE LINK (Phase 5 — additive, optional).
   *
   * When this head was picked from the school's master fee-head catalogue
   * (school-settings-store.fees.feeHeads), this is the catalogue id.
   * Lets the Master Catalogue UI report "X class structures use this head"
   * and lets the principal edit the catalogue entry's defaults and have
   * them propagate to new structures (existing structures keep their
   * snapshot — versioning integrity preserved).
   *
   * For backward compat, heads created before this field existed (or
   * custom heads typed by hand in the structure editor) have
   * `catalogueId === undefined`. The catalogue UI still lists them
   * under "Uncatalogued heads" so the principal can normalize them.
   */
  catalogueId?: string
  /**
   * CATEGORY (Phase 5 — additive, optional).
   *
   * Coarse classification matching the master catalogue's `type` field.
   * Used for grouping in the structure card + coverage matrix. Falls
   * back to the master catalogue entry's type when catalogueId is set
   * but category is undefined; defaults to 'Other' if neither is set.
   */
  category?: FeeHeadCategory
}

/**
 * Examination fee entry — charged PER EXAMINATION INSTANCE (not recurring).
 *
 * Unlike the recurring fee heads above (which are charged per period), an
 * exam fee is levied every time the school conducts an examination of the
 * matching examType (Unit Test, Half-Yearly, Annual Examination, etc.).
 * The exam-creation flow in the Examination module reads this schedule to
 * auto-resolve the per-exam fee for newly created examinations.
 */
export interface ExamFeeEntry {
  id: string
  /** Canonical exam type — matches the `EXAM_TYPES` vocabulary in
   *  `src/lib/exams/types.ts` (e.g. 'Unit Test', 'Half-Yearly',
   *  'Annual Examination', 'Pre-Board', 'Practical'). */
  examType: string
  /** Per-examination amount (in INR). Charged once per conducted exam. */
  amount: number
  /** Planned number of examination instances for the academic year.
   *  e.g. Unit Test × 4, Half-Yearly × 1, Annual × 1.
   *  The estimated annual exam fee = amount × plannedInstances.
   *  Default 1 if not specified. */
  plannedInstances?: number
  mandatory: boolean
  active: boolean
}

/** The examination fee schedule within a fee structure — kept separate from
 *  the recurring fee heads because exam fees are not charged per period. */
export type ExamFeeSchedule = ExamFeeEntry[]

/**
 * Per-frequency multiplier — number of times the per-period amount is
 * charged in a single academic year. Used by `computeHeadsTotal` to
 * produce the ACADEMIC YEAR TOTAL (not just the per-period sum).
 *
 *   Monthly ₹4,000 → 4,000 × 12 = ₹48,000 annual total
 *   Per Term ₹1,000 → 1,000 × 3 = ₹3,000 annual total (3 terms / year)
 *   One-Time ₹5,000 → ₹5,000 (charged once across the student's tenure)
 */

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
  /** FINANCIAL CATEGORY — what obligation this money was collected
   *  against (Core fee / Examination fee / Additional charge). Optional
   *  for backward compat; derive via txnCategory() when absent. */
  category?: TransactionCategory
  /** When this payment was collected against an Additional Charge, the
   *  AdditionalCharge.id. Lets the charge's collected progress + the
   *  student's additional outstanding recompute from transactions. */
  additionalChargeId?: string
  /** Optional metadata for cheques / cards / UPI references. */
  meta?: {
    bankName?: string
    chequeDate?: string
    chequeNumber?: string
    cardLast4?: string
    upiId?: string
    neftUtr?: string
  }
  // ─── Payment infrastructure fields (Phase 4 — all optional for backward compat) ───
  paymentSource?: 'online' | 'offline' | 'gateway' | 'manual'
  gateway?: GatewayProvider
  gatewayPaymentId?: string
  gatewayOrderId?: string
  settlementId?: string
  settlementStatus?: SettlementStatus
  utr?: string
  gatewayFee?: number
  taxOnFee?: number
  netAmount?: number
  reconciliationStatus?: ReconciliationStatus
  refundedAmount?: number
  refundReason?: string
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
  // ─── CORE vs ADDITIONAL separation (all additive) ────────────────
  /** Core (recurring structure) expected amount, BEFORE concession. */
  coreExpected: number
  /** Examination (per-exam schedule) expected amount. */
  examExpected: number
  /** Per-student position on event-based Additional Charges — kept
   *  completely separate from the core numbers above so the two are
   *  never mixed into one unexplained figure. */
  additional: {
    /** Active charges applicable to this student. */
    charges: Array<{
      chargeId: string
      name: string
      category: AdditionalChargeCategory
      amount: number
      dueDate: string
      mandatory: boolean
      reference?: string
      paid: number
      outstanding: number
    }>
    /** Sum of active charge amounts. */
    total: number
    /** Successful + under-verification ADDITIONAL payments. */
    paid: number
    /** max(0, total − paid). */
    outstanding: number
  }
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
  /** What this line represents — drives the ledger's Type column
   *  (Core Fee / Exam Fee / Additional Fee / Payment / Concession /
   *  Late Fee). Optional for backward compat. */
  entryType?: 'core' | 'exam' | 'additional' | 'payment' | 'concession' | 'late-fee'
}

export interface FeeStructureConfig {
  id: string
  category: string
  className: string
  classLevel: string
  /**
   * CLASS-WISE BINDING (Phase 5 — additive, optional).
   *
   * The canonical AcademicClassDef.id (from src/lib/mock/academic/classes.ts)
   * that this structure primarily applies to. When set, the matching logic
   * in `findStructureForStudent` and `countStudentsForStructure` prefers
   * classId over className (handles stream-class ambiguity — e.g. two
   * Class 11 streams share one fee structure).
   *
   * Optional for backward compat with pre-Phase-5 structures and custom
   * drafts whose className doesn't map to a real academic class. Those
   * fall back to the legacy className → classLevel matching path.
   */
  classId?: string
  /**
   * STREAM-CLASS APPLICABILITY (Phase 5 — additive, optional).
   *
   * The full list of AcademicClassDef.ids this structure applies to. When
   * set, a student whose classId is in this list matches this structure
   * even if their className differs from `className` (e.g. a "Class 11"
   * structure with classId='C14-PCM' and applicableClassIds=['C14-PCM',
   * 'C14-PCB'] matches BOTH Class 11 streams).
   *
   * When absent, the matcher uses only `classId` (if set) or falls back
   * to className/classLevel matching.
   */
  applicableClassIds?: string[]
  annual: number
  components: FeeHead[]
  effectiveFrom: string
  /** If superseded, points to the new version. */
  supersededBy?: string
  version: number
  /**
   * Examination fee schedule — per-examination charges (NOT recurring).
   * Optional for backward compatibility: existing structures without this
   * field simply have no per-exam fees configured.
   */
  examFeeSchedule?: ExamFeeSchedule
}

// ─── Versioned Fee Structure (Phase 3 — version-aware data model) ──
// Backward-compatible: FeeStructureConfig (above) remains the live pointer
// to the CURRENT version. The new types below add an immutable history.

export type FeeStructureStatus = 'current' | 'scheduled' | 'archived' | 'draft'

/** A versioned snapshot of a fee structure at a point in time. */
export interface FeeStructureVersion {
  id: string                    // unique version id (e.g. FSV-FS01-2)
  structureId: string           // parent structure id
  version: number               // 1, 2, 3...
  status: FeeStructureStatus
  heads: FeeHead[]              // snapshot of fee heads at this version
  totalAmount: number           // computed total of active heads
  effectiveFrom: string         // ISO date
  effectiveTo?: string          // ISO date (when superseded)
  createdBy: string             // user name
  createdAt: string             // ISO timestamp
  approvedBy?: string
  approvedAt?: string
  changeReason?: string
  supersedesId?: string         // previous version id
  notes?: string
  /**
   * Examination fee schedule snapshot at this version. Optional for
   * backward compatibility: pre-existing versions without this field
   * have no per-exam fees configured at that snapshot.
   */
  examFeeSchedule?: ExamFeeSchedule
}

export type FeeChangeLogAction =
  | 'created' | 'edited' | 'published' | 'scheduled'
  | 'archived' | 'restored' | 'rolled_back' | 'deleted'

/** Immutable audit log entry for every financial change. */
export interface FeeChangeLog {
  id: string
  structureId: string
  versionId: string
  action: FeeChangeLogAction
  changedBy: string
  changedAt: string
  changes: { headName: string; oldValue: number; newValue: number }[]
  reason?: string
  affectedStudents: number
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
  entityType: 'transaction' | 'cash_request' | 'fee_head' | 'fee_structure' | 'payment_mode' | 'concession' | 'receipt' | 'gateway' | 'bank_account' | 'upi_qr' | 'settlement' | 'reconciliation' | 'webhook' | 'additional_charge'
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

// ─── Payment Infrastructure Types (Phase 4) ──────────────────────────
//
// Backward-compatible additions: all new types are exported but the existing
// FeeState interface, mutations, and seed data are unchanged (except for
// the bug fixes noted inline). The new types model the payment gateway,
// bank account, UPI/QR, settlement, reconciliation, and webhook domains.
// Secret keys are NEVER stored in client-side state — they go to server env.

export type GatewayProvider = 'razorpay' | 'cashfree' | 'payu' | 'none'
export type GatewayEnvironment = 'test' | 'live'
export type GatewayStatus = 'connected' | 'disconnected' | 'test_mode' | 'error'

export interface GatewayConfig {
  id: string
  provider: GatewayProvider
  environment: GatewayEnvironment
  status: GatewayStatus
  /** Masked when displayed in the UI. */
  merchantId?: string
  /** Public key ID — safe to show. */
  apiKeyId?: string
  /** Stored server-side only; kept on the type for documentation but NOT persisted to client state. */
  webhookSecret?: string
  webhookUrl?: string
  webhookStatus: 'healthy' | 'not_configured' | 'error'
  lastWebhookAt?: string
  failedWebhookCount: number
  /** Linked BankAccount.id where settlements are credited. */
  settlementAccountId?: string
  connectedAt?: string
  connectedBy?: string
  /** All test-mode checks completed successfully. */
  testModePassed: boolean
}

export type BankAccountType = 'savings' | 'current' | 'nre' | 'nro'
export type AccountStatus = 'active' | 'inactive'

export interface BankAccount {
  id: string
  holderName: string
  bankName: string
  /** Full number stored; UI masks it (e.g. ****6789). */
  accountNumber: string
  ifsc: string
  branch: string
  accountType: BankAccountType
  status: AccountStatus
  isPrimary: boolean
  addedAt: string
  addedBy: string
  /** Parent-facing display instructions shown on the payment page. */
  parentDisplayInstructions?: string
}

export type UpiQrType = 'static' | 'dynamic'
export type UpiQrStatus = 'active' | 'inactive'

export interface UpiQrConfig {
  id: string
  name: string
  /** School's UPI VPA (e.g. school@hdfc). */
  upiId: string
  payeeName: string
  qrType: UpiQrType
  /** Gateway provider if this QR is gateway-managed (vs raw UPI). */
  provider?: string
  status: UpiQrStatus
  notes?: string
  addedAt: string
  addedBy: string
}

export type SettlementStatus = 'pending' | 'settled' | 'failed' | 'reversed'
export type ReconciliationStatus = 'reconciled' | 'unreconciled' | 'pending' | 'exception'

export interface Settlement {
  id: string
  gateway: GatewayProvider
  settlementDate: string
  grossAmount: number
  gatewayFee: number
  taxOnFee: number
  netAmount: number
  bankAccountId?: string
  utr?: string
  status: SettlementStatus
  /** FeeTransaction IDs included in this settlement payout. */
  transactionIds: string[]
  createdAt: string
  reconciledAt?: string
  reconciledBy?: string
}

export interface ReconciliationRecord {
  id: string
  transactionId: string
  settlementId?: string
  gatewayPaymentId?: string
  gatewayOrderId?: string
  utr?: string
  reconciliationStatus: ReconciliationStatus
  reconciledBy?: string
  reconciledAt?: string
  notes?: string
}

export interface WebhookEvent {
  id: string
  provider: GatewayProvider
  /** Provider's event ID — used as the idempotency key. */
  eventId: string
  /** payment.success, payment.failed, refund.created, settlement.created, etc. */
  eventType: string
  receivedAt: string
  processedAt?: string
  status: 'processed' | 'failed' | 'duplicate'
  /** Sanitized JSON string — no secrets. */
  payload?: string
  /** Linked FeeTransaction if a transaction was created/updated. */
  transactionId?: string
}

// ─── Helper: derive a student's classLevel from their className ─────
// FEE-PER-CLASS: used by the fallback matching path in computeAccount
// + byCategory distribution + countStudentsForStructure when a student's
// className doesn't have an exact per-class FeeStructureConfig (e.g. a
// Class 4 student with no FS for "Class 4" falls back to "Primary" →
// the Class 2 structure).
export function studentClassLevel(className: string): string {
  return className.includes('11') || className.includes('12') ? 'Senior Secondary' :
    className.includes('9') || className.includes('10') ? 'Secondary' :
    className.match(/Class [6-8]/) ? 'Middle' :
    className.match(/Class [1-5]/) ? 'Primary' : 'Pre-Primary'
}

// ─── Helper: find the FeeStructureConfig that applies to a student ──
// FEE-PER-CLASS (Phase 5): tries an EXACT classId match first (using the
// student's classId when available, derived from className via the
// ACADEMIC_CLASSES catalogue). Falls back to className exact match,
// then classLevel substring matching. This priority order ensures:
//   1. A student in Class 9 (C12) finds FS04 (classId='C12') directly —
//      no substring walk.
//   2. A student in Class 11-PCB (C14-PCB) finds the future Class 11
//      structure via applicableClassIds=['C14-PCM','C14-PCB'] — handles
//      the stream-class ambiguity that className-only matching couldn't.
//   3. A student whose className has no structure (e.g. "Class 4") falls
//      back to the level (Primary → FS02).
//
// The signature accepts an optional classId (Phase 5 addition). Callers
// that pass only className continue to work — backward compatible.
export function findStructureForStudent(className: string, classId?: string): FeeStructureConfig | undefined {
  // 1. classId exact match (preferred path — Phase 5)
  if (classId) {
    const byApplicable = FEE_STRUCTURES.find((f) => f.applicableClassIds?.includes(classId))
    if (byApplicable) return byApplicable
    const byClassId = FEE_STRUCTURES.find((f) => f.classId === classId)
    if (byClassId) return byClassId
  }
  // 2. className exact match (legacy path — pre-Phase-5 primary lookup)
  const byName = FEE_STRUCTURES.find((f) => f.className === className)
  if (byName) return byName
  // 3. classLevel fallback (last resort — keeps backward compat with
  //    pre-FEE-PER-CLASS seed which used range names like "Class 9–10")
  return FEE_STRUCTURES.find((f) => f.classLevel === studentClassLevel(className))
}

// ─── Helper: count affected students for a structure ───────────────
// FEE-PER-CLASS (Phase 5): tries an EXACT classId/applicableClassIds
// match first (so a Class 9 structure reports only Class 9 students,
// and a Class 12 structure reports BOTH PCM and PCB stream students).
// Falls back to className exact match, then classLevel substring
// matching when no student has an exact className match (e.g. a custom
// structure with className="Custom").
//
// Mirrors the matching logic in `findStructureForStudent` so the
// changeLog's `affectedStudents` field reflects the same students
// whose fee accounts would be re-derived when the structure changes.
function countStudentsForStructure(struct: {
  className: string
  classLevel: string
  classId?: string
  applicableClassIds?: string[]
}): number {
  const students = useStudentsStore.getState().students.filter((s) => s.status === 'Active')
  // 1. classId / applicableClassIds exact match (Phase 5 — preferred
  //    path when the structure is bound to academic class ids).
  if (struct.applicableClassIds && struct.applicableClassIds.length > 0) {
    const matched = students.filter((s) => {
      const sid = deriveStudentClassId(s.className)
      return sid != null && struct.applicableClassIds!.includes(sid)
    })
    if (matched.length > 0) return matched.length
  }
  if (struct.classId) {
    const matched = students.filter((s) => deriveStudentClassId(s.className) === struct.classId)
    if (matched.length > 0) return matched.length
  }
  // 2. className exact match (legacy path)
  if (struct.className) {
    const exact = students.filter((s) => s.className === struct.className)
    if (exact.length > 0) return exact.length
  }
  // 3. classLevel fallback (last resort)
  return students.filter((s) => studentClassLevel(s.className) === struct.classLevel).length
}

// PHASE 5 — derive a student's AcademicClassDef.id from their className.
// Looks up the canonical class catalogue to find the matching id (e.g.
// "Class 9" → "C12", "Pre-Nursery" → "C01"). Returns undefined if no
// academic class matches (e.g. custom draft className "Class 9 — Copy").
// Used by countStudentsForStructure's classId path. Cached at module
// scope so the lookup happens once per className.
const _studentClassNameToClassId = new Map<string, string | undefined>()
export function deriveStudentClassId(className: string): string | undefined {
  if (_studentClassNameToClassId.has(className)) {
    return _studentClassNameToClassId.get(className)
  }
  const def = ACADEMIC_CLASSES.find((c) => c.name === className)
  _studentClassNameToClassId.set(className, def?.id)
  return def?.id
}

// ─── Legacy alias — kept for any external caller that still imports
// `countStudentsForClassLevel`. Internal callers have been migrated to
// `countStudentsForStructure` (which considers className first). The
// legacy signature accepts a classLevel string and ignores className.
function countStudentsForClassLevel(classLevel: string): number {
  return countStudentsForStructure({ className: '', classLevel })
}

// ─── Helper: cross-store notification (Phase 3 — wire announcements) ─
// Calls into the communication store so that fee-structure publishes
// automatically notify affected parents via Push/SMS/Email. The cross-
// store call mirrors the existing pattern at line 436
// (`useStudentsStore.getState()`). The communication store is imported
// at the top of this file — no circular dep (communication-store only
// depends on students-store + teachers mock, never on fee-store).
function notifyFeeStructureChange(
  structureId: string,
  structureName: string,
  action: 'published' | 'scheduled' | 'archived' | 'rolled_back' | 'created' | 'deleted',
  affectedStudents: number,
  effectiveFrom: string,
  actor: string,
  reason?: string,
): void {
  const store = useCommunicationStore.getState()
  if (!store.createAnnouncement || !store.sendAnnouncement) return
  const verb: Record<typeof action, string> = {
    published: 'published',
    scheduled: 'scheduled',
    archived: 'archived',
    rolled_back: 'rolled back to',
    created: 'created',
    deleted: 'deleted',
  }
  const id = store.createAnnouncement({
    title: `Fee Structure ${verb[action]} — ${structureName}`,
    message: `The fee structure for ${structureName} has been ${verb[action]}. Effective from ${effectiveFrom}.${reason ? ` Reason: ${reason}.` : ''} ${affectedStudents} students are impacted.`,
    category: 'Parents',
    audience: 'All Parents',
    channels: ['Push', 'SMS', 'Email'],
    author: actor,
    recipientCount: affectedStudents,
    relatedModule: 'Fee Management',
    relatedItemId: structureId,
  })
  store.sendAnnouncement(id)
}

// ─── Zustand Store ───────────────────────────────────────────────────

interface FeeState {
  transactions: FeeTransaction[]
  cashRequests: CashRequest[]
  audit: AuditRecord[]
  feeStructures: FeeStructureConfig[]
  /** Immutable version snapshots for every Fee Structure (Phase 3). */
  versions: FeeStructureVersion[]
  /** Immutable audit trail for every version-affecting mutation (Phase 3). */
  changeLog: FeeChangeLog[]
  /** Event-based Additional Charges — INDEPENDENT of the standard annual
   *  class fee structures. Never mixed into core fee totals. */
  additionalCharges: AdditionalCharge[]
  paymentModes: PaymentModeConfig[]
  lateFeeRule: LateFeeRule
  concessionRule: ConcessionRule
  receiptSettings: ReceiptSettings
  receiptCounter: number
  // ─── Payment infrastructure state (Phase 4) ───
  gatewayConfig: GatewayConfig | null
  bankAccounts: BankAccount[]
  upiQrConfigs: UpiQrConfig[]
  settlements: Settlement[]
  reconciliationRecords: ReconciliationRecord[]
  webhookEvents: WebhookEvent[]

  // mutations
  recordPayment: (input: PaymentInput) => { success: boolean; transaction?: FeeTransaction; error?: string; duplicateTransactionId?: string }
  approveCashRequest: (id: string, actor: string) => void
  rejectCashRequest: (id: string, actor: string, reason: string) => void
  requestClarification: (id: string, actor: string, reason: string) => void
  reprintReceipt: (transactionId: string, actor: string) => void
  // ─── Additional Charge mutations (event-based collections) ─────────
  /** Create an Additional Charge (event-based collection) for the given
   *  classes/students. Does NOT touch any class fee structure. Emits an
   *  immutable audit entry. */
  createAdditionalCharge: (input: Omit<AdditionalCharge, 'id' | 'createdAt' | 'createdBy' | 'status'> & { actor?: string }) => { success: boolean; charge?: AdditionalCharge; error?: string }
  /** Soft-cancel an Additional Charge. Active student balances stop
   *  including it immediately; historical payments + audit entries are
   *  preserved (never destructive). */
  cancelAdditionalCharge: (id: string, actor: string, reason?: string) => { success: boolean; error?: string }
  addFeeHead: (structureId: string, head: Omit<FeeHead, 'id'>) => { success: boolean; error?: string }
  updateFeeHead: (structureId: string, headId: string, patch: Partial<FeeHead>) => { success: boolean; error?: string }
  archiveFeeHead: (structureId: string, headId: string) => void
  // ─── Phase 6 — catalogue normalization mutations ──────────────────
  /**
   * Link a single per-structure FeeHead to a master catalogue entry.
   *
   * Patches ONLY the catalogueId + category fields on the matching
   * FeeHead. Does NOT bump the structure's version (this is a metadata
   * link, not a financial change — historical payments stay on their
   * original version, and the live structure's financial totals don't
   * change because the head's amount/frequency are already snapshotted).
   *
   * If `catalogueId` is empty, UNLINKS the head (clears catalogueId +
   * category). Used by the Normalize drawer's "Unlink" action.
   *
   * Emits an immutable audit entry (`fee_head.updated`) so the audit
   * trail captures who normalized which head when.
   */
  linkHeadToCatalogue: (structureId: string, headId: string, catalogueId: string, category?: FeeHeadCategory) => { success: boolean; error?: string }
  /**
   * Bulk-link every per-structure FeeHead whose name matches `name`
   * (case-insensitive) across ALL structures (or a single structure when
   * `structureId` is provided). Returns counts so the UI can toast
   * "Linked 4 heads across 3 structures".
   *
   * Uses the master catalogue entry's `type` as the `category` (falls
   * back to 'Other' if the catalogue entry is missing — though that
   * should never happen since the caller passes a real catalogue id).
   */
  bulkLinkHeadsByName: (name: string, catalogueId: string, structureId?: string) => { structures: number; heads: number }
  togglePaymentMode: (id: PaymentMode) => void
  updateLateFeeRule: (patch: Partial<LateFeeRule>) => void
  updateConcessionRule: (patch: Partial<ConcessionRule>) => void
  updateReceiptSettings: (patch: Partial<ReceiptSettings>) => void
  // ─── Phase 4 — payment infrastructure mutations ──────────────────
  connectGateway: (provider: GatewayProvider, merchantId: string, apiKeyId: string, environment: GatewayEnvironment) => void
  disconnectGateway: () => void
  updateGatewayStatus: (status: GatewayStatus, lastWebhookAt?: string) => void
  addBankAccount: (account: Omit<BankAccount, 'id' | 'addedAt' | 'addedBy'>) => void
  updateBankAccount: (id: string, updates: Partial<BankAccount>) => void
  setPrimaryBankAccount: (id: string) => void
  deactivateBankAccount: (id: string) => void
  addUpiQrConfig: (config: Omit<UpiQrConfig, 'id' | 'addedAt' | 'addedBy'>) => void
  updateUpiQrConfig: (id: string, updates: Partial<UpiQrConfig>) => void
  recordSettlement: (settlement: Omit<Settlement, 'id' | 'createdAt'>) => void
  reconcileTransaction: (transactionId: string, settlementId: string | undefined, utr: string | undefined, reconciledBy: string) => void
  recordWebhookEvent: (event: Omit<WebhookEvent, 'id'>) => void

  // ─── Phase 3 — versioned Fee Structure mutations ──────────────────
  /** Create a brand-new Fee Structure + its Version 1 (draft). Returns new structureId. */
  createFeeStructure: (input: {
    category: string
    className: string
    classLevel: string
    heads: FeeHead[]
    effectiveFrom: string
    notes?: string
    actor?: string
    /** FEE-EXAM: optional exam fee schedule for the new structure. Backward
     *  compatible — callers that omit this create a structure with no
     *  per-exam fees (which is fine — exam fee resolution returns null). */
    examFeeSchedule?: ExamFeeSchedule
    /** PHASE 5 — class-wise binding. Optional for backward compat.
     *  When set, the structure matches students by classId before
     *  falling back to className/classLevel. */
    classId?: string
    applicableClassIds?: string[]
  }) => string
  /** Publish a new CURRENT version (immediately effective). Marks prior as archived.
   *  Returns new versionId. Triggers parent notification.
   *
   *  FEE-EXAM: the optional 6th parameter snapshots the new exam fee
   *  schedule onto the new version (and onto the live FeeStructureConfig).
   *  Backward compatible — callers that omit it leave the existing
   *  schedule unchanged. */
  publishFeeStructureVersion: (structureId: string, newHeads: FeeHead[], effectiveFrom: string, reason: string, actor?: string, examFeeSchedule?: ExamFeeSchedule) => string
  /** Schedule a new version for a future effective date. Returns scheduled versionId.
   *
   *  FEE-EXAM: optional 6th parameter snapshots the exam fee schedule. */
  scheduleFeeStructureVersion: (structureId: string, newHeads: FeeHead[], effectiveFrom: string, reason: string, actor?: string, examFeeSchedule?: ExamFeeSchedule) => string
  /** Archive a version (draft or scheduled). Cannot archive the only current version. */
  archiveFeeStructureVersion: (versionId: string, actor?: string) => void
  /** Roll back to a target version by creating a NEW version with the target's heads.
   *  Preserves the audit trail — never destroys history. Returns new versionId.
   *
   *  FEE-EXAM: the target version's `examFeeSchedule` is also restored on
   *  the new (rolled-back) version + the live FeeStructureConfig. No
   *  signature change required. */
  revertFeeStructureVersion: (structureId: string, targetVersionId: string, reason: string, actor?: string) => string
  /** Update a DRAFT version's heads/notes before publishing. No audit entry (drafts are mutable).
   *
   *  FEE-EXAM: the changes payload accepts an optional `examFeeSchedule`
   *  so drafts can stage exam fee edits without going through publish. */
  updateFeeStructureDraft: (versionId: string, changes: { heads?: FeeHead[]; notes?: string; changeReason?: string; examFeeSchedule?: ExamFeeSchedule }) => void
  /**
   * Delete an entire Fee Structure + all its version snapshots.
   *
   * Rules (FEE-CORRECT Fix 4):
   *   - DRAFT structures: can be deleted (removes from `feeStructures` + `versions`).
   *   - CURRENT / PUBLISHED structures: CANNOT be deleted — return error
   *     "Cannot delete a published structure. Archive it instead."
   *   - ARCHIVED structures: CANNOT be deleted if any transaction references
   *     the structure's id or any of its version ids — return error
   *     "Cannot delete — financial records depend on this structure."
   *   - ARCHIVED structures with no financial references: can be deleted.
   *
   * Always emits an immutable audit entry (`fee_structure.changed`) and a
   * FeeChangeLog entry (`action: 'deleted'`). Financial records are NEVER
   * deleted — the audit log preserves the deletion record forever.
   */
  deleteFeeStructure: (structureId: string, actor: string) => { success: boolean; error?: string }
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
  /** Financial category of the payment. When additionalChargeId is set
   *  this is forced to 'ADDITIONAL' regardless of the caller's value. */
  category?: TransactionCategory
  /** When collecting against an Additional Charge — its id. The payment
   *  then reduces the student's ADDITIONAL outstanding, never core. */
  additionalChargeId?: string
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

// ─── Phase 3 helper: push an immutable FeeChangeLog entry ──────────
function pushChangeLog(
  state: FeeState,
  entry: Omit<FeeChangeLog, 'id' | 'changedAt'>,
): FeeChangeLog[] {
  const log: FeeChangeLog = {
    ...entry,
    id: `FCL-${(state.changeLog.length + 1).toString().padStart(3, '0')}-${Date.now().toString(36)}`,
    changedAt: new Date().toISOString(),
  }
  return [log, ...state.changeLog]
}

// Compute the diff between two head arrays for the changeLog `changes` field.
function diffHeads(oldHeads: FeeHead[], newHeads: FeeHead[]): { headName: string; oldValue: number; newValue: number }[] {
  const changes: { headName: string; oldValue: number; newValue: number }[] = []
  const seen = new Set<string>()
  for (const h of newHeads) {
    seen.add(h.name)
    const old = oldHeads.find((o) => o.name === h.name)
    if (!old) {
      changes.push({ headName: h.name, oldValue: 0, newValue: h.amount })
    } else if (old.amount !== h.amount) {
      changes.push({ headName: h.name, oldValue: old.amount, newValue: h.amount })
    }
  }
  for (const h of oldHeads) {
    if (!seen.has(h.name)) {
      changes.push({ headName: h.name, oldValue: h.amount, newValue: 0 })
    }
  }
  return changes
}

function genReceiptNo(prefix: string, counter: number): string {
  return `${prefix}${counter}`
}

export const useFeeStore = create<FeeState>()(
  persist((set, get) => ({
  transactions: SEED_TRANSACTIONS,
  cashRequests: SEED_CASH_REQUESTS,
  audit: SEED_AUDIT,
  feeStructures: FEE_STRUCTURES,
  versions: SEED_VERSIONS,
  changeLog: [],
  additionalCharges: SEED_ADDITIONAL_CHARGES,
  paymentModes: DEFAULT_PAYMENT_MODES,
  lateFeeRule: DEFAULT_LATE_FEE_RULE,
  concessionRule: DEFAULT_CONCESSION_RULE,
  receiptSettings: DEFAULT_RECEIPT_SETTINGS,
  receiptCounter: 1060,
  // ─── Payment infrastructure state (Phase 4) ───
  gatewayConfig: SEED_GATEWAY_CONFIG,
  bankAccounts: SEED_BANK_ACCOUNTS,
  upiQrConfigs: SEED_UPI_QR_CONFIGS,
  settlements: SEED_SETTLEMENTS,
  reconciliationRecords: SEED_RECONCILIATION_RECORDS,
  webhookEvents: SEED_WEBHOOK_EVENTS,

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
    // ─── Idempotency (strong) — issue #7 fix ──────────────────────────
    // Complements the referenceNo-based check below. Catches duplicate
    // submissions that the referenceNo check misses:
    //   1. Cash payments (no referenceNo → the block below is skipped).
    //   2. Double-clicks on the Pay button that fire handleSubmit twice
    //      before React re-renders the button away.
    //   3. Webhook redeliveries where the gateway retries with a new
    //      reference but the underlying payment intent is the same.
    // Hash key: (studentId, amount, feeHead, referenceNo||''). Window: 5 min.
    // A legitimate same-day retry of the same head will typically differ in
    // amount (partial payment) or referenceNo, so it won't be blocked.
    const idemRef = input.referenceNo ?? ''
    const fiveMinAgo = Date.now() - 5 * 60 * 1000
    const recentDup = state.transactions.find((t) => {
      if (t.studentId !== input.studentId) return false
      if (t.amount !== input.amount) return false
      if (t.feeHead !== input.feeHead) return false
      if ((t.referenceNo ?? '') !== idemRef) return false
      if (t.status !== 'Success' && t.status !== 'Under Verification') return false
      // Transaction ids are `TXN-<epochMs>` — parse the timestamp.
      const ts = Number(t.id.replace(/^TXN-/, ''))
      return Number.isFinite(ts) && ts >= fiveMinAgo
    })
    if (recentDup) {
      return {
        success: false,
        error: `Duplicate payment blocked (idempotency). A matching ${recentDup.status === 'Under Verification' ? 'cash ' : ''}payment of ₹${input.amount.toLocaleString('en-IN')} for ${student.name} (${input.feeHead}) was recorded just now${recentDup.referenceNo ? ` with ref ${recentDup.referenceNo}` : ''}.`,
        duplicateTransactionId: recentDup.id,
      }
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
    // FINANCIAL CATEGORY — what obligation this payment is collected
    // against. A payment bound to an AdditionalCharge is ALWAYS 'ADDITIONAL'
    // (never silently becomes part of core fee collection); otherwise the
    // caller's explicit category wins; legacy callers default to the
    // feeHead-derived category (e.g. "Exam Fee — Unit Test" → EXAMINATION).
    const resolvedCategory: TransactionCategory = input.additionalChargeId
      ? 'ADDITIONAL'
      : input.category ?? (/exam/i.test(input.feeHead) ? 'EXAMINATION' : 'CORE')
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
      category: resolvedCategory,
      ...(input.additionalChargeId ? { additionalChargeId: input.additionalChargeId } : {}),
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
    // Bug fix (Phase 4): look up the student's actual classId from the
    // canonical students store so that auto-created transactions group
    // correctly in the class-wise analytics (was hardcoded to '' before,
    // which broke aggregation in useFeeData at the classMap grouping).
    const student = useStudentsStore.getState().students.find((s) => s.id === req.studentId)
    const classId = student?.classId ?? ''
    const counter = state.receiptCounter + 1
    const receiptNo = genReceiptNo(state.receiptSettings.prefix, counter)
    const txn: FeeTransaction = {
      id: `TXN-${Date.now()}`,
      receiptNo,
      studentId: req.studentId,
      studentName: req.studentName,
      admissionNo: req.admissionNo,
      className: req.className,
      classId,
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
      paymentSource: 'offline',
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

  // ─── Additional Charges (event-based collections) ───────────────────
  //
  // An Additional Charge is created INDEPENDENTLY of the class fee
  // structure — no structure is versioned, no core total changes. Student
  // accounts pick the charge up automatically via computeAccount (matched
  // by applicableClassIds / studentIds, status 'Active' only).
  createAdditionalCharge: (input) => {
    const state = get()
    const { actor: actorInput, ...rest } = input
    const actor = actorInput ?? 'Principal'
    // ─── Validation ─────────────────────────────────────────────────
    if (!input.name || !input.name.trim()) {
      return { success: false, error: 'Charge name is required.' }
    }
    if (typeof input.amount !== 'number' || input.amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero.' }
    }
    if (!input.dueDate) {
      return { success: false, error: 'Due date is required.' }
    }
    if (!Array.isArray(input.applicableClassIds) || input.applicableClassIds.length === 0) {
      return { success: false, error: 'Select at least one class for this charge.' }
    }
    // Duplicate-name guard (case-insensitive, active charges only — a
    // cancelled tour can legitimately be re-created next year).
    const dup = state.additionalCharges.find(
      (c) => c.status === 'Active' && c.name.trim().toLowerCase() === input.name.trim().toLowerCase(),
    )
    if (dup) {
      return { success: false, error: `An active charge named "${dup.name}" already exists.` }
    }
    const charge: AdditionalCharge = {
      ...rest,
      name: input.name.trim(),
      id: `AC-${Date.now().toString(36)}`,
      createdBy: actor,
      createdAt: new Date().toISOString(),
      status: 'Active',
    }
    // How many students the charge applies to (for the audit trail).
    const students = useStudentsStore.getState().students.filter((s) => s.status === 'Active')
    const appliesTo = charge.studentIds
      ? students.filter((s) => charge.studentIds!.includes(s.id)).length
      : students.filter((s) => {
          const sid = s.classId ?? deriveStudentClassId(s.className)
          return sid != null && charge.applicableClassIds.includes(sid)
        }).length
    set({
      additionalCharges: [charge, ...state.additionalCharges],
      audit: pushAudit(state, {
        action: 'additional_charge.created',
        actor,
        entityId: charge.id,
        entityType: 'additional_charge',
        description: `Additional charge "${charge.name}" (${formatINR(charge.amount)} per student) created for ${appliesTo} student(s), due ${charge.dueDate}`,
      }),
    })
    return { success: true, charge }
  },

  cancelAdditionalCharge: (id, actor, reason) => {
    const state = get()
    const charge = state.additionalCharges.find((c) => c.id === id)
    if (!charge) return { success: false, error: 'Charge not found.' }
    if (charge.status === 'Cancelled') {
      return { success: false, error: 'Charge is already cancelled.' }
    }
    // How much was already collected against this charge (historical
    // payments are preserved — cancelling only stops FUTURE obligation).
    const collected = state.transactions
      .filter((t) => t.additionalChargeId === id && (t.status === 'Success' || t.status === 'Under Verification'))
      .reduce((sum, t) => sum + t.amount, 0)
    set({
      additionalCharges: state.additionalCharges.map((c) =>
        c.id === id ? { ...c, status: 'Cancelled' as const, ...(reason ? { cancelReason: reason } : {}) } : c,
      ),
      audit: pushAudit(state, {
        action: 'additional_charge.cancelled',
        actor,
        entityId: id,
        entityType: 'additional_charge',
        description: `Additional charge "${charge.name}" cancelled${reason ? ` — ${reason}` : ''}. ${collected > 0 ? `${formatINR(collected)} already collected is preserved on record.` : 'No payments were collected against it.'}`,
      }),
    })
    return { success: true }
  },

  addFeeHead: (structureId, head) => {
    const state = get()
    const struct = state.feeStructures.find((s) => s.id === structureId)

    // ─── Fix 8 (FEE-CORRECT): validation ───────────────────────────
    if (!struct) return { success: false, error: 'Fee structure not found.' }
    if (!head.name || !head.name.trim()) {
      return { success: false, error: 'Fee head name is required.' }
    }
    if (typeof head.amount !== 'number' || head.amount < 0) {
      return { success: false, error: 'Amount must be a non-negative number.' }
    }
    if (!VALID_FREQUENCIES.includes(head.frequency)) {
      return { success: false, error: `Frequency must be one of: ${VALID_FREQUENCIES.join(', ')}.` }
    }
    // Duplicate name guard (case-insensitive).
    const dup = struct.components.find((c) => c.name.trim().toLowerCase() === head.name.trim().toLowerCase())
    if (dup) {
      return { success: false, error: `A fee head named "${dup.name}" already exists in this structure.` }
    }

    const id = `FH-${Date.now().toString(36)}`
    const newHead: FeeHead = { ...head, name: head.name.trim(), id, active: head.active ?? true }
    // Keep the matching CURRENT version's heads in sync (Phase 3 —
    // backward compat: existing in-place mutations also participate in
    // the versioning system by mirroring into the live version snapshot
    // and pushing an immutable FeeChangeLog entry).
    const currentVersion = state.versions.find((v) => v.structureId === structureId && v.status === 'current')
    const updatedHeads = currentVersion ? [...currentVersion.heads, newHead] : [newHead]
    const updatedComponents = [...struct.components, newHead]
    const newAnnual = computeHeadsTotal(updatedComponents)
    set({
      feeStructures: state.feeStructures.map((s) => s.id === structureId
        ? {
          ...s,
          components: updatedComponents,
          annual: newAnnual,
        }
        : s),
      versions: currentVersion
        ? state.versions.map((v) => v.id === currentVersion.id
          ? { ...v, heads: updatedHeads, totalAmount: computeHeadsTotal(updatedHeads) }
          : v)
        : state.versions,
      audit: pushAudit(state, {
        action: 'fee_head.created',
        actor: 'Principal',
        entityId: id,
        entityType: 'fee_head',
        description: `Fee head "${newHead.name}" (${newHead.frequency} ${formatINR(newHead.amount)}) added to structure ${struct.className}`,
      }),
      changeLog: currentVersion ? pushChangeLog(state, {
        structureId,
        versionId: currentVersion.id,
        action: 'edited',
        changedBy: 'Principal',
        changes: [{ headName: newHead.name, oldValue: 0, newValue: newHead.amount }],
        affectedStudents: countStudentsForStructure(struct),
      }) : state.changeLog,
    })
    return { success: true }
  },

  updateFeeHead: (structureId, headId, patch) => {
    const state = get()
    const struct = state.feeStructures.find((s) => s.id === structureId)
    const oldHead = struct?.components.find((h) => h.id === headId)

    // ─── Fix 8 (FEE-CORRECT): validation ───────────────────────────
    if (!struct) return { success: false, error: 'Fee structure not found.' }
    if (!oldHead) return { success: false, error: 'Fee head not found.' }
    if (patch.name !== undefined && !patch.name.trim()) {
      return { success: false, error: 'Fee head name cannot be empty.' }
    }
    if (patch.amount !== undefined && (typeof patch.amount !== 'number' || patch.amount < 0)) {
      return { success: false, error: 'Amount must be a non-negative number.' }
    }
    if (patch.frequency !== undefined && !VALID_FREQUENCIES.includes(patch.frequency)) {
      return { success: false, error: `Frequency must be one of: ${VALID_FREQUENCIES.join(', ')}.` }
    }
    // Duplicate name guard (case-insensitive, excluding the head being edited).
    if (patch.name !== undefined) {
      const dup = struct.components.find((c) =>
        c.id !== headId && c.name.trim().toLowerCase() === patch.name!.trim().toLowerCase())
      if (dup) {
        return { success: false, error: `Another fee head named "${dup.name}" already exists in this structure.` }
      }
    }

    const currentVersion = state.versions.find((v) => v.structureId === structureId && v.status === 'current')
    const updatedHeads = currentVersion
      ? currentVersion.heads.map((h) => h.id === headId ? { ...h, ...patch } : h)
      : []
    const updatedComponents = struct.components.map((h) => h.id === headId ? { ...h, ...patch } : h)
    const newAnnual = computeHeadsTotal(updatedComponents)
    set({
      feeStructures: state.feeStructures.map((s) => s.id === structureId
        ? {
          ...s,
          components: updatedComponents,
          annual: newAnnual,
        }
        : s),
      versions: currentVersion
        ? state.versions.map((v) => v.id === currentVersion.id
          ? { ...v, heads: updatedHeads, totalAmount: computeHeadsTotal(updatedHeads) }
          : v)
        : state.versions,
      audit: pushAudit(state, {
        action: 'fee_head.updated',
        actor: 'Principal',
        entityId: headId,
        entityType: 'fee_head',
        description: `Fee head "${oldHead.name}" updated in ${struct.className}`,
        before: JSON.stringify({ amount: oldHead.amount, mandatory: oldHead.mandatory, frequency: oldHead.frequency }),
        after: JSON.stringify(patch),
      }),
      changeLog: currentVersion && patch.amount !== undefined && patch.amount !== oldHead.amount
        ? pushChangeLog(state, {
            structureId,
            versionId: currentVersion.id,
            action: 'edited',
            changedBy: 'Principal',
            changes: [{ headName: oldHead.name, oldValue: oldHead.amount, newValue: patch.amount }],
            affectedStudents: countStudentsForStructure(struct),
          })
        : state.changeLog,
    })
    return { success: true }
  },

  archiveFeeHead: (structureId, headId) => {
    const state = get()
    const struct = state.feeStructures.find((s) => s.id === structureId)
    const head = struct?.components.find((h) => h.id === headId)
    const currentVersion = state.versions.find((v) => v.structureId === structureId && v.status === 'current')
    const updatedHeads = currentVersion
      ? currentVersion.heads.map((h) => h.id === headId ? { ...h, active: false } : h)
      : []
    const updatedComponents = struct
      ? struct.components.map((h) => h.id === headId ? { ...h, active: false } : h)
      : []
    set({
      feeStructures: state.feeStructures.map((s) => s.id === structureId
        ? {
          ...s,
          components: updatedComponents,
          annual: computeHeadsTotal(updatedComponents),
        }
        : s),
      versions: currentVersion
        ? state.versions.map((v) => v.id === currentVersion.id
          ? { ...v, heads: updatedHeads, totalAmount: computeHeadsTotal(updatedHeads) }
          : v)
        : state.versions,
      audit: pushAudit(state, {
        action: 'fee_head.archived',
        actor: 'Principal',
        entityId: headId,
        entityType: 'fee_head',
        description: `Fee head "${head?.name ?? headId}" archived in ${struct?.className ?? structureId} (historical transactions preserved)`,
      }),
      changeLog: currentVersion && head
        ? pushChangeLog(state, {
            structureId,
            versionId: currentVersion.id,
            action: 'edited',
            changedBy: 'Principal',
            changes: [{ headName: head.name, oldValue: head.amount, newValue: 0 }],
            affectedStudents: countStudentsForStructure({ className: struct?.className ?? '', classLevel: struct?.classLevel ?? '' }),
          })
        : state.changeLog,
    })
  },

  // ─── Phase 3 — versioned Fee Structure mutations ──────────────────

  // PHASE 6 — catalogue normalization. Patches the catalogueId +
  // category fields on a single FeeHead, no version bump, no financial
  // total change. Emits an audit entry. Empty catalogueId unlinks.
  linkHeadToCatalogue: (structureId, headId, catalogueId, category) => {
    const state = get()
    const struct = state.feeStructures.find((s) => s.id === structureId)
    if (!struct) return { success: false, error: 'Structure not found' }
    const head = struct.components.find((h) => h.id === headId)
    if (!head) return { success: false, error: 'Fee head not found' }
    const currentVersion = state.versions.find((v) => v.structureId === structureId && v.status === 'current')
    const isUnlinking = !catalogueId
    const nextCategory: FeeHeadCategory | undefined = catalogueId ? (category ?? head.category ?? 'Other') : undefined

    const updatedComponents = struct.components.map((h) => h.id === headId
      ? {
          ...h,
          ...(catalogueId ? { catalogueId } : { catalogueId: undefined }),
          ...(nextCategory !== undefined ? { category: nextCategory } : { category: undefined }),
        }
      : h,
    )
    const updatedHeads = currentVersion
      ? currentVersion.heads.map((h) => h.id === headId
        ? {
            ...h,
            ...(catalogueId ? { catalogueId } : { catalogueId: undefined }),
            ...(nextCategory !== undefined ? { category: nextCategory } : { category: undefined }),
          }
        : h)
      : []

    set({
      feeStructures: state.feeStructures.map((s) => s.id === structureId
        ? { ...s, components: updatedComponents }
        : s),
      versions: currentVersion
        ? state.versions.map((v) => v.id === currentVersion.id
          ? { ...v, heads: updatedHeads }
          : v)
        : state.versions,
      audit: pushAudit(state, {
        action: 'fee_head.updated',
        actor: 'Principal',
        entityId: headId,
        entityType: 'fee_head',
        description: `Fee head "${head.name}" in ${struct.className} ${isUnlinking ? 'unlinked from catalogue' : `linked to catalogue entry ${catalogueId}`}`,
      }),
    })
    return { success: true }
  },

  bulkLinkHeadsByName: (name, catalogueId, structureId) => {
    const state = get()
    const targetName = name.trim().toLowerCase()
    if (!targetName) return { structures: 0, heads: 0 }
    // Look up the master catalogue entry to derive the category. Falls
    // back to 'Other' if the entry isn't found — should be rare since
    // the caller passes a real catalogue id.
    let category: FeeHeadCategory = 'Other'
    if (catalogueId) {
      // Read the master catalogue via the school-settings-store's
      // getState() — this is a one-shot read (NOT a subscription),
      // so there's no React re-render concern. Statically imported
      // because there's no circular dep (school-settings-store doesn't
      // import from fee-store — verified).
      try {
        const entry = useSchoolSettingsStore.getState().fees.feeHeads.find((h) => h.id === catalogueId)
        if (entry) category = entry.type
      } catch {
        // Fall back to 'Other' — the link still works, the principal
        // can edit the catalogue entry separately.
      }
    }
    let structures = 0
    let heads = 0
    const nextFeeStructures = state.feeStructures.map((s) => {
      if (structureId && s.id !== structureId) return s
      let structureTouched = false
      const nextComponents = s.components.map((h) => {
        if (h.name.trim().toLowerCase() === targetName) {
          structureTouched = true
          heads += 1
          return { ...h, catalogueId: catalogueId || undefined, category }
        }
        return h
      })
      if (structureTouched) structures += 1
      return structureTouched ? { ...s, components: nextComponents } : s
    })
    // Mirror onto current versions too — keeps the version table in sync.
    const nextVersions = state.versions.map((v) => {
      if (v.status !== 'current') return v
      if (structureId && v.structureId !== structureId) return v
      const struct = state.feeStructures.find((s) => s.id === v.structureId)
      if (!struct) return v
      const anyMatch = struct.components.some((h) => h.name.trim().toLowerCase() === targetName)
      if (!anyMatch) return v
      const nextHeads = v.heads.map((h) => {
        if (h.name.trim().toLowerCase() === targetName) {
          return { ...h, catalogueId: catalogueId || undefined, category }
        }
        return h
      })
      return { ...v, heads: nextHeads }
    })
    set({
      feeStructures: nextFeeStructures,
      versions: nextVersions,
      audit: pushAudit(state, {
        action: 'fee_head.updated',
        actor: 'Principal',
        entityId: catalogueId,
        entityType: 'fee_head',
        description: `Bulk-linked ${heads} head${heads === 1 ? '' : 's'} named "${name}" to catalogue entry ${catalogueId} across ${structures} structure${structures === 1 ? '' : 's'}`,
      }),
    })
    return { structures, heads }
  },

  createFeeStructure: (input) => {
    const state = get()
    const actor = input.actor ?? 'Principal'
    const structureId = `FS${(state.feeStructures.length + 1).toString().padStart(2, '0')}-${Date.now().toString(36)}`
    const versionId = `FSV-${structureId}-1`
    const now = new Date().toISOString()
    const total = computeHeadsTotal(input.heads)
    // FEE-EXAM: snapshot the optional exam fee schedule onto both the
    // live structure and the Version 1 draft. Backward-compatible — if
    // the caller omits `examFeeSchedule`, no field is written (undefined).
    const examFeeScheduleSnapshot = input.examFeeSchedule?.map((e) => ({ ...e }))
    const newStructure: FeeStructureConfig = {
      id: structureId,
      category: input.category,
      className: input.className,
      classLevel: input.classLevel,
      annual: total,
      components: input.heads.map((h) => ({ ...h })),
      effectiveFrom: input.effectiveFrom,
      version: 1,
      ...(examFeeScheduleSnapshot ? { examFeeSchedule: examFeeScheduleSnapshot } : {}),
      // PHASE 5 — class-wise binding. Persist the caller-supplied
      // classId/applicableClassIds (optional; backward-compatible
      // when undefined).
      ...(input.classId ? { classId: input.classId } : {}),
      ...(input.applicableClassIds ? { applicableClassIds: [...input.applicableClassIds] } : {}),
    }
    const newVersion: FeeStructureVersion = {
      id: versionId,
      structureId,
      version: 1,
      status: 'draft',
      heads: input.heads.map((h) => ({ ...h })),
      totalAmount: total,
      effectiveFrom: input.effectiveFrom,
      createdBy: actor,
      createdAt: now,
      changeReason: 'Initial draft',
      notes: input.notes,
      ...(examFeeScheduleSnapshot ? { examFeeSchedule: examFeeScheduleSnapshot } : {}),
    }
    set({
      feeStructures: [...state.feeStructures, newStructure],
      versions: [...state.versions, newVersion],
      audit: pushAudit(state, {
        action: 'fee_structure.changed',
        actor,
        entityId: structureId,
        entityType: 'fee_structure',
        description: `Fee structure "${input.className}" created as draft (Version 1)`,
      }),
      changeLog: pushChangeLog(state, {
        structureId,
        versionId,
        action: 'created',
        changedBy: actor,
        changes: input.heads.map((h) => ({ headName: h.name, oldValue: 0, newValue: h.amount })),
        reason: input.notes,
        affectedStudents: countStudentsForStructure({
          className: input.className,
          classLevel: input.classLevel,
          ...(input.classId ? { classId: input.classId } : {}),
          ...(input.applicableClassIds ? { applicableClassIds: input.applicableClassIds } : {}),
        }),
      }),
    })
    return structureId
  },

  publishFeeStructureVersion: (structureId, newHeads, effectiveFrom, reason, actorInput, examFeeSchedule) => {
    const state = get()
    const actor = actorInput ?? 'Principal'
    const struct = state.feeStructures.find((s) => s.id === structureId)
    if (!struct) return ''
    // Find the prior CURRENT version — it will be archived.
    const priorCurrent = state.versions.find((v) => v.structureId === structureId && v.status === 'current')
    // Compute next version number (max across all versions for this structure)
    const maxVer = state.versions.filter((v) => v.structureId === structureId).reduce((m, v) => Math.max(m, v.version), 0)
    const nextVer = maxVer + 1
    const versionId = `FSV-${structureId}-${nextVer}`
    const now = new Date().toISOString()
    const total = computeHeadsTotal(newHeads)
    // FEE-EXAM: snapshot the exam fee schedule onto the new version. If
    // the caller omitted the 6th parameter, fall back to the structure's
    // existing examFeeSchedule (so the new version preserves whatever
    // per-exam fees were already configured — backward-compatible).
    const examFeeScheduleSnapshot = (examFeeSchedule
      ? examFeeSchedule.map((e) => ({ ...e }))
      : struct.examFeeSchedule?.map((e) => ({ ...e })))
    const newVersion: FeeStructureVersion = {
      id: versionId,
      structureId,
      version: nextVer,
      status: 'current',
      heads: newHeads.map((h) => ({ ...h })),
      totalAmount: total,
      effectiveFrom,
      createdBy: actor,
      createdAt: now,
      approvedBy: actor,
      approvedAt: now,
      changeReason: reason,
      supersedesId: priorCurrent?.id,
      ...(examFeeScheduleSnapshot ? { examFeeSchedule: examFeeScheduleSnapshot } : {}),
    }
    set({
      feeStructures: state.feeStructures.map((s) => s.id === structureId
        ? {
          ...s,
          components: newHeads.map((h) => ({ ...h })),
          annual: total,
          effectiveFrom,
          version: nextVer,
          supersededBy: undefined,
          ...(examFeeScheduleSnapshot ? { examFeeSchedule: examFeeScheduleSnapshot } : {}),
        }
        : s),
      versions: [
        newVersion,
        ...(priorCurrent
          ? state.versions.map((v) => v.id === priorCurrent.id
            ? { ...v, status: 'archived' as const, effectiveTo: effectiveFrom }
            : v)
          : state.versions),
      ],
      audit: pushAudit(state, {
        action: 'fee_structure.changed',
        actor,
        entityId: structureId,
        entityType: 'fee_structure',
        description: `Fee structure "${struct.className}" Version ${nextVer} published (effective ${effectiveFrom}) — ${reason}`,
      }),
      changeLog: pushChangeLog(state, {
        structureId,
        versionId,
        action: 'published',
        changedBy: actor,
        changes: diffHeads(priorCurrent?.heads ?? [], newHeads),
        reason,
        affectedStudents: countStudentsForStructure(struct),
      }),
    })
    notifyFeeStructureChange(structureId, struct.className, 'published', countStudentsForStructure(struct), effectiveFrom, actor, reason)
    return versionId
  },

  scheduleFeeStructureVersion: (structureId, newHeads, effectiveFrom, reason, actorInput, examFeeSchedule) => {
    const state = get()
    const actor = actorInput ?? 'Principal'
    const struct = state.feeStructures.find((s) => s.id === structureId)
    if (!struct) return ''
    const maxVer = state.versions.filter((v) => v.structureId === structureId).reduce((m, v) => Math.max(m, v.version), 0)
    const nextVer = maxVer + 1
    const versionId = `FSV-${structureId}-${nextVer}`
    const now = new Date().toISOString()
    const total = computeHeadsTotal(newHeads)
    // FEE-EXAM: snapshot the exam fee schedule onto the scheduled version.
    const examFeeScheduleSnapshot = (examFeeSchedule
      ? examFeeSchedule.map((e) => ({ ...e }))
      : struct.examFeeSchedule?.map((e) => ({ ...e })))
    const newVersion: FeeStructureVersion = {
      id: versionId,
      structureId,
      version: nextVer,
      status: 'scheduled',
      heads: newHeads.map((h) => ({ ...h })),
      totalAmount: total,
      effectiveFrom,
      createdBy: actor,
      createdAt: now,
      changeReason: reason,
      ...(examFeeScheduleSnapshot ? { examFeeSchedule: examFeeScheduleSnapshot } : {}),
    }
    set({
      versions: [...state.versions, newVersion],
      audit: pushAudit(state, {
        action: 'fee_structure.changed',
        actor,
        entityId: structureId,
        entityType: 'fee_structure',
        description: `Fee structure "${struct.className}" Version ${nextVer} scheduled (effective ${effectiveFrom}) — ${reason}`,
      }),
      changeLog: pushChangeLog(state, {
        structureId,
        versionId,
        action: 'scheduled',
        changedBy: actor,
        changes: diffHeads(state.versions.find((v) => v.structureId === structureId && v.status === 'current')?.heads ?? [], newHeads),
        reason,
        affectedStudents: countStudentsForStructure(struct),
      }),
    })
    notifyFeeStructureChange(structureId, struct.className, 'scheduled', countStudentsForStructure(struct), effectiveFrom, actor, reason)
    return versionId
  },

  archiveFeeStructureVersion: (versionId, actorInput) => {
    const state = get()
    const actor = actorInput ?? 'Principal'
    const version = state.versions.find((v) => v.id === versionId)
    if (!version) return
    // Safety guard: cannot archive the only CURRENT version (must publish a replacement first).
    if (version.status === 'current') {
      const otherCurrent = state.versions.find((v) => v.structureId === version.structureId && v.status === 'current' && v.id !== versionId)
      if (!otherCurrent) return
    }
    const struct = state.feeStructures.find((s) => s.id === version.structureId)
    set({
      versions: state.versions.map((v) => v.id === versionId ? { ...v, status: 'archived' as const, effectiveTo: v.effectiveTo ?? new Date().toISOString().split('T')[0] } : v),
      audit: pushAudit(state, {
        action: 'fee_structure.changed',
        actor,
        entityId: versionId,
        entityType: 'fee_structure',
        description: `Version ${version.version} of "${struct?.className ?? version.structureId}" archived`,
      }),
      changeLog: pushChangeLog(state, {
        structureId: version.structureId,
        versionId,
        action: 'archived',
        changedBy: actor,
        changes: [],
        affectedStudents: countStudentsForStructure({ className: struct?.className ?? '', classLevel: struct?.classLevel ?? '' }),
      }),
    })
    if (struct) {
      notifyFeeStructureChange(version.structureId, struct.className, 'archived', countStudentsForStructure(struct), version.effectiveFrom, actor)
    }
  },

  revertFeeStructureVersion: (structureId, targetVersionId, reason, actorInput) => {
    const state = get()
    const actor = actorInput ?? 'Principal'
    const struct = state.feeStructures.find((s) => s.id === structureId)
    const target = state.versions.find((v) => v.id === targetVersionId && v.structureId === structureId)
    if (!struct || !target) return ''
    // Create a NEW version with the target's heads — never destroy history.
    const priorCurrent = state.versions.find((v) => v.structureId === structureId && v.status === 'current')
    const maxVer = state.versions.filter((v) => v.structureId === structureId).reduce((m, v) => Math.max(m, v.version), 0)
    const nextVer = maxVer + 1
    const versionId = `FSV-${structureId}-${nextVer}`
    const now = new Date().toISOString()
    const effectiveFrom = now.split('T')[0]
    const total = computeHeadsTotal(target.heads)
    // FEE-EXAM: restore the target version's exam fee schedule too —
    // no signature change required since the snapshot lives on `target`.
    const examFeeScheduleSnapshot = target.examFeeSchedule?.map((e) => ({ ...e }))
    const newVersion: FeeStructureVersion = {
      id: versionId,
      structureId,
      version: nextVer,
      status: 'current',
      heads: target.heads.map((h) => ({ ...h })),
      totalAmount: total,
      effectiveFrom,
      createdBy: actor,
      createdAt: now,
      approvedBy: actor,
      approvedAt: now,
      changeReason: `Rolled back to Version ${target.version} — ${reason}`,
      supersedesId: priorCurrent?.id,
      notes: `Restored from ${target.id}`,
      ...(examFeeScheduleSnapshot ? { examFeeSchedule: examFeeScheduleSnapshot } : {}),
    }
    set({
      feeStructures: state.feeStructures.map((s) => s.id === structureId
        ? {
          ...s,
          components: target.heads.map((h) => ({ ...h })),
          annual: total,
          effectiveFrom,
          version: nextVer,
          supersededBy: undefined,
          ...(examFeeScheduleSnapshot ? { examFeeSchedule: examFeeScheduleSnapshot } : {}),
        }
        : s),
      versions: [
        newVersion,
        ...(priorCurrent
          ? state.versions.map((v) => v.id === priorCurrent.id
            ? { ...v, status: 'archived' as const, effectiveTo: effectiveFrom }
            : v)
          : state.versions),
      ],
      audit: pushAudit(state, {
        action: 'fee_structure.changed',
        actor,
        entityId: structureId,
        entityType: 'fee_structure',
        description: `Fee structure "${struct.className}" rolled back to Version ${target.version} → new Version ${nextVer} created (${reason})`,
      }),
      changeLog: pushChangeLog(state, {
        structureId,
        versionId,
        action: 'rolled_back',
        changedBy: actor,
        changes: diffHeads(priorCurrent?.heads ?? [], target.heads),
        reason: `Rolled back to v${target.version}: ${reason}`,
        affectedStudents: countStudentsForStructure(struct),
      }),
    })
    notifyFeeStructureChange(structureId, struct.className, 'rolled_back', countStudentsForStructure(struct), effectiveFrom, actor, reason)
    return versionId
  },

  updateFeeStructureDraft: (versionId, changes) => {
    const state = get()
    const version = state.versions.find((v) => v.id === versionId && v.status === 'draft')
    if (!version) return
    // Drafts are mutable — no audit / changeLog entry until publish.
    const updatedHeads = changes.heads ? changes.heads.map((h) => ({ ...h })) : version.heads
    // FEE-EXAM: optionally stage the exam fee schedule on the draft.
    const updatedExamFeeSchedule = changes.examFeeSchedule
      ? changes.examFeeSchedule.map((e) => ({ ...e }))
      : version.examFeeSchedule?.map((e) => ({ ...e }))
    set({
      versions: state.versions.map((v) => v.id === versionId
        ? {
          ...v,
          heads: updatedHeads,
          totalAmount: computeHeadsTotal(updatedHeads),
          notes: changes.notes ?? v.notes,
          changeReason: changes.changeReason ?? v.changeReason,
          ...(updatedExamFeeSchedule ? { examFeeSchedule: updatedExamFeeSchedule } : {}),
        }
        : v),
    })
  },

  // ─── Fix 4 (FEE-CORRECT): delete a Fee Structure with safeguards ──
  //
  // A structure can ONLY be deleted if:
  //   1. Every version is a DRAFT (never published) — i.e. the structure
  //      was created but never went live. In this case all versions and
  //      the structure record itself are removed.
  //   2. OR every version is ARCHIVED AND no FeeTransaction references
  //      the structure (we don't store an FK today, but the audit-trail
  //      mentions structureId in `entityId` for `fee_structure.changed`
  //      entries and FeeChangeLog rows reference structureId). We treat
  //      "no financial records depend on it" as: no audit entries with
  //      entityType='fee_structure' OR action='fee_head.*' OR entityType='transaction'
  //      mentioning this structureId (audit IDs reference the structure
  //      indirectly; the safer signal is: no version of this structure
  //      has status='current' or 'scheduled').
  //
  // CURRENT / PUBLISHED structures CANNOT be deleted (archive instead).
  // ARCHIVED structures with active financial references CANNOT be deleted.
  // The audit log + changeLog entries are NEVER deleted — they preserve
  // the immutable financial history forever.
  deleteFeeStructure: (structureId, actor) => {
    const state = get()
    const struct = state.feeStructures.find((s) => s.id === structureId)
    if (!struct) {
      return { success: false, error: 'Fee structure not found.' }
    }

    const structureVersions = state.versions.filter((v) => v.structureId === structureId)
    const hasCurrent = structureVersions.some((v) => v.status === 'current')
    const hasScheduled = structureVersions.some((v) => v.status === 'scheduled')

    // Rule 1: cannot delete a structure with a CURRENT (published) version.
    if (hasCurrent) {
      return {
        success: false,
        error: 'Cannot delete a published structure. Archive it instead.',
      }
    }
    // Rule 2: cannot delete a structure with a SCHEDULED version (it will go live).
    if (hasScheduled) {
      return {
        success: false,
        error: 'Cannot delete a structure with a scheduled version. Cancel the scheduled version first.',
      }
    }

    // Rule 3: ARCHIVED structures cannot be deleted if any financial
    // transaction references them. We don't store an FK on FeeTransaction,
    // but the audit trail keeps a record of every fee_structure.changed /
    // fee_head.* event. If ANY audit record references this structureId
    // AND there are recorded transactions for students in this classLevel,
    // we treat it as "financial records depend on this structure".
    const allArchived = structureVersions.length > 0 && structureVersions.every((v) => v.status === 'archived')
    if (allArchived) {
      // Look for transactions whose student belongs to this class —
      // those transactions were computed against this (or a prior) version
      // of the same structure, so we cannot safely delete it.
      // FEE-PER-CLASS: tries an EXACT className match first (so a Class 9
      // structure only blocks deletion when Class 9 students have txns);
      // falls back to classLevel substring matching when no student has
      // an exact className match (e.g. custom structures with no real
      // class mapping).
      const students = useStudentsStore.getState().students.filter((s) => s.status === 'Active')
      const exactMatches = struct.className ? students.filter((s) => s.className === struct.className) : []
      const studentsInScope = exactMatches.length > 0
        ? exactMatches
        : students.filter((s) => studentClassLevel(s.className) === struct.classLevel)
      const studentIdsInScope = new Set(studentsInScope.map((s) => s.id))
      const linkedTxns = state.transactions.some((t) => studentIdsInScope.has(t.studentId))
      if (linkedTxns) {
        return {
          success: false,
          error: 'Cannot delete — financial records depend on this structure.',
        }
      }
    }

    // All checks passed — proceed with deletion.
    set({
      feeStructures: state.feeStructures.filter((s) => s.id !== structureId),
      versions: state.versions.filter((v) => v.structureId !== structureId),
      audit: pushAudit(state, {
        action: 'fee_structure.changed',
        actor,
        entityId: structureId,
        entityType: 'fee_structure',
        description: `Fee structure "${struct.className}" (${struct.classLevel}) deleted by ${actor}. Financial records and audit history preserved.`,
      }),
      changeLog: pushChangeLog(state, {
        structureId,
        versionId: structureVersions[0]?.id ?? '',
        action: 'deleted',
        changedBy: actor,
        changes: struct.components.map((c) => ({ headName: c.name, oldValue: c.amount, newValue: 0 })),
        affectedStudents: 0,
      }),
    })
    notifyFeeStructureChange(structureId, struct.className, 'deleted', 0, new Date().toISOString().split('T')[0], actor, 'Structure deleted')
    return { success: true }
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

  // ─── Phase 4 — payment infrastructure mutations ──────────────────
  //
  // Each financially-sensitive mutation emits an immutable AuditRecord via
  // pushAudit. Operational mutations (updateGatewayStatus, recordWebhookEvent)
  // do NOT emit audit entries — those are too noisy and the dedicated arrays
  // (webhookEvents) are themselves the audit log.

  connectGateway: (provider, merchantId, apiKeyId, environment) => {
    const state = get()
    const now = new Date().toISOString()
    const config: GatewayConfig = {
      // Preserve id across reconnections; generate a new one on first connect.
      id: state.gatewayConfig?.id ?? `GC-${Date.now().toString(36)}`,
      provider,
      environment,
      status: environment === 'test' ? 'test_mode' : 'connected',
      merchantId,
      apiKeyId,
      // webhookSecret is intentionally NOT set on client state — server-side only.
      webhookUrl: `/api/webhooks/${provider}`,
      webhookStatus: 'not_configured',
      failedWebhookCount: 0,
      // Preserve an existing settlement account link; otherwise default to the primary bank.
      settlementAccountId: state.gatewayConfig?.settlementAccountId ?? state.bankAccounts.find((b) => b.isPrimary)?.id,
      connectedAt: now,
      connectedBy: 'Principal',
      testModePassed: false,
    }
    set({
      gatewayConfig: config,
      audit: pushAudit(state, {
        action: 'gateway.connected',
        actor: 'Principal',
        entityId: config.id,
        entityType: 'gateway',
        description: `Gateway ${provider} connected in ${environment} mode (merchant: ${merchantId})`,
      }),
    })
  },

  disconnectGateway: () => {
    const state = get()
    if (!state.gatewayConfig) return
    const prevId = state.gatewayConfig.id
    const prevProvider = state.gatewayConfig.provider
    set({
      gatewayConfig: null,
      audit: pushAudit(state, {
        action: 'gateway.disconnected',
        actor: 'Principal',
        entityId: prevId,
        entityType: 'gateway',
        description: `Gateway ${prevProvider} disconnected (historical transactions preserved)`,
      }),
    })
  },

  updateGatewayStatus: (status, lastWebhookAt) => {
    const state = get()
    if (!state.gatewayConfig) return
    set({
      gatewayConfig: {
        ...state.gatewayConfig,
        status,
        ...(lastWebhookAt !== undefined ? { lastWebhookAt } : {}),
      },
    })
  },

  addBankAccount: (account) => {
    const state = get()
    const id = `BA-${(state.bankAccounts.length + 1).toString().padStart(2, '0')}-${Date.now().toString(36)}`
    const now = new Date().toISOString()
    // First account auto-becomes primary; otherwise respect the caller's isPrimary flag.
    const becomesPrimary = state.bankAccounts.length === 0 ? true : !!account.isPrimary
    const newAccount: BankAccount = {
      ...account,
      id,
      addedAt: now,
      addedBy: 'Principal',
      status: 'active',
      isPrimary: becomesPrimary,
    }
    set({
      bankAccounts: [
        ...(becomesPrimary
          ? state.bankAccounts.map((b) => ({ ...b, isPrimary: false }))
          : state.bankAccounts),
        newAccount,
      ],
      audit: pushAudit(state, {
        action: 'bank_account.added',
        actor: 'Principal',
        entityId: id,
        entityType: 'bank_account',
        description: `Bank account ${account.bankName} ****${account.accountNumber.slice(-4)} added${becomesPrimary ? ' (marked primary)' : ''}`,
      }),
    })
  },

  updateBankAccount: (id, updates) => {
    const state = get()
    const prev = state.bankAccounts.find((b) => b.id === id)
    if (!prev) return
    set({
      bankAccounts: state.bankAccounts.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      audit: pushAudit(state, {
        action: 'bank_account.updated',
        actor: 'Principal',
        entityId: id,
        entityType: 'bank_account',
        description: `Bank account ${prev.bankName} ****${prev.accountNumber.slice(-4)} updated`,
      }),
    })
  },

  setPrimaryBankAccount: (id) => {
    const state = get()
    const target = state.bankAccounts.find((b) => b.id === id)
    if (!target || target.status !== 'active') return
    set({
      bankAccounts: state.bankAccounts.map((b) => ({ ...b, isPrimary: b.id === id })),
      audit: pushAudit(state, {
        action: 'bank_account.updated',
        actor: 'Principal',
        entityId: id,
        entityType: 'bank_account',
        description: `Bank account ${target.bankName} ****${target.accountNumber.slice(-4)} set as primary settlement account`,
      }),
    })
  },

  deactivateBankAccount: (id) => {
    const state = get()
    const prev = state.bankAccounts.find((b) => b.id === id)
    if (!prev) return
    let updatedAccounts = state.bankAccounts.map((b) =>
      b.id === id ? { ...b, status: 'inactive' as const, isPrimary: false } : b,
    )
    // If we are deactivating the current primary, promote another active account.
    let promoted: BankAccount | undefined
    if (prev.isPrimary) {
      promoted = updatedAccounts.find((b) => b.status === 'active')
      if (promoted) {
        updatedAccounts = updatedAccounts.map((b) =>
          b.id === promoted!.id ? { ...b, isPrimary: true } : b,
        )
      }
    }
    set({
      bankAccounts: updatedAccounts,
      audit: pushAudit(state, {
        action: 'bank_account.deactivated',
        actor: 'Principal',
        entityId: id,
        entityType: 'bank_account',
        description: `Bank account ${prev.bankName} ****${prev.accountNumber.slice(-4)} deactivated${promoted ? ` (promoted ${promoted.bankName} ****${promoted.accountNumber.slice(-4)} as primary)` : ''}`,
      }),
    })
  },

  addUpiQrConfig: (config) => {
    const state = get()
    const id = `UQR-${(state.upiQrConfigs.length + 1).toString().padStart(2, '0')}-${Date.now().toString(36)}`
    const now = new Date().toISOString()
    const newConfig: UpiQrConfig = {
      ...config,
      id,
      addedAt: now,
      addedBy: 'Principal',
      status: 'active',
    }
    set({
      upiQrConfigs: [...state.upiQrConfigs, newConfig],
      audit: pushAudit(state, {
        action: 'upi_qr.added',
        actor: 'Principal',
        entityId: id,
        entityType: 'upi_qr',
        description: `UPI/QR config "${config.name}" added (${config.upiId}, ${config.qrType})`,
      }),
    })
  },

  updateUpiQrConfig: (id, updates) => {
    const state = get()
    const prev = state.upiQrConfigs.find((c) => c.id === id)
    if (!prev) return
    set({
      upiQrConfigs: state.upiQrConfigs.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      audit: pushAudit(state, {
        action: 'upi_qr.updated',
        actor: 'Principal',
        entityId: id,
        entityType: 'upi_qr',
        description: `UPI/QR config "${prev.name}" updated`,
      }),
    })
  },

  recordSettlement: (settlement) => {
    const state = get()
    const id = `SET-${(state.settlements.length + 1).toString().padStart(2, '0')}-${Date.now().toString(36)}`
    const now = new Date().toISOString()
    const newSettlement: Settlement = {
      ...settlement,
      id,
      createdAt: now,
    }
    // Link each included transaction to this settlement + propagate settlement status.
    const updatedTransactions = state.transactions.map((t) =>
      newSettlement.transactionIds.includes(t.id)
        ? { ...t, settlementId: id, settlementStatus: newSettlement.status }
        : t,
    )
    set({
      settlements: [...state.settlements, newSettlement],
      transactions: updatedTransactions,
      audit: pushAudit(state, {
        action: 'settlement.recorded',
        actor: 'Principal',
        entityId: id,
        entityType: 'settlement',
        description: `Settlement ${id} recorded — gross ₹${newSettlement.grossAmount.toLocaleString('en-IN')}, net ₹${newSettlement.netAmount.toLocaleString('en-IN')}, ${newSettlement.transactionIds.length} transactions`,
      }),
    })
  },

  reconcileTransaction: (transactionId, settlementId, utr, reconciledBy) => {
    const state = get()
    const txn = state.transactions.find((t) => t.id === transactionId)
    if (!txn) return
    const recId = `REC-${(state.reconciliationRecords.length + 1).toString().padStart(3, '0')}-${Date.now().toString(36)}`
    const now = new Date().toISOString()
    const record: ReconciliationRecord = {
      id: recId,
      transactionId,
      settlementId,
      gatewayPaymentId: txn.gatewayPaymentId,
      gatewayOrderId: txn.gatewayOrderId,
      utr,
      reconciliationStatus: 'reconciled',
      reconciledBy,
      reconciledAt: now,
    }
    set({
      reconciliationRecords: [record, ...state.reconciliationRecords],
      transactions: state.transactions.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              reconciliationStatus: 'reconciled' as const,
              settlementId: settlementId ?? t.settlementId,
              utr: utr ?? t.utr,
            }
          : t,
      ),
      audit: pushAudit(state, {
        action: 'reconciliation.matched',
        actor: reconciledBy,
        entityId: transactionId,
        entityType: 'reconciliation',
        description: `Transaction ${txn.receiptNo} reconciled${settlementId ? ` (settlement ${settlementId})` : ''}${utr ? ` UTR ${utr}` : ''}`,
      }),
    })
  },

  recordWebhookEvent: (event) => {
    const state = get()
    // Idempotency: skip if a webhook with the same provider + eventId already exists.
    // This prevents duplicate transaction updates if the gateway retries delivery.
    const existing = state.webhookEvents.find(
      (w) => w.provider === event.provider && w.eventId === event.eventId,
    )
    if (existing) return
    const id = `WH-${(state.webhookEvents.length + 1).toString().padStart(3, '0')}-${Date.now().toString(36)}`
    const newEvent: WebhookEvent = { ...event, id }
    set({
      webhookEvents: [newEvent, ...state.webhookEvents],
    })
  },
}), {
  // Persist the fee store to localStorage so the entire fee system
  // (structures, versions, transactions, settlements, reconciliation,
  // audit log, settings) survives page reloads. Previously every reload
  // wiped the store back to seed values — making the whole Fee module a
  // throwaway demo. This is the canonical persistence layer for fee data
  // until/unless the Prisma schema gains FeeStructure/FeeHead/Version/
  // Settlement models (tracked as a separate architectural workstream).
  name: 'scholario-fee-store-v1',
  // PHASE 5 — bumped to v2 to merge in the new classId/applicableClassIds
  // fields on FeeStructureConfig and the catalogueId/category fields on
  // FeeHead. The migrate function patches persisted v1 state to add these
  // fields by looking up the canonical class catalogue + the canonical
  // name→catalogueId map below. Existing user-created structures + heads
  // keep their original ids + amounts; only the new linking fields are
  // added (since they were `undefined` in v1, any value is an improvement).
  //
  // v3 — CORE vs ADDITIONAL financial separation: seeds the new
  // `additionalCharges` array (event-based charges like the Class 8
  // Educational Tour) when the persisted state predates the key. Never
  // overwrites user-created charges; never touches transactions.
  version: 3,
  migrate: (persistedState: any, fromVersion: number) => {
    if (fromVersion < 2 && Array.isArray(persistedState?.feeStructures)) {
      // Map of className → canonical classId for the seed structures.
      // Used to set `classId` + `applicableClassIds` on each migrated
      // structure. Structures whose className isn't in this map (e.g.
      // user-created drafts with className "Class 9 — Copy") keep
      // classId undefined and the matcher falls back to className.
      const classNameToClassId: Record<string, { classId: string; applicableClassIds: string[] }> = {
        'Pre-Nursery': { classId: 'C01', applicableClassIds: ['C01'] },
        'Class 2':    { classId: 'C05', applicableClassIds: ['C05'] },
        'Class 6':    { classId: 'C09', applicableClassIds: ['C09'] },
        'Class 9':    { classId: 'C12', applicableClassIds: ['C12'] },
        'Class 10':   { classId: 'C13', applicableClassIds: ['C13'] },
        // Senior Secondary stream classes share one structure — both
        // C15-PCM and C15-PCB are applicable.
        'Class 12':   { classId: 'C15-PCM', applicableClassIds: ['C15-PCM', 'C15-PCB'] },
      }
      // Map of head name → master catalogue id (matches the seeds in
      // src/lib/store/school-settings-store/initial-state.ts). Used to
      // set `catalogueId` + `category` on each migrated head. Heads
      // whose name isn't in this map (e.g. user-typed custom names)
      // keep catalogueId undefined; the Coverage Matrix UI lists them
      // under "Uncatalogued".
      const headNameToCatalogue: Record<string, { catalogueId: string; category: FeeHeadCategory }> = {
        'Tuition':               { catalogueId: 'fh-1', category: 'Tuition' },
        'Admission Fee':         { catalogueId: 'fh-2', category: 'Admission' },
        'Activity':              { catalogueId: 'fh-3', category: 'Activity' },
        'Computer & Science Lab Fee': { catalogueId: 'fh-4', category: 'Lab' },
        'Library':               { catalogueId: 'fh-5', category: 'Library' },
        'Examination Fee':       { catalogueId: 'fh-6', category: 'Exam' },
        'Transport':             { catalogueId: 'fh-7', category: 'Transport' },
        'Board Examination Fee': { catalogueId: 'fh-8', category: 'Board' },
      }
      persistedState.feeStructures = persistedState.feeStructures.map((fs: any) => {
        if (fs.classId) return fs // already migrated by a prior v2 load
        const classInfo = classNameToClassId[fs.className]
        const components = Array.isArray(fs.components)
          ? fs.components.map((h: any) => {
              if (h.catalogueId) return h
              const cat = headNameToCatalogue[h.name]
              return cat ? { ...h, ...cat } : h
            })
          : fs.components
        return {
          ...fs,
          ...(classInfo ? { classId: classInfo.classId, applicableClassIds: classInfo.applicableClassIds } : {}),
          components,
        }
      })
    }
    // v3 — seed additionalCharges for persisted sessions that predate the
    // key (shallow-merge would keep the seed anyway, but an explicit seed
    // also covers the case where the persisted object exists yet is null).
    if (fromVersion < 3 && !Array.isArray(persistedState?.additionalCharges)) {
      persistedState.additionalCharges = SEED_ADDITIONAL_CHARGES
    }
    return persistedState
  },
  // Persist only DATA, never the mutation functions. Zustand re-binds
  // the actions on rehydrate, so we only need the data slice.
  partialize: (state) => ({
    transactions: state.transactions,
    cashRequests: state.cashRequests,
    audit: state.audit,
    feeStructures: state.feeStructures,
    versions: state.versions,
    changeLog: state.changeLog,
    additionalCharges: state.additionalCharges,
    paymentModes: state.paymentModes,
    lateFeeRule: state.lateFeeRule,
    concessionRule: state.concessionRule,
    receiptSettings: state.receiptSettings,
    receiptCounter: state.receiptCounter,
    gatewayConfig: state.gatewayConfig,
    bankAccounts: state.bankAccounts,
    upiQrConfigs: state.upiQrConfigs,
    settlements: state.settlements,
    reconciliationRecords: state.reconciliationRecords,
    webhookEvents: state.webhookEvents,
  }),
}))

// ─── Helper: compute per-student fee account ─────────────────────────

function computeAccount(
  student: StudentRecord,
  transactions: FeeTransaction[],
  lateFeeRule: LateFeeRule,
  additionalCharges: AdditionalCharge[],
): StudentFeeAccount {
  // Fix 3 (FEE-CORRECT): compute the ACADEMIC YEAR TOTAL from the matching
  // FeeStructureConfig (using `computeHeadsTotal` with the frequency
  // multipliers) instead of `student.feeTotal` (the canonical students-store
  // field that was a stale snapshot from before the frequency model). Falls
  // back to `student.feeTotal` only when no matching structure is found.
  //
  // FEE-EXAM: totalApplicable now = recurring fees (annual) + active exam
  // fee schedule total. The exam fee schedule is the per-exam fees the
  // school charges for each conducted examination (Unit Test, Half-Yearly,
  // Annual Examination, etc.). Adding them here keeps the student's
  // `totalApplicable` consistent with what the Fee Structure publishes.
  //   e.g. FS04 (Secondary): recurring ₹1,16,000 + exam fees ₹1,900 = ₹1,17,900
  // Removing the legacy "Exam" Per Term fee head reduced the recurring
  // total; the per-exam schedule compensates so the student's annual
  // obligation stays sensible.
  // FEE-PER-CLASS: try an EXACT className match first (e.g. student
  // className="Class 9" → FS04 with className="Class 9"). If no structure
  // has that exact className, fall back to classLevel substring matching
  // (e.g. student className="Class 4" → no exact match → classLevel=
  // "Primary" → finds FS02 with classLevel="Primary"). Backward-
  // compatible with the pre-FEE-PER-CLASS seed (range names like
  // "Class 9–10" never exact-match a real student className, so they
  // fall through to the classLevel path).
  const structure = findStructureForStudent(student.className)
  const regularFeesTotal = structure ? computeHeadsTotal(structure.components) : student.feeTotal
  const examFeeTotal = structure ? computeExamFeeTotal(structure.examFeeSchedule) : 0
  const totalApplicable = regularFeesTotal + examFeeTotal

  const concession = student.scholarship ?? 0
  const netPayable = totalApplicable - concession

  // ─── CORE vs ADDITIONAL split (the accounting rule) ────────────────
  // A student's transactions are split by financial category. CORE money
  // (core + examination payments) reduces the core outstanding ONLY;
  // ADDITIONAL money (payments against event-based charges) reduces the
  // additional outstanding ONLY. The two are NEVER mixed into one number.
  const studentTxns = transactions.filter((t) => t.studentId === student.id)
  const countable = (t: FeeTransaction) => t.status === 'Success' || t.status === 'Under Verification'
  const coreTxnsPaid = studentTxns
    .filter((t) => countable(t) && txnCategory(t) !== 'ADDITIONAL')
    .reduce((sum, t) => sum + t.amount, 0)
  const additionalTxns = studentTxns.filter((t) => countable(t) && txnCategory(t) === 'ADDITIONAL')
  const additionalPaid = additionalTxns.reduce((sum, t) => sum + t.amount, 0)

  // Use the larger of: (a) canonical student.feePaid or (b) sum of recorded
  // CORE transactions. Canonical matches Students module; transactions-
  // based reflects new payments. ADDITIONAL payments are deliberately
  // EXCLUDED — a ₹2,500 tour payment must never reduce core fee outstanding.
  const paid = Math.max(student.feePaid, coreTxnsPaid)

  // The student's ACTIVE additional charges — matched by explicit student
  // ids when set, otherwise by class binding (student's classId, with a
  // className→classId derivation fallback for legacy records).
  const studentClassKey = student.classId ?? deriveStudentClassId(student.className)
  const myCharges = additionalCharges.filter((c) => {
    if (c.status !== 'Active') return false
    if (c.studentIds && c.studentIds.length > 0) return c.studentIds.includes(student.id)
    return studentClassKey != null && c.applicableClassIds.includes(studentClassKey)
  })
  const chargePaidById = new Map<string, number>()
  for (const t of additionalTxns) {
    if (!t.additionalChargeId) continue
    chargePaidById.set(t.additionalChargeId, (chargePaidById.get(t.additionalChargeId) ?? 0) + t.amount)
  }
  const additionalChargesForAccount = myCharges.map((c) => {
    const cpaid = chargePaidById.get(c.id) ?? 0
    return {
      chargeId: c.id,
      name: c.name,
      category: c.category,
      amount: c.amount,
      dueDate: c.dueDate,
      mandatory: c.mandatory,
      ...(c.reference ? { reference: c.reference } : {}),
      paid: cpaid,
      outstanding: Math.max(0, c.amount - cpaid),
    }
  })
  const additionalTotal = additionalChargesForAccount.reduce((sum, c) => sum + c.amount, 0)
  // Additional paid may include money against charges that were later
  // cancelled — report the full additional money received for honesty.
  const additional = {
    charges: additionalChargesForAccount,
    total: additionalTotal,
    paid: additionalPaid,
    outstanding: Math.max(0, additionalTotal - additionalChargesForAccount.reduce((sum, c) => sum + c.paid, 0)),
  }

  const outstanding = Math.max(0, netPayable - paid)
  const isOverdue = student.feeStatus === 'Pending'
  const lateFee = isOverdue && lateFeeRule.enabled ? Math.min(lateFeeRule.amountPerMonth * 3, lateFeeRule.maxLateFee) : 0
  const totalDue = outstanding + lateFee
  const status: FeePaymentStatus = outstanding === 0 ? 'Paid' : isOverdue ? 'Overdue' : paid > 0 ? 'Partially Paid' : 'Due'
  const daysOverdue = isOverdue ? 90 : outstanding > 0 ? 30 : 0

  // Build chronological ledger.
  // Each fee head becomes a single ledger entry representing the ACADEMIC
  // YEAR TOTAL for that head (amount × frequency multiplier). The
  // description uses the frequency label (e.g. "Monthly charge — Tuition")
  // so the ledger reads correctly for both per-period and annual heads.
  //
  // FEE-EXAM: each active exam fee schedule entry is appended as a
  // separate ledger line — the feeHead reads "Exam Fee — <examType>"
  // and the description uses "Per-exam fee — <examType>".
  const ledger: LedgerEntry[] = []
  const heads = structure
  if (heads) {
    let balance = 0
    heads.components.filter((c) => c.active).forEach((c) => {
      const annualHeadCharge = c.amount * (FREQUENCY_MULTIPLIER[c.frequency] ?? 1)
      balance += annualHeadCharge
      // Exam-like recurring heads (Board Examination Fee, Examination Fee)
      // are labelled Exam Fee in the ledger's Type column even though they
      // live in the regular structure.
      const isExamLikeHead = c.category === 'Exam' || c.category === 'Board' || /exam/i.test(c.name)
      ledger.push({
        id: `LED-${student.id}-${c.id}`,
        date: '2025-04-01',
        feeHead: c.name,
        charge: annualHeadCharge,
        payment: 0,
        balance,
        description: `${c.frequency} charge — ${c.name}`,
        entryType: isExamLikeHead ? 'exam' : 'core',
      })
    })
    // FEE-EXAM: per-exam fee charges (one ledger line per active entry).
    // The charge per entry = amount × plannedInstances (the estimated
    // annual exam fee for that exam type). The description shows
    // "Per-exam fee — <examType> × N" so the parent can understand.
    const activeExamFees = (heads.examFeeSchedule ?? []).filter((e) => e.active)
    activeExamFees.forEach((e, idx) => {
      const instances = e.plannedInstances ?? 1
      const annualExamCharge = e.amount * instances
      balance += annualExamCharge
      ledger.push({
        id: `LED-${student.id}-EXAM-${idx}-${e.id}`,
        date: '2025-04-01',
        feeHead: `Exam Fee — ${e.examType}`,
        charge: annualExamCharge,
        payment: 0,
        balance,
        description: `Per-exam fee — ${e.examType} × ${instances}`,
        entryType: 'exam',
      })
    })
    // ADDITIONAL CHARGES — one ledger line per active charge, dated by the
    // charge's due date so event-based obligations read chronologically.
    additionalChargesForAccount.forEach((c) => {
      balance += c.amount
      ledger.push({
        id: `LED-${student.id}-ADDL-${c.chargeId}`,
        date: c.dueDate,
        feeHead: c.name,
        charge: c.amount,
        payment: 0,
        balance,
        description: `${c.category} charge${c.reference ? ` — ${c.reference}` : ''} · ${c.mandatory ? 'Mandatory' : 'Optional'}`,
        entryType: 'additional',
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
        entryType: 'concession',
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
        entryType: 'late-fee',
      })
    }
    // Sort transactions by date and apply payments
    const sortedTxns = [...studentTxns].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    for (const t of sortedTxns) {
      balance -= t.amount
      const cat = txnCategory(t)
      ledger.push({
        id: `LED-${student.id}-${t.id}`,
        date: t.date,
        feeHead: t.feeHead,
        charge: 0,
        payment: t.amount,
        balance,
        description: cat === 'ADDITIONAL' ? `${t.purpose} (additional charge payment)` : t.purpose,
        receiptNo: t.receiptNo,
        entryType: 'payment',
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
    coreExpected: regularFeesTotal,
    examExpected: examFeeTotal,
    additional,
  }
}

// ─── Hook: Canonical Fee Data ────────────────────────────────────────

export function useFeeData(academicYear: string = '2025-2026') {
  const students = useStudentsStore((s) => s.students)
  const transactions = useFeeStore((s) => s.transactions)
  const cashRequests = useFeeStore((s) => s.cashRequests)
  const feeStructures = useFeeStore((s) => s.feeStructures)
  const versions = useFeeStore((s) => s.versions)
  const changeLog = useFeeStore((s) => s.changeLog)
  const additionalCharges = useFeeStore((s) => s.additionalCharges)
  const paymentModes = useFeeStore((s) => s.paymentModes)
  const lateFeeRule = useFeeStore((s) => s.lateFeeRule)
  const concessionRule = useFeeStore((s) => s.concessionRule)
  const receiptSettings = useFeeStore((s) => s.receiptSettings)
  const audit = useFeeStore((s) => s.audit)

  return useMemo(() => {
    const activeStudents = students.filter((s) => s.status === 'Active')
    const accounts = activeStudents.map((s) => computeAccount(s, transactions, lateFeeRule, additionalCharges))

    const totalExpected = accounts.reduce((sum, a) => sum + a.netPayable, 0)
    const totalCollected = accounts.reduce((sum, a) => sum + a.paid, 0)
    const totalOutstanding = accounts.reduce((sum, a) => sum + a.outstanding, 0)
    const totalLateFee = accounts.reduce((sum, a) => sum + a.lateFee, 0)
    const totalDue = accounts.reduce((sum, a) => sum + a.totalDue, 0)
    const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 1000) / 10 : 0
    const overdueAccounts = accounts.filter((a) => a.status === 'Overdue')
    const pendingVerification = transactions.filter((t) => t.status === 'Under Verification' || t.status === 'Pending').length
    const pendingCashRequests = cashRequests.filter((r) => r.status === 'Pending Principal Acceptance' || r.status === 'Collected by Teacher').length

    // ─── CATEGORY TOTALS (Core vs Examination vs Additional) ─────────
    // Reporting NEVER mixes these three: core fees, exam fees and event-
    // based additional charges are expected/collected/outstanding each.
    // `paid` on an account is core+exam money only; `additional.paid` is
    // additional money only. Exam collected is derived from EXAMINATION-
    // categorised transactions (expected comes from the per-exam schedule).
    const examCollectedAll = transactions
      .filter((t) => (t.status === 'Success' || t.status === 'Under Verification') && txnCategory(t) === 'EXAMINATION')
      .reduce((sum, t) => sum + t.amount, 0)
    const categoryTotals = {
      core: {
        expected: accounts.reduce((sum, a) => sum + a.coreExpected, 0),
        collected: accounts.reduce((sum, a) => sum + a.paid, 0),
        outstanding: accounts.reduce((sum, a) => sum + a.outstanding, 0),
      },
      exam: {
        expected: accounts.reduce((sum, a) => sum + a.examExpected, 0),
        collected: examCollectedAll,
        outstanding: 0, // computed below
      },
      additional: {
        expected: accounts.reduce((sum, a) => sum + a.additional.total, 0),
        collected: accounts.reduce((sum, a) => sum + a.additional.paid, 0),
        outstanding: accounts.reduce((sum, a) => sum + a.additional.outstanding, 0),
      },
    }
    // Core expected includes recurring heads only; exam expected is the
    // per-exam schedule total. The core line's expected/collected/outstanding
    // uses account.paid which contains core+exam money together — subtract
    // the exam share so the three categories don't overlap.
    categoryTotals.core.collected -= examCollectedAll
    categoryTotals.core.outstanding = Math.max(0, categoryTotals.core.expected - categoryTotals.core.collected)
    categoryTotals.exam.outstanding = Math.max(0, categoryTotals.exam.expected - categoryTotals.exam.collected)

    // Today's collection — Bug fix (Phase 4): only count Successful
    // transactions. Previously this summed ALL transactions regardless of
    // status, inflating totals with Pending / Failed / Refunded / Under
    // Verification amounts.
    const today = new Date().toISOString().split('T')[0]
    const todayCollection = transactions.filter((t) => t.date === today && t.status === 'Success').reduce((sum, t) => sum + t.amount, 0)
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7)
    const weekCollection = transactions.filter((t) => new Date(t.date) >= weekStart && t.status === 'Success').reduce((sum, t) => sum + t.amount, 0)
    const monthStart = new Date(); monthStart.setMonth(monthStart.getMonth() - 1)
    const monthCollection = transactions.filter((t) => new Date(t.date) >= monthStart && t.status === 'Success').reduce((sum, t) => sum + t.amount, 0)
    const yearCollection = transactions.filter((t) => t.academicYear === academicYear && t.status === 'Success').reduce((sum, t) => sum + t.amount, 0)

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

    // Fee head distribution — Bug fix (Phase 4): compute from the actual
    // fee structures matched per student account. Previously this used
    // hardcoded percentages (75/15/3/4/3) of each account's totalApplicable,
    // which didn't reflect the real fee head split for any class level.
    const categoryColors: Record<string, string> = {
      Tuition: 'oklch(0.55 0.14 162)',
      Transport: 'oklch(0.65 0.16 75)',
      Library: 'oklch(0.6 0.18 300)',
      Exam: 'oklch(0.7 0.15 200)',
      Activity: 'oklch(0.62 0.2 25)',
    }
    const defaultCategoryColor = 'oklch(0.65 0.15 250)'
    const categoryMap = new Map<string, number>()
    for (const a of accounts) {
      // FEE-PER-CLASS: match by exact className first (e.g. account
      // className="Class 10" → FS05 with className="Class 10"). Falls
      // back to classLevel substring matching when no structure has
      // the exact className. Uses the same lookup as `computeAccount`
      // (`findStructureForStudent`) so the breakdown stays consistent
      // with the ledger each student sees.
      const heads = findStructureForStudent(a.className)
      if (!heads) continue
      for (const c of heads.components) {
        if (!c.active) continue
        // Fix 2 (FEE-CORRECT): multiply by the frequency multiplier so the
        // category breakdown reflects the ANNUAL contribution of each head
        // (e.g. a Monthly Tuition of ₹4,000 contributes ₹48,000 annually).
        const annualAmount = c.amount * (FREQUENCY_MULTIPLIER[c.frequency] ?? 1)
        categoryMap.set(c.name, (categoryMap.get(c.name) ?? 0) + annualAmount)
      }
    }
    const byCategory = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value, color: categoryColors[name] ?? defaultCategoryColor }))
      .sort((a, b) => b.value - a.value)

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

    // PHASE 7 — Catalogue coverage analytics. Surfaces "% of heads bound
    // to the master catalogue" so the Overview can show a Normalize CTA
    // when coverage drops below threshold. Computed from CURRENT
    // (non-archived) structures only — historical version snapshots are
    // immutable and don't drive the "needs normalization" signal.
    const liveStructures = feeStructures.filter((s) => (s as { status?: string }).status !== 'archived')
    let totalHeads = 0
    let cataloguedHeads = 0
    let structuresWithUncatalogued = 0
    const uncataloguedHeads: Array<{
      structureId: string
      structureName: string
      classLevel: string
      className: string
      headId: string
      headName: string
      amount: number
      frequency: FeeHead['frequency']
      mandatory: boolean
    }> = []
    // PHASE 8 — Per-structure coverage breakdown. Lets the Overview
    // panel render an expandable list showing each structure's own
    // coverage rate so the principal can spot which structures are
    // dragging the average down.
    const perStructureCoverage: Array<{
      structureId: string
      structureName: string
      classLevel: string
      className: string
      totalHeads: number
      cataloguedHeads: number
      uncataloguedHeads: number
      coverageRate: number
    }> = []
    for (const s of liveStructures) {
      let structureHasUncatalogued = false
      let sTotal = 0
      let sCat = 0
      for (const h of s.components) {
        totalHeads++
        sTotal++
        if (h.catalogueId) {
          cataloguedHeads++
          sCat++
        } else {
          structureHasUncatalogued = true
          uncataloguedHeads.push({
            structureId: s.id,
            structureName: s.className || s.category,
            classLevel: s.classLevel,
            className: s.className,
            headId: h.id,
            headName: h.name,
            amount: h.amount,
            frequency: h.frequency,
            mandatory: h.mandatory,
          })
        }
      }
      if (structureHasUncatalogued) structuresWithUncatalogued++
      perStructureCoverage.push({
        structureId: s.id,
        structureName: s.className || s.category,
        classLevel: s.classLevel,
        className: s.className,
        totalHeads: sTotal,
        cataloguedHeads: sCat,
        uncataloguedHeads: sTotal - sCat,
        coverageRate: sTotal > 0 ? Math.round((sCat / sTotal) * 1000) / 10 : 100,
      })
    }
    const coverageRate = totalHeads > 0
      ? Math.round((cataloguedHeads / totalHeads) * 1000) / 10
      : 100

    // PHASE 7 — Quarterly fee calendar. For each current structure,
    // compute the expected amount per academic-year quarter based on each
    // head's frequency (Annual=Q1, Half-Yearly=Q1+Q3, Quarterly=Q1+Q2+Q3+Q4,
    // Monthly=even split, Per Term=Q1+Q2+Q3, One-Time=Q1). Used by the new
    // Fee Calendar tab.
    const QUARTER_MONTHS: Record<string, number[]> = {
      Q1: [3, 4, 5],     // Apr–Jun
      Q2: [6, 7, 8],     // Jul–Sep
      Q3: [9, 10, 11],   // Oct–Dec
      Q4: [0, 1, 2],     // Jan–Mar
    }
    const calendar = liveStructures.map((s) => {
      const perQuarter: Record<string, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 }
      for (const h of s.components) {
        if (!h.active) continue
        const annual = h.amount * (FREQUENCY_MULTIPLIER[h.frequency] ?? 1)
        switch (h.frequency) {
          case 'Annual':
          case 'One-Time':
            perQuarter.Q1 += annual
            break
          case 'Half-Yearly':
            perQuarter.Q1 += annual / 2
            perQuarter.Q3 += annual / 2
            break
          case 'Quarterly':
            perQuarter.Q1 += annual / 4
            perQuarter.Q2 += annual / 4
            perQuarter.Q3 += annual / 4
            perQuarter.Q4 += annual / 4
            break
          case 'Per Term':
            perQuarter.Q1 += annual / 3
            perQuarter.Q2 += annual / 3
            perQuarter.Q3 += annual / 3
            break
          case 'Monthly': {
            // Evenly split across 12 months → 3 months per quarter.
            const monthly = annual / 12
            perQuarter.Q1 += monthly * 3
            perQuarter.Q2 += monthly * 3
            perQuarter.Q3 += monthly * 3
            perQuarter.Q4 += monthly * 3
            break
          }
        }
      }
      return {
        structureId: s.id,
        structureName: s.className || s.category,
        classLevel: s.classLevel,
        className: s.className,
        classId: s.classId,
        applicableClassIds: s.applicableClassIds,
        perQuarter,
      }
    })

    // Quarter totals (for the column footers + heatmap legend)
    const quarterTotals = {
      Q1: calendar.reduce((sum, c) => sum + c.perQuarter.Q1, 0),
      Q2: calendar.reduce((sum, c) => sum + c.perQuarter.Q2, 0),
      Q3: calendar.reduce((sum, c) => sum + c.perQuarter.Q3, 0),
      Q4: calendar.reduce((sum, c) => sum + c.perQuarter.Q4, 0),
    }
    const calendarTotal = quarterTotals.Q1 + quarterTotals.Q2 + quarterTotals.Q3 + quarterTotals.Q4

    // PHASE 8 — Actual collected amount per academic-year quarter.
    // Computed from successful transactions by their date's month →
    // quarter mapping (using QUARTER_MONTHS above). Lets the Fee
    // Calendar's "Compare to actuals" toggle overlay actuals on top
    // of expected per quarter, so the principal can see collection
    // shortfall per quarter at a glance.
    const actualByQuarter = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 }
    for (const t of transactions) {
      if (t.status !== 'Success') continue
      const m = new Date(t.date).getMonth()
      for (const qid of ['Q1', 'Q2', 'Q3', 'Q4'] as const) {
        if (QUARTER_MONTHS[qid].includes(m)) {
          actualByQuarter[qid] += t.amount
        }
      }
    }
    const actualTotal = actualByQuarter.Q1 + actualByQuarter.Q2 + actualByQuarter.Q3 + actualByQuarter.Q4

    // PHASE 8 — Weekly collection velocity (last 8 weeks). Returns an
    // array of 8 weeks (oldest → newest) with the weekly collected
    // amount + transaction count. Lets the Overview render a velocity
    // trend chart with a 4-week moving average. Uses Monday-start
    // weeks to align with the school's working-week convention.
    const velocity: Array<{ weekStart: string; weekEnd: string; amount: number; count: number; label: string }> = []
    const todayMs = new Date().setHours(0, 0, 0, 0)
    const dayOfWeek = new Date().getDay() // 0=Sun, 1=Mon...
    const daysSinceMonday = (dayOfWeek + 6) % 7 // Mon=0, Tue=1, ... Sun=6
    // Start 8 weeks ago from this week's Monday, then iterate forward.
    const thisMonday = todayMs - daysSinceMonday * 24 * 60 * 60 * 1000
    for (let i = 7; i >= 0; i--) {
      const ws = thisMonday - i * 7 * 24 * 60 * 60 * 1000
      const we = ws + 7 * 24 * 60 * 60 * 1000 - 1
      let amount = 0
      let count = 0
      for (const t of transactions) {
        if (t.status !== 'Success') continue
        const tm = new Date(t.date).getTime()
        if (tm >= ws && tm <= we) {
          amount += t.amount
          count++
        }
      }
      const startDate = new Date(ws)
      const endDate = new Date(we)
      const fmt = (d: Date) => d.toLocaleString('en-IN', { day: 'numeric', month: 'short' })
      velocity.push({
        weekStart: new Date(ws).toISOString().split('T')[0],
        weekEnd: new Date(we).toISOString().split('T')[0],
        amount,
        count,
        label: `${fmt(startDate)}–${fmt(endDate)}`,
      })
    }
    // 4-week moving average (placed on the last 5 weeks for continuity).
    const velocityMA = velocity.map((_, idx) => {
      const start = Math.max(0, idx - 3)
      const window = velocity.slice(start, idx + 1)
      const avg = window.reduce((s, w) => s + w.amount, 0) / window.length
      return Math.round(avg)
    })

    return {
      accounts,
      transactions,
      cashRequests,
      feeStructures,
      additionalCharges,
      versions,
      changeLog,
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
        // CORE vs EXAMINATION vs ADDITIONAL — never mixed
        categoryTotals,
        // PHASE 7 — catalogue coverage
        catalogueCoverage: {
          totalHeads,
          cataloguedHeads,
          uncataloguedHeads: totalHeads - cataloguedHeads,
          coverageRate,
          structuresWithUncatalogued,
          totalStructures: liveStructures.length,
          uncataloguedList: uncataloguedHeads,
          // PHASE 8 — per-structure breakdown for the expandable list
          perStructure: perStructureCoverage,
        },
        // PHASE 7 — quarterly fee calendar
        feeCalendar: {
          rows: calendar,
          quarterTotals,
          total: calendarTotal,
          quarterMonths: QUARTER_MONTHS,
          // PHASE 8 — actuals by quarter for the "Compare to actuals"
          // toggle on the Fee Calendar tab.
          actualByQuarter,
          actualTotal,
        },
        // PHASE 8 — weekly collection velocity (last 8 weeks + 4-week MA)
        velocity: {
          weeks: velocity,
          movingAverage: velocityMA,
        },
      },
    }
  }, [students, transactions, cashRequests, feeStructures, versions, changeLog, additionalCharges, paymentModes, lateFeeRule, concessionRule, receiptSettings, audit, academicYear])
}

// ─── Helper: format INR ──────────────────────────────────────────────
// Re-exported from format.ts to keep all fee formatting in one place.
export { formatINR, formatDate } from '@/lib/format'
