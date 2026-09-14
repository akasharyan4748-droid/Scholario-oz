import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { api } from '@/lib/api'
import { getUserPreferences, saveUserPreferences } from '@/lib/user-preferences'

export const runtime = 'nodejs'

/**
 * GET /api/student/settings — the signed-in student's preferences.
 * Identity (and school scope) is derived from the erp_session cookie via
 * requireStudent — the same RLS-safe resolver every /api/student/* route
 * uses. A student never sees another student's or another school's rows:
 * the lookup key is the SESSION's user id, full stop.
 */
export async function GET() {
  return api(async () => {
    const user = await getCurrentUser()
    if (!user) throw new Error('UNAUTHORIZED')
    if (user.role !== 'STUDENT') throw new Error('FORBIDDEN')

    return await getUserPreferences(user.id)
  })
}

/**
 * PUT /api/student/settings — persist preference domains.
 * Body: { notifications?: {...booleans}, learning?: {...booleans} }.
 * Values are normalized server-side (unknown keys dropped, non-booleans
 * ignored) — a malformed payload can never poison the stored JSON, and
 * schoolId comes from the session, never the body.
 */
export async function PUT(req: NextRequest) {
  return api(async () => {
    const user = await getCurrentUser()
    if (!user) throw new Error('UNAUTHORIZED')
    if (user.role !== 'STUDENT') throw new Error('FORBIDDEN')
    if (!user.schoolId) throw new Error('NO_SCHOOL')

    const body = await req.json().catch(() => ({}))
    return await saveUserPreferences(user.id, user.schoolId, {
      notifications: body?.notifications,
      learning: body?.learning,
    })
  })
}
