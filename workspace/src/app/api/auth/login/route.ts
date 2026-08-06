import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSession, setSessionCookie } from '@/lib/auth'
import { api } from '@/lib/api'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  return api(async () => {
    const body = await req.json().catch(() => ({}))
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    if (!email || !password) throw new Error('Email and password are required')

    const user = await db.user.findUnique({
      where: { email },
      include: { school: true },
    })
    if (!user) throw new Error('Invalid email or password')
    if (user.status !== 'ACTIVE') throw new Error('Account is not active')
    if (!verifyPassword(password, user.passwordHash)) throw new Error('Invalid email or password')

    const token = await createSession(user.id)
    await setSessionCookie(token)

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      schoolId: user.schoolId,
      school: user.school
        ? {
            id: user.school.id,
            name: user.school.name,
            slug: user.school.slug,
            code: user.school.code,
            themeColor: user.school.themeColor,
            accentColor: user.school.accentColor,
            logoUrl: user.school.logoUrl,
            academicYear: user.school.academicYear,
            plan: user.school.plan,
          }
        : null,
    }
  })
}
