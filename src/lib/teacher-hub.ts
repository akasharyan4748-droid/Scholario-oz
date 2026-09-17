/**
 * teacher-hub — server-side authorization + serialization for the
 * Teacher Hub modules (Parent Connect / Student Behavior).
 *
 * SECURITY MODEL (mirrors learning.ts's requireStudent pattern):
 *   erp_session cookie → getCurrentUser → requireTeacher → Teacher row →
 *   school scope → class-teacher classes → authorized student set.
 * Client-supplied ids are NEVER trusted — every mutation re-validates that
 * the target student/conversation/record belongs to the
 * authenticated teacher's scope:
 *   • Parent Connect conversations are owned by the teacher (teacherId).
 *   • Behavior records are visible to their recorder AND to the class
 *     teacher of the student's class (the class teacher sees the whole
 *     picture for their class — that is what a class teacher is for).
 * A teacher can never touch another school's rows: every query is
 * schoolId-scoped from the session, never from the request body.
 */

import { db } from '@/lib/db'
import { schoolScoped } from '@/lib/api'
import type { AuthUser } from '@/lib/auth'
import type {
  BehaviorRecordItem,
  FollowUpItem,
  StudentRef,
} from '@/lib/teacher-hub-types'

export interface TeacherClassInfo {
  id: string
  name: string
  section: string | null
  label: string
}

export interface TeacherHubContext {
  schoolId: string
  /** User.id of the authenticated teacher */
  userId: string
  /** Teacher profile row id */
  teacherId: string
  name: string
  /** classes where this user is the class teacher (Class.classTeacherId = User.id) */
  classTeacherOf: TeacherClassInfo[]
}

export function classLabelOf(c: { name: string; section: string | null } | null | undefined): string {
  if (!c) return 'Unassigned'
  // The class name may already carry the section ("Grade 9 - A") — never
  // render it twice (same rule as /api/auth/me + student dashboard).
  if (c.section) {
    const esc = c.section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (new RegExp(`[-–\\s]${esc}\\s*$`, 'i').test(c.name)) return c.name
    return `${c.name} - ${c.section}`
  }
  return c.name
}

/** Resolve the authenticated teacher + her class-teacher scope. Throws honest errors. */
export async function requireTeacher(user: AuthUser): Promise<TeacherHubContext> {
  const schoolId = schoolScoped(user)
  const teacher = await db.teacher.findUnique({ where: { userId: user.id } })
  if (!teacher || teacher.schoolId !== schoolId) throw new Error('NO_TEACHER_RECORD')
  const classes = await db.class.findMany({
    where: { schoolId, classTeacherId: user.id },
    select: { id: true, name: true, section: true },
    orderBy: { name: 'asc' },
  })
  return {
    schoolId,
    userId: user.id,
    teacherId: teacher.id,
    name: user.name || 'Teacher',
    classTeacherOf: classes.map((c) => ({ ...c, label: classLabelOf(c) })),
  }
}

/**
 * Prisma `where` for students this teacher may act on:
 * students of her class-teacher classes ∪ students already connected to her
 * through any Teacher Hub relation (conversation, behavior record).
 */
export function authorizedStudentWhere(ctx: TeacherHubContext) {
  const classIds = ctx.classTeacherOf.map((c) => c.id)
  const clauses: Record<string, unknown>[] = classIds.length
    ? [{ classId: { in: classIds } }]
    : []
  clauses.push({ parentConversations: { some: { teacherId: ctx.userId } } })
  clauses.push({ behaviorRecords: { some: { recordedById: ctx.userId } } })
  return { schoolId: ctx.schoolId, OR: clauses }
}

/** Prisma `where` for behavior records the teacher may read. */
export function visibleBehaviorWhere(ctx: TeacherHubContext) {
  const classIds = ctx.classTeacherOf.map((c) => c.id)
  const clauses: Record<string, unknown>[] = [{ recordedById: ctx.userId }]
  if (classIds.length) clauses.push({ student: { classId: { in: classIds } } })
  return { schoolId: ctx.schoolId, OR: clauses }
}

export interface ScopedStudent {
  id: string
  rollNo: string | null
  guardianName: string | null
  guardianPhone: string | null
  guardianId: string | null
  classId: string | null
  class: { id: string; name: string; section: string | null } | null
  user: { id: string; name: string | null } | null
}

/** Validate + fetch a student inside the teacher's authorized scope. */
export async function assertStudentInScope(
  ctx: TeacherHubContext,
  studentId: unknown,
): Promise<ScopedStudent> {
  if (typeof studentId !== 'string' || !studentId.trim()) throw new Error('Student is required')
  const student = await db.student.findFirst({
    where: { id: studentId, ...authorizedStudentWhere(ctx) },
    include: {
      class: { select: { id: true, name: true, section: true } },
      user: { select: { id: true, name: true } },
    },
  })
  if (!student) throw new Error('Student not found in your scope')
  return student as ScopedStudent
}

// ---------- serializers ----------

type StudentRow = {
  id: string
  rollNo: string | null
  classId?: string | null
  class: { name: string; section: string | null } | null
  user: { name: string | null } | null
}

export function toStudentRef(s: StudentRow): StudentRef {
  return {
    id: s.id,
    name: s.user?.name ?? 'Unnamed student',
    rollNo: s.rollNo,
    classLabel: classLabelOf(s.class),
    classId: s.classId ?? null,
  }
}

type FollowUpRow = {
  id: string
  kind: string
  reason: string
  note: string | null
  dueDate: Date
  priority: string
  status: string
  conversationId: string | null
  recordId: string | null
  createdAt: Date
  student: StudentRow | null
}

export function toFollowUpItem(f: FollowUpRow): FollowUpItem {
  return {
    id: f.id,
    kind: f.kind as FollowUpItem['kind'],
    reason: f.reason,
    note: f.note,
    dueDate: f.dueDate.toISOString(),
    priority: f.priority as FollowUpItem['priority'],
    status: f.status as FollowUpItem['status'],
    student: f.student ? toStudentRef(f.student) : null,
    conversationId: f.conversationId,
    recordId: f.recordId,
    createdAt: f.createdAt.toISOString(),
  }
}

type BehaviorRow = {
  id: string
  date: Date
  category: string
  type: string
  description: string
  actionTaken: string | null
  followUpRequired: boolean
  followUpDate: Date | null
  status: string
  parentNotified: boolean
  privateNote: string | null
  recordedBy: { id: string; name: string | null } | null
  student: StudentRow
}

export function toBehaviorRecordItem(r: BehaviorRow): BehaviorRecordItem {
  return {
    id: r.id,
    date: r.date.toISOString(),
    category: r.category,
    type: r.type as BehaviorRecordItem['type'],
    description: r.description,
    actionTaken: r.actionTaken,
    followUpRequired: r.followUpRequired,
    followUpDate: r.followUpDate ? r.followUpDate.toISOString() : null,
    status: r.status as BehaviorRecordItem['status'],
    parentNotified: r.parentNotified,
    privateNote: r.privateNote,
    recordedBy: { id: r.recordedBy?.id ?? '', name: r.recordedBy?.name ?? 'Staff' },
    student: toStudentRef(r.student),
  }
}

// ---------- audit (existing ActivityLog system — best-effort, never fails the op) ----------

export async function auditTeacherAction(
  user: AuthUser,
  schoolId: string,
  action: string,
  detail: string,
): Promise<void> {
  try {
    await db.activityLog.create({ data: { schoolId, userId: user.id, action, detail } })
  } catch {
    // audit is best-effort by design (matches the ActivityLog call sites in /api)
  }
}

// ---------- shared validation helpers ----------

export function parseDate(v: unknown, field: string): Date {
  if (typeof v !== 'string' || !v.trim()) throw new Error(`${field} is required`)
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) throw new Error(`${field} is not a valid date`)
  return d
}

export function parseString(
  v: unknown,
  field: string,
  opts: { required?: boolean; max?: number } = {},
): string | null {
  const required = opts.required ?? false
  if (v == null || (typeof v === 'string' && !v.trim())) {
    if (required) throw new Error(`${field} is required`)
    return null
  }
  if (typeof v !== 'string') throw new Error(`${field} must be text`)
  const s = v.trim()
  if (opts.max && s.length > opts.max) throw new Error(`${field} must be at most ${opts.max} characters`)
  return s
}

export function isDueOrOverdue(due: Date): boolean {
  const today = new Date()
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
  return due.getTime() <= endOfToday.getTime()
}
