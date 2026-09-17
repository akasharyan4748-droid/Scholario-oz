import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

/// POST /api/fees/payments/confirm — DEMO GATEWAY SETTLEMENT (UX-3 §25–§31).
///
/// ROLE: this endpoint plays the part the SIGNED Razorpay webhook plays in
/// production (see /api/webhooks/razorpay/route.ts — HMAC-verified,
/// DB-idempotent, auto-reconciling). The demo gateway has no real bank, so
/// the settlement decision happens HERE, on the server: the client may ask
/// for settlement of an order it created via /api/fees/orders, but it can
/// never assert an amount, a student, or an outcome — those are read from
/// the server's own FeeTransaction row and decided by the demo settlement
/// rules below. No client trust is involved in the financial state machine.
/// In production this PENDING → SUCCESS transition happens ONLY via the
/// webhook's verified payment.captured event; this route exists so the demo
/// flow exercises the same server-owned transition end-to-end.
///
/// Input (deliberately minimal):
///   { orderId: string }                    — the only thing the client owns
///   { orderId, outcome: 'cancelled' }      — the user abandoned the gateway
///                                           page mid-checkout. 'cancelled'
///                                           is NOT a financial success
///                                           claim, so honouring it
///                                           server-side as FAILED is safe
///                                           and honest (no money moved).
///
/// Authorisation:
///   · withUser roles [PRINCIPAL, MANAGEMENT, ACCOUNTANT, PARENT, STUDENT]
///   · schoolScoped(user) — the order is looked up by gatewayOrderId AND
///     schoolId: a student from school X can never settle school Y's order.
///   · STUDENT: the txn's studentId must equal the session's linked Student
///     row id (User → Student by userId) — student A can never confirm
///     student B's order (§25).
///
/// Idempotency (the webhook's discipline, mirrored here):
///   · SUCCESS → return the SAME authoritative result again (no double
///     credit, no state change).
///   · FAILED → return the failure again.
///   · Only PENDING rows transition.
///
/// Demo settlement rules (server-decided, deterministic — the client cannot
/// choose the outcome):
///   · UPI / CARD        → SUCCESS (captured) with a minted gatewayPaymentId.
///   · NET_BANKING       → stays PENDING ("awaiting bank settlement" — bank
///                          verification lag; reconciles later, §31 honest
///                          state).
///   · outcome cancelled → FAILED ("cancelled at gateway").
///
/// Returns:
///   { status, receiptNo, gatewayPaymentId, orderId, amount, method, txnId }

/** The authoritative settlement snapshot every caller gets back. */
function settlementOf(txn: {
  id: string
  status: string
  receiptNo: string | null
  gatewayPaymentId: string | null
  gatewayOrderId: string | null
  amount: number
  method: string
}) {
  return {
    status: txn.status,
    receiptNo: txn.receiptNo,
    gatewayPaymentId: txn.gatewayPaymentId,
    orderId: txn.gatewayOrderId ?? '',
    amount: txn.amount,
    method: txn.method,
    txnId: txn.id,
  }
}

export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      const orderId = String(body.orderId || '')
      if (!orderId) throw new Error('orderId is required.')
      const cancelled = body.outcome === 'cancelled'

      // ── Tenant isolation: the order must belong to THIS school ────
      const txn = await db.feeTransaction.findFirst({
        where: { gatewayOrderId: orderId, schoolId },
      })
      if (!txn) throw new Error('Order not found for this school.')

      // ── §25 student authorisation: only your OWN orders ───────────
      if (user.role === 'STUDENT') {
        const me = await db.student.findFirst({ where: { userId: user.id } })
        if (!me || me.schoolId !== schoolId || txn.studentId !== me.id) {
          throw new Error('FORBIDDEN')
        }
      }

      // ── Idempotency — terminal states answer with themselves ──────
      if (txn.status === 'SUCCESS' || txn.status === 'FAILED') {
        return settlementOf(txn)
      }
      if (txn.status !== 'PENDING') {
        // UNDER_VERIFICATION / REFUNDED are office-managed states — the
        // gateway rail never rewrites them.
        throw new Error(`This order is ${txn.status.toLowerCase()} — settlement is handled by the school office.`)
      }

      // ── outcome: cancelled (user abandoned the gateway page) ──────
      if (cancelled) {
        const updated = await db.feeTransaction.update({
          where: { id: txn.id },
          data: {
            status: 'FAILED',
            reconciliationStatus: 'exception',
            reconciledAt: new Date(),
            reconciledBy: 'demo-gateway',
            note: 'cancelled at gateway',
          },
        })
        return settlementOf(updated)
      }

      // ── Demo settlement rules (server-decided) ────────────────────
      if (txn.method === 'NET_BANKING') {
        // Bank verification lag — stays PENDING, reconciles later (§31).
        const updated = await db.feeTransaction.update({
          where: { id: txn.id },
          data: { note: 'awaiting bank settlement' },
        })
        return settlementOf(updated)
      }

      // UPI / CARD → captured. gatewayPaymentId minted server-side; the
      // demo gateway carries no signature (production: the webhook's HMAC).
      const gatewayPaymentId = `pay_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
      const updated = await db.feeTransaction.update({
        where: { id: txn.id },
        data: {
          status: 'SUCCESS',
          gatewayPaymentId,
          gatewaySignature: null,
          reconciliationStatus: 'reconciled',
          reconciledAt: new Date(),
          reconciledBy: 'demo-gateway',
          note: 'Settled server-side by the demo gateway',
        },
      })
      // Audit parity with the webhook's auto-reconciliation (best-effort).
      await db.reconciliation
        .create({
          data: {
            schoolId,
            transactionId: txn.id,
            settlementId: txn.settlementId,
            status: 'reconciled',
            matchedBy: 'demo-gateway',
            note: `Settled via gateway order ${orderId}`,
          },
        })
        .catch(() => {/* best-effort audit row */ })

      return settlementOf(updated)
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT', 'ACCOUNTANT', 'PARENT', 'STUDENT'] }
  )
}
