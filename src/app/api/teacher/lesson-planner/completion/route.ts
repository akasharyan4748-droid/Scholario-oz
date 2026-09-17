import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'
import { getTeachingAssignments } from '@/lib/lesson-planner'

export const runtime = 'nodejs'

// POST /api/teacher/lesson-planner/completion — mark a curriculum topic
// completed (or undo the completion). Body:
//   { topicId: string, completed: boolean, note?: string }
// The topic must belong to one of the authenticated teacher's own teaching
// assignments — every field is re-validated server-side.
export async function POST(request: Request) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const body = (await request.json().catch(() => null)) as
        | { topicId?: string; completed?: boolean; note?: string }
        | null
      if (!body?.topicId || typeof body.completed !== 'boolean') {
        throw new Error('topicId and completed are required')
      }

      const topic = await db.curriculumTopic.findUnique({
        where: { id: body.topicId },
        select: { id: true, classId: true, subjectId: true, schoolId: true },
      })
      if (!topic || topic.schoolId !== schoolId) throw new Error('FORBIDDEN')
      const assignments = await getTeachingAssignments(user)
      const owns = assignments.find(
        (a) => a.classId === topic.classId && a.subjectId === topic.subjectId
      )
      if (!owns) throw new Error('FORBIDDEN')

      const teacher = await db.teacher.findUnique({ where: { userId: user.id } })
      if (!teacher) throw new Error('NO_TEACHER_RECORD')

      if (body.completed) {
        const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 500) : null
        await db.lessonTopicCompletion.upsert({
          where: { curriculumTopicId: topic.id },
          create: {
            schoolId,
            curriculumTopicId: topic.id,
            classId: topic.classId,
            subjectId: topic.subjectId,
            teacherId: teacher.id,
            completedOn: new Date(),
            note,
          },
          update: { completedOn: new Date(), note },
        })
        return { completed: true }
      }

      await db.lessonTopicCompletion.deleteMany({ where: { curriculumTopicId: topic.id, schoolId } })
      return { completed: false }
    },
    { roles: ['TEACHER'] }
  )
}
