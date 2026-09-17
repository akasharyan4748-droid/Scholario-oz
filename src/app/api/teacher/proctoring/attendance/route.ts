import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import {
  deriveDutyStatus,
  dutyEditable,
  dutyRoster,
  findAuthorizedDuty,
  isExamAttendanceStatus,
} from '@/lib/exam-duty'

export const runtime = 'nodejs'

/**
 * POST /api/teacher/proctoring/attendance — the assigned invigilator saves
 * student attendance for ONE of her duties. States: Present / Absent / Late.
 *
 * Server-side rules (never client-only):
 *   · the duty must belong to the signed-in teacher (id match first);
 *   · completed/cancelled duties are read-only history;
 *   · every student must be on the duty's room roster;
 *   · every status must be one of the three allowed states.
 */
export async function POST(request: Request) {
  return withUser(
    async (user) => {
      const body = (await request.json().catch(() => null)) as {
        scheduleItemId?: unknown
        entries?: unknown
      } | null
      if (!body || typeof body.scheduleItemId !== 'string' || !Array.isArray(body.entries)) {
        throw new Error('Invalid request body')
      }

      const duty = await findAuthorizedDuty(user, body.scheduleItemId)
      if (!duty) throw new Error('NOT_FOUND')

      const status = deriveDutyStatus(
        duty.date,
        duty.startTime,
        duty.endTime,
        duty.examStatus,
        new Date(),
      )
      if (!dutyEditable(status)) {
        throw new Error(
          status === 'Cancelled'
            ? 'This duty was cancelled — attendance is read-only.'
            : 'This duty is completed — attendance is read-only.',
        )
      }

      const roster = await dutyRoster(duty)
      const rosterIds = new Set(roster.map((s) => s.studentId))

      const parsed: { studentId: string; status: string }[] = []
      for (const raw of body.entries) {
        if (
          typeof raw !== 'object' ||
          raw === null ||
          typeof (raw as { studentId?: unknown }).studentId !== 'string' ||
          !isExamAttendanceStatus((raw as { status?: unknown }).status)
        ) {
          throw new Error('Invalid attendance entry')
        }
        const entry = raw as { studentId: string; status: string }
        if (!rosterIds.has(entry.studentId)) {
          throw new Error('Student is not seated in this duty room')
        }
        parsed.push(entry)
      }
      if (parsed.length === 0) throw new Error('No attendance entries to save')

      for (const entry of parsed) {
        await db.examAttendance.upsert({
          where: {
            examId_studentId_subjectId_date: {
              examId: duty.examId,
              studentId: entry.studentId,
              subjectId: duty.subjectId,
              date: duty.date,
            },
          },
          update: { status: entry.status, markedBy: user.name ?? null },
          create: {
            examId: duty.examId,
            scheduleItemId: duty.id,
            classId: duty.classId,
            studentId: entry.studentId,
            subjectId: duty.subjectId,
            date: duty.date,
            status: entry.status,
            markedBy: user.name ?? null,
          },
        })
      }

      const counts = { present: 0, absent: 0, late: 0 }
      for (const entry of parsed) {
        if (entry.status === 'ABSENT') counts.absent++
        else if (entry.status === 'LATE') counts.late++
        else counts.present++
      }
      return { saved: parsed.length, counts }
    },
    { roles: ['TEACHER'] },
  )
}
