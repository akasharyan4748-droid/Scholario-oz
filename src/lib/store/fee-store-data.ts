/**
 * fee-store-data — seed + default data for the Fee store.
 *
 * Extracted from fee-store.ts (V6 modularization pass) so the store file
 * holds types + logic while this module holds the pure data constants.
 * Behaviour-preserving: fee-store.ts re-exports the previously public
 * symbols, so every existing import keeps working.
 */

import type {
  FeeHead, ExamFeeSchedule, FeeStructureConfig, FeeStructureVersion,
  FeeTransaction, CashRequest, AuditRecord, PaymentModeConfig, LateFeeRule,
  ConcessionRule, ReceiptSettings, GatewayConfig, BankAccount, UpiQrConfig,
  Settlement, ReconciliationRecord, WebhookEvent, AdditionalCharge,
} from './fee-store'

export const FREQUENCY_MULTIPLIER: Record<FeeHead['frequency'], number> = {
  'Annual': 1,
  'Half-Yearly': 2,
  'Quarterly': 4,
  'Monthly': 12,
  'Per Term': 3, // assuming 3 terms per academic year
  'One-Time': 1,
}

/** All valid frequency values (used for runtime validation in mutations). */
export const VALID_FREQUENCIES: FeeHead['frequency'][] = [
  'Annual', 'Half-Yearly', 'Quarterly', 'Monthly', 'Per Term', 'One-Time',
]

// ─── Fee Structure Configurations (initial seed) ────────────────────
//
// FEE-PER-CLASS: the seed is now PER-CLASS (one structure per actual
// school class), not per-class-RANGE. Each `className` matches a real
// class name from `src/lib/mock/academic/classes.ts` (e.g. "Class 9",
// "Pre-Nursery"). `classLevel` carries the level bucket
// ("Pre-Primary" / "Primary" / "Middle" / "Secondary" /
// "Senior Secondary") so `computeAccount` can fall back to level
// matching for students whose `className` doesn't have an exact
// per-class structure (e.g. Class 4 → no exact match → falls back to
// "Primary" → finds the Class 2 structure).
//
// FEE-EXAM: examination fees are modeled as a separate per-instance
// schedule (ExamFeeSchedule) — NOT as a recurring fee head. The cached
// `annual` field reflects only the recurring heads total. The
// `computeExamFeeTotal` helper (below) returns the per-exam schedule
// total; `computeAccount` adds it to the student's `totalApplicable`.
//
//   e.g. Class 9 (FS04): 7000*12 + 2000*12 + 4000 + 4000 = ₹1,16,000 (recurring)
//         + exam fee schedule: 100*4 + 500 + 700 + 600 = ₹2,200 (per-exam)
//         totalApplicable = ₹1,18,200

export const FEE_STRUCTURES: FeeStructureConfig[] = [
  {
    id: 'FS01', category: 'Pre-Primary', className: 'Pre-Nursery', classLevel: 'Pre-Primary',
    // PHASE 5 — class-wise binding. Pre-Nursery is the canonical C01.
    classId: 'C01', applicableClassIds: ['C01'],
    annual: 60400, effectiveFrom: '2025-04-01', version: 1,
    components: [
      { id: 'FH01', name: 'Tuition',  amount: 3500, frequency: 'Monthly', mandatory: true,  active: true, catalogueId: 'fh-1', category: 'Tuition' },
      { id: 'FH02', name: 'Transport', amount: 1200, frequency: 'Monthly', mandatory: false, active: true, catalogueId: 'fh-7', category: 'Transport' },
      { id: 'FH03', name: 'Activity', amount: 4000, frequency: 'Annual',  mandatory: true,  active: true, catalogueId: 'fh-3', category: 'Activity' },
    ],
    examFeeSchedule: [
      { id: 'EF-FS01-01', examType: 'Unit Test',            amount:  50, plannedInstances: 4, mandatory: true,  active: true },
      { id: 'EF-FS01-02', examType: 'Half-Yearly',          amount: 200, plannedInstances: 1, mandatory: true,  active: true },
      { id: 'EF-FS01-03', examType: 'Annual Examination',   amount: 300, plannedInstances: 1, mandatory: true,  active: true },
    ],
  },
  {
    id: 'FS02', category: 'Primary', className: 'Class 2', classLevel: 'Primary',
    classId: 'C05', applicableClassIds: ['C05'],
    annual: 71000, effectiveFrom: '2025-04-01', version: 1,
    components: [
      { id: 'FH04', name: 'Tuition',  amount: 4000, frequency: 'Monthly', mandatory: true,  active: true, catalogueId: 'fh-1', category: 'Tuition' },
      { id: 'FH05', name: 'Transport', amount: 1500, frequency: 'Monthly', mandatory: false, active: true, catalogueId: 'fh-7', category: 'Transport' },
      { id: 'FH06', name: 'Library',  amount: 2000, frequency: 'Annual',  mandatory: true,  active: true, catalogueId: 'fh-5', category: 'Library' },
      { id: 'FH08', name: 'Activity', amount: 3000, frequency: 'Annual',  mandatory: true,  active: true, catalogueId: 'fh-3', category: 'Activity' },
    ],
    examFeeSchedule: [
      { id: 'EF-FS02-01', examType: 'Unit Test',            amount: 100, plannedInstances: 4, mandatory: true,  active: true },
      { id: 'EF-FS02-02', examType: 'Half-Yearly',          amount: 300, plannedInstances: 1, mandatory: true,  active: true },
      { id: 'EF-FS02-03', examType: 'Annual Examination',   amount: 500, plannedInstances: 1, mandatory: true,  active: true },
    ],
  },
  {
    id: 'FS03', category: 'Middle', className: 'Class 6', classLevel: 'Middle',
    classId: 'C09', applicableClassIds: ['C09'],
    annual: 93600, effectiveFrom: '2025-04-01', version: 1,
    components: [
      { id: 'FH09',  name: 'Tuition',  amount: 5500, frequency: 'Monthly', mandatory: true,  active: true, catalogueId: 'fh-1', category: 'Tuition' },
      { id: 'FH10', name: 'Transport', amount: 1800, frequency: 'Monthly', mandatory: false, active: true, catalogueId: 'fh-7', category: 'Transport' },
      { id: 'FH11', name: 'Library',   amount: 3000, frequency: 'Annual',  mandatory: true,  active: true, catalogueId: 'fh-5', category: 'Library' },
      { id: 'FH13', name: 'Activity',  amount: 3000, frequency: 'Annual',  mandatory: true,  active: true, catalogueId: 'fh-3', category: 'Activity' },
    ],
    examFeeSchedule: [
      { id: 'EF-FS03-01', examType: 'Unit Test',            amount: 100, plannedInstances: 4, mandatory: true,  active: true },
      { id: 'EF-FS03-02', examType: 'Half-Yearly',          amount: 500, plannedInstances: 1, mandatory: true,  active: true },
      { id: 'EF-FS03-03', examType: 'Annual Examination',   amount: 700, plannedInstances: 1, mandatory: true,  active: true },
    ],
  },
  {
    id: 'FS04', category: 'Secondary', className: 'Class 9', classLevel: 'Secondary',
    classId: 'C12', applicableClassIds: ['C12'],
    annual: 116000, effectiveFrom: '2025-04-01', version: 1,
    components: [
      { id: 'FH14', name: 'Tuition',  amount: 7000, frequency: 'Monthly', mandatory: true,  active: true, catalogueId: 'fh-1', category: 'Tuition' },
      { id: 'FH15', name: 'Transport', amount: 2000, frequency: 'Monthly', mandatory: false, active: true, catalogueId: 'fh-7', category: 'Transport' },
      { id: 'FH16', name: 'Library',  amount: 4000, frequency: 'Annual',  mandatory: true,  active: true, catalogueId: 'fh-5', category: 'Library' },
      { id: 'FH18', name: 'Activity',  amount: 4000, frequency: 'Annual',  mandatory: true,  active: true, catalogueId: 'fh-3', category: 'Activity' },
    ],
    examFeeSchedule: [
      { id: 'EF-FS04-01', examType: 'Unit Test',            amount: 100, plannedInstances: 4, mandatory: true,  active: true },
      { id: 'EF-FS04-02', examType: 'Half-Yearly',          amount: 500, plannedInstances: 1, mandatory: true,  active: true },
      { id: 'EF-FS04-03', examType: 'Annual Examination',   amount: 700, plannedInstances: 1, mandatory: true,  active: true },
      { id: 'EF-FS04-04', examType: 'Pre-Board',            amount: 600, plannedInstances: 1, mandatory: true,  active: true },
    ],
  },
  {
    id: 'FS05', category: 'Secondary', className: 'Class 10', classLevel: 'Secondary',
    classId: 'C13', applicableClassIds: ['C13'],
    annual: 116500, effectiveFrom: '2025-04-01', version: 1,
    components: [
      { id: 'FH19', name: 'Tuition',              amount: 7000, frequency: 'Monthly',  mandatory: true,  active: true, catalogueId: 'fh-1', category: 'Tuition' },
      { id: 'FH20', name: 'Transport',             amount: 2000, frequency: 'Monthly',  mandatory: false, active: true, catalogueId: 'fh-7', category: 'Transport' },
      { id: 'FH21', name: 'Library',               amount: 4000, frequency: 'Annual',   mandatory: true,  active: true, catalogueId: 'fh-5', category: 'Library' },
      { id: 'FH22', name: 'Activity',              amount: 4000, frequency: 'Annual',   mandatory: true,  active: true, catalogueId: 'fh-3', category: 'Activity' },
      { id: 'FH23', name: 'Board Examination Fee', amount:  500, frequency: 'One-Time', mandatory: true,  active: true, catalogueId: 'fh-8', category: 'Board' },
    ],
    examFeeSchedule: [
      { id: 'EF-FS05-01', examType: 'Unit Test',            amount: 100, plannedInstances: 4, mandatory: true,  active: true },
      { id: 'EF-FS05-02', examType: 'Half-Yearly',          amount: 500, plannedInstances: 1, mandatory: true,  active: true },
      { id: 'EF-FS05-03', examType: 'Annual Examination',   amount: 700, plannedInstances: 1, mandatory: true,  active: true },
      { id: 'EF-FS05-04', examType: 'Pre-Board',            amount: 600, plannedInstances: 1, mandatory: true,  active: true },
    ],
  },
  {
    id: 'FS06', category: 'Senior Secondary', className: 'Class 12', classLevel: 'Senior Secondary',
    // PHASE 5 — Senior Secondary stream-class applicability. The Class 12
    // fee structure applies to BOTH stream variants (C15-PCM and C15-PCB)
    // since they share the same annual fee schedule; only subject offerings
    // differ. Likewise the Class 11 structure (when added) would carry
    // applicableClassIds=['C14-PCM','C14-PCB'].
    classId: 'C15-PCM', applicableClassIds: ['C15-PCM', 'C15-PCB'],
    annual: 144400, effectiveFrom: '2025-04-01', version: 1,
    components: [
      { id: 'FH24', name: 'Tuition',  amount: 9000, frequency: 'Monthly', mandatory: true,  active: true, catalogueId: 'fh-1', category: 'Tuition' },
      { id: 'FH25', name: 'Transport', amount: 2200, frequency: 'Monthly', mandatory: false, active: true, catalogueId: 'fh-7', category: 'Transport' },
      { id: 'FH26', name: 'Library',   amount: 5000, frequency: 'Annual',  mandatory: true,  active: true, catalogueId: 'fh-5', category: 'Library' },
      { id: 'FH27', name: 'Activity',  amount: 5000, frequency: 'Annual',  mandatory: true,  active: true, catalogueId: 'fh-3', category: 'Activity' },
    ],
    examFeeSchedule: [
      { id: 'EF-FS06-01', examType: 'Unit Test',            amount: 100, plannedInstances: 4, mandatory: true,  active: true },
      { id: 'EF-FS06-02', examType: 'Half-Yearly',          amount: 500, plannedInstances: 1, mandatory: true,  active: true },
      { id: 'EF-FS06-03', examType: 'Annual Examination',   amount: 800, plannedInstances: 1, mandatory: true,  active: true },
      { id: 'EF-FS06-04', examType: 'Pre-Board',            amount: 600, plannedInstances: 1, mandatory: true,  active: true },
      { id: 'EF-FS06-05', examType: 'Practical',            amount: 500, plannedInstances: 2, mandatory: true,  active: true },
    ],
  },
]

// ─── Helper: compute ACADEMIC YEAR TOTAL of active fee heads ────────
//
// Fix 2 (FEE-CORRECT): the per-period `amount` (e.g. ₹4,000 for a Monthly
// Tuition) is multiplied by `FREQUENCY_MULTIPLIER[h.frequency]` so the
// returned figure is the ANNUAL total (e.g. ₹48,000), not just the
// per-period sum. Backward-compatible: callers that pass all-'Annual'
// heads get the same number as before (multiplier = 1).
//
// FEE-EXAM: this helper ONLY considers the recurring fee heads. Per-exam
// fees (ExamFeeSchedule) are NOT included here — use `computeExamFeeTotal`
// for those, and `computeAccount` adds the two together to derive the
// student's `totalApplicable`.
export function computeHeadsTotal(heads: FeeHead[]): number {
  return heads
    .filter((h) => h.active)
    .reduce((sum, h) => sum + h.amount * (FREQUENCY_MULTIPLIER[h.frequency] ?? 1), 0)
}

/**
 * Compute the TOTAL of all active exam fee schedule entries.
 *
 * Each entry is a one-time per-examination charge (NOT multiplied by any
 * frequency multiplier). The total is the SUM of `amount` for every entry
 * where `active === true`.
 *
 * Backward-compatible: an undefined / empty schedule returns 0.
 */
export function computeExamFeeTotal(schedule: ExamFeeSchedule | undefined | null): number {
  if (!schedule || schedule.length === 0) return 0
  return schedule
    .filter((e) => e.active)
    .reduce((sum, e) => sum + e.amount * (e.plannedInstances ?? 1), 0)
}

// ─── ADDITIONAL CHARGES seed ──────────────────────────────────────────
//
// Event-based / special collections that exist INDEPENDENTLY of the
// per-class annual fee structures. Class 8's annual structure stays
// untouched; the tour charge below simply applies to Class 8 (C11)
// students for the 2025-26 year. Payments collected against these carry
// category='ADDITIONAL' and never reduce core fee outstanding.
export const SEED_ADDITIONAL_CHARGES: AdditionalCharge[] = [
  {
    id: 'AC-01',
    name: 'Educational Tour — Jaipur',
    category: 'Tour',
    amount: 2500,
    academicYear: '2025-2026',
    applicableClassIds: ['C11'],
    dueDate: '2025-09-15',
    mandatory: false,
    description: 'Three-day educational tour to Jaipur (transport, stay, entry fees). Opt-out possible — inform the class teacher.',
    reference: 'Jaipur Educational Tour 2025',
    createdBy: 'Principal',
    createdAt: '2025-08-20T09:30:00Z',
    status: 'Active',
  },
  {
    id: 'AC-02',
    name: 'Robotics Workshop',
    category: 'Workshop',
    amount: 1000,
    academicYear: '2025-2026',
    applicableClassIds: ['C12'],
    dueDate: '2025-10-30',
    mandatory: true,
    description: 'Two-day robotics workshop conducted with an external partner. Kit included.',
    reference: 'Science Club — Autumn Workshop',
    createdBy: 'Principal',
    createdAt: '2025-09-28T11:00:00Z',
    status: 'Active',
  },
]

// ─── Phase 3: seed version snapshots from FEE_STRUCTURES ────────────
// Each existing structure becomes Version 1 with status='current'. The
// seed is derived from FEE_STRUCTURES so the two stay in lockstep — the
// live `feeStructures` array (FeeStructureConfig) is the public API, and
// `versions` (FeeStructureVersion[]) is the immutable history.
//
// FEE-EXAM: the examFeeSchedule is now snapshot alongside the heads so
// the immutable version record carries the per-exam fees at the time of
// publication (used by the Examination module to resolve `examFee` for
// exams created against that historical version).
export const SEED_VERSIONS: FeeStructureVersion[] = FEE_STRUCTURES.map((s) => ({
  id: `FSV-${s.id}-1`,
  structureId: s.id,
  version: 1,
  status: 'current' as const,
  heads: s.components.map((h) => ({ ...h })),
  totalAmount: computeHeadsTotal(s.components),
  effectiveFrom: s.effectiveFrom,
  createdBy: 'System',
  createdAt: '2025-04-01T10:00:00Z',
  changeReason: 'Initial seeded structure',
  notes: 'Migrated from pre-versioning FeeStructureConfig',
  examFeeSchedule: s.examFeeSchedule?.map((e) => ({ ...e })),
}))


export const DEFAULT_PAYMENT_MODES: PaymentModeConfig[] = [
  { id: 'UPI', label: 'UPI', active: true, requiresReference: true },
  { id: 'Card', label: 'Card', active: true, requiresReference: true },
  { id: 'Net Banking', label: 'Net Banking', active: true, requiresReference: true },
  { id: 'Cash', label: 'Cash', active: true, requiresReference: false },
  // Cheque is DEPRECATED for new transactions (per product spec — supported
  // methods are UPI/Card/Net Banking online, Cash/Bank Transfer offline).
  // Set active:false so the collect-payment picker (which filters on .active)
  // no longer offers Cheque, while historical transactions/receipts that
  // reference Cheque still render correctly (the type union is preserved).
  { id: 'Cheque', label: 'Cheque', active: false, requiresReference: true, requiresBankName: true, requiresChequeDetails: true },
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

// ─── Payment Infrastructure seed (Phase 4) ───────────────────────────
//
// Realistic demo data for the payment infrastructure types added in Phase 4.
// All amounts are in INR. Gateway fees are modeled at 2% + 18% GST, matching
// Razorpay's standard domestic pricing — the per-transaction gatewayFee /
// taxOnFee / netAmount values on linked FeeTransactions sum to the aggregate
// grossAmount / gatewayFee / taxOnFee / netAmount on the parent Settlement.

export const SEED_GATEWAY_CONFIG: GatewayConfig = {
  id: 'GC-01',
  provider: 'razorpay',
  environment: 'test',
  status: 'test_mode',
  merchantId: 'rzp_test_DEMO1234',
  apiKeyId: 'key_DEMO1234',
  // webhookSecret is intentionally NOT seeded here — server-side only.
  webhookUrl: '/api/webhooks/razorpay',
  webhookStatus: 'healthy',
  lastWebhookAt: '2025-11-10T14:30:00Z',
  failedWebhookCount: 0,
  settlementAccountId: 'BA-01',
  connectedAt: '2025-08-15T10:00:00Z',
  connectedBy: 'Principal',
  testModePassed: true,
}

export const SEED_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'BA-01',
    holderName: 'Scholario Education Society',
    bankName: 'HDFC Bank',
    accountNumber: '50100123456789',
    ifsc: 'HDFC0001234',
    branch: 'MG Road, Bengaluru',
    accountType: 'current',
    status: 'active',
    isPrimary: true,
    addedAt: '2025-04-01T09:00:00Z',
    addedBy: 'Principal',
    parentDisplayInstructions: 'Use this account for NEFT/RTGS transfers. Email the transfer reference to accounts@scholario.edu for verification.',
  },
  {
    id: 'BA-02',
    holderName: 'Scholario Education Society',
    bankName: 'State Bank of India',
    accountNumber: '39876543210',
    ifsc: 'SBIN0007654',
    branch: 'Indiranagar, Bengaluru',
    accountType: 'savings',
    status: 'active',
    isPrimary: false,
    addedAt: '2025-06-15T11:00:00Z',
    addedBy: 'Principal',
    parentDisplayInstructions: 'Secondary account — use only if HDFC is unavailable. Confirm with the accounts office before transfer.',
  },
]

export const SEED_UPI_QR_CONFIGS: UpiQrConfig[] = [
  {
    id: 'UQR-01',
    name: 'Main Counter UPI',
    upiId: 'scholario@hdfc',
    payeeName: 'Scholario Education Society',
    qrType: 'static',
    status: 'active',
    notes: 'Static QR displayed at the fee counter. Parents can scan to pay any amount.',
    addedAt: '2025-04-01T09:00:00Z',
    addedBy: 'Principal',
  },
]

export const SEED_SETTLEMENTS: Settlement[] = [
  {
    id: 'SET-01',
    gateway: 'razorpay',
    settlementDate: '2025-04-18',
    grossAmount: 439000,
    gatewayFee: 8780,
    taxOnFee: 1581,
    netAmount: 428639,
    bankAccountId: 'BA-01',
    utr: 'RZPSET0420250001',
    status: 'settled',
    transactionIds: ['TXN001', 'TXN002', 'TXN004'],
    createdAt: '2025-04-18T08:00:00Z',
    reconciledAt: '2025-04-19T10:00:00Z',
    reconciledBy: 'Principal',
  },
  {
    id: 'SET-02',
    gateway: 'razorpay',
    settlementDate: '2025-07-15',
    grossAmount: 296000,
    gatewayFee: 5920,
    taxOnFee: 1066,
    netAmount: 289014,
    bankAccountId: 'BA-01',
    utr: 'RZPSET0720250002',
    status: 'settled',
    transactionIds: ['TXN007', 'TXN008'],
    createdAt: '2025-07-15T08:00:00Z',
    reconciledAt: '2025-07-16T10:00:00Z',
    reconciledBy: 'Principal',
  },
  {
    id: 'SET-03',
    gateway: 'razorpay',
    settlementDate: '2025-11-20',
    grossAmount: 318000,
    gatewayFee: 6360,
    taxOnFee: 1145,
    netAmount: 310495,
    bankAccountId: 'BA-01',
    status: 'pending',
    transactionIds: ['TXN010', 'TXN013', 'TXN014'],
    createdAt: '2025-11-12T08:00:00Z',
  },
]

export const SEED_RECONCILIATION_RECORDS: ReconciliationRecord[] = [
  { id: 'REC-001', transactionId: 'TXN001', settlementId: 'SET-01', gatewayPaymentId: 'pay_NJ7aBcD001', gatewayOrderId: 'order_NJ7aBcD001', utr: 'RZPSET0420250001', reconciliationStatus: 'reconciled', reconciledBy: 'Principal', reconciledAt: '2025-04-19T10:00:00Z' },
  { id: 'REC-002', transactionId: 'TXN002', settlementId: 'SET-01', gatewayPaymentId: 'pay_NJ7aBcD002', gatewayOrderId: 'order_NJ7aBcD002', utr: 'RZPSET0420250001', reconciliationStatus: 'reconciled', reconciledBy: 'Principal', reconciledAt: '2025-04-19T10:00:00Z' },
  { id: 'REC-003', transactionId: 'TXN004', settlementId: 'SET-01', gatewayPaymentId: 'pay_NJ7aBcD004', gatewayOrderId: 'order_NJ7aBcD004', utr: 'RZPSET0420250001', reconciliationStatus: 'reconciled', reconciledBy: 'Principal', reconciledAt: '2025-04-19T10:00:00Z' },
  { id: 'REC-004', transactionId: 'TXN007', settlementId: 'SET-02', gatewayPaymentId: 'pay_NJ7aBcD007', gatewayOrderId: 'order_NJ7aBcD007', utr: 'RZPSET0720250002', reconciliationStatus: 'reconciled', reconciledBy: 'Principal', reconciledAt: '2025-07-16T10:00:00Z' },
  { id: 'REC-005', transactionId: 'TXN008', settlementId: 'SET-02', gatewayPaymentId: 'pay_NJ7aBcD008', gatewayOrderId: 'order_NJ7aBcD008', utr: 'RZPSET0720250002', reconciliationStatus: 'reconciled', reconciledBy: 'Principal', reconciledAt: '2025-07-16T10:00:00Z' },
]

export const SEED_WEBHOOK_EVENTS: WebhookEvent[] = [
  { id: 'WH-001', provider: 'razorpay', eventId: 'evt_1abc234def', eventType: 'payment.success', receivedAt: '2025-04-12T11:35:00Z', processedAt: '2025-04-12T11:35:01Z', status: 'processed', transactionId: 'TXN001' },
  { id: 'WH-002', provider: 'razorpay', eventId: 'evt_2ghi567jkl', eventType: 'payment.success', receivedAt: '2025-04-12T11:36:00Z', processedAt: '2025-04-12T11:36:01Z', status: 'processed', transactionId: 'TXN002' },
  { id: 'WH-003', provider: 'razorpay', eventId: 'evt_3mno890pqr', eventType: 'payment.failed', receivedAt: '2025-09-15T10:20:00Z', processedAt: '2025-09-15T10:20:01Z', status: 'processed', transactionId: 'TXN017' },
  { id: 'WH-004', provider: 'razorpay', eventId: 'evt_4stu123vwx', eventType: 'payment.success', receivedAt: '2025-07-08T14:15:00Z', processedAt: '2025-07-08T14:15:01Z', status: 'processed', transactionId: 'TXN007' },
]

// ─── Seed Transactions (derived from canonical students) ─────────────

export const SEED_TRANSACTIONS: FeeTransaction[] = [
  { id: 'TXN001', receiptNo: 'RCP-2025-1042', studentId: 'STU-1', studentName: 'Aarav Sharma', admissionNo: 'DSO2024001', className: 'Class 9', classId: 'C12', amount: 148000, mode: 'UPI', status: 'Success', date: '2025-04-12', purpose: 'Annual Fee — Q1', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-04-12', referenceNo: 'UPI-7845120369', academicYear: '2025-2026', paymentSource: 'online', gateway: 'razorpay', gatewayPaymentId: 'pay_NJ7aBcD001', gatewayOrderId: 'order_NJ7aBcD001', gatewayFee: 2960, taxOnFee: 533, netAmount: 144507, settlementId: 'SET-01', settlementStatus: 'settled', utr: 'RZPSET0420250001', reconciliationStatus: 'reconciled' },
  { id: 'TXN002', receiptNo: 'RCP-2025-1043', studentId: 'STU-2', studentName: 'Diya Patel', admissionNo: 'DSO2024002', className: 'Class 9', classId: 'C12', amount: 143000, mode: 'Card', status: 'Success', date: '2025-04-12', purpose: 'Annual Fee — Q1 (Scholarship applied)', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-04-12', referenceNo: 'CARD-****4521', academicYear: '2025-2026', meta: { cardLast4: '4521' }, paymentSource: 'online', gateway: 'razorpay', gatewayPaymentId: 'pay_NJ7aBcD002', gatewayOrderId: 'order_NJ7aBcD002', gatewayFee: 2860, taxOnFee: 515, netAmount: 139625, settlementId: 'SET-01', settlementStatus: 'settled', utr: 'RZPSET0420250001', reconciliationStatus: 'reconciled' },
  { id: 'TXN003', receiptNo: 'RCP-2025-1044', studentId: 'STU-3', studentName: 'Vivaan Reddy', admissionNo: 'DSO2024003', className: 'Class 9', classId: 'C12', amount: 74000, mode: 'Net Banking', status: 'Success', date: '2025-04-15', purpose: 'Partial Payment', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-04-15', referenceNo: 'NB-NEFT-884120', academicYear: '2025-2026', meta: { neftUtr: 'NB-NEFT-884120' }, paymentSource: 'online', gateway: 'razorpay', gatewayPaymentId: 'pay_NJ7aBcD003', gatewayOrderId: 'order_NJ7aBcD003', gatewayFee: 1480, taxOnFee: 266, netAmount: 72254, reconciliationStatus: 'unreconciled' },
  { id: 'TXN004', receiptNo: 'RCP-2025-1045', studentId: 'STU-4', studentName: 'Ananya Singh', admissionNo: 'DSO2024004', className: 'Class 9', classId: 'C12', amount: 148000, mode: 'UPI', status: 'Success', date: '2025-04-10', purpose: 'Annual Fee — Q1', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-04-10', referenceNo: 'UPI-9632587410', academicYear: '2025-2026', paymentSource: 'online', gateway: 'razorpay', gatewayPaymentId: 'pay_NJ7aBcD004', gatewayOrderId: 'order_NJ7aBcD004', gatewayFee: 2960, taxOnFee: 533, netAmount: 144507, settlementId: 'SET-01', settlementStatus: 'settled', utr: 'RZPSET0420250001', reconciliationStatus: 'reconciled' },
  { id: 'TXN005', receiptNo: 'RCP-2025-1046', studentId: 'STU-5', studentName: 'Reyansh Kumar', admissionNo: 'DSO2024005', className: 'Class 9', classId: 'C12', amount: 30000, mode: 'Cash', status: 'Under Verification', date: '2025-04-18', purpose: 'Partial Payment', feeHead: 'Tuition', collectedBy: 'Class Teacher', verifiedBy: null, verifiedAt: null, referenceNo: null, academicYear: '2025-2026', paymentSource: 'offline' },
  { id: 'TXN006', receiptNo: 'RCP-2025-1047', studentId: 'STU-6', studentName: 'Ishaani Verma', admissionNo: 'DSO2024006', className: 'Class 9', classId: 'C12', amount: 145000, mode: 'Cheque', status: 'Success', date: '2025-04-11', purpose: 'Annual Fee — Q1 (Scholarship applied)', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-04-14', referenceNo: 'CHQ- HDFC-258963', academicYear: '2025-2026', meta: { bankName: 'HDFC', chequeNumber: '258963', chequeDate: '2025-04-11' }, paymentSource: 'offline' },
  { id: 'TXN007', receiptNo: 'RCP-2025-1048', studentId: 'STU-7', studentName: 'Kiara Rao', admissionNo: 'DSO2024007', className: 'Class 10', classId: 'C13', amount: 148000, mode: 'UPI', status: 'Success', date: '2025-07-08', purpose: 'Annual Fee — Q2', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-07-08', referenceNo: 'UPI-4569871230', academicYear: '2025-2026', paymentSource: 'online', gateway: 'razorpay', gatewayPaymentId: 'pay_NJ7aBcD007', gatewayOrderId: 'order_NJ7aBcD007', gatewayFee: 2960, taxOnFee: 533, netAmount: 144507, settlementId: 'SET-02', settlementStatus: 'settled', utr: 'RZPSET0720250002', reconciliationStatus: 'reconciled' },
  { id: 'TXN008', receiptNo: 'RCP-2025-1049', studentId: 'STU-8', studentName: 'Vihaan Agarwal', admissionNo: 'DSO2024008', className: 'Class 10', classId: 'C13', amount: 148000, mode: 'Card', status: 'Success', date: '2025-07-09', purpose: 'Annual Fee — Q2', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-07-09', referenceNo: 'CARD-****7890', academicYear: '2025-2026', meta: { cardLast4: '7890' }, paymentSource: 'online', gateway: 'razorpay', gatewayPaymentId: 'pay_NJ7aBcD008', gatewayOrderId: 'order_NJ7aBcD008', gatewayFee: 2960, taxOnFee: 533, netAmount: 144507, settlementId: 'SET-02', settlementStatus: 'settled', utr: 'RZPSET0720250002', reconciliationStatus: 'reconciled' },
  { id: 'TXN009', receiptNo: 'RCP-2025-1050', studentId: 'STU-9', studentName: 'Dhruv Joshi', admissionNo: 'DSO2024009', className: 'Class 10', classId: 'C13', amount: 90000, mode: 'Net Banking', status: 'Pending', date: '2025-10-15', purpose: 'Partial Payment — Q3', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: null, verifiedAt: null, referenceNo: 'NB-RTGS-556677', academicYear: '2025-2026', meta: { neftUtr: 'NB-RTGS-556677' }, paymentSource: 'online', gateway: 'razorpay', gatewayPaymentId: 'pay_NJ7aBcD009', gatewayOrderId: 'order_NJ7aBcD009', reconciliationStatus: 'pending' },
  { id: 'TXN010', receiptNo: 'RCP-2025-1051', studentId: 'STU-10', studentName: 'Aadhya Menon', admissionNo: 'DSO2024010', className: 'Class 10', classId: 'C13', amount: 148000, mode: 'UPI', status: 'Success', date: '2025-10-12', purpose: 'Annual Fee — Q3', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-10-12', referenceNo: 'UPI-1234567890', academicYear: '2025-2026', paymentSource: 'online', gateway: 'razorpay', gatewayPaymentId: 'pay_NJ7aBcD010', gatewayOrderId: 'order_NJ7aBcD010', gatewayFee: 2960, taxOnFee: 533, netAmount: 144507, settlementId: 'SET-03', settlementStatus: 'pending', reconciliationStatus: 'pending' },
  { id: 'TXN011', receiptNo: 'RCP-2025-1052', studentId: 'STU-12', studentName: 'Anika Gupta', admissionNo: 'DSO2024012', className: 'Class 10', classId: 'C13', amount: 50000, mode: 'Cash', status: 'Under Verification', date: '2025-11-05', purpose: 'Partial Payment', feeHead: 'Tuition', collectedBy: 'Class Teacher', verifiedBy: null, verifiedAt: null, referenceNo: null, academicYear: '2025-2026', paymentSource: 'offline' },
  { id: 'TXN012', receiptNo: 'RCP-2025-1053', studentId: 'STU-15', studentName: 'Pari Khanna', admissionNo: 'DSO2024015', className: 'Class 11', classId: 'C14', amount: 184000, mode: 'Cheque', status: 'Success', date: '2025-07-20', purpose: 'Annual Fee — Q2', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-07-22', referenceNo: 'CHQ-ICICI-145896', academicYear: '2025-2026', meta: { bankName: 'ICICI', chequeNumber: '145896', chequeDate: '2025-07-19' }, paymentSource: 'offline' },
  { id: 'TXN013', receiptNo: 'RCP-2025-1054', studentId: 'STU-16', studentName: 'Rohan Mehta', admissionNo: 'DSO2024016', className: 'Class 11', classId: 'C14', amount: 92000, mode: 'UPI', status: 'Success', date: '2025-08-04', purpose: 'Annual Fee — Q2', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-08-04', referenceNo: 'UPI-7788990011', academicYear: '2025-2026', paymentSource: 'online', gateway: 'razorpay', gatewayPaymentId: 'pay_NJ7aBcD013', gatewayOrderId: 'order_NJ7aBcD013', gatewayFee: 1840, taxOnFee: 331, netAmount: 89829, settlementId: 'SET-03', settlementStatus: 'pending', reconciliationStatus: 'pending' },
  { id: 'TXN014', receiptNo: 'RCP-2025-1055', studentId: 'STU-17', studentName: 'Riya Iyer', admissionNo: 'DSO2024017', className: 'Class 7', classId: 'C10', amount: 78000, mode: 'UPI', status: 'Success', date: '2025-09-12', purpose: 'Annual Fee — Q3', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-09-12', referenceNo: 'UPI-9988776655', academicYear: '2025-2026', paymentSource: 'online', gateway: 'razorpay', gatewayPaymentId: 'pay_NJ7aBcD014', gatewayOrderId: 'order_NJ7aBcD014', gatewayFee: 1560, taxOnFee: 281, netAmount: 76159, settlementId: 'SET-03', settlementStatus: 'pending', reconciliationStatus: 'pending' },
  { id: 'TXN015', receiptNo: 'RCP-2025-1056', studentId: 'STU-18', studentName: 'Karan Desai', admissionNo: 'DSO2024018', className: 'Class 7', classId: 'C10', amount: 40000, mode: 'Cash', status: 'Under Verification', date: '2025-11-10', purpose: 'Partial Payment', feeHead: 'Tuition', collectedBy: 'Class Teacher', verifiedBy: null, verifiedAt: null, referenceNo: null, academicYear: '2025-2026', paymentSource: 'offline' },
  // ─── Phase 4 additions: Bank Transfer + Failed + Refunded examples ───
  { id: 'TXN016', receiptNo: 'RCP-2025-1057', studentId: 'STU-11', studentName: 'Vihaan Joshi', admissionNo: 'DSO2024011', className: 'Class 10', classId: 'C13', amount: 50000, mode: 'Bank Transfer', status: 'Success', date: '2025-09-25', purpose: 'Partial Payment — Q3', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-09-25', referenceNo: 'BT-NEFT-991234', academicYear: '2025-2026', meta: { neftUtr: 'BT-NEFT-991234' }, paymentSource: 'offline' },
  { id: 'TXN017', receiptNo: 'RCP-2025-1058', studentId: 'STU-13', studentName: 'Dhruv Agarwal', admissionNo: 'DSO2024013', className: 'Class 11', classId: 'C14', amount: 184000, mode: 'UPI', status: 'Failed', date: '2025-09-15', purpose: 'Annual Fee — Q3', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: null, verifiedAt: null, referenceNo: 'UPI-FAIL-558899', academicYear: '2025-2026', paymentSource: 'online', gateway: 'razorpay', gatewayPaymentId: 'pay_NJ7aBcD017', gatewayOrderId: 'order_NJ7aBcD017', reconciliationStatus: 'exception', refundReason: 'Payment failed at gateway — insufficient funds in payer account' },
  { id: 'TXN018', receiptNo: 'RCP-2025-1059', studentId: 'STU-14', studentName: 'Aadhya Mehta', admissionNo: 'DSO2024014', className: 'Class 11', classId: 'C14', amount: 92000, mode: 'Card', status: 'Failed', date: '2025-10-02', purpose: 'Annual Fee — Q3', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: null, verifiedAt: null, referenceNo: 'CARD-FAIL-9981', academicYear: '2025-2026', meta: { cardLast4: '9981' }, paymentSource: 'online', gateway: 'razorpay', gatewayPaymentId: 'pay_NJ7aBcD018', gatewayOrderId: 'order_NJ7aBcD018', reconciliationStatus: 'exception', refundReason: 'Card declined by issuing bank — parent to retry with different card' },
  { id: 'TXN019', receiptNo: 'RCP-2025-1060', studentId: 'STU-16', studentName: 'Rohan Mehta', admissionNo: 'DSO2024016', className: 'Class 11', classId: 'C14', amount: 92000, mode: 'Card', status: 'Refunded', date: '2025-08-15', purpose: 'Annual Fee — Q2 (duplicate)', feeHead: 'Tuition', collectedBy: 'Principal', verifiedBy: 'Principal', verifiedAt: '2025-08-15', referenceNo: 'CARD-****2244', academicYear: '2025-2026', meta: { cardLast4: '2244' }, paymentSource: 'online', gateway: 'razorpay', gatewayPaymentId: 'pay_NJ7aBcD019', gatewayOrderId: 'order_NJ7aBcD019', gatewayFee: 1840, taxOnFee: 331, netAmount: 89829, reconciliationStatus: 'reconciled', refundedAmount: 50000, refundReason: 'Duplicate payment — parent requested refund for second transaction' },
]

export const SEED_FEE_TRANSACTIONS = SEED_TRANSACTIONS

// ─── Cash Request seed ───────────────────────────────────────────────

export const SEED_CASH_REQUESTS: CashRequest[] = [
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

export const SEED_AUDIT: AuditRecord[] = [
  { id: 'AUD-001', action: 'payment.recorded', actor: 'Principal', timestamp: '2025-10-12T11:30:00Z', entityId: 'TXN010', entityType: 'transaction', description: 'Payment ₹1,48,000 recorded for Aadhya Menon via UPI (RCP-2025-1051)' },
  { id: 'AUD-002', action: 'cash.submitted', actor: 'Ananya Sharma (Class Teacher)', timestamp: '2025-04-18T09:15:00Z', entityId: 'PCR-01', entityType: 'cash_request', description: 'Cash ₹30,000 submitted for Reyansh Kumar' },
  { id: 'AUD-003', action: 'concession.granted', actor: 'Principal', timestamp: '2025-04-11T14:00:00Z', entityId: 'STU-6', entityType: 'concession', description: 'Sibling concession (₹5,000) granted to Ishaani Verma' },
  { id: 'AUD-004', action: 'fee_structure.changed', actor: 'Principal', timestamp: '2025-04-01T10:00:00Z', entityId: 'FS04', entityType: 'fee_structure', description: 'Class 9–10 Tuition revised from ₹1,04,000 → ₹1,08,000 (effective 2025-26 session)' },
  { id: 'AUD-005', action: 'receipt.reprinted', actor: 'Principal', timestamp: '2025-11-01T15:20:00Z', entityId: 'TXN007', entityType: 'receipt', description: 'Receipt RCP-2025-1048 reprinted (no second transaction created)' },
]

