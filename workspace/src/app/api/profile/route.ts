import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'

export const runtime = 'nodejs'

export async function PUT(req: NextRequest) {
  return withUser(async (user) => {
    const body = await req.json().catch(() => ({}))

    const name = String(body.name || '').trim()
    const phone = body.phone !== undefined ? String(body.phone).trim() || null : undefined

    if (!name) throw new Error('Name cannot be empty')

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        name,
        ...(phone !== undefined ? { phone } : {}),
      },
      select: { id: true, name: true, email: true, phone: true },
    })

    return updated
  })
}
