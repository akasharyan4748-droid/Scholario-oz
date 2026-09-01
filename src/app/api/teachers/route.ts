import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

export async function GET() {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const teachers = await db.teacher.findMany({
      where: { schoolId },
      include: { user: { select: { name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return teachers
  })
}

export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      const name = String(body.name || '').trim()
      const email = String(body.email || '').trim().toLowerCase()
      if (!name || !email) throw new Error('Name and email are required')
      const exists = await db.user.findUnique({ where: { email } })
      if (exists) throw new Error('Email already in use')
      const password = String(body.password || 'password123')
      const empId = String(body.employeeId || `EMP-${Date.now()}`)
      const u = await db.user.create({
        data: {
          schoolId,
          email,
          passwordHash: hashPassword(password),
          name,
          role: 'TEACHER',
          phone: body.phone || null,
          status: 'ACTIVE',
        },
      })
      const t = await db.teacher.create({
        data: {
          schoolId,
          userId: u.id,
          employeeId: empId,
          department: body.department || null,
          qualification: body.qualification || null,
          subjects: body.subjects || null,
        },
        include: { user: { select: { name: true, email: true } } },
      })
      return t
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
