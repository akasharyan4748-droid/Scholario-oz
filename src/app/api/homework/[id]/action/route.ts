import { NextRequest } from 'next/server'
import { withUser, schoolScoped } from '@/lib/api'
import { publishHomework, closeHomework, archiveHomework, duplicateHomework, extendDeadline, reviewSubmission } from '@/lib/homework/service'

export const runtime = 'nodejs'

// POST /api/homework/[id]/action  body: { action: 'publish'|'close'|'archive'|'duplicate'|'extend'|'review', ... }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params
      const body = await req.json().catch(() => ({}))

      switch (body.action) {
        case 'publish':
          return await publishHomework(id, schoolId, user)
        case 'close':
          return await closeHomework(id, schoolId, user)
        case 'archive':
          return await archiveHomework(id, schoolId, user)
        case 'duplicate':
          return await duplicateHomework(id, schoolId, user)
        case 'extend':
          if (!body.newDueDate || !body.reason) throw new Error('newDueDate and reason are required')
          return await extendDeadline(id, schoolId, user, body.newDueDate, body.reason)
        case 'review':
          if (!body.submissionId) throw new Error('submissionId is required')
          return await reviewSubmission(id, body.submissionId, schoolId, user, {
            marks: body.marks,
            grade: body.grade,
            feedback: body.feedback,
            privateNote: body.privateNote,
            action: body.reviewAction || 'review',
          })
        default:
          throw new Error(`Unknown action: ${body.action}`)
      }
    },
    { roles: ['PRINCIPAL', 'MANAGEMENT', 'TEACHER'] }
  )
}
