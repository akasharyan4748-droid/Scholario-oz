import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

/// GET /api/student/payments/receipt/[txnId]
///
/// Receipt re-download: returns the FeeTransaction row for a payment
/// the SESSION student made at this school (RLS on both schoolId and
/// studentId — the id is never trusted from the URL alone).
///
/// 404 NOT_FOUND when the transaction doesn't exist; FORBIDDEN when it
/// belongs to another school or another student.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ txnId: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { txnId } = await params

      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        include: { student: { select: { id: true } } },
      })
      const studentId = dbUser?.student?.id
      if (!studentId) throw new Error('NO_STUDENT_RECORD')

      const txn = await db.feeTransaction.findUnique({ where: { id: txnId } })
      if (!txn) throw new Error('NOT_FOUND')
      if (txn.schoolId !== schoolId || txn.studentId !== studentId) throw new Error('FORBIDDEN')

      return txn
    },
    { roles: ['STUDENT'] }
  )
}
