import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'
import { classLabelOf } from '@/lib/teacher-hub'

export const runtime = 'nodejs'

/**
 * GET /api/teacher/analytics — real performance analytics for the
 * teacher's classes, derived from actual records:
 *   • per-class subject averages from entered exam marks;
 *   • attendance stats from the canonical Attendance rows;
 *   • student performance ranking from the latest completed exam;
 *   • honest derived insights (no fabricated observations).
 */
export async function GET() {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const teacherName = (user.name || '').trim().toLowerCase()

      // The teacher's classes (same permission source as elsewhere).
      const ttRows = await db.timetable.findMany({
        where: { schoolId, teacherName: { not: null } },
        select: { classId: true, teacherName: true },
      })
      const taughtClassIds = new Set(
        ttRows.filter((r) => (r.teacherName || '').trim().toLowerCase() === teacherName).map((r) => r.classId),
      )
      const classTeacherOf = await db.class.findMany({
        where: { schoolId, classTeacherId: user.id },
        select: { id: true },
      })
      for (const c of classTeacherOf) taughtClassIds.add(c.id)
      if (taughtClassIds.size === 0) {
        return { classes: [], classAnalytics: [] }
      }

      const classes = await db.class.findMany({
        where: { schoolId, id: { in: [...taughtClassIds] } },
        select: { id: true, name: true, section: true },
        orderBy: { name: 'asc' },
      })

      const classAnalytics = await Promise.all(
        classes.map(async (cls) => {
          const label = classLabelOf(cls)

          // ── Marks: latest exams with entered marks for this class ──────
          const marks = await db.examMark.findMany({
            where: {
              classId: cls.id,
              marksObtained: { not: null },
              exam: { schoolId },
            },
            include: {
              exam: { select: { id: true, name: true, startDate: true, status: true } },
              subject: { select: { name: true } },
            },
            orderBy: { exam: { startDate: 'desc' } },
          })

          // Subject averages from the LATEST exam that has marks
          const latestExamId = marks[0]?.examId ?? null
          const latestExam = marks.find((m) => m.examId === latestExamId)?.exam ?? null
          const latestMarks = marks.filter((m) => m.examId === latestExamId)

          const subjectMap = new Map<string, { sum: number; count: number }>()
          for (const m of latestMarks) {
            if (m.marksObtained == null) continue
            const entry = subjectMap.get(m.subject.name) ?? { sum: 0, count: 0 }
            entry.sum += m.marksObtained
            entry.count += 1
            subjectMap.set(m.subject.name, entry)
          }
          const subjectAverages = [...subjectMap.entries()].map(([subject, { sum, count }]) => ({
            subject,
            avg: Math.round((sum / count) * 10) / 10,
          })).sort((a, b) => b.avg - a.avg)

          // Config (maxMarks) for percentage-based comparisons
          const configs = await db.examSubjectConfig.findMany({
            where: { classId: cls.id, examId: latestExamId ?? '' },
            select: { subject: { select: { name: true } }, maxMarks: true },
          })
          const maxBySubject = new Map(configs.map((c) => [c.subject.name, c.maxMarks]))

          // ── Attendance (canonical rows) ────────────────────────────────
          const attendanceRows = await db.attendance.findMany({
            where: { schoolId, classId: cls.id },
            select: { status: true, date: true },
          })
          const total = attendanceRows.length
          const present = attendanceRows.filter((r) => r.status === 'PRESENT').length
          const late = attendanceRows.filter((r) => r.status === 'LATE').length
          const absent = attendanceRows.filter((r) => r.status === 'ABSENT').length
          const attendancePct = total > 0 ? Math.round(((present + late) / total) * 1000) / 10 : null

          // Weekly attendance trend (last 6 weeks with data)
          const weekMap = new Map<string, { presentish: number; total: number }>()
          for (const r of attendanceRows) {
            const week = weekKey(r.date)
            const entry = weekMap.get(week) ?? { presentish: 0, total: 0 }
            entry.total += 1
            if (r.status === 'PRESENT' || r.status === 'LATE') entry.presentish += 1
            weekMap.set(week, entry)
          }
          const attendanceTrend = [...weekMap.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
            .map(([week, { presentish, total: t }]) => ({
              name: week,
              value: Math.round((presentish / t) * 1000) / 10,
            }))

          // ── Student performance (latest exam, percentage-normalized) ──
          const studentMap = new Map<string, { pctSum: number; exams: number }>()
          for (const m of latestMarks) {
            if (m.marksObtained == null) continue
            const max = maxBySubject.get(m.subject.name)
            if (!max) continue
            const pct = (m.marksObtained / max) * 100
            const entry = studentMap.get(m.studentId) ?? { pctSum: 0, exams: 0 }
            entry.pctSum += pct
            entry.exams += 1
            studentMap.set(m.studentId, entry)
          }
          const students = await db.student.findMany({
            where: { id: { in: [...studentMap.keys()] } },
            select: { id: true, rollNo: true, user: { select: { name: true } } },
          })
          const studentPerformance = students
            .map((s) => {
              const entry = studentMap.get(s.id)!
              return {
                name: s.user.name,
                rollNo: s.rollNo,
                avgPct: Math.round((entry.pctSum / entry.exams) * 10) / 10,
                subjects: entry.exams,
              }
            })
            .sort((a, b) => b.avgPct - a.avgPct)

          // ── Honest derived insights ────────────────────────────────────
          const insights: { type: 'success' | 'warning' | 'info'; title: string; desc: string }[] = []
          if (subjectAverages.length > 0) {
            const top = subjectAverages[0]
            const topMax = maxBySubject.get(top.subject) ?? 100
            insights.push({
              type: 'info',
              title: `Strongest subject: ${top.subject}`,
              desc: `${label} averages ${top.avg}/${topMax} in ${top.subject} in ${latestExam?.name ?? 'the latest assessment'}.`,
            })
          }
          if (subjectAverages.length > 1) {
            const low = subjectAverages[subjectAverages.length - 1]
            const lowMax = maxBySubject.get(low.subject) ?? 100
            insights.push({
              type: 'warning',
              title: `${low.subject} needs attention`,
              desc: `${label} averages ${low.avg}/${lowMax} in ${low.subject} — the lowest of the entered subjects.`,
            })
          }
          if (attendancePct != null) {
            insights.push({
              type: attendancePct >= 90 ? 'success' : 'warning',
              title: `Attendance at ${attendancePct}%`,
              desc: total > 0
                ? `${present} present · ${late} late · ${absent} absent across ${total} recorded entries.`
                : 'No attendance recorded yet.',
            })
          }
          if (studentPerformance.length >= 3) {
            const topStudent = studentPerformance[0]
            insights.push({
              type: 'success',
              title: `${topStudent.name} leads ${label}`,
              desc: `Averaging ${topStudent.avgPct}% across ${topStudent.subjects} subjects in ${latestExam?.name ?? 'the latest assessment'}.`,
            })
          }

          return {
            classId: cls.id,
            label,
            exam: latestExam ? { name: latestExam.name, status: latestExam.status } : null,
            subjectAverages: subjectAverages.map((s) => ({
              ...s,
              max: maxBySubject.get(s.subject) ?? 100,
            })),
            attendance: { total, present, late, absent, pct: attendancePct, trend: attendanceTrend },
            studentPerformance: studentPerformance.slice(0, 8),
            insights,
          }
        })
      )

      return {
        classes: classes.map((c) => ({ id: c.id, label: classLabelOf(c) })),
        classAnalytics: classAnalytics.filter((c) => c.subjectAverages.length > 0 || c.attendance.total > 0),
      }
    },
    { roles: ['TEACHER'] }
  )
}

function weekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = date.getUTCDay() || 7 // Mon=1..Sun=7
  date.setUTCDate(date.getUTCDate() - day + 1) // back to Monday
  return `W${Math.ceil(date.getUTCDate() / 7)}`
}
