import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import {
  deriveDutyStatus,
  dutyAttendanceSummary,
  dutyRoster,
  findAuthorizedDuty,
  paperStartAt,
} from '@/lib/exam-duty'

export const runtime = 'nodejs'

/**
 * POST /api/teacher/proctoring/complete — the invigilator signs off one of
 * her duties ("Complete Duty"). This is REAL persistence, not a local UI
 * flag: an ExamDutyCompletion row is written with the teacher's id, the
 * duty id, the paper's start, the sign-off time and the attendance/incident
 * counts at sign-off.
 *
 * Required information is verified server-side before anything is written:
 *   · the duty belongs to THIS teacher in THIS school (findAuthorizedDuty)
 *   · the paper has started (status In Progress — the same-day window)
 *   · the duty has not been completed already
 *   · attendance is fully marked (no unmarked students)
 */
export async function POST(req: Request) {
  return withUser(
    async (user) => {
      const body = (await req.json().catch(() => null)) as {
        scheduleItemId?: unknown
      } | null
      const scheduleItemId =
        typeof body?.scheduleItemId === 'string' ? body.scheduleItemId.trim() : ''
      if (!scheduleItemId) throw new Error('Missing duty id')

      const duty = await findAuthorizedDuty(user, scheduleItemId)
      if (!duty) throw new Error('NOT_FOUND')
      if (!user.schoolId) throw new Error('NO_SCHOOL')

      const status = deriveDutyStatus(
        duty.date,
        duty.startTime,
        duty.endTime,
        duty.examStatus,
        new Date(),
      )
      if (status === 'Upcoming') {
        throw new Error('The paper has not started yet — a duty can only be completed on its exam day.')
      }
      if (status === 'Cancelled') throw new Error('This examination was cancelled.')

      const existing = await db.examDutyCompletion.findUnique({
        where: { scheduleItemId },
      })
      if (existing) throw new Error('This duty has already been completed.')

      // Attendance must be fully marked before sign-off.
      const roster = await dutyRoster(duty)
      if (roster.length === 0) {
        throw new Error('This duty has no seated roster — nothing to sign off.')
      }
      const attendance = await dutyAttendanceSummary(duty, roster)
      if (attendance.unmarked > 0) {
        throw new Error(
          `Attendance incomplete — ${attendance.unmarked} of ${roster.length} students are still unmarked.`,
        )
      }

      const incidentCount = await db.examIncident.count({
        where: { scheduleItemId },
      })

      const row = await db.examDutyCompletion.create({
        data: {
          schoolId: user.schoolId,
          scheduleItemId,
          teacherId: user.id,
          startedAt: paperStartAt(duty),
          completedAt: new Date(),
          presentCount: attendance.present,
          absentCount: attendance.absent,
          lateCount: attendance.late,
          incidentCount,
        },
      })

      return {
        completion: {
          completedAt: row.completedAt.toISOString(),
          presentCount: row.presentCount,
          absentCount: row.absentCount,
          lateCount: row.lateCount,
          incidentCount: row.incidentCount,
        },
      }
    },
    { roles: ['TEACHER'] },
  )
}
