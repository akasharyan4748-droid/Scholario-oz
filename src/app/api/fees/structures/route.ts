import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

/// GET /api/fees/structures?status=current&classId=C12
/// Returns all fee structures for the school, optionally filtered.
/// Includes heads + catalogue entries.
export async function GET(req: NextRequest) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const classId = searchParams.get('classId')
    const structures = await db.feeStructure.findMany({
      where: {
        schoolId,
        ...(status ? { status } : {}),
        ...(classId ? { classId } : {}),
      },
      include: {
        heads: { orderBy: { sortOrder: 'asc' } },
        versions: { orderBy: { version: 'desc' }, take: 5 },
        _count: { select: { transactions: true } },
      },
      orderBy: [{ classLevel: 'asc' }, { className: 'asc' }],
    })
    return structures
  })
}

/// POST /api/fees/structures
/// Create a new draft fee structure for a class. Requires PRINCIPAL/MANAGEMENT.
/// Body: { classId, className, classLevel, heads: [{catalogueId, name, amount, frequency, mandatory, category}] }
export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      const classId = String(body.classId || '')
      const className = String(body.className || '')
      const classLevel = String(body.classLevel || 'Primary')
      const heads = Array.isArray(body.heads) ? body.heads : []
      if (!classId || !className) throw new Error('classId and className are required')

      // If a current structure already exists for this class, refuse — the
      // principal must archive or amend instead. Drafts/scheduled are allowed
      // (the @@unique constraint allows one per status per class).
      const existing = await db.feeStructure.findUnique({
        where: { schoolId_classId_status: { schoolId, classId, status: 'current' } },
      }).catch(() => null)
      if (existing) throw new Error('A current structure already exists for this class. Archive it first.')

      const structure = await db.feeStructure.create({
        data: {
          schoolId,
          classId,
          className,
          classLevel,
          status: 'draft',
          version: 1,
          heads: {
            create: heads.map((h: any, i: number) => ({
              schoolId,
              catalogueId: h.catalogueId || null,
              name: String(h.name || ''),
              category: String(h.category || 'Other'),
              amount: Number(h.amount) || 0,
              frequency: String(h.frequency || 'Monthly'),
              mandatory: h.mandatory !== false,
              active: true,
              sortOrder: i,
            })),
          },
        },
        include: { heads: { orderBy: { sortOrder: 'asc' } } },
      })
      return structure
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
