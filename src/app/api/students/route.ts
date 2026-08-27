import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('classId')
    const q = searchParams.get('q')
    const students = await db.student.findMany({
      where: {
        schoolId,
        ...(classId ? { classId } : {}),
        ...(q
          ? { OR: [{ user: { name: { contains: q } } }, { admissionNo: { contains: q } }] }
          : {}),
      },
      include: { class: true, user: { select: { name: true, email: true, phone: true } }, route: true },
      orderBy: { rollNo: 'asc' },
      take: 200,
    })
    return students
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
      const admNo = String(body.admissionNo || `ADM-${Date.now()}`)
      const u = await db.user.create({
        data: {
          schoolId,
          email,
          passwordHash: hashPassword(password),
          name,
          role: 'STUDENT',
          phone: body.phone || null,
          status: 'ACTIVE',
        },
      })
      const s = await db.student.create({
        data: {
          schoolId,
          userId: u.id,
          classId: body.classId || null,
          rollNo: body.rollNo || null,
          admissionNo: admNo,
          guardianName: body.guardianName || null,
          guardianPhone: body.guardianPhone || null,
          dob: body.dob || null,
          gender: body.gender || null,
          bloodGroup: body.bloodGroup || null,
          address: body.address || null,
          routeId: body.routeId || null,
        },
        include: { class: true, user: { select: { name: true, email: true } } },
      })
      return s
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
