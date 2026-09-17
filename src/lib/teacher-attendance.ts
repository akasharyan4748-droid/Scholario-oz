/**
 * teacher-attendance — server-side authorization + serialization for the
 * Class Attendance workflow (draft/submit, class teacher vs subject teacher).
 *
 * SECURITY MODEL (mirrors teacher-hub.ts):
 *   erp_session cookie → getCurrentUser → requireTeacher → Teacher row →
 *   school scope → attendance-authorized classes.
 * A teacher may take attendance for a class iff, inside the SAME school:
 *   • she is the class teacher of that class (Class.classTeacherId), OR
 *   • she has an active ClassSubjectAssignment (teacherId) in that class.
 * Client-supplied classId/studentIds are NEVER trusted — every read and
 * mutation re-validates against the session-derived scope. A teacher can
 * never touch another school's rows: every query is schoolId-scoped from
 * the session.
 *
 * SUBMISSION MODEL:
 *   AttendanceSubmission (one per class + date + teacher) — DRAFT is fully
 *   editable; SUBMITTED is read-only. Subject-teacher submissions record
 *   sourceSubmissionId when pre-filled from the class teacher's submission.
 *   One teacher's submission NEVER overwrites another's. When the CLASS
 *   TEACHER submits, entries are synced into the legacy Attendance table
 *   (the official daily record student/principal dashboards read).
 */

import { db } from '@/lib/db'
import type { AuthUser } from '@/lib/auth'
import { classLabelOf, requireTeacher, type TeacherHubContext } from '@/lib/teacher-hub'
import type {
  AttendanceClassInfo,
  AttendanceDetail,
  AttendanceEntryDTO,
  AttendancePayload,
  AttendanceRole,
  AttendanceStatusValue,
  AttendanceSubmissionDTO,
} from '@/lib/teacher-attendance-types'

export const ATTENDANCE_STATUSES: AttendanceStatusValue[] = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE']

// ---------- date handling (attendance days are UTC-midnight YYYY-MM-DD) ----------

/** Parse a YYYY-MM-DD string into a UTC-midnight Date. Throws honest errors. */
export function parseAttendanceDay(v: unknown, field = 'Date'): Date {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v.trim())) {
    throw new Error(`${field} must be a YYYY-MM-DD date`)
  }
  const d = new Date(`${v.trim()}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) throw new Error(`${field} is not a valid date`)
  return d
}

export function attendanceDayISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function todayAttendanceDayISO(): string {
  return attendanceDayISO(new Date())
}

// ---------- authorization ----------

export interface AttendanceScope {
  cls: {
    id: string
    name: string
    section: string | null
    classTeacherId: string | null
  }
  role: AttendanceRole
  /** first active subject assignment of this teacher in this class */
  subjectId: string | null
  subjectName: string | null
}

/**
 * Server-side verification that the teacher may take attendance for the
 * class. Throws 'NOT_FOUND' for foreign/unknown classes (no existence leak)
 * and 'FORBIDDEN' when the teacher has no assignment relationship.
 */
export async function assertAttendanceScope(
  ctx: TeacherHubContext,
  classId: unknown,
): Promise<AttendanceScope> {
  if (typeof classId !== 'string' || !classId.trim()) throw new Error('Class is required')
  const cls = await db.class.findFirst({
    where: { id: classId, schoolId: ctx.schoolId },
    include: {
      subjectAssignments: {
        where: { isActive: true, teacherId: ctx.userId },
        include: { subject: { select: { id: true, name: true } } },
        orderBy: { displayOrder: 'asc' },
      },
    },
  })
  if (!cls) throw new Error('NOT_FOUND')
  const isClassTeacher = cls.classTeacherId === ctx.userId
  if (!isClassTeacher && cls.subjectAssignments.length === 0) {
    throw new Error('FORBIDDEN')
  }
  const anchor = cls.subjectAssignments[0]
  return {
    cls: { id: cls.id, name: cls.name, section: cls.section, classTeacherId: cls.classTeacherId },
    role: isClassTeacher ? 'CLASS_TEACHER' : 'SUBJECT_TEACHER',
    subjectId: isClassTeacher ? null : (anchor?.subject.id ?? null),
    subjectName: isClassTeacher ? null : (anchor?.subject.name ?? null),
  }
}

/** Classes the teacher may take attendance for (class-teacher ∪ subject assignments). */
export async function attendanceAuthorizedClasses(ctx: TeacherHubContext) {
  const [ctClasses, stAssignments] = await Promise.all([
    db.class.findMany({
      where: { schoolId: ctx.schoolId, classTeacherId: ctx.userId },
      select: { id: true, name: true, section: true },
    }),
    db.classSubjectAssignment.findMany({
      where: { schoolId: ctx.schoolId, teacherId: ctx.userId, isActive: true },
      include: { class: { select: { id: true, name: true, section: true } }, subject: { select: { name: true } } },
      orderBy: { displayOrder: 'asc' },
    }),
  ])
  const map = new Map<
    string,
    { id: string; name: string; section: string | null; isClassTeacher: boolean; subjects: string[] }
  >()
  for (const c of ctClasses) {
    map.set(c.id, { ...c, isClassTeacher: true, subjects: [] })
  }
  for (const a of stAssignments) {
    const existing = map.get(a.class.id)
    if (existing) {
      if (!existing.subjects.includes(a.subject.name)) existing.subjects.push(a.subject.name)
    } else {
      map.set(a.class.id, {
        id: a.class.id,
        name: a.class.name,
        section: a.class.section,
        isClassTeacher: false,
        subjects: [a.subject.name],
      })
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}

// ---------- serialization ----------

type SubmissionRow = {
  id: string
  status: string
  role: string
  sourceSubmissionId: string | null
  submittedAt: Date | null
  updatedAt: Date
  entries: { studentId: string; status: string }[]
}

export function toSubmissionDTO(s: SubmissionRow, subjectName: string | null = null): AttendanceSubmissionDTO {
  return {
    id: s.id,
    status: (s.status === 'SUBMITTED' ? 'SUBMITTED' : 'DRAFT') as AttendanceSubmissionDTO['status'],
    role: (s.role === 'CLASS_TEACHER' ? 'CLASS_TEACHER' : 'SUBJECT_TEACHER') as AttendanceSubmissionDTO['role'],
    subjectName,
    sourceSubmissionId: s.sourceSubmissionId,
    submittedAt: s.submittedAt ? s.submittedAt.toISOString() : null,
    updatedAt: s.updatedAt.toISOString(),
    entries: s.entries.map((e) => ({
      studentId: e.studentId,
      status: e.status as AttendanceStatusValue,
    })),
  }
}

/** Serialize entries without the submission wrapper (prefill / update payloads). */
function entriesOf(s: SubmissionRow): AttendanceEntryDTO[] {
  return s.entries.map((e) => ({ studentId: e.studentId, status: e.status as AttendanceStatusValue }))
}

// ---------- payload builders ----------

const ROSTER_SELECT = { id: true, rollNo: true, user: { select: { name: true } } } as const

/** The full module payload: authorized classes (+ per-class submission status) and, when classId is provided, the working detail. */
export async function buildAttendancePayload(
  ctx: TeacherHubContext,
  date: Date,
  classId: string | null,
): Promise<AttendancePayload> {
  const authorized = await attendanceAuthorizedClasses(ctx)
  const classIds = authorized.map((c) => c.id)

  const [submissions, countRows, detail] = await Promise.all([
    classIds.length
      ? db.attendanceSubmission.findMany({
          where: { schoolId: ctx.schoolId, date, teacherId: ctx.userId, classId: { in: classIds } },
          select: { classId: true, status: true, updatedAt: true, submittedAt: true },
        })
      : Promise.resolve([] as { classId: string; status: string; updatedAt: Date; submittedAt: Date | null }[]),
    classIds.length
      ? db.student.groupBy({ by: ['classId'], where: { classId: { in: classIds } }, _count: { _all: true } })
      : Promise.resolve([] as { classId: string | null; _count: { _all: number } }[]),
    classId ? buildDetail(ctx, date, classId) : Promise.resolve(null),
  ])

  const classes: AttendanceClassInfo[] = authorized.map((c) => {
    const sub = submissions.find((s) => s.classId === c.id)
    return {
      id: c.id,
      label: classLabelOf(c),
      isClassTeacher: c.isClassTeacher,
      subjects: c.subjects,
      studentCount: countRows.find((r) => r.classId === c.id)?._count._all ?? 0,
      submission: sub
        ? {
            status: (sub.status === 'SUBMITTED' ? 'SUBMITTED' : 'DRAFT') as 'DRAFT' | 'SUBMITTED',
            updatedAt: sub.updatedAt.toISOString(),
            submittedAt: sub.submittedAt ? sub.submittedAt.toISOString() : null,
          }
        : null,
    }
  })

  return {
    teacherName: ctx.name,
    date: attendanceDayISO(date),
    classes,
    detail,
  }
}

async function buildDetail(ctx: TeacherHubContext, date: Date, classId: string): Promise<AttendanceDetail | null> {
  const scope = await assertAttendanceScope(ctx, classId) // throws NOT_FOUND/FORBIDDEN
  const [rosterRows, youRow, classTeacherRow] = await Promise.all([
    db.student.findMany({ where: { classId: scope.cls.id }, select: ROSTER_SELECT }),
    db.attendanceSubmission.findFirst({
      where: { classId: scope.cls.id, date, teacherId: ctx.userId },
      include: { entries: { select: { studentId: true, status: true } } },
    }),
    scope.cls.classTeacherId && scope.cls.classTeacherId !== ctx.userId
      ? (async () => {
          const teacherUser = await db.user.findFirst({
            where: { id: scope.cls.classTeacherId!, schoolId: ctx.schoolId },
            select: { id: true, name: true },
          })
          if (!teacherUser) return null
          const sub = await db.attendanceSubmission.findFirst({
            where: { classId: scope.cls.id, date, teacherId: teacherUser.id },
            include: { entries: { select: { studentId: true, status: true } } },
          })
          return { teacherId: teacherUser.id, teacherName: teacherUser.name ?? 'Class Teacher', sub }
        })()
      : Promise.resolve(null),
  ])

  // numeric-aware roll order (rollNo is a string; "2" must sort before "10")
  const roster = rosterRows
    .map((s) => ({ id: s.id, name: s.user?.name ?? 'Unnamed student', rollNo: s.rollNo }))
    .sort((a, b) => {
      const na = Number.parseInt(a.rollNo ?? '', 10)
      const nb = Number.parseInt(b.rollNo ?? '', 10)
      if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb
      return (a.rollNo ?? '').localeCompare(b.rollNo ?? '')
    })

  const you = youRow ? toSubmissionDTO(youRow, scope.subjectName) : null
  const ctSubmission = classTeacherRow?.sub ?? null
  const ctSubmitted = ctSubmission && ctSubmission.status === 'SUBMITTED' ? ctSubmission : null

  // Prefill: teacher has not started AND the class teacher has submitted.
  let prefill: AttendanceDetail['prefill'] = null
  if (!you && ctSubmitted) {
    prefill = {
      fromSubmissionId: ctSubmitted.id,
      submittedAt: (ctSubmitted.submittedAt ?? ctSubmitted.updatedAt).toISOString(),
      entries: entriesOf(ctSubmitted),
    }
  }

  // Class-teacher update notice: teacher has a draft, but the class teacher
  // has submitted a record the draft was not based on. Draft is preserved.
  let classTeacherUpdate: AttendanceDetail['classTeacherUpdate'] = null
  if (you && you.status === 'DRAFT' && ctSubmitted && you.sourceSubmissionId !== ctSubmitted.id) {
    classTeacherUpdate = {
      submissionId: ctSubmitted.id,
      submittedAt: (ctSubmitted.submittedAt ?? ctSubmitted.updatedAt).toISOString(),
      entries: entriesOf(ctSubmitted),
    }
  }

  return {
    classId: scope.cls.id,
    classLabel: classLabelOf(scope.cls),
    date: attendanceDayISO(date),
    roster,
    you,
    classTeacher: classTeacherRow
      ? {
          teacherId: classTeacherRow.teacherId,
          teacherName: classTeacherRow.teacherName,
          submission: ctSubmission ? toSubmissionDTO(ctSubmission) : null,
        }
      : null,
    prefill,
    classTeacherUpdate,
  }
}

// ---------- entry validation (mutations) ----------

export interface ValidatedEntries {
  entries: { studentId: string; status: AttendanceStatusValue }[]
  roster: { id: string; name: string }[]
}

/**
 * Validate client-supplied entries against the real class roster —
 * every studentId must belong to the class, every status must be known.
 * Missing students are NOT invented; extra/foreign ids are rejected.
 */
export async function validateEntries(scope: AttendanceScope, raw: unknown): Promise<ValidatedEntries> {
  if (!Array.isArray(raw) || raw.length === 0) throw new Error('Attendance entries are required')
  const roster = await db.student.findMany({
    where: { classId: scope.cls.id },
    select: { id: true, user: { select: { name: true } } },
  })
  const rosterIds = new Set(roster.map((s) => s.id))
  const seen = new Set<string>()
  const entries: { studentId: string; status: AttendanceStatusValue }[] = []
  for (const e of raw) {
    if (!e || typeof e !== 'object') throw new Error('Invalid attendance entry')
    const { studentId, status } = e as { studentId?: unknown; status?: unknown }
    if (typeof studentId !== 'string' || !rosterIds.has(studentId)) {
      throw new Error('Attendance entry references a student outside this class')
    }
    if (seen.has(studentId)) continue // last-write-wins on duplicates
    seen.add(studentId)
    if (typeof status !== 'string' || !ATTENDANCE_STATUSES.includes(status as AttendanceStatusValue)) {
      throw new Error('Invalid attendance status')
    }
    entries.push({ studentId, status: status as AttendanceStatusValue })
  }
  return { entries, roster: roster.map((s) => ({ id: s.id, name: s.user?.name ?? 'Student' })) }
}

/** Upsert the teacher's submission (status + entries) inside one transaction. */
export async function saveSubmission(opts: {
  ctx: TeacherHubContext
  scope: AttendanceScope
  date: Date
  entries: { studentId: string; status: AttendanceStatusValue }[]
  status: 'DRAFT' | 'SUBMITTED'
}): Promise<AttendanceSubmissionDTO & { syncedLegacy: boolean }> {
  const { ctx, scope, date, entries, status } = opts

  const existing = await db.attendanceSubmission.findUnique({
    where: { class_date_teacher: { classId: scope.cls.id, date, teacherId: ctx.userId } },
  })
  if (existing?.status === 'SUBMITTED') {
    throw new Error('Attendance already submitted — submitted records are read-only')
  }

  // Prefill lineage: a NEW subject-teacher submission adopts the class
  // teacher's current submitted record as its source (honest provenance).
  let sourceSubmissionId = existing?.sourceSubmissionId ?? null
  if (!existing && scope.role === 'SUBJECT_TEACHER') {
    const ct = await db.attendanceSubmission.findFirst({
      where: {
        classId: scope.cls.id,
        date,
        teacherId: scope.cls.classTeacherId ?? '',
        status: 'SUBMITTED',
      },
      select: { id: true },
    })
    sourceSubmissionId = ct?.id ?? null
  }

  const submission = await db.$transaction(async (tx) => {
    const base = {
      schoolId: ctx.schoolId,
      classId: scope.cls.id,
      teacherId: ctx.userId,
      date,
      status,
      role: scope.role,
      subjectId: scope.subjectId,
      sourceSubmissionId,
      submittedAt: status === 'SUBMITTED' ? new Date() : null,
    }
    const row = await tx.attendanceSubmission.upsert({
      where: { class_date_teacher: { classId: scope.cls.id, date, teacherId: ctx.userId } },
      update: {
        status,
        submittedAt: base.submittedAt,
        sourceSubmissionId,
        role: scope.role,
        subjectId: scope.subjectId,
        entries: { deleteMany: {} },
      },
      create: { ...base, entries: { create: entries } },
      include: { entries: { select: { studentId: true, status: true } } },
    })
    if (existing) {
      // upsert's nested create only fires on create — replace entries on update
      await tx.attendanceEntry.createMany({ data: entries.map((e) => ({ ...e, submissionId: row.id })) })
    }
    return tx.attendanceSubmission.findUniqueOrThrow({
      where: { id: row.id },
      include: { entries: { select: { studentId: true, status: true } } },
    })
  })

  // Class teacher submit → sync the legacy Attendance table (official daily
  // record the student/principal dashboards read). Subject teachers never
  // touch it — their submissions remain their own auditable records.
  let syncedLegacy = false
  if (status === 'SUBMITTED' && scope.role === 'CLASS_TEACHER') {
    for (const e of entries) {
      await db.attendance.upsert({
        where: { studentId_date: { studentId: e.studentId, date } },
        update: { status: e.status, markedBy: ctx.userId, classId: scope.cls.id },
        create: {
          schoolId: ctx.schoolId,
          studentId: e.studentId,
          classId: scope.cls.id,
          date,
          status: e.status,
          markedBy: ctx.userId,
        },
      })
    }
    syncedLegacy = true
  }

  return { ...toSubmissionDTO(submission, scope.subjectName), syncedLegacy }
}
