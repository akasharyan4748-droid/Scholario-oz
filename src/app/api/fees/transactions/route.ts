import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

/// GET /api/fees/transactions?status=SUCCESS&from=2025-04-01&to=2025-04-30&recon=unreconciled
/// Returns paginated, filtered fee transactions.
export async function GET(req: NextRequest) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const recon = searchParams.get('recon')
    const method = searchParams.get('method')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const limit = Math.min(500, Number(searchParams.get('limit') || 200))

    const where: any = { schoolId }
    if (status) where.status = status
    if (recon) where.reconciliationStatus = recon
    if (method) where.method = method
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      }
    }

    const transactions = await db.feeTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        settlement: { select: { id: true, payoutId: true, status: true, periodStart: true, periodEnd: true } },
      },
    })
    return transactions
  })
}

/// POST /api/fees/transactions — record a manual (offline) payment as a
/// FeeTransaction row. (Online payments are recorded by the webhook route
/// after gateway callback.)
///
/// Body: { studentId?, studentName?, className?, feeHeadName?, amount, method,
///         note?, receiptNo? }
/// Returns the created transaction.
export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      const amount = Number(body.amount)
      if (!amount || amount <= 0) throw new Error('amount must be > 0')

      const receiptNo = body.receiptNo || `RCP-${Date.now()}`
      const txn = await db.feeTransaction.create({
        data: {
          schoolId,
          studentId: body.studentId ? String(body.studentId) : null,
          studentName: body.studentName ? String(body.studentName) : null,
          className: body.className ? String(body.className) : null,
          feeHeadName: body.feeHeadName ? String(body.feeHeadName) : null,
          amount,
          method: String(body.method || 'Cash').toUpperCase().replace(' ', '_'),
          status: 'SUCCESS',
          gatewayName: 'manual',
          receiptNo,
          note: body.note ? String(body.note) : null,
          reconciliationStatus: 'unreconciled',
          reconciledAt: null,
          reconciledBy: user.id,
        },
      })
      return txn
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
