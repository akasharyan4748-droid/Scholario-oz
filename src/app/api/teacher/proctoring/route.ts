import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'
import { classLabelOf } from '@/lib/teacher-hub'

export const runtime = 'nodejs'

/**
 * GET /api/teacher/proctoring — the Exam Proctoring payload, derived
 * entirely from real exam-operation records:
 *   • exams with their papers (ExamScheduleItem: subject, date, slot,
 *     room, invigilator) and class labels;
 *   • the room-level seating plan (ExamSeatAssignment grouped by room);
 *   • the invigilation duty roster (papers with a named invigilator,
 *     the signed-in teacher's own duties flagged);
 *   • hall tickets for the students of the teacher's own classes
 *     (class-teacher classes and subject-teaching classes).
 */
export async function GET() {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const teacherName = (user.name || '').trim()
      const today = new Date()
      const todayKey = today.toISOString().slice(0, 10)


      const exams = await db.exam.findMany({
        where: { schoolId },
        select: {
          id: true,
          name: true,
          type: true,
          term: true,
          status: true,
          startDate: true,
          endDate: true,
          examClasses: { select: { class: { select: { name: true, section: true } } } },
        },
        orderBy: { startDate: 'asc' },
      })

      const scheduleItems = await db.examScheduleItem.findMany({
        where: { exam: { schoolId } },
        include: {
          exam: { select: { id: true, name: true } },
          class: { select: { name: true, section: true } },
          subject: { select: { name: true } },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      })

      const seatAssignments = await db.examSeatAssignment.findMany({
        where: { exam: { schoolId } },
        include: {
          exam: { select: { id: true, name: true } },
          student: { select: { id: true, rollNo: true, user: { select: { name: true } }, class: { select: { id: true, name: true, section: true } } } },
        },
        orderBy: [{ room: 'asc' }, { seatNumber: 'asc' }],
      })

      // Teacher's own classes (class-teacher of, or teaches a subject in)
      const myClassIds = new Set<string>()
      const ttRows = await db.timetable.findMany({
        where: { schoolId, teacherName: { not: null } },
        select: { classId: true, teacherName: true },
      })
      for (const r of ttRows) {
        if ((r.teacherName || '').trim().toLowerCase() === teacherName.toLowerCase()) {
          myClassIds.add(r.classId)
        }
      }
      // Classes where this teacher is class teacher (Class.classTeacherId)
      const classTeacherOf = await db.class.findMany({
        where: { schoolId, classTeacherId: user.id },
        select: { id: true },
      })
      for (const c of classTeacherOf) myClassIds.add(c.id)

      // ── Papers per exam (schedule items) ───────────────────────────────
      const papersByExam = new Map<string, typeof scheduleItems>()
      for (const item of scheduleItems) {
        const list = papersByExam.get(item.examId) ?? []
        list.push(item)
        papersByExam.set(item.examId, list)
      }

      const examDTOs = exams.map((e) => {
        const papers = papersByExam.get(e.id) ?? []
        const classes = [...new Set(e.examClasses.map((ec) => classLabelOf(ec.class)))]
        return {
          id: e.id,
          name: e.name,
          type: e.type,
          term: e.term,
          status: e.status,
          startDate: e.startDate.toISOString().slice(0, 10),
          endDate: e.endDate.toISOString().slice(0, 10),
          classes,
          paperCount: papers.length,
          studentCount: seatAssignments.filter((s) => s.examId === e.id).length,
        }
      })

      const paperDTOs = scheduleItems.map((item) => ({
        id: item.id,
        examId: item.examId,
        examName: item.exam.name,
        subject: item.subject.name,
        classLabel: classLabelOf(item.class),
        date: item.date.toISOString().slice(0, 10),
        startTime: item.startTime,
        endTime: item.endTime,
        room: item.room,
        invigilator: item.invigilatorName,
        isMine: (item.invigilatorName || '').trim().toLowerCase() === teacherName.toLowerCase(),
        done: item.date.toISOString().slice(0, 10) < todayKey,
      }))

      // ── Seating plan per room ──────────────────────────────────────────
      const ROOM_CAPACITY = 24 // 4 rows × 6 cols — mirrors the seeded grid
      const roomMap = new Map<string, { room: string; examName: string; examId: string; seats: typeof seatAssignments }>()
      for (const s of seatAssignments) {
        const key = `${s.exam.id}|${s.room}`
        let entry = roomMap.get(key)
        if (!entry) {
          entry = { room: s.room, examName: s.exam.name, examId: s.exam.id, seats: [] }
          roomMap.set(key, entry)
        }
        entry.seats.push(s)
      }
      // Invigilator for each room = the invigilator of the first paper in it
      const roomInvigilator = new Map<string, string>()
      for (const p of scheduleItems) {
        if (p.room && !roomInvigilator.has(`${p.examId}|${p.room}`)) {
          roomInvigilator.set(`${p.examId}|${p.room}`, p.invigilatorName || '—')
        }
      }
      const seatingDTOs = [...roomMap.values()].map((r) => ({
        room: r.room,
        examName: r.examName,
        allocated: r.seats.length,
        capacity: ROOM_CAPACITY,
        rows: 4,
        cols: 6,
        invigilator: roomInvigilator.get(`${r.examId}|${r.room}`) ?? '—',
        seatNumbers: r.seats.map((s) => s.seatNumber),
        students: r.seats.map((s) => ({
          name: s.student.user.name,
          rollNo: s.student.rollNo,
          classLabel: s.student.class ? classLabelOf(s.student.class) : '',
          seatNumber: s.seatNumber,
        })),
      }))

      // ── Hall tickets: students of MY classes that have seat assignments ─
      const myTickets = seatAssignments
        .filter((s) => s.student.class && myClassIds.has(s.student.class.id))
        .map((s) => {
          const papers = (papersByExam.get(s.examId) ?? [])
            .filter((p) => p.classId === s.student.class!.id)
            .map((p) => ({ subject: p.subject.name, date: p.date.toISOString().slice(0, 10), time: p.startTime }))
          return {
            studentId: s.student.id,
            studentName: s.student.user.name,
            rollNo: s.student.rollNo,
            classLabel: s.student.class ? classLabelOf(s.student.class) : '',
            examName: s.exam.name,
            room: s.room,
            seatNumber: s.seatNumber,
            subjects: papers,
          }
        })

      // ── Stats ──────────────────────────────────────────────────────────
      const upcomingPapers = paperDTOs.filter((p) => p.date >= todayKey && !p.done)
      const myDuties = paperDTOs.filter((p) => p.isMine)
      const roomsUsed = new Set(seatingDTOs.map((r) => r.room))

      // Papers per month (for the bar chart)
      const monthMap = new Map<string, number>()
      for (const p of paperDTOs) {
        const m = p.date.slice(0, 7)
        monthMap.set(m, (monthMap.get(m) ?? 0) + 1)
      }
      const monthLabels: Record<string, string> = {
        '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
        '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
      }
      const monthly = [...monthMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([m, count]) => ({ month: monthLabels[m.slice(5, 7)] ?? m, count }))

      return {
        teacherName,
        exams: examDTOs,
        papers: paperDTOs,
        seating: seatingDTOs,
        duties: paperDTOs.filter((p) => p.invigilator),
        tickets: myTickets,
        stats: {
          upcomingPapers: upcomingPapers.length,
          upcomingExams: examDTOs.filter((e) => e.startDate >= todayKey && e.status === 'SCHEDULED').length,
          studentsSeated: seatAssignments.length,
          roomsUsed: roomsUsed.size,
          myDuties: myDuties.length,
          monthly,
        },
      }
    },
    { roles: ['TEACHER'] }
  )
}
