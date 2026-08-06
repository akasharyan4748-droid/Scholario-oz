import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { searchParams } = new URL(req.url)
    const examId = searchParams.get('examId')
    const studentId = searchParams.get('studentId')
    const results = await db.result.findMany({
      where: {
        exam: { schoolId },
        ...(examId ? { examId } : {}),
        ...(studentId ? { studentId } : {}),
      },
      include: { subject: true, exam: true, student: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
    return results
  })
}

export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = await req.json().catch(() => ({}))
      const entries: Array<{ studentId: string; subjectId: string; marks: number; totalMarks?: number }> = body.entries || []
      if (!entries.length) throw new Error('entries[] required')
      const created = await db.$transaction(
        entries.map((e) =>
          db.result.create({
            data: {
              studentId: e.studentId,
              examId: body.examId || null,
              subjectId: e.subjectId,
              marks: Number(e.marks),
              totalMarks: Number(e.totalMarks) || 100,
              grade: gradeFor(Number(e.marks), Number(e.totalMarks) || 100),
              remarks: body.remarks || null,
            },
          })
        )
      )
      await db.activityLog.create({
        data: { schoolId, userId: user.id, action: 'RESULTS_PUBLISHED', detail: `${entries.length} result(s) published` },
      })
      return { count: created.length }
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT', 'TEACHER'] }
  )
}

function gradeFor(marks: number, total: number): string {
  const pct = (marks / total) * 100
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B+'
  if (pct >= 60) return 'B'
  if (pct >= 50) return 'C'
  if (pct >= 33) return 'D'
  return 'F'
}
