import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'
import { classLabelOf } from '@/lib/teacher-hub'

export const runtime = 'nodejs'

/**
 * GET /api/teacher/marks-entry/grid?examId=&classId=&subjectId= — the
 * marks-entry grid for one exam × class × subject the teacher teaches:
 * roster, existing marks (DRAFT or SUBMITTED), max/pass marks and
 * grade-band derivation from the school's GradeScale.
 */
export async function GET(request: Request) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const url = new URL(request.url)
      const examId = url.searchParams.get('examId')
      const classId = url.searchParams.get('classId')
      const subjectId = url.searchParams.get('subjectId')
      if (!examId || !classId || !subjectId) throw new Error('examId, classId and subjectId are required')

      const teacherName = (user.name || '').trim().toLowerCase()
      const ttRow = await db.timetable.findFirst({
        where: { schoolId, classId, subjectId, teacherName: { not: null } },
      })
      const teaches = ttRow && (ttRow.teacherName || '').trim().toLowerCase() === teacherName
      if (!teaches) throw new Error('FORBIDDEN')

      const config = await db.examSubjectConfig.findFirst({
        where: { examId, classId, subjectId, exam: { schoolId } },
      })
      if (!config) throw new Error('NOT_FOUND')

      const exam = await db.exam.findUnique({
        where: { id: examId },
        select: { schoolId: true, name: true, type: true, resultStatus: true },
      })
      if (!exam || exam.schoolId !== schoolId) throw new Error('NOT_FOUND')
      const cls = await db.class.findUnique({ where: { id: classId }, select: { name: true, section: true } })
      const subject = await db.subject.findUnique({ where: { id: subjectId }, select: { name: true } })

      const students = await db.student.findMany({
        where: { classId, user: { status: 'ACTIVE' } },
        select: { id: true, rollNo: true, user: { select: { name: true } } },
        orderBy: { rollNo: 'asc' },
      })
      const marks = await db.examMark.findMany({ where: { examId, classId, subjectId } })
      const markByStudent = new Map(marks.map((m) => [m.studentId, m]))

      const gradeScale = await db.gradeScale.findMany({
        where: { schoolId },
        select: { grade: true, minPct: true },
        orderBy: { minPct: 'desc' },
      })
      const gradeFor = (pct: number): string => {
        for (const g of gradeScale) {
          if (pct >= g.minPct) return g.grade
        }
        return gradeScale.length > 0 ? gradeScale[gradeScale.length - 1].grade : pct >= 33 ? 'C' : 'F'
      }

      return {
        exam: { id: examId, name: exam.name, type: exam.type, resultStatus: exam.resultStatus },
        classId,
        label: cls ? classLabelOf(cls) : 'Class',
        subjectName: subject?.name ?? 'Subject',
        maxMarks: config.maxMarks,
        passMarks: Math.round(config.passMarks),
        students: students.map((s) => {
          const m = markByStudent.get(s.id)
          const pct = m?.marksObtained != null ? (m.marksObtained / config.maxMarks) * 100 : null
          return {
            id: s.id,
            rollNo: s.rollNo,
            name: s.user?.name ?? 'Student',
            marks: m?.marksObtained ?? null,
            remarks: m?.remarks ?? null,
            workflowStatus: m ? m.workflowStatus : null,
            grade: pct != null ? gradeFor(pct) : null,
            passed: pct != null ? m!.marksObtained! >= config.passMarks : null,
          }
        }),
        // ANY submitted row means the sheet was submitted — the whole grid
        // locks (rows for students without marks included).
        submitted: marks.some((m) => m.workflowStatus === 'SUBMITTED'),
      }
    },
    { roles: ['TEACHER'] }
  )
}
