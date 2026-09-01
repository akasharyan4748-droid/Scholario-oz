/**
 * Mock audit store — canonical source of truth for examination audit events.
 *
 * Every meaningful state change in the Examination module (marks submitted /
 * verified / locked / unlocked, attendance submitted, grace applied, result
 * declared / published) records an event here. The Audit tab reads from this
 * store directly — it never maintains its own separate audit array.
 *
 * Design:
 *  - `recordEvent` is the single entry point. All other stores call it.
 *  - Events are scoped to an examId so the Audit tab can filter.
 *  - Each event carries enough context (user, role, entity, oldValue, newValue,
 *    metadata) to render a meaningful timeline entry without re-deriving.
 *  - Seeded with a few historical events for the completed Mid-Term exam so
 *    the Audit tab is never empty on first load.
 */

import { create } from 'zustand'

export type AuditAction =
  | 'EXAM_CREATED'
  | 'SCHEDULE_UPDATED'
  | 'SEATING_GENERATED'
  | 'INVIGILATOR_ASSIGNED'
  | 'MARKS_ENTERED'
  | 'MARKS_SUBMITTED'
  | 'MARKS_VERIFIED'
  | 'MARKS_LOCKED'
  | 'MARKS_UNLOCKED'
  | 'ATTENDANCE_SUBMITTED'
  | 'GRACE_APPLIED'
  | 'RESULT_DECLARED'
  | 'RESULT_PUBLISHED'
  | 'OUTCOME_OVERRIDDEN'

export type AuditRole = 'PRINCIPAL' | 'TEACHER' | 'SYSTEM' | 'INVIGILATOR'

export interface AuditEvent {
  id: string
  examId: string
  action: AuditAction
  /** Human-readable summary, e.g. "Class 10 Mathematics marks submitted". */
  summary: string
  /** Entity type: 'paper' | 'class' | 'session' | 'student' | 'exam'. */
  entityType: string
  /** Entity identifier (classId, sessionId, studentId, etc.). */
  entityId: string | null
  /** Free-form context — e.g. { className, subjectName, room, count }. */
  metadata: Record<string, string | number | null>
  userId: string | null
  userName: string | null
  userRole: AuditRole
  oldValue: string | null
  newValue: string | null
  createdAt: string
}

interface MockAuditState {
  events: AuditEvent[]
  /** Record a new audit event. Returns the created event. */
  recordEvent: (input: Omit<AuditEvent, 'id' | 'createdAt'>) => AuditEvent
  /** Get events for an exam, newest first. */
  getEvents: (examId: string) => AuditEvent[]
  /** Clear events for an exam (used when an exam is deleted). */
  clearExam: (examId: string) => void
}

let eventCounter = 0
function makeId(): string {
  eventCounter += 1
  return `audit-${Date.now()}-${eventCounter}`
}

/** Seed historical events for the completed Mid-Term exam (exam-seed-3). */
function seedEvents(): AuditEvent[] {
  const now = Date.now()
  const events: Array<Partial<AuditEvent> & { action: AuditAction; summary: string }> = [
    {
      action: 'MARKS_SUBMITTED',
      summary: 'Class 9 Mathematics marks submitted',
      entityType: 'paper',
      entityId: 'exam-seed-3:C12:SUB-MATH',
      metadata: { className: 'Class 9', subjectName: 'Mathematics', count: 4 },
      userName: 'Mr. Sharma',
      userRole: 'TEACHER',
    },
    {
      action: 'MARKS_VERIFIED',
      summary: 'Class 9 Mathematics marks verified',
      entityType: 'paper',
      entityId: 'exam-seed-3:C12:SUB-MATH',
      metadata: { className: 'Class 9', subjectName: 'Mathematics', count: 4 },
      userName: 'Principal',
      userRole: 'PRINCIPAL',
    },
    {
      action: 'MARKS_LOCKED',
      summary: 'Class 9 Mathematics marks locked',
      entityType: 'paper',
      entityId: 'exam-seed-3:C12:SUB-MATH',
      metadata: { className: 'Class 9', subjectName: 'Mathematics' },
      userName: 'Principal',
      userRole: 'PRINCIPAL',
    },
    {
      action: 'ATTENDANCE_SUBMITTED',
      summary: 'Class 10 Mathematics attendance submitted',
      entityType: 'session',
      entityId: 'exam-seed-3:session-C13-SUB-MATH',
      metadata: { className: 'Class 10', subjectName: 'Mathematics', room: 'Room A', present: 4, absent: 0 },
      userName: 'Mr. Rajesh Kumar',
      userRole: 'TEACHER',
    },
    {
      action: 'GRACE_APPLIED',
      summary: 'Grace marks applied to Pari Rao — Mathematics +3',
      entityType: 'student',
      entityId: 'exam-seed-3:student-pari',
      metadata: { className: 'Class 10', subjectName: 'Mathematics', original: 37, grace: 3, final: 40 },
      userName: 'Principal',
      userRole: 'PRINCIPAL',
    },
    {
      action: 'RESULT_DECLARED',
      summary: 'Class 10 results declared',
      entityType: 'class',
      entityId: 'exam-seed-3:C13',
      metadata: { className: 'Class 10' },
      userName: 'Principal',
      userRole: 'PRINCIPAL',
    },
    {
      action: 'RESULT_PUBLISHED',
      summary: 'Class 10 results published',
      entityType: 'class',
      entityId: 'exam-seed-3:C13',
      metadata: { className: 'Class 10', notificationsSent: 4 },
      userName: 'Principal',
      userRole: 'PRINCIPAL',
    },
  ]
  return events.map((e, i) => ({
    id: `audit-seed-${i}`,
    examId: 'exam-seed-3',
    action: e.action,
    summary: e.summary,
    entityType: e.entityType ?? 'entity',
    entityId: e.entityId ?? null,
    metadata: e.metadata ?? {},
    userId: e.userName === 'Principal' ? 'principal' : e.userName === 'Mr. Sharma' ? 'teacher-sharma' : 'teacher-rajesh',
    userName: e.userName ?? null,
    userRole: e.userRole ?? 'SYSTEM',
    oldValue: null,
    newValue: null,
    // Spread timestamps across the last ~2 hours for the seed exam.
    createdAt: new Date(now - (events.length - i) * 7 * 60 * 1000).toISOString(),
  }))
}

export const useMockAuditStore = create<MockAuditState>()((set, get) => ({
  events: seedEvents(),

  recordEvent: (input) => {
    const event: AuditEvent = {
      ...input,
      id: makeId(),
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ events: [event, ...state.events] }))
    return event
  },

  getEvents: (examId) => {
    return get().events.filter((e) => e.examId === examId)
  },

  clearExam: (examId) => {
    set((state) => ({ events: state.events.filter((e) => e.examId !== examId) }))
  },
}))

/** Convenience: human-readable action labels for the timeline UI. */
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  EXAM_CREATED: 'Exam Created',
  SCHEDULE_UPDATED: 'Schedule Updated',
  SEATING_GENERATED: 'Seating Generated',
  INVIGILATOR_ASSIGNED: 'Invigilator Assigned',
  MARKS_ENTERED: 'Marks Entered',
  MARKS_SUBMITTED: 'Marks Submitted',
  MARKS_VERIFIED: 'Marks Verified',
  MARKS_LOCKED: 'Marks Locked',
  MARKS_UNLOCKED: 'Marks Unlocked',
  ATTENDANCE_SUBMITTED: 'Attendance Submitted',
  GRACE_APPLIED: 'Grace Applied',
  RESULT_DECLARED: 'Result Declared',
  RESULT_PUBLISHED: 'Result Published',
  OUTCOME_OVERRIDDEN: 'Outcome Overridden',
}

/** Icon hint per action — used by the timeline UI. */
export const AUDIT_ACTION_ICON: Record<AuditAction, string> = {
  EXAM_CREATED: 'plus',
  SCHEDULE_UPDATED: 'calendar',
  SEATING_GENERATED: 'layout-grid',
  INVIGILATOR_ASSIGNED: 'user-check',
  MARKS_ENTERED: 'pencil',
  MARKS_SUBMITTED: 'send',
  MARKS_VERIFIED: 'check',
  MARKS_LOCKED: 'lock',
  MARKS_UNLOCKED: 'unlock',
  ATTENDANCE_SUBMITTED: 'clipboard-check',
  GRACE_APPLIED: 'sparkles',
  RESULT_DECLARED: 'award',
  RESULT_PUBLISHED: 'megaphone',
  OUTCOME_OVERRIDDEN: 'git-branch',
}
