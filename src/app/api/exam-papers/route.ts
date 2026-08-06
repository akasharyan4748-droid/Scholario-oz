import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

// Generate an exam paper from question bank
export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      const title = String(body.title || 'Generated Exam Paper').trim()
      const subjectId = body.subjectId || null
      const classId = body.classId || null
      const count = Math.min(50, Math.max(1, Number(body.count) || 10))
      const difficulties: string[] = body.difficulties?.length ? body.difficulties : ['EASY', 'MEDIUM', 'HARD']
      const duration = Number(body.duration) || 180
      const instructions = body.instructions || 'Read each question carefully. All questions are compulsory.'

      const where = {
        schoolId,
        ...(subjectId ? { subjectId } : {}),
        ...(classId ? { classId } : {}),
        difficulty: { in: difficulties },
      }
      const pool = await db.questionBank.findMany({ where })

      if (pool.length === 0) throw new Error('No questions match the selected filters. Add questions first.')

      // shuffle and pick
      const shuffled = [...pool].sort(() => Math.random() - 0.5)
      const picked = shuffled.slice(0, Math.min(count, shuffled.length))

      const subjectName = picked[0].subjectId
        ? (await db.subject.findUnique({ where: { id: picked[0].subjectId } }))?.name || 'General'
        : 'General'
      const className = classId
        ? (await db.class.findUnique({ where: { id: classId } }))?.name || ''
        : ''

      const totalMarks = picked.reduce((s, q) => s + q.marks, 0)

      const paper = await db.examPaper.create({
        data: {
          schoolId,
          title,
          subjectName,
          className,
          duration,
          totalMarks,
          instructions,
          questions: JSON.stringify(picked),
          createdBy: user.id,
          examId: body.examId || null,
        },
      })

      return { ...paper, questionsList: picked }
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT', 'TEACHER'] }
  )
}

export async function GET() {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const papers = await db.examPaper.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return papers.map((p) => ({ ...p, questionsList: JSON.parse(p.questions) }))
  })
}
