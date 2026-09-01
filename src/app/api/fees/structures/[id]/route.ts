import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

/// GET /api/fees/structures/[id] — full structure with heads + versions.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { id } = await params
    const structure = await db.feeStructure.findFirst({
      where: { id, schoolId },
      include: {
        heads: { orderBy: { sortOrder: 'asc' } },
        versions: { orderBy: { version: 'desc' } },
      },
    })
    if (!structure) throw new Error('NOT_FOUND')
    return structure
  })
}

/// PATCH /api/fees/structures/[id] — amend a DRAFT or ARCHIVED structure
/// (current structures must be archived first; the publish endpoint creates
/// a new version). Body: { className?, classLevel?, heads?: [{id?, catalogueId, name, amount, frequency, mandatory, category, active}] }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params
      const body = await req.json().catch(() => ({}))
      const structure = await db.feeStructure.findFirst({ where: { id, schoolId } })
      if (!structure) throw new Error('NOT_FOUND')
      if (structure.status === 'current') {
        throw new Error('Cannot edit a published structure. Archive it first or publish a new version.')
      }

      // If heads array provided, replace line items (only valid in draft).
      if (Array.isArray(body.heads)) {
        await db.feeHead.deleteMany({ where: { structureId: id } })
        for (let i = 0; i < body.heads.length; i++) {
          const h = body.heads[i]
          await db.feeHead.create({
            data: {
              schoolId,
              structureId: id,
              catalogueId: h.catalogueId || null,
              name: String(h.name || ''),
              category: String(h.category || 'Other'),
              amount: Number(h.amount) || 0,
              frequency: String(h.frequency || 'Monthly'),
              mandatory: h.mandatory !== false,
              active: h.active !== false,
              sortOrder: i,
            },
          })
        }
      }

      const updated = await db.feeStructure.update({
        where: { id },
        data: {
          ...(body.className ? { className: String(body.className) } : {}),
          ...(body.classLevel ? { classLevel: String(body.classLevel) } : {}),
        },
        include: { heads: { orderBy: { sortOrder: 'asc' } } },
      })
      return updated
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}

/// DELETE /api/fees/structures/[id] — only DRAFT structures can be deleted.
/// Current/archived/scheduled are soft-deleted (status set to 'archived'
/// with archivedAt + archivedReason) for audit integrity.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params
      const { searchParams } = new URL(req.url)
      const reason = searchParams.get('reason') || 'No reason provided'
      const structure = await db.feeStructure.findFirst({ where: { id, schoolId } })
      if (!structure) throw new Error('NOT_FOUND')

      if (structure.status === 'draft') {
        await db.feeStructure.delete({ where: { id } })
        return { ok: true, deleted: true }
      }
      // Otherwise soft-delete (archive).
      await db.feeStructure.update({
        where: { id },
        data: {
          status: 'archived',
          archivedAt: new Date(),
          archivedReason: reason,
        },
      })
      return { ok: true, archived: true }
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
