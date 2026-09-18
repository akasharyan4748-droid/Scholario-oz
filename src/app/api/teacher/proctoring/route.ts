import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'
import { classLabelOf } from '@/lib/teacher-hub'
import {
  dayKey,
  deriveDutyStatus,
  type DutyStatus,
} from '@/lib/exam-duty'

export const runtime = 'nodejs'

/**
 * GET /api/teacher/proctoring — the logged-in teacher's examination DUTY
 * workspace payload (not an exam-administration dashboard):
 *
 *   · duties — every invigilation duty assigned to THIS teacher, with its
 *     derived status (Upcoming / In Progress / Completed / Cancelled),
 *     room roster size, attendance summary and incident count;
 *   · stats — the four teacher-specific metrics (upcoming duties in the
 *     next 30 days, duties today, students to supervise, scheduled hours);
 *   · schedule — exams the teacher is authorized to see: exams with one of
 *     her duties, or exams involving a class she teaches / is class
 *     teacher of. School-wide exam administration stays out.
 */
export async function GET() {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const teacherName = (user.name || '').trim()
      const now = new Date()
      const today = dayKey(now)

      const school = await db.school.findUnique({
        where: { id: schoolId },
        select: { academicYear: true },
      })

      // ── My duties: schedule items assigned to me in this school ────────
      const allItems = await db.examScheduleItem.findMany({
        where: { exam: { schoolId } },
        include: {
          exam: { select: { id: true, name: true, type: true, status: true } },
          class: { select: { id: true, name: true, section: true } },
          subject: { select: { name: true } },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      })
      const nameMatch = teacherName.toLowerCase()
      const myItems = allItems.filter((i) => {
        if (i.invigilatorId != null) return i.invigilatorId === user.id
        return (
          nameMatch.length > 0 &&
          (i.invigilatorName || '').trim().toLowerCase() === nameMatch
        )
      })

      // Room roster size per (exam, room) + attendance + incidents in bulk.
      const seats = await db.examSeatAssignment.findMany({
        where: { exam: { schoolId } },
        select: { examId: true, room: true, studentId: true },
      })
      const roomSize = new Map<string, number>()
      for (const s of seats) {
        const key = `${s.examId}|${s.room}`
        roomSize.set(key, (roomSize.get(key) ?? 0) + 1)
      }
      const myExamIds = new Set(myItems.map((i) => i.examId))
      const attendanceRows = await db.examAttendance.findMany({
        where: { examId: { in: [...myExamIds] } },
        select: { scheduleItemId: true, studentId: true, status: true },
      })
      const attByDuty = new Map<string, { P: number; A: number; L: number }>()
      for (const a of attendanceRows) {
        if (!a.scheduleItemId) continue
        const slot = attByDuty.get(a.scheduleItemId) ?? { P: 0, A: 0, L: 0 }
        if (a.status === 'ABSENT') slot.A++
        else if (a.status === 'LATE') slot.L++
        else slot.P++
        attByDuty.set(a.scheduleItemId, slot)
      }
      const incidentRows = await db.examIncident.findMany({
        where: { examId: { in: [...myExamIds] } },
        select: { scheduleItemId: true },
      })
      const incidentsByDuty = new Map<string, number>()
      for (const inc of incidentRows) {
        if (!inc.scheduleItemId) continue
        incidentsByDuty.set(
          inc.scheduleItemId,
          (incidentsByDuty.get(inc.scheduleItemId) ?? 0) + 1,
        )
      }

      // Persisted sign-offs complete a duty immediately (even on its exam
      // day — the same-day window only keeps UNCOMPLETED duties editable).
      const myDutyIds = myItems.map((i) => i.id)
      const completions = myDutyIds.length
        ? await db.examDutyCompletion.findMany({
            where: { scheduleItemId: { in: myDutyIds }, teacherId: user.id },
            select: { scheduleItemId: true },
          })
        : []
      const completedByMe = new Set(completions.map((c) => c.scheduleItemId))

      const dutyDTOs = myItems.map((i) => {
        const status: DutyStatus = completedByMe.has(i.id)
          ? 'Completed'
          : deriveDutyStatus(i.date, i.startTime, i.endTime, i.exam.status, now)
        const att = attByDuty.get(i.id)
        return {
          id: i.id,
          examId: i.examId,
          examName: i.exam.name,
          examType: i.exam.type,
          subject: i.subject.name,
          classLabel: classLabelOf(i.class),
          date: dayKey(i.date),
          startTime: i.startTime,
          endTime: i.endTime,
          room: i.room,
          role: 'Invigilator',
          studentCount: (i.room && roomSize.get(`${i.examId}|${i.room}`)) || 0,
          status,
          attendance: att
            ? { present: att.P, absent: att.A, late: att.L }
            : null,
          incidentCount: incidentsByDuty.get(i.id) ?? 0,
        }
      })

      // ── Teacher-specific stats (no school-wide numbers) ────────────────
      const in30 = dayKey(new Date(now.getTime() + 30 * 24 * 3600 * 1000))
      const notCompleted = dutyDTOs.filter(
        (d) => d.status === 'Upcoming' || d.status === 'In Progress',
      )
      let dutyMinutes = 0
      for (const d of notCompleted) {
        const [sh, sm] = d.startTime.split(':').map(Number)
        const [eh, em] = d.endTime.split(':').map(Number)
        dutyMinutes += eh * 60 + em - (sh * 60 + sm)
      }
      const stats = {
        upcomingDuties: dutyDTOs.filter(
          (d) => d.date > today && d.date <= in30 && d.status === 'Upcoming',
        ).length,
        todaysDuties: dutyDTOs.filter((d) => d.date === today && d.status !== 'Cancelled').length,
        studentsToSupervise: notCompleted.reduce((acc, d) => acc + d.studentCount, 0),
        dutyMinutes,
        completedDuties: dutyDTOs.filter((d) => d.status === 'Completed').length,
      }

      // ── Authorized exam schedule ───────────────────────────────────────
      // Exams I have a duty in, or exams involving a class I teach / am
      // class teacher of. Everything else stays invisible to me.
      const myClassIds = new Set<string>()
      const ttRows = await db.timetable.findMany({
        where: { schoolId, teacherName: { not: null } },
        select: { classId: true, teacherName: true },
      })
      for (const r of ttRows) {
        if ((r.teacherName || '').trim().toLowerCase() === nameMatch) {
          myClassIds.add(r.classId)
        }
      }
      const classTeacherOf = await db.class.findMany({
        where: { schoolId, classTeacherId: user.id },
        select: { id: true },
      })
      for (const c of classTeacherOf) myClassIds.add(c.id)

      const exams = await db.exam.findMany({
        where: { schoolId },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          startDate: true,
          endDate: true,
          examClasses: { select: { classId: true, class: { select: { name: true, section: true } } } },
        },
        orderBy: { startDate: 'asc' },
      })

      const schedule = exams
        .filter((e) => {
          if (myExamIds.has(e.id)) return true
          return e.examClasses.some((ec) => myClassIds.has(ec.classId))
        })
        .map((e) => ({
          examId: e.id,
          name: e.name,
          type: e.type,
          status: e.status,
          startDate: e.startDate ? dayKey(e.startDate) : null,
          endDate: e.endDate ? dayKey(e.endDate) : null,
          classes: [...new Set(e.examClasses.map((ec) => classLabelOf(ec.class)))],
          papers: allItems
            .filter((i) => i.examId === e.id)
            .map((i) => ({
              id: i.id,
              subject: i.subject.name,
              classLabel: classLabelOf(i.class),
              date: dayKey(i.date),
              startTime: i.startTime,
              endTime: i.endTime,
              room: i.room,
              invigilatorName: i.invigilatorName,
              isMine: myItems.some((m) => m.id === i.id),
            })),
        }))

      return {
        teacherName,
        academicSession: school?.academicYear ?? null,
        todayKey: today,
        duties: dutyDTOs,
        stats,
        schedule,
      }
    },
    { roles: ['TEACHER'] },
  )
}
