import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import { requireStudent, materialVisibleToStudent, targetedMaterialIds } from '@/lib/learning'

export const runtime = 'nodejs'

/// POST /api/student/learning/bookmark
///
/// Body: { studyMaterialId: string } → TOGGLE the student's bookmark.
///
/// RLS: identical to the activity route — the material must be authorized
/// for THIS student before a bookmark can be created (an unauthorized id
/// is indistinguishable from a missing one). Returns { bookmarked } so the
/// client can reconcile its optimistic state (spec §71).
export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const ctx = await requireStudent(user)

      const body = await req.json().catch(() => ({}))
      const studyMaterialId = typeof body?.studyMaterialId === 'string' ? body.studyMaterialId : ''
      if (!studyMaterialId) throw new Error('studyMaterialId is required')

      const material = await db.studyMaterial.findUnique({ where: { id: studyMaterialId } })
      if (!material || material.schoolId !== ctx.schoolId) throw new Error('NOT_FOUND')

      const existing = await db.learningBookmark.findUnique({
        where: { studentId_studyMaterialId: { studentId: ctx.studentId, studyMaterialId } },
      })

      if (existing) {
        await db.learningBookmark.delete({ where: { id: existing.id } })
        return { studyMaterialId, bookmarked: false }
      }

      // A bookmark is only ever created on an authorized material.
      const targeted = await targetedMaterialIds(ctx.studentId)
      if (!materialVisibleToStudent(material, ctx, targeted)) throw new Error('NOT_FOUND')

      await db.learningBookmark.create({
        data: {
          schoolId: ctx.schoolId,
          studentId: ctx.studentId,
          studyMaterialId,
        },
      })
      return { studyMaterialId, bookmarked: true }
    },
    { roles: ['STUDENT'] },
  )
}
