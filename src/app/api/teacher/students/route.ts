import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'
import { classLabelOf } from '@/lib/teacher-hub'

export const runtime = 'nodejs'

/**
 * GET /api/teacher/students — the Student Directory payload: the classes
 * this teacher works with (class-teacher of ∪ teaches a subject in, from
 * the timetable) and every class's real roster with profile fields,
 * attendance derived from the canonical Attendance records, and the latest
 * exam marks for the student's class.
 *
 * PERMISSION MODEL (all server-decided, school-scoped):
 *   · classes — only the ones this teacher is class teacher of or teaches
 *     a subject in (timetable rows carry teacherName, the same permission
 *     source as Lesson Planner / Marks Entry);
 *   · rosters — only ACTIVE students of those classes;
 *   · guardian name/phone — visible to any teacher with an authorized
 *     class (the pre-existing server decision for this route, kept);
 *   · academic performance — the latest exam that has entered marks for
 *     the student's class, per-subject marks + percentage average. Both
 *     DRAFT and SUBMITTED rows count ("marks exist" = marksObtained set);
 *     nothing is fabricated — no exam ⇒ latestExam is null.
 */
export async function GET() {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const teacherName = (user.name || '').trim().toLowerCase()

      // Classes this teacher teaches a subject in (timetable rows carry
      // teacherName — the same permission source as Lesson Planner).
      const ttRows = await db.timetable.findMany({
        where: { schoolId, teacherName: { not: null } },
        select: { classId: true, teacherName: true, subject: { select: { name: true } } },
      })
      const subjectByClass = new Map<string, Set<string>>()
      for (const r of ttRows) {
        if ((r.teacherName || '').trim().toLowerCase() !== teacherName) continue
        const set = subjectByClass.get(r.classId) ?? new Set<string>()
        if (r.subject?.name) set.add(r.subject.name)
        subjectByClass.set(r.classId, set)
      }

      // Classes where this teacher is class teacher.
      const classTeacherOf = await db.class.findMany({
        where: { schoolId, classTeacherId: user.id },
        select: { id: true },
      })
      const classTeacherIds = new Set(classTeacherOf.map((c) => c.id))

      const classIds = new Set<string>([...subjectByClass.keys(), ...classTeacherIds])
      if (classIds.size === 0) {
        return { classes: [], studentsByClass: {} }
      }

      const classes = await db.class.findMany({
        where: { schoolId, id: { in: [...classIds] } },
        select: { id: true, name: true, section: true },
        orderBy: { name: 'asc' },
      })
      const labelByClass = new Map(classes.map((c) => [c.id, classLabelOf(c)]))

      const students = await db.student.findMany({
        where: { classId: { in: [...classIds] }, user: { status: 'ACTIVE' } },
        select: {
          id: true,
          rollNo: true,
          admissionNo: true,
          guardianName: true,
          guardianPhone: true,
          dob: true,
          gender: true,
          bloodGroup: true,
          address: true,
          classId: true,
          user: { select: { name: true, email: true } },
        },
        orderBy: [{ rollNo: 'asc' }],
      })

      // ── Attendance per student (canonical Attendance rows; PRESENT +
      //    LATE count as attended). Null pct when no records — never
      //    fabricated. Recent = newest first, capped for the profile view.
      const attendanceRows = await db.attendance.findMany({
        where: { schoolId, studentId: { in: students.map((s) => s.id) } },
        select: { studentId: true, date: true, status: true },
        orderBy: { date: 'desc' },
      })
      const RECENT_ATTENDANCE_LIMIT = 8
      const attByStudent = new Map<
        string,
        {
          total: number
          attended: number
          present: number
          absent: number
          late: number
          leave: number
          recent: { date: string; status: string }[]
        }
      >()
      for (const row of attendanceRows) {
        let entry = attByStudent.get(row.studentId)
        if (!entry) {
          entry = { total: 0, attended: 0, present: 0, absent: 0, late: 0, leave: 0, recent: [] }
          attByStudent.set(row.studentId, entry)
        }
        entry.total += 1
        if (row.status === 'PRESENT' || row.status === 'LATE') entry.attended += 1
        if (row.status === 'PRESENT') entry.present += 1
        else if (row.status === 'ABSENT') entry.absent += 1
        else if (row.status === 'LATE') entry.late += 1
        else if (row.status === 'LEAVE') entry.leave += 1
        if (entry.recent.length < RECENT_ATTENDANCE_LIMIT) {
          entry.recent.push({ date: row.date.toISOString().slice(0, 10), status: row.status })
        }
      }

      // ── Latest exam with entered marks, per class. "Latest" = greatest
      //    exam date (startDate, falling back to createdAt) among the
      //    exams that have at least one non-null ExamMark row for that
      //    class. Per-subject percentages use ExamSubjectConfig.maxMarks
      //    (fallback: Subject.fullMarks, then 100).
      const markRows = await db.examMark.findMany({
        where: {
          classId: { in: [...classIds] },
          marksObtained: { not: null },
        },
        select: {
          examId: true,
          classId: true,
          subjectId: true,
          studentId: true,
          marksObtained: true,
          exam: { select: { name: true, startDate: true, createdAt: true } },
          subject: { select: { name: true, fullMarks: true } },
        },
      })

      // exam sort key per (classId, examId) — max over each class's exams.
      const examSortKeyByClassExam = new Map<string, { examId: string; sortKey: number }>()
      for (const m of markRows) {
        const sortKey = (m.exam.startDate ?? m.exam.createdAt).getTime()
        const key = `${m.classId}:${m.examId}`
        const cur = examSortKeyByClassExam.get(key)
        if (!cur || sortKey > cur.sortKey) {
          examSortKeyByClassExam.set(key, { examId: m.examId, sortKey })
        }
      }
      // the winning (latest) examId per class
      const latestExamIdByClass = new Map<string, string>()
      for (const [key, v] of examSortKeyByClassExam) {
        const classId = key.slice(0, key.lastIndexOf(':'))
        const cur = latestExamIdByClass.get(classId)
        const curSort = cur ? examSortKeyByClassExam.get(`${classId}:${cur}`)?.sortKey ?? -1 : -1
        if (v.sortKey > curSort) latestExamIdByClass.set(classId, v.examId)
      }

      const involvedExamIds = new Set(markRows.map((m) => m.examId))
      const maxByKey = new Map<string, number>()
      if (involvedExamIds.size > 0) {
        const configRows = await db.examSubjectConfig.findMany({
          where: { examId: { in: [...involvedExamIds] } },
          select: { examId: true, classId: true, subjectId: true, maxMarks: true },
        })
        for (const c of configRows) {
          maxByKey.set(`${c.examId}:${c.classId}:${c.subjectId}`, c.maxMarks)
        }
      }

      // per-class latest-exam rows grouped per student
      const latestByClassStudent = new Map<
        string,
        Map<string, { examId: string; examName: string; subjects: { subjectId: string; subjectName: string; marks: number; maxMarks: number; pct: number }[] }>
      >()
      for (const m of markRows) {
        if (latestExamIdByClass.get(m.classId) !== m.examId) continue
        if (m.marksObtained == null) continue
        let byStudent = latestByClassStudent.get(m.classId)
        if (!byStudent) {
          byStudent = new Map()
          latestByClassStudent.set(m.classId, byStudent)
        }
        let entry = byStudent.get(m.studentId)
        if (!entry) {
          entry = { examId: m.examId, examName: m.exam.name, subjects: [] }
          byStudent.set(m.studentId, entry)
        }
        const maxMarks = maxByKey.get(`${m.examId}:${m.classId}:${m.subjectId}`) ?? m.subject.fullMarks ?? 100
        entry.subjects.push({
          subjectId: m.subjectId,
          subjectName: m.subject.name,
          marks: m.marksObtained,
          maxMarks,
          pct: Math.round((m.marksObtained / maxMarks) * 100),
        })
      }

      const studentsByClass: Record<string, unknown[]> = {}
      for (const s of students) {
        if (!s.classId) continue
        const att = attByStudent.get(s.id)
        const latest = latestByClassStudent.get(s.classId)?.get(s.id) ?? null
        const list = studentsByClass[s.classId] ?? []
        list.push({
          id: s.id,
          name: s.user.name,
          email: s.user.email,
          rollNo: s.rollNo,
          admissionNo: s.admissionNo,
          guardianName: s.guardianName,
          guardianPhone: s.guardianPhone,
          dob: s.dob,
          gender: s.gender,
          bloodGroup: s.bloodGroup,
          address: s.address,
          classLabel: labelByClass.get(s.classId) ?? 'Unassigned',
          attendance: {
            pct: att && att.total > 0 ? Math.round((att.attended / att.total) * 100) : null,
            records: att?.total ?? 0,
            present: att?.present ?? 0,
            absent: att?.absent ?? 0,
            late: att?.late ?? 0,
            leave: att?.leave ?? 0,
            recent: att?.recent ?? [],
          },
          latestExam:
            latest && latest.subjects.length > 0
              ? {
                  examId: latest.examId,
                  examName: latest.examName,
                  subjects: latest.subjects,
                  averagePct: Math.round(
                    latest.subjects.reduce((sum, x) => sum + x.pct, 0) / latest.subjects.length,
                  ),
                }
              : null,
        })
        studentsByClass[s.classId] = list
      }

      return {
        classes: classes.map((c) => ({
          id: c.id,
          label: classLabelOf(c),
          isClassTeacher: classTeacherIds.has(c.id),
          subjects: [...(subjectByClass.get(c.id) ?? [])].sort(),
          studentCount: (studentsByClass[c.id] ?? []).length,
        })),
        studentsByClass,
      }
    },
    { roles: ['TEACHER'] }
  )
}
