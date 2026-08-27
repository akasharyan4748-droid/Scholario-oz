import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

/// GET /api/fees/settlements — list all gateway settlements for the school.
export async function GET(req: NextRequest) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: any = { schoolId }
    if (status) where.status = status
    if (from || to) {
      where.periodStart = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      }
    }

    const settlements = await db.settlement.findMany({
      where,
      orderBy: { periodStart: 'desc' },
      include: {
        _count: { select: { transactions: true } },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            receiptNo: true,
            studentName: true,
            className: true,
            amount: true,
            method: true,
            status: true,
            reconciliationStatus: true,
            gatewayOrderId: true,
            gatewayPaymentId: true,
            createdAt: true,
          },
        },
      },
      take: 100,
    })
    return settlements
  })
}
