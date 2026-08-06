import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

// List users in the same school that the current user can message
export async function GET(req: NextRequest) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')

    const users = await db.user.findMany({
      where: {
        schoolId,
        id: { not: user.id },
        status: 'ACTIVE',
        ...(q ? { name: { contains: q } } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
      },
      orderBy: { name: 'asc' },
      take: 200,
    })

    // Group by role for easier UI
    const grouped: Record<string, typeof users> = {}
    for (const u of users) {
      const role = u.role
      if (!grouped[role]) grouped[role] = []
      grouped[role].push(u)
    }

    return { users, grouped }
  })
}
