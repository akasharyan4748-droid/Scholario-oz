import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('classId')
    const subjects = await db.subject.findMany({
      where: { schoolId, ...(classId ? { classId } : {}) },
      orderBy: { name: 'asc' },
    })
    return subjects
  })
}

export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      const name = String(body.name || '').trim()
      const code = String(body.code || '').trim().toUpperCase()
      if (!name || !code) throw new Error('Name and code required')
      const s = await db.subject.create({
        data: {
          schoolId,
          classId: body.classId || null,
          name,
          code,
          fullMarks: Number(body.fullMarks) || 100,
          passMarks: Number(body.passMarks) || 33,
        },
      })
      return s
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT', 'TEACHER'] }
  )
}
