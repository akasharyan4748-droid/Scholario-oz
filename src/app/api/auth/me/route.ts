import { getCurrentUser, getCurrentSession, parseUserAgent } from '@/lib/auth'
import { api } from '@/lib/api'

export const runtime = 'nodejs'

/**
 * GET /api/auth/me
 *
 * Session identity (server truth) for the shell + Settings. SS-1 adds the
 * CURRENT session's context (started/expires/device) — never the token —
 * and the account's lastLoginAt so Login & Security can render real
 * sign-in information instead of fabricating it.
 */
export async function GET() {
  return api(async () => {
    const user = await getCurrentUser()
    if (!user) throw new Error('UNAUTHORIZED')

    const session = await getCurrentSession()
    const ua = parseUserAgent(session?.userAgent ?? null)

    return {
      user,
      session: session
        ? {
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
            userAgent: session.userAgent,
            ipAddress: session.ipAddress,
            device: ua,
          }
        : null,
      lastLoginAt: await getLastLoginAt(user.id),
    }
  })
}

async function getLastLoginAt(userId: string) {
  const { db } = await import('@/lib/db')
  const row = await db.user.findUnique({
    where: { id: userId },
    select: { lastLoginAt: true },
  })
  return row?.lastLoginAt ?? null
}
