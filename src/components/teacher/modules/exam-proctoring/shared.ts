'use client'

/**
 * Exam Proctoring (EP-6) — shared contracts, status recipes and pure
 * helpers for the teacher's OPERATIONAL DUTY WORKSPACE.
 *
 * The module answers one question for the signed-in teacher:
 * "Which exam duty do I have, when is it, where is it, and what do I
 * need to do?" Everything on screen comes from the three
 * /api/teacher/proctoring* routes ({ ok, data } envelopes, EP backend) —
 * duties, the duty workspace (roster / attendance / incidents / seating)
 * and the authorized exam schedule. Nothing is fabricated client-side.
 *
 * Status vocabulary (spec §22 — exactly four duty states):
 *   Upcoming · In Progress · Completed · Cancelled
 * Exam-level statuses (Scheduled / Ongoing / Completed) only ever appear
 * inside the Exam Schedule tab.
 */

import { Check, Clock, X, type LucideIcon } from 'lucide-react'

// ─── API contracts (mirror of the EP server routes) ───────────────────

/** The four duty states (spec §22). */
export type DutyStatus = 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled'

export type ExamAttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE'

export const EXAM_ATTENDANCE_STATUSES: readonly ExamAttendanceStatus[] = [
  'PRESENT',
  'ABSENT',
  'LATE',
] as const

/** Runtime guard for statuses arriving inside JSON payloads. */
export function isExamAttendanceStatus(value: unknown): value is ExamAttendanceStatus {
  return (
    typeof value === 'string' &&
    (EXAM_ATTENDANCE_STATUSES as readonly unknown[]).includes(value)
  )
}

export type ExamIncidentType =
  | 'LATE_ARRIVAL'
  | 'UNFAIR_MEANS'
  | 'MEDICAL_ISSUE'
  | 'PAPER_ISSUE'
  | 'OTHER'

export const EXAM_INCIDENT_TYPES: readonly ExamIncidentType[] = [
  'LATE_ARRIVAL',
  'UNFAIR_MEANS',
  'MEDICAL_ISSUE',
  'PAPER_ISSUE',
  'OTHER',
] as const

/** One invigilation duty assigned to THIS teacher. */
export interface DutySummary {
  id: string
  examId: string
  examName: string
  examType: string
  subject: string
  classLabel: string
  /** "YYYY-MM-DD" */
  date: string
  startTime: string
  endTime: string
  room: string | null
  role: 'Invigilator'
  studentCount: number
  status: DutyStatus
  /** null = attendance was never marked for this duty. */
  attendance: { present: number; absent: number; late: number } | null
  incidentCount: number
}

export interface ProctoringStats {
  upcomingDuties: number
  todaysDuties: number
  studentsToSupervise: number
  dutyMinutes: number
  completedDuties: number
}

export interface SchedulePaper {
  id: string
  subject: string
  classLabel: string
  date: string
  startTime: string
  endTime: string
  room: string | null
  invigilatorName: string | null
  isMine: boolean
}

/** An exam the teacher is authorized to see (duty in it, or her classes). */
export interface ScheduleExam {
  examId: string
  name: string
  type: string
  status: string
  startDate: string | null
  endDate: string | null
  classes: string[]
  papers: SchedulePaper[]
}

export interface ProctoringPayload {
  teacherName: string
  academicSession: string | null
  todayKey: string
  duties: DutySummary[]
  stats: ProctoringStats
  schedule: ScheduleExam[]
}

export interface DutyRosterStudent {
  studentId: string
  name: string
  rollNo: string | null
  classLabel: string
  seatNumber: number
  seatLabel: string
  row: number | null
  column: number | null
}

export interface DutyAttendanceSummary {
  present: number
  absent: number
  late: number
  unmarked: number
  total: number
  markedBy: string | null
  savedAt: string | null
}

export interface DutyIncident {
  id: string
  /** null = room-level incident (no specific student). */
  studentName: string | null
  incidentType: ExamIncidentType
  occurredAt: string
  description: string
  reportedByName: string | null
}

export interface DutyDetail {
  duty: {
    id: string
    examName: string
    examType: string
    subject: string
    classLabel: string
    date: string
    startTime: string
    endTime: string
    room: string | null
    role: 'Invigilator'
    studentCount: number
    status: DutyStatus
  }
  /** false for Completed/Cancelled duties — history is read-only. */
  editable: boolean
  roster: DutyRosterStudent[]
  rosterAttendance: Record<string, ExamAttendanceStatus>
  attendance: DutyAttendanceSummary
  /** the invigilator's persisted sign-off (null = duty not completed yet) */
  completion: {
    completedAt: string
    presentCount: number
    absentCount: number
    lateCount: number
    incidentCount: number
  } | null
  incidents: DutyIncident[]
  room: { capacity: number; rows: number; cols: number }
}

/**
 * The editable attendance draft: ONLY students with an explicit selection.
 * A missing key = unmarked (the roster row shows Present as a visual
 * default, the counts strip counts it as unmarked — the honest truth).
 */
export type DutyDraft = Record<string, ExamAttendanceStatus>

export interface SaveAttendanceResult {
  saved: number
  counts: { present: number; absent: number; late: number }
}

export interface SaveIncidentResult {
  id: string
}

// ─── Duty status system (spec §22 — exactly these four) ───────────────

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary'

export const DUTY_STATUS_CONFIG: Record<DutyStatus, { variant: BadgeVariant }> = {
  Upcoming: { variant: 'info' },
  'In Progress': { variant: 'warning' },
  Completed: { variant: 'success' },
  Cancelled: { variant: 'danger' },
}

/** Exam-level statuses — Exam Schedule tab only, never for duties. */
export const EXAM_STATUS_CONFIG: Record<string, { variant: BadgeVariant; label: string }> = {
  SCHEDULED: { variant: 'info', label: 'Scheduled' },
  ONGOING: { variant: 'warning', label: 'Ongoing' },
  COMPLETED: { variant: 'success', label: 'Completed' },
}

export function examStatusConfig(status: string): { variant: BadgeVariant; label: string } {
  return EXAM_STATUS_CONFIG[status] ?? { variant: 'neutral', label: status }
}

// ─── Attendance status recipe (copied from the Class Attendance module) ─

export interface AttendanceRecipe {
  label: string
  icon: LucideIcon
  /** selected: filled bg + white text */
  active: string
  /** unselected: outline tint */
  inactive: string
  /** quiet row tint while this status is selected */
  row: string
  /** quiet read-only chip */
  chip: string
}

export const ATTENDANCE_CONFIG: Record<ExamAttendanceStatus, AttendanceRecipe> = {
  PRESENT: {
    label: 'Present',
    icon: Check,
    active: 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/30',
    inactive: 'text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30',
    row: 'border-emerald-500/20 bg-emerald-500/5',
    chip: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  ABSENT: {
    label: 'Absent',
    icon: X,
    active: 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/30',
    inactive: 'text-rose-600 hover:bg-rose-500/10 border-rose-500/30',
    row: 'border-rose-500/20 bg-rose-500/5',
    chip: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  },
  LATE: {
    label: 'Late',
    icon: Clock,
    active: 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/30',
    inactive: 'text-amber-600 hover:bg-amber-500/10 border-amber-500/30',
    row: 'border-amber-500/20 bg-amber-500/5',
    chip: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
}

export const UNMARKED_CHIP = 'bg-muted text-muted-foreground'

// ─── Incident types ───────────────────────────────────────────────────

export const INCIDENT_TYPE_CONFIG: Record<
  ExamIncidentType,
  { label: string; chip: string }
> = {
  LATE_ARRIVAL: {
    label: 'Late arrival',
    chip: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  UNFAIR_MEANS: {
    label: 'Unfair means concern',
    chip: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  },
  MEDICAL_ISSUE: {
    label: 'Medical issue',
    chip: 'bg-info/10 text-info',
  },
  PAPER_ISSUE: {
    label: 'Paper issue',
    chip: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  OTHER: {
    label: 'Other',
    chip: 'bg-muted text-muted-foreground',
  },
}

export function incidentTypeLabel(type: ExamIncidentType): string {
  return INCIDENT_TYPE_CONFIG[type].label
}

// ─── Date / time helpers (LOCAL time — never UTC, avoids off-by-one) ──

/** Date → calendar-day key "YYYY-MM-DD" in local time. */
export function toDayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** "YYYY-MM-DD" for today (local). */
export function todayKey(): string {
  return toDayKey(new Date())
}

/** Parse "YYYY-MM-DD" as a LOCAL date (midnight, never UTC). */
export function parseDayKey(key: string): Date {
  return new Date(`${key}T00:00:00`)
}

/** "17 Sep" — quiet in-sentence date. */
export function shortDate(key: string): string {
  const d = parseDayKey(key)
  return Number.isNaN(d.getTime())
    ? key
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/** "17 September 2026" — the duty-detail date line. */
export function longDate(key: string): string {
  const d = parseDayKey(key)
  return Number.isNaN(d.getTime())
    ? key
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** "09:00" → "09:00 AM" (12-hour clock, uppercase meridiem). */
export function formatClock(hm: string): string {
  const [h, m] = hm.split(':').map((x) => Number.parseInt(x, 10))
  if (!Number.isFinite(h)) return hm
  const d = new Date()
  d.setHours(h, Number.isFinite(m) ? m : 0, 0, 0)
  return d
    .toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    .toUpperCase()
}

/** "09:00" + "11:00" → "09:00 AM – 11:00 AM" (en-dash separator). */
export function formatClockRange(start: string, end: string): string {
  return `${formatClock(start)} – ${formatClock(end)}`
}

/** "09:00" + "11:00" → "09:00–11:00" (compact, list meta lines). */
export function formatCompactRange(start: string, end: string): string {
  return `${start}–${end}`
}

/**
 * "2026-2027" → "2026–27" (en-dash, short second year). Non-year strings
 * pass through untouched; null stays null.
 */
export function sessionLabel(academicSession: string | null): string | null {
  if (academicSession == null) return null
  const m = /^(\d{4})-(\d{4})$/.exec(academicSession.trim())
  if (!m) return academicSession
  return `${m[1]}–${m[2].slice(2)}`
}

/** 480 → "8h"; 270 → "4h 30m"; 0 → "0h". */
export function formatDutyMinutes(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  const h = Math.floor(m / 60)
  const rest = m % 60
  if (rest === 0) return `${h}h`
  return h > 0 ? `${h}h ${rest}m` : `${rest}m`
}

/** "10:42 AM" when saved the same calendar day, else "16 Sep, 10:42 AM". */
export function savedAtLabel(iso: string, dateKey: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const time = d
    .toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
    .toUpperCase()
  const day = toDayKey(d)
  return day === dateKey ? time : `${shortDate(day)}, ${time}`
}

/** "10 present · 1 absent · 1 late" — zero parts omitted. */
export function countsParts(counts: {
  present: number
  absent: number
  late: number
}): string[] {
  const parts: string[] = []
  if (counts.present > 0) parts.push(`${counts.present} present`)
  if (counts.absent > 0) parts.push(`${counts.absent} absent`)
  if (counts.late > 0) parts.push(`${counts.late} late`)
  return parts
}

// ─── Meta lines (spec-exact formats) ─────────────────────────────────

/**
 * The today-hero meta line:
 * "17 Sep · 09:00 AM – 11:00 AM · Room 201 · 19 students"
 */
export function heroMeta(duty: {
  date: string
  startTime: string
  endTime: string
  room: string | null
  studentCount: number
}): string {
  return [
    shortDate(duty.date),
    formatClockRange(duty.startTime, duty.endTime),
    duty.room ?? 'Room TBA',
    `${duty.studentCount} student${duty.studentCount === 1 ? '' : 's'}`,
  ].join(' · ')
}

/**
 * The quiet list meta line:
 * "18 Sep · 09:00–11:00 · Room 201 · 19 students"
 */
export function rowMeta(duty: {
  date: string
  startTime: string
  endTime: string
  room: string | null
  studentCount: number
}): string {
  return [
    shortDate(duty.date),
    formatCompactRange(duty.startTime, duty.endTime),
    duty.room ?? 'Room TBA',
    `${duty.studentCount} student${duty.studentCount === 1 ? '' : 's'}`,
  ].join(' · ')
}

// ─── Draft helpers (server truth → editable draft) ────────────────────

/**
 * The draft starts as the SAVED truth only (rosterAttendance). Unmarked
 * students have NO draft key: the roster row displays Present as a visual
 * default while the counts strip honestly counts them as unmarked — the
 * same "default without pretending" discipline as the Class Attendance
 * module's buildDraft.
 */
export function buildDraft(
  rosterAttendance: Record<string, ExamAttendanceStatus>,
): DutyDraft {
  const draft: DutyDraft = {}
  for (const [studentId, status] of Object.entries(rosterAttendance)) {
    if (isExamAttendanceStatus(status)) draft[studentId] = status
  }
  return draft
}

/** Live counts over the draft — missing keys count as unmarked. */
export function draftCounts(
  roster: readonly DutyRosterStudent[],
  draft: DutyDraft,
): { present: number; absent: number; late: number; unmarked: number } {
  const counts = { present: 0, absent: 0, late: 0, unmarked: 0 }
  for (const s of roster) {
    const status = draft[s.studentId]
    if (status === 'ABSENT') counts.absent++
    else if (status === 'LATE') counts.late++
    else if (status === 'PRESENT') counts.present++
    else counts.unmarked++
  }
  return counts
}

/** Structural equality of two drafts (key sets + values). */
export function draftsEqual(a: DutyDraft, b: DutyDraft): boolean {
  const ka = Object.keys(a)
  const kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  return ka.every((k) => a[k] === b[k])
}

// ─── Seating (read-only, scoped to THIS duty's room) ──────────────────

/** Place roster students onto the room grid (1-based row/column). */
export function seatGrid(
  room: { rows: number; cols: number },
  roster: readonly DutyRosterStudent[],
): (DutyRosterStudent | null)[][] {
  const grid: (DutyRosterStudent | null)[][] = Array.from({ length: room.rows }, () =>
    Array.from({ length: room.cols }, () => null),
  )
  for (const s of roster) {
    let r = s.row
    let c = s.column
    if (r == null || c == null || r < 1 || r > room.rows || c < 1 || c > room.cols) {
      // Fallback: derive the position from the sequential seat number.
      r = Math.floor((s.seatNumber - 1) / room.cols) + 1
      c = ((s.seatNumber - 1) % room.cols) + 1
    }
    if (r >= 1 && r <= room.rows && c >= 1 && c <= room.cols && !grid[r - 1][c - 1]) {
      grid[r - 1][c - 1] = s
    }
  }
  return grid
}
