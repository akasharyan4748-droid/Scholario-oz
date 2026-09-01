import { NextRequest } from 'next/server'
import { getSessionToken, destroySession, clearSessionCookie } from '@/lib/auth'
import { api } from '@/lib/api'

export const runtime = 'nodejs'

export async function POST(_req: NextRequest) {
  return api(async () => {
    const token = await getSessionToken()
    if (token) await destroySession(token)
    await clearSessionCookie()
    return { ok: true }
  })
}
