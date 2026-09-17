/**
 * curriculum-execution — the AUTOMATED CURRICULUM EXECUTION engine.
 *
 * Lesson Planner is NOT manual planning. The teacher selects a (class,
 * subject) teaching assignment; the platform resolves the MASTER CURRICULUM
 * (structured CBSE data — never AI-generated), derives the day-wise teaching
 * schedule from the class TIMETABLE + ACADEMIC CALENDAR (holidays), and the
 * teacher simply executes: start → complete. Progress updates automatically.
 *
 * SECURITY MODEL (mirrors teacher-attendance.ts):
 *   erp_session cookie → requireTeacher → school scope → ACTIVE teaching
 *   assignments (ClassSubjectAssignment). Being class teacher grants NO
 *   lesson-planner scope (§24) — only assignments do. Client-supplied
 *   classId/subjectId/topicId are re-validated server-side on every call;
 *   LessonExecution rows are (schoolId, classId, subjectId, teacherId)-
 *   scoped, so no other school's or teacher's execution state is reachable.
 *
 * SCHEDULING MODEL (cursor-based projection):
 *   · COMPLETED/SKIPPED topics are history — they keep their real dates and
 *     are never recalculated (§33/§34).
 *   · The CURSOR = first topic without a COMPLETED/SKIPPED record. It is
 *     always the next lesson to teach, on the next eligible slot — a missed
 *     day self-heals (the topic repeats) and a holiday simply shifts the
 *     projection forward (§11/§33).
 *   · Future topics are PROJECTED onto upcoming eligible slots (weekday has
 *     a timetable slot for the class+subject AND the date is not a holiday).
 *     A topic needing more minutes than one slot spans consecutive slots.
 *   · POSTPONED marks today's slot as moved — the topic re-appears at the
 *     next eligible slot (§16/§17). All overrides are persisted rows
 *     (auditability §17).
 */

import { db } from '@/lib/db'
import type { AuthUser } from '@/lib/auth'
import { classLabelOf, requireTeacher, auditTeacherAction, type TeacherHubContext } from '@/lib/teacher-hub'
import type {
  CurriculumExecutionPayload,
  CurriculumRef,
  CurriculumUnitDTO,
  LessonAction,
  ScheduledTopicDTO,
  TeachingAssignmentRef,
  TodayLessonDTO,
  UpNextItemDTO,
} from '@/lib/curriculum-types'

// ---------- date handling (UTC-midnight days) ----------

function dayISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function parseDay(v: unknown, field = 'Date'): Date {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v.trim())) {
    throw new Error(`${field} must be a YYYY-MM-DD date`)
  }
  const d = new Date(`${v.trim()}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) throw new Error(`${field} is not a valid date`)
  return d
}

function todayUTC(): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setUTCDate(x.getUTCDate() + n)
  return x
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

function dayIndex(name: string): number {
  const i = DAY_NAMES.findIndex((d) => d.toLowerCase() === name.trim().toLowerCase())
  if (i < 0) throw new Error(`Unknown weekday in timetable: ${name}`)
  return i
}

/** minutes between "HH:MM" strings (timetable rows) */
function minutesBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null
  const m = (s: string): number => {
    const [h, mm] = s.split(':').map((x) => Number.parseInt(x, 10))
    if (Number.isNaN(h) || Number.isNaN(mm)) return NaN
    return h * 60 + mm
  }
  const a = m(start)
  const b = m(end)
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return null
  return b - a
}

// ---------- teaching assignments (the ONLY authorization surface) ----------

export async function teachingAssignments(ctx: TeacherHubContext): Promise<TeachingAssignmentRef[]> {
  const rows = await db.classSubjectAssignment.findMany({
    where: { schoolId: ctx.schoolId, teacherId: ctx.userId, isActive: true },
    include: {
      class: { select: { id: true, name: true, section: true, gradeLevel: true } },
      subject: { select: { id: true, name: true } },
    },
    orderBy: [{ class: { name: 'asc' } }, { displayOrder: 'asc' }],
  })
  const out: TeachingAssignmentRef[] = []
  for (const r of rows) {
    if (!out.some((a) => a.classId === r.class.id && a.subjectId === r.subject.id)) {
      out.push({
        classId: r.class.id,
        classLabel: classLabelOf(r.class),
        subjectId: r.subject.id,
        subjectName: r.subject.name,
      })
    }
  }
  return out
}

async function assertAssignment(
  ctx: TeacherHubContext,
  classId: unknown,
  subjectId: unknown,
): Promise<TeachingAssignmentRef> {
  if (typeof classId !== 'string' || !classId.trim()) throw new Error('Class is required')
  if (typeof subjectId !== 'string' || !subjectId.trim()) throw new Error('Subject is required')
  const assignments = await teachingAssignments(ctx)
  const match = assignments.find((a) => a.classId === classId && a.subjectId === subjectId)
  if (!match) {
    const cls = await db.class.findFirst({ where: { id: classId, schoolId: ctx.schoolId }, select: { id: true } })
    if (!cls) throw new Error('NOT_FOUND')
    throw new Error('FORBIDDEN')
  }
  return match
}

// ---------- master curriculum resolution (§5/§6/§8/§27) ----------

/** class level digits from gradeLevel or the class name ("Grade 9 - A" → "9") */
function classLevelOf(cls: { gradeLevel: string | null; name: string }): string {
  if (cls.gradeLevel) {
    const digits = cls.gradeLevel.replace(/[^0-9]/g, '')
    if (digits) return digits
  }
  const digits = cls.name.replace(/[^0-9]/g, '')
  return digits || cls.name
}

/**
 * Resolve the ACTIVE master curriculum for a (class, subject). Picks the
 * highest ACTIVE version for the board/classLevel/subjectName. Returns null
 * when the library has no curriculum for this pair — the UI then shows the
 * honest "Curriculum unavailable" state (§32). NEVER fabricates one.
 */
async function resolveCurriculum(
  ctx: TeacherHubContext,
  cls: { gradeLevel: string | null; name: string },
  subjectName: string,
): Promise<CurriculumRef | null> {
  const classLevel = classLevelOf(cls)
  const curricula = await db.curriculum.findMany({
    where: { board: 'CBSE', classLevel, subjectName, status: 'ACTIVE' },
    orderBy: { version: 'desc' },
    select: {
      id: true, board: true, academicSession: true, classLevel: true,
      subjectName: true, version: true, status: true,
    },
  })
  // prefer the school's own academic session when the library has it
  const school = await db.school.findUnique({ where: { id: ctx.schoolId }, select: { academicYear: true } })
  const sessionOf = (s: string): string => s.replace('/', '-').replace(/\s/g, '')
  const schoolSession = school?.academicYear ? sessionOf(school.academicYear) : null
  const match =
    (schoolSession && curricula.find((c) => sessionOf(c.academicSession) === schoolSession)) || curricula[0] || null
  return match
}

// ---------- teaching slots + academic calendar (§10/§11/§30/§31) ----------

interface Slot {
  weekday: number
  period: number
  minutes: number
}

async function subjectSlots(schoolId: string, classId: string, subjectId: string): Promise<Slot[]> {
  const rows = await db.timetable.findMany({ where: { schoolId, classId, subjectId } })
  const slots: Slot[] = []
  for (const r of rows) {
    const minutes = minutesBetween(r.startTime, r.endTime) ?? 45
    slots.push({ weekday: dayIndex(r.day), period: r.period, minutes })
  }
  slots.sort((a, b) => a.weekday - b.weekday || a.period - b.period)
  return slots
}

/** HOLIDAY calendar: ISO-date set + title map ( SchoolEvent, ranges expanded ). */
async function holidayCalendar(schoolId: string): Promise<{ dates: Map<string, string>; titles: Map<string, string> }> {
  const events = await db.schoolEvent.findMany({
    where: { schoolId, type: 'HOLIDAY' },
    select: { title: true, startDate: true, endDate: true },
  })
  const dates = new Map<string, string>()
  const titles = new Map<string, string>()
  for (const e of events) {
    const start = new Date(e.startDate)
    start.setUTCHours(0, 0, 0, 0)
    const end = e.endDate ? new Date(e.endDate) : start
    end.setUTCHours(0, 0, 0, 0)
    for (let d = new Date(start); d.getTime() <= end.getTime(); d = addDays(d, 1)) {
      const iso = dayISO(d)
      dates.set(iso, iso)
      titles.set(iso, e.title)
    }
  }
  return { dates, titles }
}

const DEFAULT_SLOTS: Slot[] = [1, 2, 3, 4, 5].map((weekday) => ({ weekday, period: 1, minutes: 45 }))

// ---------- schedule projection (§9/§13/§21) ----------

interface FlatTopic {
  id: string
  unitId: string
  unitTitle: string
  unitSequence: number
  sequence: number
  title: string
  estimatedMinutes: number
  learningOutcomes: string[]
}

interface ExecutionRow {
  curriculumTopicId: string
  date: Date
  period: number | null
  status: string
  completedAt: Date | null
}

/** Iterate eligible lesson slots (date+period) from `from` (inclusive). */
function* eligibleSlots(
  from: Date,
  slots: Slot[],
  holidays: Map<string, string>,
): Generator<{ date: Date; period: number; minutes: number }> {
  const slotsByWeekday = new Map<number, Slot[]>()
  for (const s of slots) {
    const arr = slotsByWeekday.get(s.weekday) ?? []
    arr.push(s)
    slotsByWeekday.set(s.weekday, arr)
  }
  let d = new Date(from)
  d.setUTCHours(0, 0, 0, 0)
  for (let guard = 0; guard < 400; guard++) {
    const iso = dayISO(d)
    if (!holidays.has(iso)) {
      const daySlots = (slotsByWeekday.get(d.getUTCDay()) ?? []).slice().sort((a, b) => a.period - b.period)
      for (const s of daySlots) yield { date: new Date(d), period: s.period, minutes: s.minutes }
    }
    d = addDays(d, 1)
  }
}

/**
 * Assign upcoming topics to eligible slots. A topic spans
 * ceil(estimatedMinutes / slotMinutes) consecutive slots.
 */
function projectTopics(
  topics: FlatTopic[],
  startIndex: number,
  slotIterator: Generator<{ date: Date; period: number; minutes: number }>,
): Map<string, { date: string; period: number }> {
  const out = new Map<string, { date: string; period: number }>()
  let idx = startIndex
  let current = slotIterator.next()
  while (!current.done && idx < topics.length) {
    const topic = topics[idx]
    const slotsNeeded = Math.max(1, Math.ceil(topic.estimatedMinutes / current.value.minutes))
    out.set(topic.id, { date: dayISO(current.value.date), period: current.value.period })
    for (let i = 0; i < slotsNeeded; i++) {
      current = slotIterator.next()
      if (current.done) return out
    }
    idx++
  }
  return out
}

// ---------- payload ----------

async function buildSelected(
  ctx: TeacherHubContext,
  assignment: TeachingAssignmentRef,
): Promise<CurriculumExecutionPayload['selected']> {
  const cls = await db.class.findFirst({
    where: { id: assignment.classId, schoolId: ctx.schoolId },
    select: { gradeLevel: true, name: true },
  })

  const curriculum = cls
    ? await resolveCurriculum(ctx, cls, assignment.subjectName)
    : null

  const today = todayUTC()
  const todayIso = dayISO(today)

  if (!curriculum) {
    return {
      classId: assignment.classId,
      classLabel: assignment.classLabel,
      subjectId: assignment.subjectId,
      subjectName: assignment.subjectName,
      curriculum: null,
      timetable: null,
      todayLesson: null,
      todayNote: null,
      upNext: [],
      units: [],
      progress: {
        completedTopics: 0,
        skippedTopics: 0,
        totalTopics: 0,
        remainingTopics: 0,
        percent: 0,
        completedMinutes: 0,
        totalMinutes: 0,
      },
    }
  }

  // full topic tree (flat, in teaching sequence)
  const unitRows = await db.curriculumUnit.findMany({
    where: { curriculumId: curriculum.id },
    orderBy: { sequence: 'asc' },
    include: { topics: { orderBy: { sequence: 'asc' } } },
  })
  const topics: FlatTopic[] = []
  for (const u of unitRows) {
    for (const t of u.topics) {
      let outcomes: string[] = []
      try {
        const v: unknown = t.learningOutcomes ? JSON.parse(t.learningOutcomes) : []
        if (Array.isArray(v)) outcomes = v.filter((x): x is string => typeof x === 'string')
      } catch {
        outcomes = []
      }
      topics.push({
        id: t.id,
        unitId: u.id,
        unitTitle: u.title,
        unitSequence: u.sequence,
        sequence: t.sequence,
        title: t.title,
        estimatedMinutes: t.estimatedMinutes,
        learningOutcomes: outcomes,
      })
    }
  }

  // execution state for this (class, subject, teacher)
  const executions = await db.lessonExecution.findMany({
    where: {
      schoolId: ctx.schoolId,
      classId: assignment.classId,
      subjectId: assignment.subjectId,
      teacherId: ctx.userId,
    },
  })
  const byTopic = new Map<string, ExecutionRow>()
  for (const e of executions) byTopic.set(e.curriculumTopicId, e)

  // slots + holidays (timetable is the preferred source; default fallback otherwise)
  const realSlots = await subjectSlots(ctx.schoolId, assignment.classId, assignment.subjectId)
  const useDefault = realSlots.length === 0
  const slots = useDefault ? DEFAULT_SLOTS : realSlots
  const { dates: holidays, titles: holidayTitles } = await holidayCalendar(ctx.schoolId)
  const minutesPerWeek = slots.reduce((acc, s) => acc + s.minutes, 0)

  // cursor = first topic not COMPLETED/SKIPPED
  const isDone = (t: FlatTopic): boolean => {
    const e = byTopic.get(t.id)
    return !!e && (e.status === 'COMPLETED' || e.status === 'SKIPPED')
  }
  const cursorIdx = topics.findIndex((t) => !isDone(t))

  // today's slots (empty on holidays / no-slot weekdays)
  const todaySlotList = holidays.has(todayIso)
    ? []
    : (slots.filter((s) => s.weekday === today.getUTCDay()).sort((a, b) => a.period - b.period))

  // today's execution overlay for the cursor topic
  const cursorTopic = cursorIdx >= 0 ? topics[cursorIdx] : null
  const cursorExec = cursorTopic ? byTopic.get(cursorTopic.id) ?? null : null
  const cursorPostponedToday =
    cursorExec?.status === 'POSTPONED' && dayISO(cursorExec.date) === todayIso

  // slots already consumed today by completed lessons (spanning topics take
  // ceil(est/minutes) slots — the honest approximation of real consumption)
  const slotMinutes = todaySlotList[0]?.minutes ?? 45
  const completedToday = topics.filter((t) => {
    const e = byTopic.get(t.id)
    return e?.status === 'COMPLETED' && dayISO(e.date) === todayIso
  })
  const consumedSlotsToday = completedToday.reduce(
    (acc, t) => acc + Math.max(1, Math.ceil(t.estimatedMinutes / slotMinutes)),
    0,
  )
  const slotsLeftToday = todaySlotList.length - consumedSlotsToday
  const lastCompletedToday = completedToday[completedToday.length - 1] ?? null

  // ── projection start: the first slot from which uncompleted topics are placed ──
  // · today still has a free slot and the cursor is pending: the cursor sits
  //   on today's first FREE slot; the NEXT topics start after today.
  // · cursor postponed today: cursor re-appears at the next slot after today.
  // · today fully taught / holiday / no slots: projection starts after today.
  const todayPending =
    slotsLeftToday > 0 && !!cursorTopic && !cursorPostponedToday

  let projectionIterator: Generator<{ date: Date; period: number; minutes: number }>
  let projectionStartIdx: number
  if (todayPending && cursorTopic) {
    projectionIterator = eligibleSlots(addDays(today, 1), slots, holidays)
    projectionStartIdx = cursorIdx + 1
  } else {
    projectionIterator = eligibleSlots(addDays(today, 1), slots, holidays)
    projectionStartIdx = cursorIdx
  }
  const projection = projectTopics(topics, projectionStartIdx, projectionIterator)

  // the cursor topic's own slot when it is today's pending lesson
  if (todayPending && cursorTopic) {
    projection.set(cursorTopic.id, {
      date: todayIso,
      period: todaySlotList[Math.min(consumedSlotsToday, todaySlotList.length - 1)].period,
    })
  }

  // where a postponed cursor moves to (next eligible slot)
  let movedTo: { date: string; period: number | null } | null = null
  if (cursorPostponedToday && cursorTopic) {
    const next = eligibleSlots(addDays(today, 1), slots, holidays).next()
    if (!next.done) movedTo = { date: dayISO(next.value.date), period: next.value.period }
  }

  // ── topic DTOs ──
  const scheduled: ScheduledTopicDTO[] = topics.map((t) => {
    const e = byTopic.get(t.id)
    let status: ScheduledTopicDTO['status'] = 'PLANNED'
    let completedAt: string | null = null
    let scheduledDate: string | null = null
    let period: number | null = null
    if (e) {
      if (e.status === 'COMPLETED') {
        status = 'COMPLETED'
        completedAt = (e.completedAt ?? e.date).toISOString()
        scheduledDate = dayISO(e.date)
        period = e.period
      } else if (e.status === 'SKIPPED') {
        status = 'SKIPPED'
        scheduledDate = dayISO(e.date)
        period = e.period
      } else if (e.status === 'IN_PROGRESS') {
        status = 'IN_PROGRESS'
        scheduledDate = dayISO(e.date)
        period = e.period
      } else if (e.status === 'POSTPONED') {
        status = 'POSTPONED'
        scheduledDate = dayISO(e.date)
        period = e.period
      }
    }
    if (status === 'PLANNED') {
      const p = projection.get(t.id)
      if (p) {
        scheduledDate = p.date
        period = p.period
      }
    }
    return {
      id: t.id,
      unitId: t.unitId,
      unitTitle: t.unitTitle,
      unitSequence: t.unitSequence,
      sequence: t.sequence,
      title: t.title,
      estimatedMinutes: t.estimatedMinutes,
      learningOutcomes: t.learningOutcomes,
      status,
      completedAt,
      scheduledDate,
      period,
      isToday: scheduledDate === todayIso,
      postponedTo: null,
    }
  })
  const topicById = new Map(scheduled.map((t) => [t.id, t]))
  if (cursorTopic && movedTo) {
    const dto = topicById.get(cursorTopic.id)
    if (dto) {
      dto.postponedTo = movedTo
      // display target date instead of the postponed-from date
      dto.scheduledDate = movedTo.date
      dto.period = movedTo.period
      dto.isToday = false
    }
  }

  // ── today's lesson ──
  let todayLesson: TodayLessonDTO | null = null
  let todayNote: string | null = null
  if (holidays.has(todayIso)) {
    todayNote = `School holiday — ${holidayTitles.get(todayIso) ?? 'Holiday'}`
  } else if (todaySlotList.length === 0) {
    todayNote = `No ${assignment.subjectName} period scheduled today`
  } else if (!cursorTopic) {
    todayNote = 'All curriculum topics are completed'
  } else if (slotsLeftToday <= 0 && lastCompletedToday) {
    // today's teaching slots are fully consumed — show the last completion
    const lastExec = byTopic.get(lastCompletedToday.id)
    todayLesson = {
      topic: topicById.get(lastCompletedToday.id)!,
      period: lastExec?.period ?? todaySlotList[0].period,
      slotMinutes: todaySlotList[0].minutes,
      state: 'COMPLETED',
      movedTo: null,
      nextLessonToday: null,
    }
  } else {
    const cursorState: TodayLessonDTO['state'] = cursorPostponedToday
      ? 'POSTPONED'
      : cursorExec?.status === 'IN_PROGRESS'
        ? 'IN_PROGRESS'
        : 'PLANNED'
    todayLesson = {
      topic: topicById.get(cursorTopic.id)!,
      period: todaySlotList[Math.min(consumedSlotsToday, todaySlotList.length - 1)].period,
      slotMinutes: todaySlotList[0].minutes,
      state: cursorState,
      movedTo,
      nextLessonToday: null,
    }
  }

  // ── up next: the next ~8 projected lessons, with skipped holidays in between ──
  const upNext: UpNextItemDTO[] = []
  const projectedDates = [...projection.entries()]
    .filter(([topicId, v]) => {
      const t = topics.find((x) => x.id === topicId)
      return t && !isDone(t) && v.date > todayIso
    })
    .map(([, v]) => v)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.period ?? 0) - (b.period ?? 0))
  for (const p of projectedDates.slice(0, 8)) {
    const topic = topics.find((t) => projection.get(t.id) === p)
    if (!topic) continue
    upNext.push({
      date: p.date,
      kind: 'lesson',
      topic: topicById.get(topic.id)!,
      period: p.period,
      slotMinutes: todaySlotList[0]?.minutes ?? slots[0]?.minutes ?? 45,
    })
  }
  // holidays that fall inside the visible horizon → shown as skipped days
  const horizon = upNext.length > 0 ? upNext[upNext.length - 1].date : dayISO(addDays(today, 7))
  for (let d = addDays(today, 1); dayISO(d) <= horizon; d = addDays(d, 1)) {
    const iso = dayISO(d)
    if (holidays.has(iso)) {
      upNext.push({ date: iso, kind: 'holiday', holidayTitle: holidayTitles.get(iso) ?? 'Holiday' })
    }
  }
  upNext.sort((a, b) => a.date.localeCompare(b.date) || (a.period ?? 0) - (b.period ?? 0))
  const trimmed = upNext.slice(0, 12)

  // ── units + progress ──
  const units: CurriculumUnitDTO[] = unitRows.map((u) => {
    const unitTopics = scheduled.filter((t) => t.unitId === u.id)
    return {
      id: u.id,
      sequence: u.sequence,
      title: u.title,
      estimatedMinutes: u.estimatedMinutes,
      topics: unitTopics,
      completedTopics: unitTopics.filter((t) => t.status === 'COMPLETED').length,
    }
  })
  const completed = scheduled.filter((t) => t.status === 'COMPLETED')
  const skipped = scheduled.filter((t) => t.status === 'SKIPPED')
  const totalMinutes = topics.reduce((acc, t) => acc + t.estimatedMinutes, 0)
  const completedMinutes = completed.reduce((acc, t) => acc + t.estimatedMinutes, 0)

  return {
    classId: assignment.classId,
    classLabel: assignment.classLabel,
    subjectId: assignment.subjectId,
    subjectName: assignment.subjectName,
    curriculum: {
      id: curriculum.id,
      board: curriculum.board,
      academicSession: curriculum.academicSession,
      classLevel: curriculum.classLevel,
      subjectName: curriculum.subjectName,
      version: curriculum.version,
    },
    timetable: {
      periodsPerWeek: slots.length,
      minutesPerWeek,
      source: useDefault ? 'default' : 'timetable',
    },
    todayLesson,
    todayNote,
    upNext: trimmed,
    units,
    progress: {
      completedTopics: completed.length,
      skippedTopics: skipped.length,
      totalTopics: topics.length,
      remainingTopics: topics.length - completed.length - skipped.length,
      percent: topics.length > 0 ? Math.round((completed.length / topics.length) * 100) : 0,
      completedMinutes,
      totalMinutes,
    },
  }
}

/** count of assignments with a lesson due today (sidebar badge) */
async function dueTodayCount(ctx: TeacherHubContext, assignments: TeachingAssignmentRef[]): Promise<number> {
  const today = todayUTC()
  const todayIso = dayISO(today)
  let due = 0
  for (const a of assignments) {
    const selected = await buildSelected(ctx, a)
    if (selected?.todayLesson && selected.todayLesson.state !== 'COMPLETED' && selected.todayLesson.state !== 'POSTPONED') {
      // only count when today's slot is genuinely still pending
      if (selected.todayLesson.topic.scheduledDate === todayIso || selected.todayLesson.state === 'IN_PROGRESS') due++
    }
  }
  return due
}

export async function buildCurriculumPayload(
  ctx: TeacherHubContext,
  classId: string | null,
  subjectId: string | null,
): Promise<CurriculumExecutionPayload> {
  const assignments = await teachingAssignments(ctx)
  if (assignments.length === 0) {
    return {
      teacherName: ctx.name,
      today: dayISO(todayUTC()),
      assignments: [],
      dueTodayCount: 0,
      selected: null,
    }
  }
  const selectedAssignment =
    assignments.find((a) => a.classId === classId && a.subjectId === subjectId) ?? assignments[0]
  const selected = await buildSelected(ctx, selectedAssignment)
  const dueCount = await dueTodayCount(ctx, assignments)
  return {
    teacherName: ctx.name,
    today: dayISO(todayUTC()),
    assignments,
    dueTodayCount: dueCount,
    selected,
  }
}

// ---------- actions (§13/§15/§16/§17) ----------

async function resolveTopicInCurriculum(
  ctx: TeacherHubContext,
  assignment: TeachingAssignmentRef,
  topicId: unknown,
): Promise<string> {
  if (typeof topicId !== 'string' || !topicId.trim()) throw new Error('Topic is required')
  const cls = await db.class.findFirst({
    where: { id: assignment.classId, schoolId: ctx.schoolId },
    select: { gradeLevel: true, name: true },
  })
  if (!cls) throw new Error('NOT_FOUND')
  const curriculum = await resolveCurriculum(ctx, cls, assignment.subjectName)
  if (!curriculum) throw new Error('No curriculum is available for this class and subject')
  const unitRows = await db.curriculumUnit.findMany({
    where: { curriculumId: curriculum.id },
    select: { topics: { select: { id: true } } },
  })
  const topicIds = new Set(unitRows.flatMap((u) => u.topics.map((t) => t.id)))
  if (!topicIds.has(topicId)) throw new Error('Topic does not belong to this curriculum')
  return topicId
}

/**
 * Apply a lesson action to an owned execution row (one per topic — the
 * school curriculum instance state for this teacher/class/subject).
 */
export async function applyLessonAction(opts: {
  user: AuthUser
  ctx: TeacherHubContext
  assignment: TeachingAssignmentRef
  topicId: string
  action: LessonAction
}): Promise<void> {
  const { user, ctx, assignment, topicId, action } = opts
  const today = todayUTC()
  const todayIso = dayISO(today)

  // the topic's current slot (for honest date/period anchoring)
  const slots = await subjectSlots(ctx.schoolId, assignment.classId, assignment.subjectId)
  const todaySlots = slots
    .filter((s) => s.weekday === today.getUTCDay())
    .sort((a, b) => a.period - b.period)
  const { dates: holidays } = await holidayCalendar(ctx.schoolId)
  const eligibleToday = !holidays.has(todayIso) && todaySlots.length > 0
  const period = eligibleToday ? todaySlots[0].period : null

  const unique = {
    schoolId: ctx.schoolId,
    classId: assignment.classId,
    subjectId: assignment.subjectId,
    teacherId: ctx.userId,
    curriculumTopicId: topicId,
  }

  const existing = await db.lessonExecution.findUnique({
    where: { schoolId_classId_subjectId_teacherId_curriculumTopicId: unique },
  })

  if (action === 'start') {
    if (existing?.status === 'COMPLETED') throw new Error('This lesson is already completed')
    if (existing?.status === 'SKIPPED') throw new Error('This lesson was skipped')
    await db.lessonExecution.upsert({
      where: { schoolId_classId_subjectId_teacherId_curriculumTopicId: unique },
      update: { status: 'IN_PROGRESS', date: today, period },
      create: { ...unique, date: today, period, status: 'IN_PROGRESS' },
    })
  } else if (action === 'complete') {
    if (existing?.status === 'COMPLETED') throw new Error('This lesson is already completed')
    if (existing?.status === 'SKIPPED') throw new Error('This lesson was skipped')
    await db.lessonExecution.upsert({
      where: { schoolId_classId_subjectId_teacherId_curriculumTopicId: unique },
      update: { status: 'COMPLETED', date: today, period, completedAt: new Date() },
      create: { ...unique, date: today, period, status: 'COMPLETED', completedAt: new Date() },
    })
  } else if (action === 'postpone') {
    if (existing?.status === 'COMPLETED') throw new Error('A completed lesson cannot be rescheduled')
    await db.lessonExecution.upsert({
      where: { schoolId_classId_subjectId_teacherId_curriculumTopicId: unique },
      update: { status: 'POSTPONED', date: today, period, completedAt: null },
      create: { ...unique, date: today, period, status: 'POSTPONED' },
    })
  } else if (action === 'skip') {
    if (existing?.status === 'COMPLETED') throw new Error('A completed lesson cannot be skipped')
    await db.lessonExecution.upsert({
      where: { schoolId_classId_subjectId_teacherId_curriculumTopicId: unique },
      update: { status: 'SKIPPED', date: today, period, completedAt: null },
      create: { ...unique, date: today, period, status: 'SKIPPED' },
    })
  }

  const topicRow = await db.curriculumTopic.findUnique({ where: { id: topicId }, select: { title: true } })
  const actionLabel: Record<LessonAction, string> = {
    start: 'started',
    complete: 'completed',
    postpone: 'postponed to the next teaching slot',
    skip: 'skipped',
  }
  await auditTeacherAction(
    user,
    ctx.schoolId,
    action === 'complete' ? 'LESSON_COMPLETED' : 'LESSON_EXECUTION',
    `${assignment.subjectName} · ${assignment.classLabel} · ${topicRow?.title ?? 'Topic'} · ${actionLabel[action]}`,
  )
}

export { parseDay, dayISO, todayUTC, assertAssignment, resolveTopicInCurriculum }
