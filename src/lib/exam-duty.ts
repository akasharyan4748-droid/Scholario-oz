/**
 * exam-duty — the canonical server-side library for the Teacher Exam
 * Proctoring module. One duty = one ExamScheduleItem the signed-in teacher
 * invigilates. Everything here is school-tenant scoped and authorization is
 * enforced on ids (invigilatorId), with the display name only as a legacy
 * fallback — never the security boundary alone.
 *
 * Status vocabulary (exactly four, spec §22):
 *   Upcoming · In Progress · Completed · Cancelled
 */

import { db } from '@/lib/db'
import type { AuthUser } from '@/lib/auth'
import { classLabelOf } from '@/lib/teacher-hub'

export type DutyStatus = 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled'

export const EXAM_ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE'] as const
export type ExamAttendanceStatus = (typeof EXAM_ATTENDANCE_STATUSES)[number]

export const EXAM_INCIDENT_TYPES = [
  'LATE_ARRIVAL',
  'UNFAIR_MEANS',
  'MEDICAL_ISSUE',
  'PAPER_ISSUE',
  'OTHER',
] as const
export type ExamIncidentType = (typeof EXAM_INCIDENT_TYPES)[number]

export function isExamAttendanceStatus(v: unknown): v is ExamAttendanceStatus {
  return (
    typeof v === 'string' &&
    (EXAM_ATTENDANCE_STATUSES as readonly unknown[]).includes(v)
  )
}

export function isExamIncidentType(v: unknown): v is ExamIncidentType {
  return (
    typeof v === 'string' &&
    (EXAM_INCIDENT_TYPES as readonly unknown[]).includes(v)
  )
}

// ─── Time helpers (UTC day keys — exam dates are stored as UTC midnights) ──

export function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** "09:30" → minutes since midnight. */
export function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map((x) => Number.parseInt(x, 10))
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0)
}

/**
 * Derive a duty's status from the paper's date + time window and the exam's
 * own status. Pure — same rule for every consumer.
 *
 * SAME-DAY RULE: once the paper starts, the duty stays "In Progress" for the
 * rest of the exam DAY. Real invigilators typically submit attendance and
 * incident reports AFTER the paper ends — locking the duty at endTime would
 * strand unsubmitted attendance permanently (read-only history). The duty
 * flips to Completed (read-only) only from the next day.
 */
export function deriveDutyStatus(
  date: Date,
  startTime: string,
  endTime: string,
  examStatus: string,
  now: Date,
): DutyStatus {
  if (examStatus === 'CANCELLED') return 'Cancelled'
  const paper = dayKey(date)
  const today = dayKey(now)
  if (paper < today) return 'Completed'
  if (paper > today) return 'Upcoming'
  const cur = now.getUTCHours() * 60 + now.getUTCMinutes()
  if (cur < hmToMinutes(startTime)) return 'Upcoming'
  // Paper started today — attendance/incident entry stays open until midnight.
  return 'In Progress'
}

/** Completed/Cancelled duties are read-only history. */
export function dutyEditable(status: DutyStatus): boolean {
  return status === 'Upcoming' || status === 'In Progress'
}

// ─── Duty completion (the invigilator's sign-off) ────────────────────────

export interface DutyCompletionInfo {
  completedAt: string
  presentCount: number
  absentCount: number
  lateCount: number
  incidentCount: number
}

/** The persisted sign-off for one duty (null = not completed yet). */
export async function dutyCompletionOf(
  scheduleItemId: string,
): Promise<DutyCompletionInfo | null> {
  const row = await db.examDutyCompletion.findUnique({
    where: { scheduleItemId },
  })
  if (!row) return null
  return {
    completedAt: row.completedAt.toISOString(),
    presentCount: row.presentCount,
    absentCount: row.absentCount,
    lateCount: row.lateCount,
    incidentCount: row.incidentCount,
  }
}

/** The paper's start timestamp (UTC date + "HH:MM" start time). */
export function paperStartAt(duty: { date: Date; startTime: string }): Date {
  const [h, m] = duty.startTime.split(':').map((x) => Number.parseInt(x, 10))
  const d = new Date(duty.date)
  d.setUTCHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0)
  return d
}

// ─── Duty resolution + authorization ─────────────────────────────────────

export interface DutyRow {
  id: string
  examId: string
  examName: string
  examType: string
  examStatus: string
  subject: string
  subjectId: string
  classId: string
  classLabel: string
  date: Date
  startTime: string
  endTime: string
  room: string | null
  invigilatorId: string | null
  invigilatorName: string | null
}

/**
 * Fetch one schedule item with its exam/class/subject and verify the
 * signed-in teacher is the assigned invigilator FOR THE RIGHT SCHOOL.
 * Returns null when not found, throws FORBIDDEN when the duty exists but
 * belongs to someone else (or another school).
 */
export async function findAuthorizedDuty(
  user: AuthUser,
  scheduleItemId: string,
): Promise<DutyRow | null> {
  const item = await db.examScheduleItem.findUnique({
    where: { id: scheduleItemId },
    include: {
      exam: { select: { id: true, schoolId: true, name: true, type: true, status: true } },
      class: { select: { id: true, name: true, section: true } },
      subject: { select: { id: true, name: true } },
    },
  })
  if (!item) return null
  if (item.exam.schoolId !== user.schoolId) throw new Error('FORBIDDEN')

  const teacherName = (user.name || '').trim().toLowerCase()
  const byId = item.invigilatorId != null && item.invigilatorId === user.id
  const byName =
    item.invigilatorName != null &&
    teacherName.length > 0 &&
    item.invigilatorName.trim().toLowerCase() === teacherName
  if (!byId && !byName) throw new Error('FORBIDDEN')

  return {
    id: item.id,
    examId: item.exam.id,
    examName: item.exam.name,
    examType: item.exam.type,
    examStatus: item.exam.status,
    subject: item.subject.name,
    subjectId: item.subject.id,
    classId: item.class.id,
    classLabel: classLabelOf(item.class),
    date: item.date,
    startTime: item.startTime,
    endTime: item.endTime,
    room: item.room,
    invigilatorId: item.invigilatorId,
    invigilatorName: item.invigilatorName,
  }
}

// ─── Roster (the room the invigilator supervises) ───────────────────────

export interface RosterStudent {
  studentId: string
  name: string
  rollNo: string | null
  classLabel: string
  seatNumber: number
  seatLabel: string
  row: number | null
  column: number | null
}

/** Seat "A-01" style label derived from row/column (fallback: plain number). */
export function seatLabelOf(seat: {
  seatNumber: number
  row: number | null
  column: number | null
}): string {
  const ROWS = 'ABCDEFG'
  if (seat.row != null && seat.column != null && seat.row >= 1 && seat.row <= ROWS.length) {
    return `${ROWS[seat.row - 1]}-${String(seat.column).padStart(2, '0')}`
  }
  return String(seat.seatNumber).padStart(2, '0')
}

/**
 * The students seated in this duty's room for this exam — the roster the
 * invigilator is responsible for (mixed classes supported).
 */
export async function dutyRoster(duty: DutyRow): Promise<RosterStudent[]> {
  if (!duty.room) return []
  const seats = await db.examSeatAssignment.findMany({
    where: { examId: duty.examId, room: duty.room },
    include: {
      student: {
        select: {
          id: true,
          rollNo: true,
          user: { select: { name: true } },
          class: { select: { name: true, section: true } },
        },
      },
    },
    orderBy: { seatNumber: 'asc' },
  })
  return seats.map((s) => ({
    studentId: s.student.id,
    name: s.student.user.name ?? 'Unknown',
    rollNo: s.student.rollNo,
    classLabel: classLabelOf(s.student.class),
    seatNumber: s.seatNumber,
    seatLabel: seatLabelOf(s),
    row: s.row,
    column: s.column,
  }))
}

// ─── Attendance summary ─────────────────────────────────────────────────

export interface DutyAttendanceSummary {
  present: number
  absent: number
  late: number
  unmarked: number
  total: number
  markedBy: string | null
  savedAt: string | null
}

export async function dutyAttendanceSummary(
  duty: DutyRow,
  roster: readonly RosterStudent[],
): Promise<DutyAttendanceSummary> {
  const records = await db.examAttendance.findMany({
    where: { examId: duty.examId, scheduleItemId: duty.id },
    select: { studentId: true, status: true, markedBy: true, updatedAt: true },
  })
  const byStudent = new Map(records.map((r) => [r.studentId, r]))
  const summary: DutyAttendanceSummary = {
    present: 0,
    absent: 0,
    late: 0,
    unmarked: 0,
    total: roster.length,
    markedBy: null,
    savedAt: null,
  }
  for (const s of roster) {
    const rec = byStudent.get(s.studentId)
    if (!rec) {
      summary.unmarked++
      continue
    }
    if (rec.status === 'ABSENT') summary.absent++
    else if (rec.status === 'LATE') summary.late++
    else summary.present++
    if (!summary.savedAt || rec.updatedAt > new Date(summary.savedAt)) {
      summary.savedAt = rec.updatedAt.toISOString()
      summary.markedBy = rec.markedBy
    }
  }
  return summary
}
