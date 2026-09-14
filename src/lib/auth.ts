import { db } from './db'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'

// Lightweight password hashing using Node's scrypt (no external deps)
import { scryptSync, timingSafeEqual } from 'crypto'

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const hashBuf = Buffer.from(hash, 'hex')
  const testBuf = scryptSync(password, salt, 64)
  if (hashBuf.length !== testBuf.length) return false
  return timingSafeEqual(hashBuf, testBuf)
}

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export const SESSION_COOKIE = 'erp_session'
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

export async function createSession(
  userId: string,
  meta?: { userAgent?: string | null; ipAddress?: string | null },
): Promise<string> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
      // SS-1 — device context for Settings → Devices (nullable: older
      // sessions honestly render as "unknown device").
      userAgent: meta?.userAgent?.slice(0, 400) ?? null,
      ipAddress: meta?.ipAddress?.slice(0, 60) ?? null,
    },
  })
  await db.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  })
  return token
}

export async function destroySession(token: string): Promise<void> {
  await db.session.deleteMany({ where: { token } }).catch(() => {})
}

export async function setSessionCookie(token: string) {
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getSessionToken(): Promise<string | undefined> {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value
}

/** SS-1 — the caller's Session row (token never leaves the server; the
 *  id/createdAt/expiresAt/device metadata shape what Settings renders). */
export async function getCurrentSession() {
  const token = await getSessionToken()
  if (!token) return null
  const session = await db.session.findUnique({ where: { token } })
  if (!session) return null
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }
  return session
}

/** SS-1 — light UA parser for the Devices list. Best-effort labels; never
 *  a fingerprint. Unknown UAs render as "Unknown device" downstream. */
export function parseUserAgent(ua: string | null | undefined): {
  browser: string
  os: string
  device: 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown'
} {
  if (!ua) return { browser: 'Unknown browser', os: 'Unknown OS', device: 'Unknown' }
  const s = ua.toLowerCase()

  const device: 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown' = /ipad|tablet|playbook|silk/.test(s)
    ? 'Tablet'
    : /mobi|iphone|android.*mobile|windows phone/.test(s)
      ? 'Mobile'
      : /android/.test(s)
        ? 'Tablet'
        : /windows|macintosh|mac os|cros|linux/.test(s)
          ? 'Desktop'
          : 'Unknown'

  const browser =
    /edg\//.test(s) ? 'Edge'
    : /opr\//.test(s) ? 'Opera'
    : /chrome|crios/.test(s) && !/edg\//.test(s) ? 'Chrome'
    : /firefox|fxios/.test(s) ? 'Firefox'
    : /safari/.test(s) && !/chrome/.test(s) ? 'Safari'
    : 'Unknown browser'

  const os =
    /windows/.test(s) ? 'Windows'
    : /iphone|ipad|ipod|ios/.test(s) ? 'iOS'
    : /mac os|macintosh/.test(s) ? 'macOS'
    : /android/.test(s) ? 'Android'
    : /cros/.test(s) ? 'ChromeOS'
    : /linux/.test(s) ? 'Linux'
    : 'Unknown OS'

  return { browser, os, device }
}

export type AuthUser = {
  id: string
  email: string
  name: string
  role: string
  schoolId: string | null
  avatarUrl: string | null
  phone: string | null
  status: string
  school?: {
    id: string
    name: string
    slug: string
    code: string
    themeColor: string
    accentColor: string
    logoUrl: string | null
    academicYear: string
    plan: string
  } | null
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getSessionToken()
  if (!token) return null
  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: { include: { school: true } },
    },
  })
  if (!session) return null
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }
  const u = session.user
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? '',
    role: u.role,
    schoolId: u.schoolId,
    avatarUrl: u.avatarUrl,
    phone: u.phone,
    status: u.status,
    school: u.school
      ? {
          id: u.school.id,
          name: u.school.name,
          slug: u.school.slug,
          code: u.school.code,
          themeColor: u.school.themeColor,
          accentColor: u.school.accentColor,
          logoUrl: u.school.logoUrl,
          academicYear: u.school.academicYear ?? '',
          plan: u.school.plan,
        }
      : null,
  }
}

export function requireUser(user: AuthUser | null): AuthUser {
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}

export function requireRole(user: AuthUser | null, ...roles: string[]): AuthUser {
  const u = requireUser(user)
  if (!roles.includes(u.role)) throw new Error('FORBIDDEN')
  return u
}
