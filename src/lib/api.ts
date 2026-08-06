import { NextResponse } from 'next/server'
import { getCurrentUser, type AuthUser } from './auth'

export type Ctx = { user: AuthUser }

export async function api(handler: () => Promise<unknown>) {
  try {
    const data = await handler()
    return NextResponse.json({ ok: true, data })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal error'
    const code = msg === 'UNAUTHORIZED' ? 401 : msg === 'FORBIDDEN' ? 403 : msg === 'NOT_FOUND' ? 404 : 400
    return NextResponse.json({ ok: false, error: msg }, { status: code })
  }
}

export async function withUser(
  handler: (user: AuthUser) => Promise<unknown>,
  opts?: { roles?: string[] }
) {
  return api(async () => {
    const user = await getCurrentUser()
    if (!user) throw new Error('UNAUTHORIZED')
    if (user.status !== 'ACTIVE') throw new Error('UNAUTHORIZED')
    if (opts?.roles && !opts.roles.includes(user.role)) throw new Error('FORBIDDEN')
    return handler(user)
  })
}

export function schoolScoped(user: AuthUser): string {
  if (user.role === 'SUPER_ADMIN') throw new Error('SUPER_ADMIN has no school scope')
  if (!user.schoolId) throw new Error('NO_SCHOOL')
  return user.schoolId
}

export { getCurrentUser }
