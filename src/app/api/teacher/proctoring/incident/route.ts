import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'
import {
  deriveDutyStatus,
  dutyEditable,
  dutyRoster,
  findAuthorizedDuty,
  isExamIncidentType,
} from '@/lib/exam-duty'

export const runtime = 'nodejs'

/**
 * POST /api/teacher/proctoring/incident — the assigned invigilator raises a
 * professional incident record during one of her duties (late arrival,
 * unfair-means concern, medical issue, paper issue, other). The student is
 * optional so room-level issues (e.g. a paper problem) can be recorded too.
 *
 * Server-side rules: the duty must be the teacher's own and not read-only
 * history; the type must be one of the known kinds; the description must be
 * a real sentence; an optional student must be on the duty's room roster.
 */
export async function POST(request: Request) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = (await request.json().catch(() => null)) as {
        scheduleItemId?: unknown
        studentId?: unknown
        incidentType?: unknown
        description?: unknown
        occurredAt?: unknown
      } | null
      if (!body || typeof body.scheduleItemId !== 'string') {
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
            ? 'This duty was cancelled — incidents can no longer be recorded.'
            : 'This duty is completed — incidents can no longer be recorded.',
        )
      }

      if (!isExamIncidentType(body.incidentType)) {
        throw new Error('Unknown incident type')
      }
      const description =
        typeof body.description === 'string' ? body.description.trim() : ''
      if (description.length < 3 || description.length > 500) {
        throw new Error('Description must be between 3 and 500 characters')
      }

      let studentId: string | null = null
      if (body.studentId != null && body.studentId !== '') {
        if (typeof body.studentId !== 'string') {
          throw new Error('Invalid student')
        }
        const roster = await dutyRoster(duty)
        if (!roster.some((s) => s.studentId === body.studentId)) {
          throw new Error('Student is not seated in this duty room')
        }
        studentId = body.studentId
      }

      const occurredAt =
        typeof body.occurredAt === 'string' && !Number.isNaN(Date.parse(body.occurredAt))
          ? new Date(body.occurredAt)
          : new Date()

      const incident = await db.examIncident.create({
        data: {
          schoolId,
          examId: duty.examId,
          scheduleItemId: duty.id,
          studentId,
          incidentType: body.incidentType,
          occurredAt,
          description,
          reportedById: user.id,
          reportedByName: user.name ?? null,
        },
        select: { id: true },
      })
      return { id: incident.id }
    },
    { roles: ['TEACHER'] },
  )
}
