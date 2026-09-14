import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, getCurrentSession, verifyPassword, hashPassword } from '@/lib/auth'
import { api } from '@/lib/api'

export const runtime = 'nodejs'

/**
 * POST /api/auth/change-password
 *
 * Reads the session cookie the same way /api/auth/me does (getCurrentUser),
 * verifies the current password against the DB user's passwordHash with the
 * SAME scrypt hash/verify helpers prisma/seed.ts uses to write password
 * hashes, validates the new password, and updates the record.
 *
 * SS-1 hardening: a successful change also revokes every OTHER session for
 * the account (standard practice — other signed-in devices must re-enter
 * the new password) and writes an ActivityLog audit row.
 */
export async function POST(req: NextRequest) {
  return api(async () => {
    const user = await getCurrentUser()
    if (!user) throw new Error('UNAUTHORIZED')

    const body = await req.json().catch(() => ({}))
    const currentPassword = String(body.currentPassword || '')
    const newPassword = String(body.newPassword || '')
    const confirmPassword = String(body.confirmPassword || '')

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new Error('All three password fields are required')
    }
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters')
    }
    if (newPassword !== confirmPassword) {
      throw new Error('New passwords do not match')
    }

    const dbUser = await db.user.findUnique({ where: { id: user.id } })
    if (!dbUser) throw new Error('Account not found')
    if (!dbUser.passwordHash || !verifyPassword(currentPassword, dbUser.passwordHash)) {
      throw new Error('Current password is incorrect')
    }

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(newPassword) },
    })

    // Revoke every OTHER session (keep this one signed in).
    const current = await getCurrentSession()
    const revoked = await db.session.deleteMany({
      where: { userId: user.id, ...(current ? { token: { not: current.token } } : {}) },
    })

    await db.activityLog.create({
      data: {
        schoolId: user.schoolId ?? null,
        userId: user.id,
        action: 'password_changed',
        detail: `Password updated from ${revoked.count + 1} active session(s); ${revoked.count} other session(s) signed out.`,
      },
    }).catch(() => {})

    return { ok: true, otherSessionsSignedOut: revoked.count }
  })
}
