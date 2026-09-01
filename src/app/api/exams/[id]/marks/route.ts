import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { getStudentsForClass, getMarksForSubject } from '@/lib/exams/service'

export const runtime = 'nodejs'

// GET /api/exams/[id]/marks?classId=&subjectId=
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(async (user) => {
    const schoolId = schoolScoped(user)
    const { id } = await params
    const url = new URL(req.url)
    const classId = url.searchParams.get('classId')
    const subjectId = url.searchParams.get('subjectId')
    if (!classId) throw new Error('classId is required')
    const students = await getStudentsForClass(classId, schoolId)
    const marks = subjectId ? await getMarksForSubject(id, classId, subjectId, schoolId) : []
    return { students, marks }
  })
}
