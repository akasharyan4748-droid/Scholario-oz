import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'
import { classLabelOf } from '@/lib/teacher-hub'

export const runtime = 'nodejs'

/**
 * GET /api/teacher/analytics — real performance analytics for the
 * teacher's classes. Everything below is derived from actual records
 * (ExamMark / ExamSubjectConfig / Attendance); nothing is fabricated.
 *
 *   • classes          — the teacher's classes (class-teacher classes
 *                        first) with an isClassTeacher flag so the
 *                        client can default the selector sensibly.
 *   • examTrend        — class average (%) per graded assessment,
 *                        chronological. Only exams with at least one
 *                        entered, config-normalizable mark appear.
 *   • subjectAverages  — latest graded assessment, averages by subject
 *                        (raw avg + maxMarks + pct).
 *   • attendance       — canonical Attendance rows: totals, rate and a
 *                        weekly trend labelled with the REAL Monday of
 *                        each week (no W1/W2 placeholders).
 *   • assessmentCompletion — marks entered vs expected (configured
 *                        subjects × enrolled students) for the latest
 *                        exam configured for the class.
 *   • needingAttention — documented thresholds (see constants below).
 *   • topPerformers    — top 5 students of the latest graded assessment.
 *
 * DOCUMENTED THRESHOLDS (Students Needing Attention):
 *   • PERFORMANCE: student's latest-assessment average is ≥ 15
 *     percentage points below the class average (both normalized to
 *     each subject's maxMarks). Only students with entered marks are
 *     evaluated.
 *   • ATTENDANCE: attendance rate below 75% (present + late over all
 *     recorded entries), requiring at least 5 attendance records so a
 *     single early absence never flags a student.
 */

/** Percentage points below the class average that flags a student. */
const PERF_GAP_THRESHOLD = 15
/** Minimum attendance rate (%) — below this a student is flagged. */
const ATTENDANCE_MIN_PCT = 75
/** Minimum attendance records before the attendance flag can apply. */
const ATTENDANCE_MIN_RECORDS = 5
/** How many weeks of the attendance trend to return (most recent). */
const TREND_WEEKS = 8
/** Top performers to return per class. */
const TOP_PERFORMERS = 5

/** The exam fields selected on both the marks and configs queries. */
interface ExamRef {
  id: string
  name: string
  startDate: Date | null
  status: string
  resultStatus: string
}

export async function GET() {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const teacherName = (user.name || '').trim().toLowerCase()

      // The teacher's classes (same permission source as the other
      // teacher modules: timetable cells with her name + classes she is
      // class teacher of).
      const ttRows = await db.timetable.findMany({
        where: { schoolId, teacherName: { not: null } },
        select: { classId: true, teacherName: true },
      })
      const taughtClassIds = new Set(
        ttRows
          .filter((r) => (r.teacherName || '').trim().toLowerCase() === teacherName)
          .map((r) => r.classId),
      )
      const classTeacherRows = await db.class.findMany({
        where: { schoolId, classTeacherId: user.id },
        select: { id: true },
      })
      for (const c of classTeacherRows) taughtClassIds.add(c.id)
      if (taughtClassIds.size === 0) {
        return { classes: [], classAnalytics: [] }
      }

      const classRows = await db.class.findMany({
        where: { schoolId, id: { in: [...taughtClassIds] } },
        select: { id: true, name: true, section: true, classTeacherId: true },
      })
      // Class-teacher classes first, then by name — the client defaults
      // its selector to the first entry.
      classRows.sort((a, b) => {
        const aCT = a.classTeacherId === user.id ? 0 : 1
        const bCT = b.classTeacherId === user.id ? 0 : 1
        if (aCT !== bCT) return aCT - bCT
        return a.name.localeCompare(b.name)
      })

      const classAnalytics = await Promise.all(
        classRows.map(async (cls) => {
          const label = classLabelOf(cls)

          // ── Roster ─────────────────────────────────────────────────
          const students = await db.student.findMany({
            where: { classId: cls.id },
            select: { id: true, rollNo: true, user: { select: { name: true } } },
            orderBy: { rollNo: 'asc' },
          })
          const studentById = new Map(students.map((s) => [s.id, s]))

          // ── Marks (canonical ExamMark rows with a value) ──────────
          const marks = await db.examMark.findMany({
            where: {
              classId: cls.id,
              marksObtained: { not: null },
              exam: { schoolId },
            },
            include: {
              exam: { select: { id: true, name: true, startDate: true, status: true, resultStatus: true } },
              subject: { select: { id: true, name: true } },
            },
          })

          // Subject configs for every exam of this class — the only
          // honest denominator for percentages. Marks without a config
          // are excluded from percentage metrics (no fabricated /100).
          const configs = await db.examSubjectConfig.findMany({
            where: { classId: cls.id },
            select: {
              examId: true,
              subjectId: true,
              maxMarks: true,
              exam: { select: { id: true, name: true, startDate: true, status: true, resultStatus: true } },
            },
          })
          const maxOf = new Map<string, number>()
          for (const c of configs) maxOf.set(`${c.examId}:${c.subjectId}`, c.maxMarks)

          // ── Performance trend: one point per graded assessment ────
          // Exams are keyed by id; each contributes the mean of its
          // normalized marks. Ordered chronologically by start date.
          const examAgg = new Map<
            string,
            { exam: ExamRef; pctSum: number; count: number; marks: typeof marks }
          >()
          for (const m of marks) {
            const max = maxOf.get(`${m.examId}:${m.subjectId}`)
            if (!max || m.marksObtained == null) continue
            const entry =
              examAgg.get(m.examId) ??
              { exam: m.exam, pctSum: 0, count: 0, marks: [] as typeof marks }
            entry.pctSum += (m.marksObtained / max) * 100
            entry.count += 1
            entry.marks.push(m)
            examAgg.set(m.examId, entry)
          }
          const gradedExams = [...examAgg.values()].sort((a, b) => {
            const ad = a.exam.startDate?.getTime() ?? Number.MAX_SAFE_INTEGER
            const bd = b.exam.startDate?.getTime() ?? Number.MAX_SAFE_INTEGER
            if (ad !== bd) return ad - bd
            return a.exam.name.localeCompare(b.exam.name)
          })

          const examYears = new Set(
            gradedExams
              .map((e) => e.exam.startDate?.getUTCFullYear())
              .filter((y): y is number => y != null),
          )
          const showYear = examYears.size > 1

          const examTrend = gradedExams.map((e) => ({
            examId: e.exam.id,
            name: e.exam.name,
            dateLabel: examLabel(e.exam, showYear),
            avgPct: Math.round((e.pctSum / e.count) * 10) / 10,
          }))

          // ── Latest graded assessment ───────────────────────────────
          const latest = gradedExams[gradedExams.length - 1] ?? null
          const latestAssessment = latest
            ? {
                examId: latest.exam.id,
                name: latest.exam.name,
                dateLabel: examLabel(latest.exam, showYear),
                status: latest.exam.status,
                resultStatus: latest.exam.resultStatus,
              }
            : null

          // Subject averages (raw + pct) for the latest graded exam.
          const subjectMap = new Map<string, { subject: string; sum: number; count: number; max: number }>()
          for (const m of latest?.marks ?? []) {
            if (m.marksObtained == null) continue
            const max = maxOf.get(`${m.examId}:${m.subjectId}`)
            if (!max) continue
            const entry = subjectMap.get(m.subject.name) ?? { subject: m.subject.name, sum: 0, count: 0, max }
            entry.sum += m.marksObtained
            entry.count += 1
            subjectMap.set(m.subject.name, entry)
          }
          const subjectAverages = [...subjectMap.values()]
            .map((s) => ({
              subject: s.subject,
              avg: Math.round((s.sum / s.count) * 10) / 10,
              max: s.max,
              pct: Math.round((s.sum / s.count / s.max) * 1000) / 10,
            }))
            .sort((a, b) => b.pct - a.pct)

          // Per-student averages for the latest graded exam → class
          // average, top performers and the performance flag.
          const studentMap = new Map<string, { pctSum: number; subjects: number }>()
          for (const m of latest?.marks ?? []) {
            if (m.marksObtained == null) continue
            const max = maxOf.get(`${m.examId}:${m.subjectId}`)
            if (!max) continue
            const entry = studentMap.get(m.studentId) ?? { pctSum: 0, subjects: 0 }
            entry.pctSum += (m.marksObtained / max) * 100
            entry.subjects += 1
            studentMap.set(m.studentId, entry)
          }
          const gradedStudents = studentMap.size
          let classAveragePct: number | null = null
          if (gradedStudents > 0) {
            const total = [...studentMap.values()].reduce((s, e) => s + e.pctSum / e.subjects, 0)
            classAveragePct = Math.round((total / gradedStudents) * 10) / 10
          }
          const topPerformers = [...studentMap.entries()]
            .map(([studentId, e]) => {
              const s = studentById.get(studentId)
              return {
                studentId,
                name: s?.user.name ?? 'Unknown student',
                rollNo: s?.rollNo ?? null,
                avgPct: Math.round((e.pctSum / e.subjects) * 10) / 10,
                subjects: e.subjects,
              }
            })
            .sort((a, b) => b.avgPct - a.avgPct)
            .slice(0, TOP_PERFORMERS)

          // ── Assessment completion for the current grading cycle ──
          // Latest exam (by start date) that has subject configs for
          // this class. Expected = configured subjects × enrolled
          // students; entered = ExamMark rows with a value.
          const configExams = new Map<string, ExamRef & { subjects: number }>()
          for (const c of configs) {
            const entry = configExams.get(c.examId) ?? { ...c.exam, subjects: 0 }
            entry.subjects += 1
            configExams.set(c.examId, entry)
          }
          const completionExam = [...configExams.values()].sort((a, b) => {
            const ad = a.startDate?.getTime() ?? Number.MAX_SAFE_INTEGER
            const bd = b.startDate?.getTime() ?? Number.MAX_SAFE_INTEGER
            return bd - ad
          })[0]
          const assessmentCompletion = (() => {
            if (completionExam == null) return null
            const entered = marks.filter((m) => m.examId === completionExam.id).length
            const expected = completionExam.subjects * students.length
            return {
              examId: completionExam.id,
              examName: completionExam.name,
              dateLabel: examLabel(completionExam, showYear),
              entered,
              expected,
              pct: expected > 0 ? Math.round((entered / expected) * 1000) / 10 : null,
            }
          })()

          // ── Attendance (canonical rows) ────────────────────────────
          // Attendance rate = (PRESENT + LATE) / all recorded entries.
          const attendanceRows = await db.attendance.findMany({
            where: { schoolId, classId: cls.id },
            select: { studentId: true, status: true, date: true },
          })
          const total = attendanceRows.length
          const present = attendanceRows.filter((r) => r.status === 'PRESENT').length
          const late = attendanceRows.filter((r) => r.status === 'LATE').length
          const absent = attendanceRows.filter((r) => r.status === 'ABSENT').length
          const attendancePct = total > 0 ? Math.round(((present + late) / total) * 1000) / 10 : null

          // Weekly trend keyed by the REAL Monday of each week; labels
          // carry that date (e.g. "10 Aug"), sorted chronologically.
          const weekMap = new Map<string, { presentish: number; total: number; monday: Date }>()
          for (const r of attendanceRows) {
            const monday = mondayOf(r.date)
            const key = monday.toISOString().slice(0, 10)
            const entry = weekMap.get(key) ?? { presentish: 0, total: 0, monday }
            entry.total += 1
            if (r.status === 'PRESENT' || r.status === 'LATE') entry.presentish += 1
            weekMap.set(key, entry)
          }
          const weeklyTrend = [...weekMap.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-TREND_WEEKS)
            .map(([key, { presentish, total: t, monday }]) => ({
              key,
              label: dayMonthLabel(monday),
              value: Math.round((presentish / t) * 1000) / 10,
            }))

          // Per-student attendance (for the attention flag).
          const attByStudent = new Map<string, { presentish: number; total: number }>()
          for (const r of attendanceRows) {
            const entry = attByStudent.get(r.studentId) ?? { presentish: 0, total: 0 }
            entry.total += 1
            if (r.status === 'PRESENT' || r.status === 'LATE') entry.presentish += 1
            attByStudent.set(r.studentId, entry)
          }

          // ── Students needing attention (documented thresholds) ────
          const needingAttention: {
            studentId: string
            name: string
            rollNo: string | null
            avgPct: number | null
            attendancePct: number | null
            attendanceRecords: number
            reasons: { kind: 'performance' | 'attendance'; text: string }[]
          }[] = []
          for (const s of students) {
            const reasons: { kind: 'performance' | 'attendance'; text: string }[] = []

            const perf = studentMap.get(s.id)
            if (
              perf != null &&
              classAveragePct != null &&
              perf.pctSum / perf.subjects <= classAveragePct - PERF_GAP_THRESHOLD
            ) {
              const avgPct = Math.round((perf.pctSum / perf.subjects) * 10) / 10
              const gap = Math.round((classAveragePct - avgPct) * 10) / 10
              reasons.push({
                kind: 'performance',
                text: `Averaging ${avgPct}% in ${latestAssessment?.name ?? 'the latest assessment'} — ${gap} pts below the class average of ${classAveragePct}%`,
              })
            }

            const att = attByStudent.get(s.id)
            const attPct =
              att != null && att.total > 0 ? Math.round((att.presentish / att.total) * 1000) / 10 : null
            if (att != null && att.total >= ATTENDANCE_MIN_RECORDS && attPct != null && attPct < ATTENDANCE_MIN_PCT) {
              reasons.push({
                kind: 'attendance',
                text: `Attendance ${attPct}% across ${att.total} recorded days — below the ${ATTENDANCE_MIN_PCT}% threshold`,
              })
            }

            if (reasons.length > 0) {
              needingAttention.push({
                studentId: s.id,
                name: s.user.name ?? 'Unknown student',
                rollNo: s.rollNo,
                avgPct:
                  perf != null ? Math.round((perf.pctSum / perf.subjects) * 10) / 10 : null,
                attendancePct: attPct,
                attendanceRecords: att?.total ?? 0,
                reasons,
              })
            }
          }
          // Most urgent first: multiple reasons, then lowest attendance.
          needingAttention.sort((a, b) => {
            if (b.reasons.length !== a.reasons.length) return b.reasons.length - a.reasons.length
            const ap = a.attendancePct ?? 101
            const bp = b.attendancePct ?? 101
            if (ap !== bp) return ap - bp
            return (a.avgPct ?? 101) - (b.avgPct ?? 101)
          })

          return {
            classId: cls.id,
            label,
            studentCount: students.length,
            latestAssessment,
            classAveragePct,
            gradedStudents,
            subjectAverages,
            examTrend,
            assessmentCompletion,
            topPerformers,
            attendance: { total, present, late, absent, pct: attendancePct, weeklyTrend },
            needingAttention,
          }
        }),
      )

      return {
        classes: classRows.map((c) => ({
          id: c.id,
          label: classLabelOf(c),
          isClassTeacher: c.classTeacherId === user.id,
        })),
        classAnalytics,
      }
    },
    { roles: ['TEACHER'] }
  )
}

// ── date helpers (UTC — seed dates are stored at UTC midnight) ────────

const DAY_MONTH = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})
const DAY_MONTH_YEAR = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/** Day-month label for the exam's real start date; the year is appended
 *  only when the trend spans more than one calendar year. */
function examLabel(exam: { name: string; startDate: Date | null }, showYear: boolean): string {
  if (!exam.startDate) return exam.name
  return showYear ? DAY_MONTH_YEAR.format(exam.startDate) : DAY_MONTH.format(exam.startDate)
}

function dayMonthLabel(d: Date): string {
  return DAY_MONTH.format(d)
}

/** Monday (UTC) of the week containing `d`. */
function mondayOf(d: Date): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = date.getUTCDay() || 7 // Mon=1..Sun=7
  date.setUTCDate(date.getUTCDate() - day + 1)
  return date
}
