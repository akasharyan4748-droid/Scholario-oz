import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

/// GET /api/fees/payments?orderId=… — SETTLEMENT STATUS LOOKUP (UX-3 §31).
///
/// Lets the client re-check an UNCERTAIN order after a network error: the
/// demo-gateway settlement call may have landed server-side even though the
/// response never reached the browser. The answer is always the server's
/// own FeeTransaction state — the client re-syncs its UI mirror from THIS,
/// never from its own assumption.
///
/// Authorisation mirrors /api/fees/payments/confirm exactly:
///   · withUser roles [PRINCIPAL, MANAGEMENT, ACCOUNTANT, PARENT, STUDENT]
///   · schoolScoped(user) — the order is matched by gatewayOrderId AND
///     schoolId (tenant isolation).
///   · STUDENT: the order's studentId must equal the session's linked
///     Student row id (§25 — only your own orders).
///
/// Returns the same settlement snapshot shape as the confirm endpoint:
///   { status, receiptNo, gatewayPaymentId, orderId, amount, method, txnId, note }

export async function GET(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const orderId = req.nextUrl.searchParams.get('orderId') || ''
      if (!orderId) throw new Error('orderId is required.')

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

      return {
        status: txn.status,
        receiptNo: txn.receiptNo,
        gatewayPaymentId: txn.gatewayPaymentId,
        orderId: txn.gatewayOrderId ?? '',
        amount: txn.amount,
        method: txn.method,
        txnId: txn.id,
        note: txn.note,
      }
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT', 'ACCOUNTANT', 'PARENT', 'STUDENT'] }
  )
}
