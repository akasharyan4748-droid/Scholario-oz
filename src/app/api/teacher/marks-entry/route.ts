import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'
import { classLabelOf } from '@/lib/teacher-hub'

export const runtime = 'nodejs'

/**
 * GET /api/teacher/marks-entry — exams this teacher can enter marks for:
 * every exam with an ExamClass for one of her classes, restricted to the
 * subjects she actually teaches. The picker source for the module.
 */
export async function GET() {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const teacherName = (user.name || '').trim().toLowerCase()

      // The teacher's (class, subject) teaching assignments.
      const ttRows = teacherName
        ? await db.timetable.findMany({
            where: { schoolId, teacherName: { not: null } },
            select: {
              classId: true,
              subjectId: true,
              teacherName: true,
              class: { select: { name: true, section: true } },
            },
          })
        : []
      const mine = new Set(
        ttRows
          .filter((r) => (r.teacherName || '').trim().toLowerCase() === teacherName && r.subjectId)
          .map((r) => `${r.classId}|${r.subjectId}`)
      )
      const classLabels = new Map(ttRows.map((r) => [r.classId, r.class]))

      const examClasses = await db.examClass.findMany({
        where: { exam: { schoolId } },
        include: {
          exam: { select: { id: true, name: true, type: true, status: true, resultStatus: true, startDate: true, endDate: true } },
        },
      })
      const configs = await db.examSubjectConfig.findMany({
        where: { exam: { schoolId } },
        include: { subject: { select: { name: true } } },
      })
      const configByKey = new Map(configs.map((c) => [`${c.examId}|${c.classId}|${c.subjectId}`, c]))

      const examMap = new Map<
        string,
        {
          id: string
          name: string
          type: string
          status: string
          resultStatus: string
          dateLabel: string
          classes: {
            classId: string
            label: string
            subjects: { id: string; name: string; maxMarks: number; passMarks: number }[]
          }[]
        }
      >()

      for (const ec of examClasses) {
        const label = classLabels.get(ec.classId)
        const clsLabel = label ? classLabelOf(label) : 'Class'
        const subjects = configs
          .filter((c) => c.examId === ec.examId && c.classId === ec.classId && mine.has(`${ec.classId}|${c.subjectId}`))
          .sort((a, b) => a.subject.name.localeCompare(b.subject.name))
          .map((c) => ({ id: c.subjectId, name: c.subject.name, maxMarks: c.maxMarks, passMarks: Math.round(c.passMarks) }))
        if (subjects.length === 0) continue

        let exam = examMap.get(ec.examId)
        if (!exam) {
          const e = ec.exam
          const fmt = (d: Date | null) => (d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '')
          exam = {
            id: e.id,
            name: e.name,
            type: e.type,
            status: e.status,
            resultStatus: e.resultStatus,
            dateLabel: [fmt(e.startDate), fmt(e.endDate)].filter(Boolean).join(' – '),
            classes: [],
          }
          examMap.set(ec.examId, exam)
        }
        exam.classes.push({ classId: ec.classId, label: clsLabel, subjects })
      }

      return { exams: [...examMap.values()] }
    },
    { roles: ['TEACHER'] }
  )
}
