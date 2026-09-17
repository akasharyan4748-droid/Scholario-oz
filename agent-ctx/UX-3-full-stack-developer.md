# UX-3 — Fees Module Redesign + Server-Verified Payment Flow

Task ID: UX-3
Agent: full-stack-developer subagent
Scope: spec §18–§39 — Fees header rule, server-verified payment state machine
(orders → server settlement → mirror), honest pending/failure states,
no-dues state, design discipline.

> Context for future agents: an earlier interrupted session had already
> written most of the UX-3 code (fees/*, gateway-client.ts, both API routes,
> fee-store mirror params) but never verified or logged it. This session
> AUDITED every file against the spec, applied the remaining polish
> (44px touch targets on dialog footer actions), and ran the FULL gate +
> curl verification suite. Everything below is verified working on the live
:3000 dev server.

## The payment state machine (the contract future agents must preserve)

SERVER (authoritative — the client NEVER owns financial state, §25):

1. `POST /api/fees/orders` (src/app/api/fees/orders/route.ts)
   - `withUser` roles [PRINCIPAL, MANAGEMENT, ACCOUNTANT, PARENT, STUDENT]
     + `schoolScoped(user)`.
   - STUDENT callers: student resolved SERVER-SIDE
     (`db.student.findFirst({ where: { userId: user.id } })`); client-provided
     studentId/studentName IGNORED (verified by curl: `studentId:"STU-58"`,
     `studentName:"Impostor Name"` → row written with
     `cmtartfn000ggju86pz5zozwh` / "Aarav Sharma").
   - PARENT/staff: client-named student validated to exist in the SAME school.
   - Amount sanity: > 0 and ≤ 500000 (both bounds curl-tested).
   - Creates FeeTransaction status='PENDING', unique `gatewayOrderId`,
     `receiptNo` `RCP-<epochMs>`, reconciliationStatus 'pending'.

2. `POST /api/fees/payments/confirm` (src/app/api/fees/payments/confirm/route.ts)
   — THE DEMO GATEWAY'S SERVER-SIDE SETTLEMENT. Doc comment states plainly:
   in production this PENDING→SUCCESS transition happens ONLY via the signed
   Razorpay webhook (/api/webhooks/razorpay, HMAC + WebhookEvent.eventId
   idempotency); the demo gateway simulates the same server-owned transition
   so no client trust is involved.
   - Input `{ orderId, outcome?: 'cancelled' }` — nothing else. Amount,
     identity and outcome are read/decided server-side.
   - Lookup by `gatewayOrderId AND schoolId` (tenant isolation). STUDENT:
     txn.studentId must equal the session's linked Student row → else
     FORBIDDEN 403 (curl-verified with a principal-minted order for another
     student).
   - IDEMPOTENT: SUCCESS → same authoritative snapshot again (same
     gatewayPaymentId, no state change; curl-verified double-confirm);
     FAILED → failure again; only PENDING transitions.
   - Rules: UPI/CARD → SUCCESS + `pay_<random>` + reconciliationStatus
     'reconciled' + reconciledAt + best-effort Reconciliation audit row;
     NET_BANKING → stays PENDING, note 'awaiting bank settlement' (§31);
     `outcome:'cancelled'` → FAILED, note 'cancelled at gateway'.

3. `GET /api/fees/payments?orderId=…` (src/app/api/fees/payments/route.ts)
   — §31 reconciliation lookup, same auth/tenant/student checks, returns the
   same settlement snapshot (+note) so the client can re-sync after a
   network error instead of guessing.

CLIENT (mirror only — src/components/student/modules/fees/):

- `gateway-client.ts`: `createFeeOrder` / `confirmFeePayment` /
  `cancelFeeOrder` / `lookupFeePayment` / `isAbortError`. Fetches carry an
  AbortController that spans order+settlement (explicit cancel path).
- `index.tsx handlePay` (gateway rail): stage 'processing' → createFeeOrder →
  confirmFeePayment → ONLY on server `SUCCESS` does `recordPayment` run as
  the MIRROR write, with the SERVER's `receiptNo` (new optional
  `PaymentInput.receiptNoOverride` — store counter untouched for offline
  rails), `gatewayPaymentId`, `gatewayOrderId`, `paymentSource:'gateway'`.
  Server `PENDING` → mirror with new `PaymentInput.pendingSettlement` →
  honest 'Pending' row + amber principal alert + 'pending' stage ("Payment
  initiated — awaiting bank confirmation", NOT success). FAILED / network
  error / cancelled → NEW 'failed' stage ("Payment wasn't completed." +
  [Try again] → NEW order, no duplicate + [Close]), NO ledger write. Network
  error mid-confirm → `lookupFeePayment` re-check; if even that fails →
  `outcomeUnknown` copy defers reconciliation to the office.
- Cancel race: user cancels after the order existed → abort + server
  `outcome:'cancelled'` → FAILED; if the server answers SUCCESS anyway
  (settled just before), the server's result wins and is mirrored silently.
- MANUAL rail preserved: no gateway → reference submission →
  'Under Verification' + principal alert (§33).
- `confirmed` prop for success/receipt stages = server-confirmed SUCCESS
  with gatewayPaymentId. Receipt (§32): `downloadReceiptA5(submittedTxn,…)`
  carries the server receiptNo + gateway reference.
- Amount rules (§26): default = outstanding balance only; no arbitrary
  amount entry (form has no amount field).

## Header rule + no-dues (§19/§20/§37/§39)

- `index.tsx`: no SectionHeading/"My Fees" (rg sweep → zero matches); page
  opens into FinancialOverview (FeeRevisionApprovalCard renders null unless
  a real pending revision exists).
- `financial-overview.tsx`: ONE compact top row `2026–27 · ● Partially paid`
  (the page's ONLY financial status chip) → BALANCE DUE hero (AnimatedCounter)
  → §20 line `₹4,750 paid · ₹9,500 total` → progress bar. Verbose hints gone
  (§39) — the under-review hint is the only one left, shown conditionally.
- Settled (§37): calm emerald "All fees paid" + received line + [View fee
  statement]; progress bar keeps 100% context. No giant ₹0.

## Verification (all run this session)

- `bunx tsc --noEmit` → 0 errors ✓ · `bun run lint` → clean ✓
- curl (fresh jar /tmp/ux3-cookies.txt, student session):
  1. login aarav → ok, role STUDENT, schoolId cmtartda70001ju867gl760tm
  2. POST orders UPI ₹100 (with impostor studentId) → orderId
     order_kkxog6rh0nfmu00e5j2, receipt RCP-1789315740542, notes.studentId =
     server-resolved cmtartfn000ggju86pz5zozwh ✓
  3. POST confirm → SUCCESS, gatewayPaymentId pay_r5l1u5e2mu00eas7 ✓
  4. POST confirm AGAIN → identical snapshot (idempotent, no double credit;
     DB: exactly 1 SUCCESS row, reconciled, reconciledBy 'demo-gateway') ✓
  5. GET payments?orderId → SUCCESS + note 'Settled server-side by the demo
     gateway' ✓
  6. POST orders NET_BANKING ₹250 → confirm → status PENDING, note 'awaiting
     bank settlement' ✓
  7. Negative: amount 0 → error; ₹500001 → error; unauthenticated → 401
     UNAUTHORIZED; unknown orderId → 'Order not found for this school.';
     cancelled outcome → FAILED 'cancelled at gateway'; aarav confirming
     another student's order → 403 FORBIDDEN ✓
- dev.log → clean compile, GET / 200 ✓ · no agent-browser, no APP_VERSION
  bump, dev server never restarted.
