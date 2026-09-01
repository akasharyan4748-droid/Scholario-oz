import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

/// POST /api/fees/reconcile
///
/// Manually reconcile (match) a transaction to a settlement, OR mark it
/// as an exception. The webhook route auto-calls this logic internally —
/// this endpoint exposes it for the principal's manual review surface.
///
/// Body:
///   { action: 'match' | 'exception' | 'reverse', transactionId, settlementId?, note? }
/// Returns the updated transaction + the Reconciliation row created.
export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      const action = String(body.action || 'match')
      const transactionId = String(body.transactionId || '')
      if (!transactionId) throw new Error('transactionId is required')

      const txn = await db.feeTransaction.findFirst({
        where: { id: transactionId, schoolId },
      })
      if (!txn) throw new Error('NOT_FOUND')

      const now = new Date()
      let newStatus: string = txn.reconciliationStatus
      let newSettlementId: string | null = txn.settlementId
      let note: string | null = body.note ? String(body.note) : null

      if (action === 'match') {
        if (!body.settlementId) throw new Error('settlementId is required for match action')
        const settlement = await db.settlement.findFirst({
          where: { id: String(body.settlementId), schoolId },
        })
        if (!settlement) throw new Error('settlement not found')
        newStatus = 'reconciled'
        newSettlementId = settlement.id
        if (!note) note = `Matched to settlement ${settlement.payoutId ?? settlement.id} by ${user.email}`
      } else if (action === 'exception') {
        newStatus = 'exception'
        if (!note) note = `Marked as exception by ${user.email}`
      } else if (action === 'reverse') {
        newStatus = 'unreconciled'
        newSettlementId = null
        if (!note) note = `Reversed previous reconciliation by ${user.email}`
      } else {
        throw new Error(`unknown action: ${action}`)
      }

      const updated = await db.feeTransaction.update({
        where: { id: txn.id },
        data: {
          reconciliationStatus: newStatus,
          settlementId: newSettlementId,
          reconciliationNote: note,
          reconciledAt: now,
          reconciledBy: user.id,
        },
      })

      const recon = await db.reconciliation.create({
        data: {
          schoolId,
          transactionId: txn.id,
          settlementId: newSettlementId,
          status: newStatus,
          matchedBy: user.id,
          note,
        },
      })

      return { transaction: updated, reconciliation: recon }
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT', 'ACCOUNTANT'] }
  )
}
