/**
 * lesson-schedule — PURE day-wise curriculum scheduling (no DB, no Next
 * imports) shared by:
 *   • src/lib/lesson-planner.ts (the Lesson Planner API), and
 *   • prisma/seed-teacher-academics.ts (seeding completions for the demo
 *     so the demo state and the live schedule always agree).
 *
 * Model:
 *   Teaching days  — weekdays that appear in the class's timetable.
 *   Holidays       — SchoolEvent HOLIDAY date ranges (school calendar).
 *   Pace           — periods/week for the class+subject ÷ teaching
 *                    days/week → periods per teaching day; a topic of N
 *                    periods occupies ceil(N / pace) consecutive teaching
 *                    days. Fallback when a class has no timetable:
 *                    45-minute daily slot, 6-day teaching week.
 *   Status         — completed | today | in-progress | needs-rescheduling |
 *                    upcoming, derived against the current date.
 */

// ─── Date helpers (day-granular, UTC-day keys avoid TZ drift) ───────────

export function dayKey(d: Date): string {
  const y = d.getUTCFullYear()
  const m = `${d.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${d.getUTCDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(d: Date, n: number): Date {
  const next = new Date(d.getTime())
  next.setUTCDate(next.getUTCDate() + n)
  return next
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export const WEEKDAY_INDEX: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
}

// ─── Contract types (client-safe) ───────────────────────────────────────

export type TopicStatus = 'completed' | 'today' | 'in-progress' | 'needs-rescheduling' | 'upcoming'

export interface HolidayRange {
  title: string
  start: string
  end: string
}

export interface ScheduledTopic {
  id: string
  unitNo: number
  unitName: string
  topicNo: number
  topicName: string
  description: string | null
  periodsNeeded: number
  startDate: string
  endDate: string
  status: TopicStatus
  completedOn: string | null
}

export interface ScheduleTopicInput {
  id: string
  unitNo: number
  unitName: string
  topicNo: number
  topicName: string
  description: string | null
  periodsNeeded: number
  orderIndex: number
}

export interface SchedulePace {
  periodsPerWeek: number
  teachingDaysPerWeek: number
  /** weekday numbers (0=Sun) that carry timetable rows for the class */
  teachingWeekdays: number[]
}

export interface ScheduleInputs {
  topics: ScheduleTopicInput[]
  completions: Map<string, { completedOn: string; note: string | null }>
  sessionStart: Date
  today: Date
  pace: SchedulePace
  holidays: HolidayRange[]
}

// ─── Core algorithm ─────────────────────────────────────────────────────

export function isHolidayKey(key: string, holidays: HolidayRange[]): HolidayRange | null {
  for (const h of holidays) {
    if (key >= h.start && key <= h.end) return h
  }
  return null
}

export function computeSchedule(inputs: ScheduleInputs): ScheduledTopic[] {
  const { topics, completions, sessionStart, today, pace, holidays } = inputs
  const todayKey = dayKey(today)
  const periodsPerDay =
    pace.periodsPerWeek > 0 ? pace.periodsPerWeek / Math.max(1, pace.teachingDaysPerWeek) : 1
  const weekdays =
    pace.teachingWeekdays.length > 0 ? new Set(pace.teachingWeekdays) : new Set([1, 2, 3, 4, 5, 6])

  const scheduled: ScheduledTopic[] = []
  let cursor = new Date(
    Date.UTC(sessionStart.getUTCFullYear(), sessionStart.getUTCMonth(), sessionStart.getUTCDate())
  )
  const horizonEnd = addDays(today, 400)

  for (const t of [...topics].sort((a, b) => a.orderIndex - b.orderIndex)) {
    const completion = completions.get(t.id)
    const daysNeeded = Math.max(1, Math.ceil(t.periodsNeeded / Math.max(periodsPerDay, 0.25)))

    let startKey: string | null = null
    let endKey: string | null = null
    let consumed = 0
    while (consumed < daysNeeded && cursor <= horizonEnd) {
      const key = dayKey(cursor)
      const weekday = cursor.getUTCDay()
      if (weekdays.has(weekday) && !isHolidayKey(key, holidays)) {
        consumed += 1
        if (!startKey) startKey = key
        endKey = key
      }
      cursor = addDays(cursor, 1)
    }
    if (!startKey || !endKey) {
      startKey = startKey ?? dayKey(addDays(cursor, -1))
      endKey = endKey ?? startKey
    }

    let status: TopicStatus
    if (completion) {
      status = 'completed'
    } else if (todayKey >= startKey && todayKey <= endKey) {
      status = todayKey === startKey ? 'today' : 'in-progress'
    } else if (endKey < todayKey) {
      status = 'needs-rescheduling'
    } else {
      status = 'upcoming'
    }

    scheduled.push({
      id: t.id,
      unitNo: t.unitNo,
      unitName: t.unitName,
      topicNo: t.topicNo,
      topicName: t.topicName,
      description: t.description,
      periodsNeeded: t.periodsNeeded,
      startDate: startKey,
      endDate: endKey,
      status,
      completedOn: completion?.completedOn ?? null,
    })
  }
  return scheduled
}

/**
 * Session anchor: CBSE sessions begin April 1. Derived from the school's
 * academicYear ("2026-2027"), falling back to the calendar year's April 1
 * (or the previous April when queried in Jan–Mar before the new session).
 */
export function sessionStartFor(academicYear: string | null | undefined, today: Date): Date {
  const match = academicYear?.match(/^(\d{4})/)
  if (match) {
    const anchor = new Date(Date.UTC(Number(match[1]), 3, 1))
    if (anchor.getTime() - today.getTime() < 400 * 86_400_000) return anchor
  }
  const y = today.getUTCFullYear()
  const aprilThisYear = new Date(Date.UTC(y, 3, 1))
  return aprilThisYear.getTime() > today.getTime()
    ? new Date(Date.UTC(y - 1, 3, 1))
    : aprilThisYear
}
