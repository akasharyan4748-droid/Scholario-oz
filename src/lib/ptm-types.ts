/**
 * ptm-types — the pure DTO contract for the PTM Scheduler module
 * (Class Teacher Hub, spec §17 — PTM-1). Client-safe: no server imports.
 *
 * MENTAL MODEL:
 *   A teacher schedules a PTM EVENT (date + booking window + slot length)
 *   → slots are auto-generated tiling the window
 *   → the teacher BOOKS a slot for one of her authorized students
 *     (with the guardian's name + phone)
 *   → after the meeting she writes NOTES and marks the slot COMPLETED
 *     (or RELEASES the booking back to available).
 *   Events and slots are owned by ONE teacher (Teacher-table id) — another
 *   teacher's data is never reachable, not even by id.
 */

import type { TeacherHubContext } from '@/lib/teacher-hub'

/** The only statuses a PtmEvent may carry. */
export type PtmEventStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'

/** The only statuses a PtmSlot may carry. */
export type PtmSlotStatus = 'AVAILABLE' | 'BOOKED' | 'COMPLETED'

// ─── students (the teacher's authorized booking targets) ──────────────

/** A student the teacher may book into her slots (students of her ACTIVE
 *  subject-assignment classes ∪ her class-teacher classes — the same
 *  authorized set the Student Directory exposes). */
export interface PtmStudentOptionDTO {
  studentId: string
  name: string
  rollNo: string | null
  classLabel: string
  /** the student record's guardian fields, used to prefill the booking form */
  guardianName: string | null
  guardianPhone: string | null
}

// ─── events ────────────────────────────────────────────────────────────

/** One PTM event with its slot counts (the events-grid card). */
export interface PtmEventSummaryDTO {
  id: string
  title: string
  /** YYYY-MM-DD — the meeting day */
  meetingDate: string
  /** 24h "HH:MM" booking window */
  windowStart: string
  windowEnd: string
  slotMinutes: number
  location: string | null
  status: PtmEventStatus
  totalSlots: number
  /** status = BOOKED only */
  bookedSlots: number
  /** status = COMPLETED only */
  completedSlots: number
  /** status = AVAILABLE */
  availableSlots: number
  /** occupied (booked + completed) ÷ total, rounded to a whole percent */
  fillRate: number
}

/** GET /api/teacher/ptm — the module's aggregate opening payload. */
export interface PtmOverviewDTO {
  /** YYYY-MM-DD — the school's "today" (Asia/Kolkata), for date guards */
  today: string
  /** the teacher's events, newest meetingDate first */
  events: PtmEventSummaryDTO[]
  /** the teacher's authorized students (booking targets) */
  students: PtmStudentOptionDTO[]
}

// ─── slots + event detail ─────────────────────────────────────────────

/** The booked student rendered inside a slot row. */
export interface PtmSlotStudentDTO {
  id: string
  name: string
  rollNo: string | null
  classLabel: string
}

/** One slot inside an event's window. */
export interface PtmSlotDTO {
  id: string
  /** 24h "HH:MM" */
  startTime: string
  endTime: string
  status: PtmSlotStatus
  student: PtmSlotStudentDTO | null
  /** the guardian this booking is with */
  bookedByName: string | null
  contactPhone: string | null
  notes: string | null
  /** ISO timestamp — set when the meeting was marked completed */
  completedAt: string | null
}

/** GET /api/teacher/ptm/[eventId] — an event + its slots (by startTime). */
export interface PtmEventDetailDTO extends PtmEventSummaryDTO {
  slots: PtmSlotDTO[]
}

/** Every mutation's response: the refreshed event detail + the refreshed
 *  event summaries (one response replaces the whole client state — no
 *  re-GET after a write). */
export interface PtmMutationDTO {
  event: PtmEventDetailDTO
  events: PtmEventSummaryDTO[]
}

// ─── request bodies ────────────────────────────────────────────────────

/** POST /api/teacher/ptm body. */
export interface PtmCreateEventBody {
  title: string
  /** YYYY-MM-DD */
  meetingDate: string
  /** 24h "HH:MM" */
  windowStart: string
  windowEnd: string
  /** 5..60 */
  slotMinutes: number
  location?: string
}

/** POST /api/teacher/ptm/slot/[slotId] { action: 'book', … } body. */
export interface PtmBookSlotBody {
  studentId: string
  bookedByName: string
  contactPhone?: string
}

/** Re-exported so server modules can share the authorization context type. */
export type { TeacherHubContext }
