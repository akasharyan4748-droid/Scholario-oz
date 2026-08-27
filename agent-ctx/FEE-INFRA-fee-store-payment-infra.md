# FEE-INFRA — Payment infrastructure types + critical bug fixes

**Task ID:** FEE-INFRA
**Agent:** full-stack-developer (Payment infrastructure types + bug fixes)
**Task:** Add payment infrastructure types to fee-store + fix critical bugs
**File touched:** `src/lib/store/fee-store.ts` ONLY (1438 LOC → 2068 LOC, +630 LOC additive)

## Scope summary

Implemented the foundational data model for the payment infrastructure (gateway, bank accounts, UPI/QR, settlements, reconciliation, webhooks) AND fixed 3 critical bugs flagged by the FEE-AUDIT pass. Every change is additive / backward-compatible — existing consumers (22 files import from `fee-store`) continue to compile and run without modification.

## Work Log

### 1. Type extensions (additive, lines 30–55, 94–107, 215, 271–392)

- **AuditAction union** (fee-store.ts:30-55): appended 10 new actions — `gateway.connected`, `gateway.disconnected`, `bank_account.added`, `bank_account.updated`, `bank_account.deactivated`, `upi_qr.added`, `upi_qr.updated`, `settlement.recorded`, `reconciliation.matched`.
- **AuditRecord.entityType** (fee-store.ts:215): widened the union with `'gateway' | 'bank_account' | 'upi_qr' | 'settlement' | 'reconciliation' | 'webhook'`. Verified downstream consumers use equality filters (fees-approvals.tsx:68 `=== 'cash_request'`, fees-student-accounts.tsx:472 by `entityId`) — no exhaustive `switch` blocks would break.
- **FeeTransaction interface** (fee-store.ts:94-107): added 12 optional fields — `paymentSource`, `gateway`, `gatewayPaymentId`, `gatewayOrderId`, `settlementId`, `settlementStatus`, `utr`, `gatewayFee`, `taxOnFee`, `netAmount`, `reconciliationStatus`, `refundedAmount`, `refundReason`. All optional — existing recordPayment / approveCashRequest paths that don't set them are unaffected.
- **New types block** (fee-store.ts:271-392): `GatewayProvider`, `GatewayEnvironment`, `GatewayStatus`, `GatewayConfig`, `BankAccountType`, `AccountStatus`, `BankAccount`, `UpiQrType`, `UpiQrStatus`, `UpiQrConfig`, `SettlementStatus`, `ReconciliationStatus`, `Settlement`, `ReconciliationRecord`, `WebhookEvent`. Secret keys (`webhookSecret`) are typed but explicitly NOT seeded into client state (server-side only — comment at fee-store.ts:292-293, 580).

### 2. Seed data (fee-store.ts:565-697)

Added 6 new seed constants used to initialize the new store state:
- `SEED_GATEWAY_CONFIG` — 1 Razorpay config, environment=`test`, status=`test_mode`, webhook healthy, linked to `BA-01`.
- `SEED_BANK_ACCOUNTS` — 2 accounts: BA-01 HDFC current (primary), BA-02 SBI savings (secondary). Both with `parentDisplayInstructions`.
- `SEED_UPI_QR_CONFIGS` — 1 static UPI QR (`scholario@hdfc`).
- `SEED_SETTLEMENTS` — 3 settlements: SET-01 (settled, UTR `RZPSET0420250001`, includes TXN001+TXN002+TXN004, gross ₹4,39,000), SET-02 (settled, UTR `RZPSET0720250002`, TXN007+TXN008, gross ₹2,96,000), SET-03 (pending, TXN010+TXN013+TXN014, gross ₹3,18,000). Per-transaction `gatewayFee` / `taxOnFee` / `netAmount` on linked transactions sum exactly to each settlement's aggregate (2% + 18% GST model).
- `SEED_RECONCILIATION_RECORDS` — 5 reconciled records for the SET-01 + SET-02 transactions, each with the gatewayPaymentId / gatewayOrderId / utr snapshot.
- `SEED_WEBHOOK_EVENTS` — 4 events: 3 `payment.success` (TXN001, TXN002, TXN007), 1 `payment.failed` (TXN017).

### 3. Store state interface + initialization (fee-store.ts:781-787, 802-814, 911-918)

- **FeeState interface** (fee-store.ts:781-787): added 6 new state arrays/scalar — `gatewayConfig: GatewayConfig | null`, `bankAccounts: BankAccount[]`, `upiQrConfigs: UpiQrConfig[]`, `settlements: Settlement[]`, `reconciliationRecords: ReconciliationRecord[]`, `webhookEvents: WebhookEvent[]`. All have sensible defaults (`null` / `[]`) so existing selectors that don't read them keep working unchanged.
- **FeeState mutation signatures** (fee-store.ts:802-814): added the 12 new mutation signatures exactly per the task spec.
- **create() initialization** (fee-store.ts:911-918): wired the new state to the seed constants. Bumped `receiptCounter` from `1057` → `1060` because the 4 new seed transactions (TXN016–019) consume receipts `RCP-2025-1057..1060`; the next user-recorded payment now correctly gets `RCP-2025-1061`.

### 4. New mutations (fee-store.ts:1525-1805)

Implemented all 12 new mutations with audit records where financially sensitive:
- `connectGateway` — emits `gateway.connected` audit; preserves prior settlement account link.
- `disconnectGateway` — emits `gateway.disconnected` audit; clears gatewayConfig but keeps historical transactions.
- `updateGatewayStatus` — operational, NO audit (matches the existing pattern for `updateLateFeeRule` / `updateConcessionRule` which deliberately skip audit to avoid noise).
- `addBankAccount` — first account auto-becomes primary; emits `bank_account.added`.
- `updateBankAccount` — emits `bank_account.updated`.
- `setPrimaryBankAccount` — refuses if target is inactive; emits `bank_account.updated`.
- `deactivateBankAccount` — auto-promotes another active account if the primary is deactivated; emits `bank_account.deactivated`.
- `addUpiQrConfig` — emits `upi_qr.added`.
- `updateUpiQrConfig` — emits `upi_qr.updated`.
- `recordSettlement` — links each included transaction's `settlementId` + `settlementStatus`; emits `settlement.recorded` with gross/net totals in INR.
- `reconcileTransaction` — creates a `ReconciliationRecord`, sets the linked transaction's `reconciliationStatus` to `reconciled`, propagates `settlementId` / `utr`; emits `reconciliation.matched`.
- `recordWebhookEvent` — idempotent on (`provider`, `eventId`); duplicates silently return without writing (prevents double-processing on gateway retries). No audit (the `webhookEvents` array IS the log).

### 5. Seed transactions upgraded (fee-store.ts:701-722)

Annotated all 15 existing seed transactions with the new optional fields:
- UPI/Card/Net Banking Success → `paymentSource: 'online'`, `gateway: 'razorpay'`, `gatewayPaymentId`, `gatewayOrderId`. Settled ones (TXN001/002/004/007/008) also get `gatewayFee` / `taxOnFee` / `netAmount` / `settlementId` / `settlementStatus: 'settled'` / `utr` / `reconciliationStatus: 'reconciled'`. Pending-settlement ones (TXN010/013/014) get `settlementId: 'SET-03'`, `settlementStatus: 'pending'`, `reconciliationStatus: 'pending'`.
- Cash / Cheque → `paymentSource: 'offline'`.
- Net Banking Pending (TXN009) → `paymentSource: 'online'`, `gateway: 'razorpay'`, `reconciliationStatus: 'pending'`.

Added 4 new seed transactions (TXN016–019) to cover the gaps the FEE-AUDIT flagged:
- **TXN016** Bank Transfer Success (₹50,000, STU-11 Class 10) — fills the unused `Bank Transfer` PaymentMode.
- **TXN017** UPI Failed (₹1,84,000, STU-13 Class 11) — first Failed seed transaction; carries `refundReason: 'Payment failed at gateway — insufficient funds in payer account'`, `reconciliationStatus: 'exception'`.
- **TXN018** Card Failed (₹92,000, STU-14 Class 11) — second Failed; `refundReason: 'Card declined by issuing bank'`, `reconciliationStatus: 'exception'`.
- **TXN019** Card Refunded (₹92,000, STU-16 Class 11) — first Refunded seed transaction; carries `refundedAmount: 50000`, `refundReason: 'Duplicate payment — parent requested refund'`, plus `gatewayFee` / `taxOnFee` / `netAmount` (the original fee was charged before the refund), `reconciliationStatus: 'reconciled'`.

### 6. Bug fixes

#### Bug 1 — `approveCashRequest` classId (fee-store.ts:984-1016)
Previously the auto-created transaction had `classId: ''`, which broke the `classWise` aggregation in `useFeeData` (transactions grouped under key `''` instead of the student's real class).
**Fix:** look up the student by `req.studentId` in the canonical students store and use `student.classId`. Fall back to `''` only if the student isn't found (defensive). Also tagged the new transaction with `paymentSource: 'offline'` for consistency with the new infrastructure.

```ts
const student = useStudentsStore.getState().students.find((s) => s.id === req.studentId)
const classId = student?.classId ?? ''
// ...
const txn: FeeTransaction = { ..., classId, ..., paymentSource: 'offline' }
```

#### Bug 2 — `todayCollection` / `week` / `month` / `year` (fee-store.ts:1938-1948)
Previously these KPIs summed ALL transactions regardless of status, so a failed ₹50,000 UPI payment would inflate today's collection.
**Fix:** added `&& t.status === 'Success'` to all four filters. The `monthly` chart already filtered correctly (line 1960 `if (t.status === 'Success')`), so this brings the period KPIs in line with the monthly breakdown.

#### Bug 3 — `byCategory` hardcoded percentages (fee-store.ts:1965-1996)
Previously:
```ts
{ name: 'Tuition',   value: accounts.reduce((s,a) => s + Math.round(a.totalApplicable * 0.75), 0), ... },
{ name: 'Transport', value: accounts.reduce((s,a) => s + Math.round(a.totalApplicable * 0.15), 0), ... },
{ name: 'Library',   value: accounts.reduce((s,a) => s + Math.round(a.totalApplicable * 0.03), 0), ... },
{ name: 'Exam',      value: accounts.reduce((s,a) => s + Math.round(a.totalApplicable * 0.04), 0), ... },
{ name: 'Activity',  value: accounts.reduce((s,a) => s + Math.round(a.totalApplicable * 0.03), 0), ... },
```
These percentages didn't reflect the real fee structures (e.g., FS04 Secondary has Tuition=108000/148000 ≈ 73%, not 75%; FS01 Pre-Primary has Tuition=48000/68000 ≈ 71%).
**Fix:** compute the actual per-head totals by walking each `account` → matching its className → classLevel → `FEE_STRUCTURES` row (using the SAME substring logic as `computeAccount` at fee-store.ts:1242-1247 so the breakdown is consistent with each student's ledger) → summing each active component's `amount` into a `categoryMap`. The output is now a sorted array of `{ name, value, color }` derived from real data. Colors preserved for the 5 known heads (Tuition/Transport/Library/Exam/Activity) with a default for any future head.

#### Bug 4 — Fee Heads Settings toast-only (acknowledged)
Per the task: the `addFeeHead` and `archiveFeeHead` mutations already exist in the store (fee-store.ts:758-882, unchanged by this pass) and are ready to be called by the Settings UI. The wiring itself is the Settings agent's job; no fee-store changes needed here.

## Verification results

| Check | Command | Result |
|-------|---------|--------|
| ESLint | `bun run lint` | exit 0, no errors (only an unrelated `.eslintignore` deprecation warning) |
| TypeScript (fee-store specific) | `bunx tsc --noEmit 2>&1 \| grep "fee-store" \| head -20` | empty — no errors in the modified file |
| TypeScript (project-wide) | `bunx tsc --noEmit 2>&1 \| grep "error TS" \| wc -l` | 21 errors, ALL in pre-existing unrelated files (exams/*, finance-store.ts) — none in fee-store.ts or any new type |
| Dev server | `curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/` | HTTP 200 |

## Backward-compatibility audit

- **Existing 18 mutations** — unchanged (only `approveCashRequest` got the classId fix + a new `paymentSource: 'offline'` field, both backward-compat).
- **Existing 5 seed Fee Structures + 23 fee heads + 3 cash requests + 5 audit records + 6 payment modes + late-fee/concession/receipt defaults** — preserved verbatim.
- **Existing 15 seed transactions** — fields preserved, only new OPTIONAL fields appended to each line.
- **Existing 22 consuming files** — confirmed none select the entire store state (all use specific selectors like `useFeeStore((s) => s.transactions)`), so adding new state fields is invisible to them. The only `entityType` consumer (`fees-approvals.tsx:68`) uses `===` equality, which is safe with the widened union.
- **`useFeeData` return shape** — unchanged; the `analytics` object still has all the same keys. `byCategory` is now computed (sorted by value desc) instead of hardcoded, so chart consumers will see the same 5 heads with corrected values.

## Stage Summary

The payment infrastructure foundation is in place: 90 LOC of new types, 130 LOC of new seed data, 280 LOC of new mutations, 3 critical bugs fixed, 4 new demo transactions covering Failed / Refunded / Bank Transfer. The store grew from 1438 LOC to 2068 LOC (+630 LOC, all additive). Lint passes (exit 0). `bunx tsc --noEmit` reports zero errors in `fee-store.ts`. Dev server returns HTTP 200. The downstream Settings / Transactions / Approvals / Reports agents can now consume `gatewayConfig`, `bankAccounts`, `upiQrConfigs`, `settlements`, `reconciliationRecords`, `webhookEvents` from `useFeeStore` and the new gateway/settlement fields on each `FeeTransaction` to build the gateway-config UI, settlement tracking, reconciliation dashboard, and refund workflow.
