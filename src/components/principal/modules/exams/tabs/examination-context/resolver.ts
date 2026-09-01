// ──────────────────────────────────────────────────────────────────────
// Context resolver — determines which examination state to show.
// Pure function — no React, no side effects.
// ──────────────────────────────────────────────────────────────────────

import type { ExamDTO } from '@/lib/exams/types'

export type ExamContextState = 'LIVE' | 'UPCOMING' | 'PERFORMANCE'

export interface ScheduleItemContext {
  id: string
  subjectName: string | null
  className: string
  date: string
  startTime: string
  endTime: string
  room: string | null
  invigilatorName: string | null
  status: 'running' | 'upcoming_today' | 'completed_today' | 'future'
}

export interface ExamContext {
  state: ExamContextState
  exam: ExamDTO | null
  todaysSchedule: ScheduleItemContext[]
  nextExam: ExamDTO | null
  daysUntilNext: number | null
  upcomingPapers: ScheduleItemContext[]
  readiness: {
    schedule: boolean
    rooms: boolean
    invigilators: boolean
    seating: boolean
    marksSetup: boolean
    overallPct: number
  }
}

const SOON_THRESHOLD_DAYS = 7

export function resolveExamContext(exams: ExamDTO[]): ExamContext {
  const now = new Date()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  const allSchedule: Array<ScheduleItemContext & { examId: string; examName: string }> = []
  for (const exam of exams) {
    for (const s of exam.schedule) {
      const itemDate = s.date ? new Date(s.date) : null
      const itemDateStr = itemDate ? itemDate.toISOString().split('T')[0] : ''

      let status: ScheduleItemContext['status'] = 'future'
      if (itemDateStr === todayStr) {
        const [sh, sm] = s.startTime.split(':').map(Number)
        const [eh, em] = s.endTime.split(':').map(Number)
        const start = new Date(today)
        start.setHours(sh || 0, sm || 0, 0, 0)
        const end = new Date(today)
        end.setHours(eh || 23, em || 59, 0, 0)
        if (now >= start && now <= end) status = 'running'
        else if (now < start) status = 'upcoming_today'
        else status = 'completed_today'
      }

      allSchedule.push({
        id: s.id,
        subjectName: s.subjectName,
        className: s.className,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        room: s.room,
        invigilatorName: s.invigilatorName,
        status,
        examId: exam.id,
        examName: exam.name,
      })
    }
  }

  const todaysSchedule = allSchedule.filter((s) => s.date === todayStr)
  const hasLiveToday = todaysSchedule.some((s) => s.status === 'running' || s.status === 'upcoming_today')

  if (hasLiveToday) {
    const liveExamId = todaysSchedule[0]?.examId
    const liveExam = exams.find((e) => e.id === liveExamId) ?? null
    return {
      state: 'LIVE',
      exam: liveExam,
      todaysSchedule: todaysSchedule.sort((a, b) => a.startTime.localeCompare(b.startTime)),
      nextExam: null,
      daysUntilNext: 0,
      upcomingPapers: [],
      readiness: computeReadiness(liveExam),
    }
  }

  const upcomingExams = exams
    .filter((e) => ['Scheduled', 'Ongoing', 'Draft'].includes(e.status))
    .filter((e) => e.startDate)
    // Exclude past-dated exams from the upcoming list (stale "Scheduled" data)
    .filter((e) => {
      const d = new Date(e.startDate!)
      d.setHours(0, 0, 0, 0)
      return d.getTime() >= today.getTime()
    })
    .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))

  if (upcomingExams.length > 0) {
    const next = upcomingExams[0]
    const nextDate = new Date(next.startDate!)
    nextDate.setHours(0, 0, 0, 0)
    const daysUntil = Math.round((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntil <= SOON_THRESHOLD_DAYS) {
      const upcomingPapers = allSchedule
        .filter((s) => s.examId === next.id && s.date >= todayStr)
        .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
        .slice(0, 5)

      return {
        state: 'UPCOMING',
        exam: next,
        todaysSchedule: [],
        nextExam: next,
        daysUntilNext: daysUntil,
        upcomingPapers,
        readiness: computeReadiness(next),
      }
    }
  }

  return {
    state: 'PERFORMANCE',
    exam: null,
    todaysSchedule: [],
    nextExam: upcomingExams[0] ?? null,
    daysUntilNext: upcomingExams[0]?.startDate
      ? Math.round((new Date(upcomingExams[0].startDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : null,
    upcomingPapers: [],
    readiness: { schedule: false, rooms: false, invigilators: false, seating: false, marksSetup: false, overallPct: 0 },
  }
}

function computeReadiness(exam: ExamDTO | null): ExamContext['readiness'] {
  if (!exam) return { schedule: false, rooms: false, invigilators: false, seating: false, marksSetup: false, overallPct: 0 }
  const hasSchedule = exam.schedule.length > 0
  const hasRooms = exam.schedule.some((s) => s.room)
  const hasInvigilators = exam.schedule.some((s) => s.invigilatorName)
  const hasSeating = false
  const hasMarksSetup = exam.subjects.length > 0
  const checks = [hasSchedule, hasRooms, hasInvigilators, hasSeating, hasMarksSetup]
  return {
    schedule: hasSchedule,
    rooms: hasRooms,
    invigilators: hasInvigilators,
    seating: hasSeating,
    marksSetup: hasMarksSetup,
    overallPct: Math.round((checks.filter(Boolean).length / checks.length) * 100),
  }
}
