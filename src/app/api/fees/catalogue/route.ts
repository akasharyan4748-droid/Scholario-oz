import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

/// GET /api/fees/catalogue — list all master fee heads.
export async function GET() {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const heads = await db.masterFeeHead.findMany({
      where: { schoolId },
      include: {
        _count: { select: { structures: true } },
      },
      orderBy: { sortOrder: 'asc' },
    })
    return heads
  })
}

/// POST /api/fees/catalogue — create a new master fee head.
/// Body: { name, category, frequency, amount, mandatory, description }
export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      const name = String(body.name || '').trim()
      if (!name) throw new Error('name is required')
      const dup = await db.masterFeeHead.findUnique({
        where: { schoolId_name: { schoolId, name } },
      }).catch(() => null)
      if (dup) throw new Error('A master fee head with this name already exists')

      const maxOrder = await db.masterFeeHead.aggregate({
        where: { schoolId },
        _max: { sortOrder: true },
      })
      const head = await db.masterFeeHead.create({
        data: {
          schoolId,
          name,
          category: String(body.category || 'Other'),
          frequency: String(body.frequency || 'Monthly'),
          amount: Number(body.amount) || 0,
          mandatory: body.mandatory !== false,
          description: body.description ? String(body.description) : null,
          sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
        },
      })
      return head
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}

/// PATCH /api/fees/catalogue?id=xxx — update a master fee head.
/// Body: { name?, category?, frequency?, amount?, mandatory?, active?, description? }
export async function PATCH(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { searchParams } = new URL(req.url)
      const id = searchParams.get('id')
      if (!id) throw new Error('id query param is required')
      const existing = await db.masterFeeHead.findFirst({ where: { id, schoolId } })
      if (!existing) throw new Error('NOT_FOUND')
      const body = await req.json().catch(() => ({}))

      // If renaming, refuse if the new name collides with another entry.
      if (body.name && body.name !== existing.name) {
        const newName = String(body.name).trim()
        const collision = await db.masterFeeHead.findUnique({
          where: { schoolId_name: { schoolId, name: newName } },
        }).catch(() => null)
        if (collision) throw new Error('Another master fee head with this name already exists')
      }

      const updated = await db.masterFeeHead.update({
        where: { id },
        data: {
          ...(body.name ? { name: String(body.name).trim() } : {}),
          ...(body.category ? { category: String(body.category) } : {}),
          ...(body.frequency ? { frequency: String(body.frequency) } : {}),
          ...(body.amount !== undefined ? { amount: Number(body.amount) } : {}),
          ...(body.mandatory !== undefined ? { mandatory: body.mandatory } : {}),
          ...(body.active !== undefined ? { active: body.active } : {}),
          ...(body.description !== undefined ? { description: body.description ? String(body.description) : null } : {}),
        },
      })
      return updated
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
