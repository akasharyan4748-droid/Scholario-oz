import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { searchParams } = new URL(req.url)
    const withCounts = searchParams.get('counts') === '1'
    const classes = await db.class.findMany({
      where: { schoolId },
      orderBy: { gradeLevel: 'asc' },
      include: withCounts
        ? { _count: { select: { students: true, subjects: true } } }
        : undefined,
    })
    return classes
  })
}

export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      const name = String(body.name || '').trim()
      if (!name) throw new Error('Class name is required')
      const cls = await db.class.create({
        data: {
          schoolId,
          name,
          gradeLevel: String(body.gradeLevel || ''),
          section: body.section || null,
          capacity: Number(body.capacity) || 40,
          room: body.room || null,
          classTeacherId: body.classTeacherId || null,
        },
      })
      return cls
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT'] }
  )
}
