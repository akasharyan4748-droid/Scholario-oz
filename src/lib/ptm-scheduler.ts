/**
 * ptm-scheduler — the server-side engine for the PTM Scheduler module
 * (Class Teacher Hub, spec §17 — PTM-1).
 *
 * ARCHITECTURE (mirrors class-attendance.ts):
 *   1. Authorization: every read AND write is scoped to
 *      { schoolId, teacherId: ctx.teacherId } — the Teacher-table id of
 *      the authenticated teacher. A row that is not the teacher's own
 *      simply does not exist for her (NOT_FOUND), never a FORBIDDEN leak.
 *   2. Booking targets: a student may be booked only from the teacher's
 *      authorized set — students of classes with an ACTIVE
 *      ClassSubjectAssignment for this teacher ∪ classes where she is the
 *      class teacher (the exact Student Directory scope, re-validated on
 *      every booking — client ids are NEVER trusted).
 *   3. Conflicts: slots tile the event window by construction (generated
 *      server-side, never client-supplied); one student can hold at most
 *      ONE booking (BOOKED or COMPLETED) per event — re-checked inside
 *      the write transaction; a slot transitions AVAILABLE → BOOKED via a
 *      conditional updateMany so a racing double-book cannot succeed.
 *   4. Dates/times: meetingDate is a UTC-midnight Date (house convention,
 *      "today" resolved in Asia/Kolkata); window/slot times are plain
 *      24h "HH:MM" local-schedule strings that are never timezone-shifted.
 *   5. Cancellation is soft (status CANCELLED, rows kept for history) and
 *      freezes every slot action on the event.
 */

import { db } from '@/lib/db'
import type { AuthUser } from '@/lib/auth'
import { auditTeacherAction, classLabelOf, type TeacherHubContext } from '@/lib/teacher-hub'
import type {
  PtmEventDetailDTO,
  PtmEventStatus,
  PtmEventSummaryDTO,
  PtmMutationDTO,
  PtmOverviewDTO,
  PtmSlotDTO,
  PtmSlotStatus,
  PtmStudentOptionDTO,
} from '@/lib/ptm-types'

const TZ = 'Asia/Kolkata'
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/
const MAX_SLOTS_PER_EVENT = 200

/** The school's "today" as YYYY-MM-DD (matches the Lesson Planner /
 *  Class Attendance convention). */
export function ptmTodayStr(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date())
}

// ─── time helpers (24h "HH:MM" schedule strings) ──────────────────────

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

/** Slot definitions tiling [startMin, endMin) — each slot fully inside
 *  the window (a trailing partial slot is never generated). */
export function generateSlotDefs(
  startMin: number,
  endMin: number,
  slotMinutes: number,
): { startTime: string; endTime: string }[] {
  const defs: { startTime: string; endTime: string }[] = []
  for (let m = startMin; m + slotMinutes <= endMin; m += slotMinutes) {
    defs.push({ startTime: minutesToTime(m), endTime: minutesToTime(m + slotMinutes) })
  }
  return defs
}

function dayToDate(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`)
}

function toDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// ─── the teacher's authorized students (booking targets) ──────────────

/** The teacher's authorized class ids: ACTIVE subject-assignment classes
 *  ∪ class-teacher classes (the Student Directory scope). */
async function authorizedClassIds(ctx: TeacherHubContext): Promise<string[]> {
  const [assignments, ctClasses] = await Promise.all([
    db.classSubjectAssignment.findMany({
      where: { schoolId: ctx.schoolId, teacherId: ctx.teacherId, isActive: true },
      select: { classId: true },
    }),
    db.class.findMany({
      where: { schoolId: ctx.schoolId, classTeacherId: ctx.userId },
      select: { id: true },
    }),
  ])
  return [...new Set([...assignments.map((a) => a.classId), ...ctClasses.map((c) => c.id)])]
}

/** The teacher's authorized students with their guardian fields — the
 *  booking dialog's option list (and the booking validation set). */
export async function ptmStudentOptions(ctx: TeacherHubContext): Promise<PtmStudentOptionDTO[]> {
  const classIds = await authorizedClassIds(ctx)
  if (!classIds.length) return []
  const students = await db.student.findMany({
    where: { schoolId: ctx.schoolId, classId: { in: classIds } },
    select: {
      id: true,
      rollNo: true,
      guardianName: true,
      guardianPhone: true,
      class: { select: { id: true, name: true, section: true } },
      user: { select: { name: true } },
    },
  })
  return students
    .map((s) => ({
      studentId: s.id,
      name: s.user?.name ?? 'Unnamed student',
      rollNo: s.rollNo,
      classLabel: s.class ? classLabelOf(s.class) : 'Unassigned',
      guardianName: s.guardianName,
      guardianPhone: s.guardianPhone,
    }))
    .sort(
      (a, b) =>
        a.classLabel.localeCompare(b.classLabel) ||
        (Number(a.rollNo) || 999) - (Number(b.rollNo) || 999) ||
        a.name.localeCompare(b.name),
    )
}

/** Validate + resolve a booking target inside the teacher's authorized set. */
async function assertStudentAuthorized(
  ctx: TeacherHubContext,
  studentId: unknown,
): Promise<PtmStudentOptionDTO> {
  if (typeof studentId !== 'string' || !studentId.trim()) throw new Error('STUDENT_REQUIRED')
  const options = await ptmStudentOptions(ctx)
  const student = options.find((s) => s.studentId === studentId)
  if (!student) throw new Error('STUDENT_NOT_AUTHORIZED')
  return student
}

// ─── serialization ─────────────────────────────────────────────────────

type EventWithSlots = {
  id: string
  title: string
  meetingDate: Date
  windowStart: string
  windowEnd: string
  slotMinutes: number
  location: string | null
  status: string
  slots: { status: string }[]
}

function toEventSummary(e: EventWithSlots): PtmEventSummaryDTO {
  const total = e.slots.length
  const booked = e.slots.filter((s) => s.status === 'BOOKED').length
  const completed = e.slots.filter((s) => s.status === 'COMPLETED').length
  const available = e.slots.filter((s) => s.status === 'AVAILABLE').length
  return {
    id: e.id,
    title: e.title,
    meetingDate: toDay(e.meetingDate),
    windowStart: e.windowStart,
    windowEnd: e.windowEnd,
    slotMinutes: e.slotMinutes,
    location: e.location,
    status: e.status as PtmEventStatus,
    totalSlots: total,
    bookedSlots: booked,
    completedSlots: completed,
    availableSlots: available,
    fillRate: total ? Math.round(((booked + completed) / total) * 100) : 0,
  }
}

type SlotRow = {
  id: string
  startTime: string
  endTime: string
  status: string
  bookedByName: string | null
  contactPhone: string | null
  notes: string | null
  completedAt: Date | null
  student: { id: string; rollNo: string | null; user: { name: string | null } | null; class: { name: string; section: string | null } | null } | null
}

function toSlotDTO(s: SlotRow): PtmSlotDTO {
  return {
    id: s.id,
    startTime: s.startTime,
    endTime: s.endTime,
    status: s.status as PtmSlotStatus,
    student: s.student
      ? {
          id: s.student.id,
          name: s.student.user?.name ?? 'Unnamed student',
          rollNo: s.student.rollNo,
          classLabel: s.student.class ? classLabelOf(s.student.class) : 'Unassigned',
        }
      : null,
    bookedByName: s.bookedByName,
    contactPhone: s.contactPhone,
    notes: s.notes,
    completedAt: s.completedAt ? s.completedAt.toISOString() : null,
  }
}

// ─── reads ─────────────────────────────────────────────────────────────

/** The teacher's events with slot counts, newest meetingDate first. */
export async function ptmEventSummaries(ctx: TeacherHubContext): Promise<PtmEventSummaryDTO[]> {
  const events = await db.ptmEvent.findMany({
    where: { schoolId: ctx.schoolId, teacherId: ctx.teacherId },
    select: {
      id: true,
      title: true,
      meetingDate: true,
      windowStart: true,
      windowEnd: true,
      slotMinutes: true,
      location: true,
      status: true,
      slots: { select: { status: true } },
    },
    orderBy: [{ meetingDate: 'desc' }, { createdAt: 'desc' }],
  })
  return events.map(toEventSummary)
}

/** One event + its slots (ordered by startTime) — owner-scoped: another
 *  teacher's event answers NOT_FOUND, never its data. */
export async function ptmEventDetail(ctx: TeacherHubContext, eventId: unknown): Promise<PtmEventDetailDTO> {
  if (typeof eventId !== 'string' || !eventId.trim()) throw new Error('NOT_FOUND')
  const event = await db.ptmEvent.findFirst({
    where: { id: eventId, schoolId: ctx.schoolId, teacherId: ctx.teacherId },
    select: {
      id: true,
      title: true,
      meetingDate: true,
      windowStart: true,
      windowEnd: true,
      slotMinutes: true,
      location: true,
      status: true,
      slots: {
        orderBy: { startTime: 'asc' },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          status: true,
          bookedByName: true,
          contactPhone: true,
          notes: true,
          completedAt: true,
          student: {
            select: {
              id: true,
              rollNo: true,
              user: { select: { name: true } },
              class: { select: { name: true, section: true } },
            },
          },
        },
      },
    },
  })
  if (!event) throw new Error('NOT_FOUND')
  return { ...toEventSummary(event), slots: event.slots.map(toSlotDTO) }
}

/** GET /api/teacher/ptm — today + events + authorized students. */
export async function ptmOverview(ctx: TeacherHubContext): Promise<PtmOverviewDTO> {
  const [events, students] = await Promise.all([ptmEventSummaries(ctx), ptmStudentOptions(ctx)])
  return { today: ptmTodayStr(), events, students }
}

/** Every mutation returns the refreshed detail + summaries (one response
 *  replaces the client's whole module state). */
async function mutationPayload(ctx: TeacherHubContext, eventId: string): Promise<PtmMutationDTO> {
  const [event, events] = await Promise.all([
    ptmEventDetail(ctx, eventId),
    ptmEventSummaries(ctx),
  ])
  return { event, events }
}

// ─── owner-scoped slot fetch ───────────────────────────────────────────

async function ownedSlot(ctx: TeacherHubContext, slotId: unknown) {
  if (typeof slotId !== 'string' || !slotId.trim()) throw new Error('NOT_FOUND')
  const slot = await db.ptmSlot.findFirst({
    where: { id: slotId, schoolId: ctx.schoolId, teacherId: ctx.teacherId },
    select: {
      id: true,
      startTime: true,
      status: true,
      eventId: true,
      event: { select: { id: true, title: true, status: true } },
    },
  })
  if (!slot) throw new Error('NOT_FOUND')
  return slot
}

// ─── mutations ─────────────────────────────────────────────────────────

/**
 * Create a PTM event + its auto-generated slots. Validation: title 3..120
 * chars, meetingDate not in the past (Asia/Kolkata), windowEnd >
 * windowStart, slotMinutes 5..60, at least one slot must fit, at most
 * MAX_SLOTS_PER_EVENT slots. Audits PTM_EVENT_CREATED.
 */
export async function createPtmEvent(
  user: AuthUser,
  ctx: TeacherHubContext,
  body: { title?: unknown; meetingDate?: unknown; windowStart?: unknown; windowEnd?: unknown; slotMinutes?: unknown; location?: unknown } | null,
): Promise<PtmMutationDTO> {
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  if (title.length < 3) throw new Error('TITLE_REQUIRED')
  if (title.length > 120) throw new Error('INVALID_TITLE')

  const dateStr = body?.meetingDate
  if (typeof dateStr !== 'string' || !DATE_RE.test(dateStr)) throw new Error('INVALID_DATE')
  const meetingDate = dayToDate(dateStr)
  if (Number.isNaN(meetingDate.getTime())) throw new Error('INVALID_DATE')
  if (dateStr < ptmTodayStr()) throw new Error('PAST_DATE')

  const windowStart = body?.windowStart
  const windowEnd = body?.windowEnd
  if (typeof windowStart !== 'string' || !TIME_RE.test(windowStart) || typeof windowEnd !== 'string' || !TIME_RE.test(windowEnd)) {
    throw new Error('INVALID_WINDOW')
  }
  const startMin = timeToMinutes(windowStart)
  const endMin = timeToMinutes(windowEnd)
  if (endMin <= startMin) throw new Error('INVALID_WINDOW')

  const slotMinutes = body?.slotMinutes
  if (typeof slotMinutes !== 'number' || !Number.isInteger(slotMinutes) || slotMinutes < 5 || slotMinutes > 60) {
    throw new Error('INVALID_SLOT_MINUTES')
  }

  const location = typeof body?.location === 'string' ? body.location.trim().slice(0, 120) : ''
  if (location && location.length < 2) throw new Error('INVALID_LOCATION')

  const slotDefs = generateSlotDefs(startMin, endMin, slotMinutes)
  if (!slotDefs.length) throw new Error('INVALID_WINDOW')
  if (slotDefs.length > MAX_SLOTS_PER_EVENT) throw new Error('TOO_MANY_SLOTS')

  const event = await db.ptmEvent.create({
    data: {
      schoolId: ctx.schoolId,
      teacherId: ctx.teacherId,
      title,
      meetingDate,
      windowStart,
      windowEnd,
      slotMinutes,
      location: location || null,
      status: 'SCHEDULED',
      slots: {
        create: slotDefs.map((s) => ({
          schoolId: ctx.schoolId,
          teacherId: ctx.teacherId,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      },
    },
    select: { id: true },
  })

  await auditTeacherAction(
    user,
    ctx.schoolId,
    'PTM_EVENT_CREATED',
    `PTM event created: ${title} · ${dateStr} · ${windowStart}–${windowEnd} · ${slotDefs.length} × ${slotMinutes}-min slots`,
  )

  return mutationPayload(ctx, event.id)
}

/** Soft-cancel an event (rows kept for history; slot actions freeze). */
export async function cancelPtmEvent(
  user: AuthUser,
  ctx: TeacherHubContext,
  eventId: unknown,
): Promise<PtmMutationDTO> {
  if (typeof eventId !== 'string' || !eventId.trim()) throw new Error('NOT_FOUND')
  const event = await db.ptmEvent.findFirst({
    where: { id: eventId, schoolId: ctx.schoolId, teacherId: ctx.teacherId },
    select: { id: true, title: true, status: true, meetingDate: true },
  })
  if (!event) throw new Error('NOT_FOUND')
  if (event.status !== 'SCHEDULED') throw new Error('EVENT_NOT_ACTIVE')

  await db.ptmEvent.update({ where: { id: event.id }, data: { status: 'CANCELLED' } })

  await auditTeacherAction(
    user,
    ctx.schoolId,
    'PTM_EVENT_CANCELLED',
    `PTM event cancelled: ${event.title} · ${toDay(event.meetingDate)}`,
  )

  return mutationPayload(ctx, event.id)
}

/**
 * Book an AVAILABLE slot for one of the teacher's authorized students.
 * Conflicts handled server-side, re-checked inside the write transaction:
 *   · the student must not already hold a booking in this event
 *     (STUDENT_ALREADY_BOOKED);
 *   · the slot must still be AVAILABLE at write time (conditional
 *     updateMany — a racing double-book cannot succeed).
 */
export async function bookPtmSlot(
  user: AuthUser,
  ctx: TeacherHubContext,
  slotId: unknown,
  body: { studentId?: unknown; bookedByName?: unknown; contactPhone?: unknown } | null,
): Promise<PtmMutationDTO> {
  const slot = await ownedSlot(ctx, slotId)
  if (slot.event.status !== 'SCHEDULED') throw new Error('EVENT_NOT_ACTIVE')
  if (slot.status !== 'AVAILABLE') throw new Error('SLOT_NOT_AVAILABLE')

  const student = await assertStudentAuthorized(ctx, body?.studentId)

  const bookedByName = typeof body?.bookedByName === 'string' ? body.bookedByName.trim() : ''
  if (bookedByName.length < 2) throw new Error('BOOKED_BY_REQUIRED')
  if (bookedByName.length > 80) throw new Error('INVALID_BOOKED_BY')
  const contactPhone = typeof body?.contactPhone === 'string' ? body.contactPhone.trim() : ''
  if (contactPhone.length > 20) throw new Error('INVALID_PHONE')

  await db.$transaction(async (tx) => {
    const conflict = await tx.ptmSlot.findFirst({
      where: {
        eventId: slot.eventId,
        studentId: student.studentId,
        status: { in: ['BOOKED', 'COMPLETED'] },
      },
      select: { id: true },
    })
    if (conflict) throw new Error('STUDENT_ALREADY_BOOKED')
    const updated = await tx.ptmSlot.updateMany({
      where: { id: slot.id, status: 'AVAILABLE' },
      data: {
        status: 'BOOKED',
        studentId: student.studentId,
        bookedByName,
        contactPhone: contactPhone || null,
      },
    })
    if (updated.count !== 1) throw new Error('SLOT_NOT_AVAILABLE')
  })

  await auditTeacherAction(
    user,
    ctx.schoolId,
    'PTM_SLOT_BOOKED',
    `PTM slot booked: ${slot.event.title} · ${slot.startTime} · ${student.name} (with ${bookedByName})`,
  )

  return mutationPayload(ctx, slot.eventId)
}

/** Release a BOOKED slot back to AVAILABLE (clears student/notes). */
export async function releasePtmSlot(
  user: AuthUser,
  ctx: TeacherHubContext,
  slotId: unknown,
): Promise<PtmMutationDTO> {
  const slot = await ownedSlot(ctx, slotId)
  if (slot.event.status !== 'SCHEDULED') throw new Error('EVENT_NOT_ACTIVE')
  if (slot.status === 'COMPLETED') throw new Error('SLOT_COMPLETED')
  if (slot.status !== 'BOOKED') throw new Error('SLOT_NOT_BOOKED')

  await db.ptmSlot.update({
    where: { id: slot.id },
    data: {
      status: 'AVAILABLE',
      studentId: null,
      bookedByName: null,
      contactPhone: null,
      notes: null,
      completedAt: null,
    },
  })

  await auditTeacherAction(
    user,
    ctx.schoolId,
    'PTM_SLOT_RELEASED',
    `PTM slot released: ${slot.event.title} · ${slot.startTime}`,
  )

  return mutationPayload(ctx, slot.eventId)
}

/** Mark a BOOKED meeting completed (completedAt stamped, notes kept). */
export async function completePtmSlot(
  user: AuthUser,
  ctx: TeacherHubContext,
  slotId: unknown,
): Promise<PtmMutationDTO> {
  const slot = await ownedSlot(ctx, slotId)
  if (slot.event.status !== 'SCHEDULED') throw new Error('EVENT_NOT_ACTIVE')
  if (slot.status !== 'BOOKED') throw new Error('SLOT_NOT_BOOKED')

  await db.ptmSlot.update({
    where: { id: slot.id },
    data: { status: 'COMPLETED', completedAt: new Date() },
  })

  await auditTeacherAction(
    user,
    ctx.schoolId,
    'PTM_SLOT_COMPLETED',
    `PTM meeting completed: ${slot.event.title} · ${slot.startTime}`,
  )

  return mutationPayload(ctx, slot.eventId)
}

/** Persist meeting notes (≤2000 chars; empty clears). Allowed while the
 *  slot is BOOKED or COMPLETED — notes are the meeting's work product. */
export async function saveSlotNotes(
  user: AuthUser,
  ctx: TeacherHubContext,
  slotId: unknown,
  notes: unknown,
): Promise<PtmMutationDTO> {
  const slot = await ownedSlot(ctx, slotId)
  if (slot.event.status === 'CANCELLED') throw new Error('EVENT_NOT_ACTIVE')
  if (slot.status !== 'BOOKED' && slot.status !== 'COMPLETED') throw new Error('SLOT_NOT_BOOKED')

  const text = typeof notes === 'string' ? notes : ''
  if (text.length > 2000) throw new Error('NOTES_TOO_LONG')

  await db.ptmSlot.update({ where: { id: slot.id }, data: { notes: text.trim() ? text.trim() : null } })

  await auditTeacherAction(
    user,
    ctx.schoolId,
    'PTM_SLOT_NOTES_SAVED',
    `PTM meeting notes saved: ${slot.event.title} · ${slot.startTime}`,
  )

  return mutationPayload(ctx, slot.eventId)
}
