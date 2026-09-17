import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'

export const runtime = 'nodejs'

interface SubmitBody {
  examId?: string
  classId?: string
  subjectId?: string
}

/**
 * POST /api/teacher/marks-entry/submit — submit the teacher's marks for
 * one exam × class × subject (DRAFT → SUBMITTED). Every entered mark is
 * re-validated against the configured maximum before submission; a
 * submission with zero entered marks is rejected.
 */
export async function POST(request: Request) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = (await request.json().catch(() => null)) as SubmitBody | null
      if (!body?.examId || !body?.classId || !body?.subjectId) {
        throw new Error('examId, classId and subjectId are required')
      }

      const teacherName = (user.name || '').trim().toLowerCase()
      const ttRow = await db.timetable.findFirst({
        where: { schoolId, classId: body.classId, subjectId: body.subjectId, teacherName: { not: null } },
      })
      if (!ttRow || (ttRow.teacherName || '').trim().toLowerCase() !== teacherName) {
        throw new Error('FORBIDDEN')
      }

      const config = await db.examSubjectConfig.findFirst({
        where: { examId: body.examId, classId: body.classId, subjectId: body.subjectId, exam: { schoolId } },
      })
      if (!config) throw new Error('NOT_FOUND')

      const marks = await db.examMark.findMany({
        where: { examId: body.examId, classId: body.classId, subjectId: body.subjectId },
      })
      const entered = marks.filter((m) => m.marksObtained != null)
      if (entered.length === 0) throw new Error('Enter marks before submitting')
      for (const m of entered) {
        if (m.marksObtained! < 0 || m.marksObtained! > config.maxMarks) {
          throw new Error(`Marks must be between 0 and ${config.maxMarks}`)
        }
      }

      const result = await db.examMark.updateMany({
        where: { examId: body.examId, classId: body.classId, subjectId: body.subjectId, workflowStatus: 'DRAFT' },
        data: { workflowStatus: 'SUBMITTED', verifiedBy: user.name ?? 'Teacher' },
      })
      return { submitted: result.count }
    },
    { roles: ['TEACHER'] }
  )
}
