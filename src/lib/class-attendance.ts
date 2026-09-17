/**
 * class-attendance — shared server helpers for the Class Attendance
 * module (baseline + subject-session model).
 */

import { db } from '@/lib/db'
import { schoolScoped } from '@/lib/api'

export const VALID_ATTENDANCE_STATUS = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE'] as const
export type AttendanceStatusValue = (typeof VALID_ATTENDANCE_STATUS)[number]

export function isValidStatus(value: unknown): value is AttendanceStatusValue {
  return typeof value === 'string' && (VALID_ATTENDANCE_STATUS as readonly string[]).includes(value)
}

export function parseDateParam(value: string | null | undefined): Date {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Invalid date')
  const d = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) throw new Error('Invalid date')
  return d
}

export interface ClassScope {
  isClassTeacher: boolean
  subjects: { id: string; name: string }[]
}

/**
 * Resolve what the authenticated teacher may do with a class:
 * class-teacher → owns the daily baseline; subject teacher (has timetable
 * cells in the class) → subject sessions for her own subjects only.
 */
export async function resolveClassScope(
  user: { id: string; name: string | null },
  schoolId: string,
  classId: string
): Promise<ClassScope> {
  const cls = await db.class.findUnique({
    where: { id: classId },
    select: { id: true, schoolId: true, classTeacherId: true },
  })
  if (!cls || cls.schoolId !== schoolId) throw new Error('NOT_FOUND')
  const isClassTeacher = cls.classTeacherId === user.id

  const teacherName = (user.name || '').trim().toLowerCase()
  const rows = teacherName
    ? await db.timetable.findMany({
        where: { schoolId, classId, teacherName: { not: null }, subjectId: { not: null } },
        select: { subjectId: true, subject: { select: { name: true } }, teacherName: true },
      })
    : []
  const subjects = [
    ...new Map(
      rows
        .filter((r) => (r.teacherName || '').trim().toLowerCase() === teacherName)
        .map((r) => [r.subjectId as string, { id: r.subjectId as string, name: r.subject!.name }])
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name))

  if (!isClassTeacher && subjects.length === 0) throw new Error('FORBIDDEN')
  return { isClassTeacher, subjects }
}

export function schoolIdOf(user: { schoolId: string | null }): string {
  return schoolScoped(user as never)
}
