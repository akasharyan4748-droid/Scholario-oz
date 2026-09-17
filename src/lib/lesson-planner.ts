/**
 * lesson-planner — server-side data layer for the Teacher Workspace Lesson
 * Planner. The pure scheduling algorithm lives in lesson-schedule.ts
 * (shared with the demo seed); this module owns DB access, teacher scope
 * resolution and the plan payload.
 *
 * Permissions: a teacher may only plan (class, subject) pairs she actually
 * teaches — ACTIVE ClassSubjectAssignment ∩ Timetable cells carrying her
 * name. Class-teacher status grants attendance authority, not lesson
 * planning for subjects she does not teach.
 */

import { db } from '@/lib/db'
import { schoolScoped } from '@/lib/api'
import type { AuthUser } from '@/lib/auth'
import { classLabelOf } from '@/lib/teacher-hub'
import {
  dayKey,
  isHolidayKey,
  sessionStartFor,
  computeSchedule,
  WEEKDAY_INDEX,
  type HolidayRange,
  type ScheduledTopic,
} from '@/lib/lesson-schedule'

export type { ScheduledTopic, TopicStatus, HolidayRange } from '@/lib/lesson-schedule'

// ─── Types (client contract) ────────────────────────────────────────────

export interface TeachingAssignment {
  classId: string
  classLabel: string
  subjectId: string
  subjectName: string
  periodsPerWeek: number
}

export interface UnitProgress {
  unitNo: number
  unitName: string
  total: number
  completed: number
}

export interface LessonPlanPayload {
  classId: string
  classLabel: string
  subjectId: string
  subjectName: string
  sourceBoard: string
  sessionStart: string
  pace: {
    periodsPerWeek: number
    periodsPerDay: number
    periodMinutes: number
    teachingDaysPerWeek: number
  }
  progress: { completed: number; total: number; pct: number }
  units: UnitProgress[]
  topics: ScheduledTopic[]
  today: {
    date: string
    topic: ScheduledTopic | null
    reason: string | null
  }
  nextUp: ScheduledTopic[]
}

// ─── Teacher scope resolution ───────────────────────────────────────────

export async function getTeachingAssignments(user: AuthUser): Promise<TeachingAssignment[]> {
  const schoolId = schoolScoped(user)
  const teacher = await db.teacher.findUnique({ where: { userId: user.id } })
  if (!teacher || teacher.schoolId !== schoolId) return []
  const teacherName = (user.name || '').trim().toLowerCase()
  if (!teacherName) return []

  const rows = (await db.timetable.findMany({
    where: { schoolId, teacherName: { not: null }, subjectId: { not: null } },
    select: {
      classId: true,
      subjectId: true,
      teacherName: true,
      class: { select: { name: true, section: true } },
      subject: { select: { name: true } },
    },
  })) as {
    classId: string
    subjectId: string
    teacherName: string | null
    class: { name: string; section: string | null }
    subject: { name: string }
  }[]
  const mine = rows.filter((r) => (r.teacherName || '').trim().toLowerCase() === teacherName)
  if (mine.length === 0) return []

  // Permission gate: only ACTIVE ClassSubjectAssignments count.
  const csas = await db.classSubjectAssignment.findMany({
    where: { schoolId, isActive: true },
    select: { classId: true, subjectId: true },
  })
  const activeKeys = new Set(csas.map((c) => `${c.classId}|${c.subjectId}`))

  const byKey = new Map<string, TeachingAssignment>()
  for (const r of mine) {
    if (!r.subjectId) continue
    const key = `${r.classId}|${r.subjectId}`
    if (!activeKeys.has(key)) continue
    const existing = byKey.get(key)
    if (existing) {
      existing.periodsPerWeek += 1
    } else {
      byKey.set(key, {
        classId: r.classId,
        classLabel: classLabelOf(r.class),
        subjectId: r.subjectId,
        subjectName: r.subject.name,
        periodsPerWeek: 1,
      })
    }
  }
  return [...byKey.values()].sort((a, b) => a.classLabel.localeCompare(b.classLabel) || a.subjectName.localeCompare(b.subjectName))
}

// ─── Pace + calendar ────────────────────────────────────────────────────

interface ClassPace {
  periodsPerWeek: number
  teachingDaysPerWeek: number
  periodMinutes: number
  teachingWeekdays: number[]
}

async function getClassPace(schoolId: string, classId: string, subjectId: string | null): Promise<ClassPace> {
  const rows = await db.timetable.findMany({
    where: { schoolId, classId },
    select: { day: true, subjectId: true, startTime: true, endTime: true },
  })
  const days = new Set(rows.map((r) => r.day))
  const subjectCells = subjectId ? rows.filter((r) => r.subjectId === subjectId).length : 0

  let periodMinutes = 45
  for (const r of rows) {
    if (r.startTime && r.endTime) {
      const [sh, sm] = r.startTime.split(':').map(Number)
      const [eh, em] = r.endTime.split(':').map(Number)
      const mins = eh * 60 + em - (sh * 60 + sm)
      if (mins > 20 && mins < 90) {
        periodMinutes = mins
        break
      }
    }
  }

  return {
    periodsPerWeek: subjectCells,
    teachingDaysPerWeek: days.size || 6,
    periodMinutes,
    teachingWeekdays: [...days].map((d) => WEEKDAY_INDEX[d]).filter((n) => n !== undefined),
  }
}

export async function getHolidays(schoolId: string): Promise<HolidayRange[]> {
  const events = await db.schoolEvent.findMany({
    where: { schoolId, type: 'HOLIDAY' },
    select: { title: true, startDate: true, endDate: true },
    orderBy: { startDate: 'asc' },
  })
  return events.map((e) => ({
    title: e.title,
    start: dayKey(e.startDate),
    end: dayKey(e.endDate ?? e.startDate),
  }))
}

// ─── The full plan payload ──────────────────────────────────────────────

export async function getLessonPlan(
  user: AuthUser,
  classId: string,
  subjectId: string
): Promise<LessonPlanPayload | null> {
  const assignments = await getTeachingAssignments(user)
  const assignment = assignments.find((a) => a.classId === classId && a.subjectId === subjectId)
  if (!assignment) return null

  const schoolId = schoolScoped(user)
  const [school, topicRows, completionRows, pace, holidays] = await Promise.all([
    db.school.findUnique({ where: { id: schoolId }, select: { academicYear: true, board: true } }),
    db.curriculumTopic.findMany({
      where: { schoolId, classId, subjectId },
      orderBy: { orderIndex: 'asc' },
    }),
    db.lessonTopicCompletion.findMany({
      where: { schoolId, classId, subjectId },
      select: { curriculumTopicId: true, completedOn: true, note: true },
    }),
    getClassPace(schoolId, classId, subjectId),
    getHolidays(schoolId),
  ])

  const today = new Date()
  const sessionStart = sessionStartFor(school?.academicYear, today)
  const completions = new Map(
    completionRows.map((c) => [c.curriculumTopicId, { completedOn: dayKey(c.completedOn), note: c.note }])
  )
  const topics = computeSchedule({
    topics: topicRows.map((t) => ({
      id: t.id,
      unitNo: t.unitNo,
      unitName: t.unitName,
      topicNo: t.topicNo,
      topicName: t.topicName,
      description: t.description,
      periodsNeeded: t.periodsNeeded,
      orderIndex: t.orderIndex,
    })),
    completions,
    sessionStart,
    today,
    pace,
    holidays,
  })

  const completed = topics.filter((t) => t.status === 'completed').length
  const total = topics.length
  const unitMap = new Map<string, UnitProgress>()
  for (const t of topics) {
    const key = `${t.unitNo}|${t.unitName}`
    let u = unitMap.get(key)
    if (!u) {
      u = { unitNo: t.unitNo, unitName: t.unitName, total: 0, completed: 0 }
      unitMap.set(key, u)
    }
    u.total += 1
    if (t.status === 'completed') u.completed += 1
  }

  const todayTopic =
    topics.find((t) => t.status === 'today') ?? topics.find((t) => t.status === 'in-progress') ?? null
  const todayKeyStr = dayKey(today)
  let reason: string | null = null
  if (!todayTopic) {
    const holiday = isHolidayKey(todayKeyStr, holidays)
    if (holiday) {
      reason = `School holiday — ${holiday.title}`
    } else if (pace.teachingWeekdays.length > 0 && !pace.teachingWeekdays.includes(today.getUTCDay())) {
      reason = 'No classes scheduled today'
    } else if (topics.length > 0 && topics[topics.length - 1].status === 'completed') {
      reason = 'Curriculum completed for this session'
    } else {
      reason = 'No lesson scheduled for today'
    }
  }

  const periodsPerDay = pace.periodsPerWeek > 0
    ? pace.periodsPerWeek / Math.max(1, pace.teachingDaysPerWeek)
    : 1

  return {
    classId,
    classLabel: assignment.classLabel,
    subjectId,
    subjectName: assignment.subjectName,
    sourceBoard: topicRows[0]?.sourceBoard ?? school?.board ?? 'CBSE',
    sessionStart: dayKey(sessionStart),
    pace: {
      periodsPerWeek: pace.periodsPerWeek,
      periodsPerDay: Math.round(periodsPerDay * 10) / 10,
      periodMinutes: pace.periodMinutes,
      teachingDaysPerWeek: pace.teachingDaysPerWeek,
    },
    progress: { completed, total, pct: total > 0 ? Math.round((completed / total) * 100) : 0 },
    units: [...unitMap.values()].sort((a, b) => a.unitNo - b.unitNo),
    topics,
    today: { date: todayKeyStr, topic: todayTopic, reason },
    nextUp: topics.filter((t) => t.status === 'upcoming' || t.status === 'today').slice(0, 5),
  }
}
