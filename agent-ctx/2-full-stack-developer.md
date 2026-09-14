# Task ID: 2 — Student online-payment backend (PaymentProvider + server-verified checkout)

Agent: full-stack-developer subagent
Scope: SERVER-SIDE ONLY. No files under src/components/ were touched. No schema changes.

## What was built

| File | Purpose |
|---|---|
| `src/lib/payments/provider.ts` | PaymentProvider abstraction — RazorpayProvider (real API via plain fetch, Basic auth, HMAC checkout verify, timing-safe) + SandboxProvider (server-side simulated gateway, HMAC with server-held `PAYMENTS_SANDBOX_SECRET`). `getPaymentProvider()`: Razorpay if `RAZORPAY_KEY_ID`+`RAZORPAY_KEY_SECRET`, else Sandbox if `PAYMENTS_SANDBOX=1`, else null. Server-only module (comment guard; imported only from route handlers). |
| `src/lib/payments/methods.ts` | Method vocabulary helpers: `normalizeMethod` ('Net Banking'→'NET_BANKING', FeeTransaction convention), `paymentMethodFor` ('NET_BANKING'→'NETBANKING', Payment row convention), `prettyMethod` ('NET_BANKING'→'Net Banking', UI text; UPI stays 'UPI'). |
| `src/app/api/student/payments/config/route.ts` | GET — capability probe: `{ available, provider, mode, keyId }`. |
| `src/app/api/student/payments/order/route.ts` | POST — order creation. Student resolved from SESSION (body schoolId/studentId ignored → 'NO_STUDENT_RECORD'). Amount validated 1..500000. Receipt minted server-side `RCP-<year>-<seq4>`. FeeTransaction persisted PENDING. Sandbox: signed confirmation minted server-side and returned under `sandbox` (+top-level mirror). |
| `src/app/api/student/payments/verify/route.ts` | POST — the ONLY path to SUCCESS. RLS school check (FORBIDDEN), idempotent (already-SUCCESS returns same payload, no double-writes), signature re-verified server-side (forged → txn FAILED + 'exception' + 400 SIGNATURE_VERIFICATION_FAILED). On success (one `db.$transaction`): txn SUCCESS+reconciled, Payment row created (fires event-stream poller), Fee row paid/status/method/paidDate updated (or minimal Fee created), Notification row created (appears in /api/notifications-feed), WebhookEvent audit row `verify-<orderId>` (duplicate-safe try/catch). |
| `src/app/api/student/payments/receipt/[txnId]/route.ts` | GET — receipt re-download. School + session-student RLS (404/FORBIDDEN). |

## Env
Appended to `.env` (values never printed): `PAYMENTS_SANDBOX=1`, `PAYMENTS_SANDBOX_SECRET=<random hex>`. Dev server picked them up via env hot-reload (verified: config returns provider `sandbox`).

## API contract (exact shapes)

### GET /api/student/payments/config (auth: STUDENT session cookie `erp_session`)
```json
{ "ok": true, "data": { "available": true, "provider": "sandbox", "mode": "sandbox", "keyId": null } }
```
`available:false` (provider null) → UI shows "Online payment isn't available. Please contact the school office."

### POST /api/student/payments/order — body `{ amount, method?, feeHead?, purpose? }`
```json
{ "ok": true, "data": {
  "orderId": "order_sbx_a6ff8892cbd97e471ab20473",
  "receiptNo": "RCP-2026-0003",
  "amountPaise": 2500000,
  "currency": "INR",
  "mode": "sandbox",
  "keyId": null,
  "paymentId": "pay_sbx_15498efd9488aa5c64374833",
  "signature": "eaa3954725d3e57af381d75ef7372a4d8fe4e2289dca5fbfe32c04842c52839a",
  "sandbox": { "paymentId": "pay_sbx_…", "signature": "…" },
  "txnId": "cmu0gh03d0003pyugceq0o9ua"
} }
```
- `paymentId`/`signature`/`sandbox` present ONLY in sandbox mode (null/absent for Razorpay — then the client opens Razorpay Checkout with `keyId`+`orderId`).
- Client relays `{ orderId, paymentId, signature }` to /verify.
- Errors (400): `NO_STUDENT_RECORD`, `ONLINE_PAYMENTS_UNAVAILABLE`, "amount must be a number between 1 and 500000".

### POST /api/student/payments/verify — body `{ orderId, paymentId, signature }`
```json
{ "ok": true, "data": {
  "receiptNo": "RCP-2026-0003", "amount": 25000, "method": "UPI",
  "status": "SUCCESS", "gatewayPaymentId": "pay_sbx_…",
  "txnId": "cmu0gh03d0003pyugceq0o9ua", "paidAt": "2026-09-13T23:40:47.015Z"
} }
```
- `method` is a PRETTY label ('UPI' | 'Card' | 'Net Banking'). FeeTransaction rows store 'UPI'|'CARD'|'NET_BANKING'; Payment rows store 'UPI'|'CARD'|'NETBANKING'.
- Idempotent: repeat call returns the same payload; exactly ONE Payment/Notification row per order.
- Errors: 400 `SIGNATURE_VERIFICATION_FAILED` (txn → FAILED/exception), 400 `TRANSACTION_NOT_VERIFIABLE` (already FAILED), 404 `NOT_FOUND`, 403 `FORBIDDEN` (cross-school), 400 missing fields.

### GET /api/student/payments/receipt/[txnId]
Returns the full FeeTransaction row (raw `method` convention 'NET_BANKING'; map for display) — 404 NOT_FOUND / 403 FORBIDDEN otherwise.

## Test evidence (curl, demo student `student1@demoschool.edu` / `password123`)
- login → 200 session cookie; config → sandbox provider.
- order ₹25000 UPI → receipt `RCP-2026-0003` + sandbox confirmation; amount 0 / 500001 → 400.
- verify (valid sig) → SUCCESS; second verify → identical payload; DB had exactly 1 Payment row (idempotency proven).
- FORGED signature on a fresh PENDING order → 400 SIGNATURE_VERIFICATION_FAILED + txn FAILED/'exception'; re-verify → 400 TRANSACTION_NOT_VERIFIABLE.
- Unknown orderId → 404; missing fields → 400; student2 fetching Aarav's receipt → 403; principal calling config → 403.
- Side effects confirmed via SQL: Fee paid 0→25000 status PAID; Notification "Aarav Sharma paid ₹25000 via UPI · Receipt RCP-2026-0003" visible in /api/notifications-feed (top item); WebhookEvent `verify-order_sbx_…` processed with matchedTransactionId.
- Gates: `bunx tsc --noEmit` 0 errors; `bun run lint` clean; dev.log shows routes compiled + 401/200.
- CLEANUP: all test FeeTransaction/Payment/Notification/WebhookEvent rows deleted; Aarav's Fee restored to ORIGINAL (25000 / paid 0 / UNPAID / method null / paidDate null / dueDate 2025-09-30). Counts back to baseline (Fee 18, FeeTransaction 8, WebhookEvent 1).

## Deviations from spec (minor, with reasons)
1. `/order` response additionally returns `txnId` (needed for the receipt re-download URL) and mirrors sandbox paymentId/signature top-level as well as under `sandbox` (spec's return shape listed both placements ambiguously — both provided, documented).
2. Fee row resolution prefers an exact `feeHeadName` title match before falling back to `findFirst({ where: { studentId } })` (spec's plain call) — deterministic attribution when a student has multiple Fee rows; identical behaviour for the demo (single fee row).
3. Fee status uses the codebase's existing convention incl. 'PARTIAL' for under-payment (matches /api/fees POST), spec only mentioned 'PAID'.
4. `prettyMethod` keeps 'UPI' uppercase (a naive title-case produced "Upi").
5. Provider resolution is cached per process (env changes require the standard dev-server env reload, which Next.js performs automatically — observed working).
