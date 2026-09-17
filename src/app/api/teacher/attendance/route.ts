import { NextRequest } from 'next/server'
import { withUser } from '@/lib/api'
import { requireTeacher, auditTeacherAction } from '@/lib/teacher-hub'
import {
  buildAttendancePayload,
  parseAttendanceDay,
  todayAttendanceDayISO,
  assertAttendanceScope,
  validateEntries,
  saveSubmission,
} from '@/lib/teacher-attendance'
import type { AttendancePayload } from '@/lib/teacher-attendance-types'

export const runtime = 'nodejs'

// GET /api/teacher/attendance?date=YYYY-MM-DD&classId=<id>
// The Class Attendance workspace payload: authorized classes (class-teacher ∪
// subject assignments) with the teacher's per-class submission status for the
// date, plus the working detail (roster, own submission, class-teacher
// submission, prefill / update notices) when classId is provided.
export async function GET(req: NextRequest) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const params = req.nextUrl.searchParams
      const date = params.get('date') ? parseAttendanceDay(params.get('date')) : parseAttendanceDay(todayAttendanceDayISO())
      const classId = params.get('classId') // optional — null → classes-only payload
      const payload: AttendancePayload = await buildAttendancePayload(ctx, date, classId)
      return payload
    },
    { roles: ['TEACHER'] },
  )
}

// POST /api/teacher/attendance — save a DRAFT or SUBMIT the teacher's
// attendance for a class/date. Authorization, roster membership and statuses
// are re-validated server-side on every call; submitted records are
// read-only; the class teacher's submit also syncs the legacy Attendance
// table (official daily record).
export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const ctx = await requireTeacher(user)
      const body = await req.json().catch(() => null)
      if (!body || typeof body !== 'object') throw new Error('Invalid request body')

      const intent = body.intent === 'submit' ? 'submit' : body.intent === 'draft' ? 'draft' : null
      if (!intent) throw new Error('intent must be "draft" or "submit"')

      const scope = await assertAttendanceScope(ctx, body.classId)
      const date = parseAttendanceDay(body.date, 'Date')
      const { entries } = await validateEntries(scope, body.entries)

      const saved = await saveSubmission({ ctx, scope, date, entries, status: intent === 'submit' ? 'SUBMITTED' : 'DRAFT' })

      const counts = entries.reduce<Record<string, number>>((acc, e) => {
        acc[e.status] = (acc[e.status] ?? 0) + 1
        return acc
      }, {})
      const summary = `${entries.length} students · ${counts.PRESENT ?? 0} present, ${counts.ABSENT ?? 0} absent, ${counts.LATE ?? 0} late, ${counts.LEAVE ?? 0} on leave`
      await auditTeacherAction(
        user,
        ctx.schoolId,
        intent === 'submit' ? 'ATTENDANCE_SUBMITTED' : 'ATTENDANCE_DRAFT_SAVED',
        `${scope.role === 'CLASS_TEACHER' ? 'Class Teacher' : 'Subject Teacher'} · ${scope.cls.name}${scope.subjectName ? ` (${scope.subjectName})` : ''} · ${saved.status} · ${summary}`,
      )

      // Return the refreshed payload (classes + detail) so the client gets
      // the honest post-mutation state in one round-trip.
      const payload = await buildAttendancePayload(ctx, date, scope.cls.id)
      return { saved, payload }
    },
    { roles: ['TEACHER'] },
  )
}
