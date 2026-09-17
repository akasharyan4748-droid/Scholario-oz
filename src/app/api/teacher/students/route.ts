import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'
import { classLabelOf } from '@/lib/teacher-hub'

export const runtime = 'nodejs'

/**
 * GET /api/teacher/students — the Student Directory payload: the classes
 * this teacher works with (class-teacher of ∪ teaches a subject in, from
 * the timetable) and every class's real roster with profile fields and
 * attendance derived from the canonical Attendance records.
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

      // Attendance per student (canonical Attendance rows; PRESENT + LATE
      // count as attended). Null when no records exist — never fabricated.
      const attendanceRows = await db.attendance.findMany({
        where: { schoolId, studentId: { in: students.map((s) => s.id) } },
        select: { studentId: true, date: true, status: true },
        orderBy: { date: 'desc' },
      })
      const attByStudent = new Map<string, { total: number; attended: number; recent: { date: string; status: string }[] }>()
      for (const row of attendanceRows) {
        let entry = attByStudent.get(row.studentId)
        if (!entry) {
          entry = { total: 0, attended: 0, recent: [] }
          attByStudent.set(row.studentId, entry)
        }
        entry.total += 1
        if (row.status === 'PRESENT' || row.status === 'LATE') entry.attended += 1
        if (entry.recent.length < 5) {
          entry.recent.push({ date: row.date.toISOString().slice(0, 10), status: row.status })
        }
      }

      const studentsByClass: Record<string, unknown[]> = {}
      for (const s of students) {
        if (!s.classId) continue
        const att = attByStudent.get(s.id)
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
          attendancePct: att && att.total > 0 ? Math.round((att.attended / att.total) * 100) : null,
          attendanceRecords: att?.total ?? 0,
          recentAttendance: att?.recent ?? [],
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
