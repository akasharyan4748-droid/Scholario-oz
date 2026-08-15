import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { markExamAttendance, getExamAttendance, autoMarkAttendanceFromExamMarks } from '@/lib/exams/service-extended'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { id } = await params
    const url = new URL(req.url)
    const classId = url.searchParams.get('classId')
    const attendance = await getExamAttendance(id, classId, schoolId)
    return attendance
  })
}

// POST /api/exams/[id]/attendance  body: { scheduleItemId?, classId, studentId, subjectId?, date, status, remarks? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params
      const body = await req.json().catch(() => ({}))
      const result = await markExamAttendance(id, schoolId, user, {
        scheduleItemId: body.scheduleItemId,
        classId: body.classId,
        studentId: body.studentId,
        subjectId: body.subjectId,
        date: body.date,
        status: body.status ?? 'PRESENT',
        remarks: body.remarks,
      })
      return result
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT', 'TEACHER'] }
  )
}
