import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import {
  deriveDutyStatus,
  dutyAttendanceSummary,
  dutyCompletionOf,
  dutyEditable,
  dutyRoster,
  findAuthorizedDuty,
  type DutyStatus,
} from '@/lib/exam-duty'

export const runtime = 'nodejs'

/**
 * GET /api/teacher/proctoring/duty?id=<scheduleItemId> — the complete
 * examination-duty workspace for ONE of the signed-in teacher's duties:
 * exam details, her role, the room roster (with any recorded attendance),
 * incidents raised during the duty, and the read-only room seating plan.
 *
 * Authorization is server-side and absolute: a duty that is not the
 * teacher's own (or belongs to another school) never reaches the payload.
 * Completed/Cancelled duties arrive with editable:false — history is
 * read-only.
 */
export async function GET(request: Request) {
  return withUser(
    async (user) => {
      const id = new URL(request.url).searchParams.get('id')
      if (!id) throw new Error('Missing duty id')

      const duty = await findAuthorizedDuty(user, id)
      if (!duty) throw new Error('NOT_FOUND')

      const derived = deriveDutyStatus(
        duty.date,
        duty.startTime,
        duty.endTime,
        duty.examStatus,
        new Date(),
      )
      // A persisted sign-off completes the duty immediately (even on the
      // exam day — the same-day window only keeps UNCOMPLETED duties open).
      const completion = await dutyCompletionOf(duty.id)
      const status: DutyStatus = completion ? 'Completed' : derived

      const roster = await dutyRoster(duty)
      const [attendance, attendanceRows, incidents] = await Promise.all([
        dutyAttendanceSummary(duty, roster),
        db.examAttendance.findMany({
          where: { examId: duty.examId, scheduleItemId: duty.id },
          select: { studentId: true, status: true },
        }),
        db.examIncident.findMany({
          where: { scheduleItemId: duty.id },
          include: { student: { select: { user: { select: { name: true } } } } },
          orderBy: { occurredAt: 'asc' },
        }),
      ])

      return {
        duty: {
          id: duty.id,
          examName: duty.examName,
          examType: duty.examType,
          subject: duty.subject,
          classLabel: duty.classLabel,
          date: duty.date.toISOString().slice(0, 10),
          startTime: duty.startTime,
          endTime: duty.endTime,
          room: duty.room,
          role: 'Invigilator',
          studentCount: roster.length,
          status,
        },
        editable: dutyEditable(status),
        roster: roster.map((s) => ({
          studentId: s.studentId,
          name: s.name,
          rollNo: s.rollNo,
          classLabel: s.classLabel,
          seatNumber: s.seatNumber,
          seatLabel: s.seatLabel,
          row: s.row,
          column: s.column,
        })),
        rosterAttendance: Object.fromEntries(
          attendanceRows.map((r) => [r.studentId, r.status]),
        ),
        attendance,
        completion,
        incidents: incidents.map((inc) => ({
          id: inc.id,
          studentName: inc.student ? inc.student.user.name : null,
          incidentType: inc.incidentType,
          occurredAt: inc.occurredAt.toISOString(),
          description: inc.description,
          reportedByName: inc.reportedByName,
        })),
        room: { capacity: 24, rows: 4, cols: 6 },
      }
    },
    { roles: ['TEACHER'] },
  )
}
