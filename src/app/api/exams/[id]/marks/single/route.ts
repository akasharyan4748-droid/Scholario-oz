import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { setMark } from '@/lib/exams/service'

export const runtime = 'nodejs'

// POST /api/exams/[id]/marks/single  body: { classId, subjectId, studentId, marksObtained, status, remarks? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params
      const body = await req.json().catch(() => ({}))
      const mark = await setMark(id, schoolId, user, {
        classId: body.classId,
        subjectId: body.subjectId,
        studentId: body.studentId,
        marksObtained: body.marksObtained ?? null,
        status: body.status ?? 'PRESENT',
        remarks: body.remarks,
      })
      return mark
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT', 'TEACHER'] }
  )
}
