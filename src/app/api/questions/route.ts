import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { searchParams } = new URL(req.url)
    const subjectId = searchParams.get('subjectId')
    const classId = searchParams.get('classId')
    const difficulty = searchParams.get('difficulty')
    const questions = await db.questionBank.findMany({
      where: {
        schoolId,
        ...(subjectId ? { subjectId } : {}),
        ...(classId ? { classId } : {}),
        ...(difficulty ? { difficulty } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
    return questions
  })
}

export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      const question = String(body.question || '').trim()
      if (!question) throw new Error('Question text required')
      const q = await db.questionBank.create({
        data: {
          schoolId,
          subjectId: body.subjectId || null,
          classId: body.classId || null,
          question,
          optionA: body.optionA || null,
          optionB: body.optionB || null,
          optionC: body.optionC || null,
          optionD: body.optionD || null,
          answer: body.answer || '',
          type: body.type || 'MCQ',
          difficulty: body.difficulty || 'MEDIUM',
          marks: Number(body.marks) || 1,
        },
      })
      return q
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT', 'TEACHER'] }
  )
}

export async function DELETE(req: NextRequest) {
  return withUser(
    async () => {
      const { searchParams } = new URL(req.url)
      const id = searchParams.get('id')
      if (!id) throw new Error('id required')
      await db.questionBank.delete({ where: { id } })
      return { id }
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT', 'TEACHER'] }
  )
}
