import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const status = searchParams.get('status')
    const fees = await db.fee.findMany({
      where: { schoolId, ...(studentId ? { studentId } : {}), ...(status ? { status } : {}) },
      include: { student: { include: { user: { select: { name: true } } } }, payments: true },
      orderBy: { createdAt: 'desc' },
      take: 300,
    })
    return fees
  })
}

export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))

      // record a payment on an existing fee
      if (body.feeId && body.amount) {
        const fee = await db.fee.findUnique({ where: { id: body.feeId } })
        if (!fee || fee.schoolId !== schoolId) throw new Error('NOT_FOUND')
        const amount = Number(body.amount)
        const newPaid = fee.paid + amount
        const status = newPaid >= fee.amount ? 'PAID' : newPaid > 0 ? 'PARTIAL' : fee.status
        await db.$transaction([
          db.payment.create({ data: { feeId: fee.id, amount, method: body.method || 'CASH', note: body.note || null } }),
          db.fee.update({
            where: { id: fee.id },
            data: { paid: newPaid, status, method: body.method || fee.method, paidDate: new Date() },
          }),
        ])
        return { ok: true, feeId: fee.id, paid: newPaid, status }
      }

      // create a new fee
      const studentId = body.studentId
      const amount = Number(body.amount)
      if (!studentId || !amount) throw new Error('studentId and amount required')
      const fee = await db.fee.create({
        data: {
          schoolId,
          studentId,
          title: body.title || 'Fee',
          amount,
          paid: 0,
          type: body.type || 'TUITION',
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          status: 'UNPAID',
        },
      })
      return fee
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
