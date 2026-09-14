import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { withUser } from '@/lib/api'
import { requireStudent, materialVisibleToStudent, targetedMaterialIds } from '@/lib/learning'

export const runtime = 'nodejs'

/// POST /api/student/learning/activity
///
/// Body: { studyMaterialId: string, action: 'opened' | 'completed' }
///
/// Records REAL learning activity (spec §72 — opened/completed events).
/// RLS: the material must belong to the caller's school AND be authorized
/// for THIS student (published + whole-school/class/targeted) — an id
/// alone never grants a write. Upserts the unique (studentId,
/// studyMaterialId) row: 'opened' refreshes lastOpenedAt, 'completed'
/// stamps completedAt once (the first completion timestamp is preserved
/// on repeat calls).
export async function POST(req: NextRequest) {
  return withUser(
    async (user) => {
      const ctx = await requireStudent(user)

      const body = await req.json().catch(() => ({}))
      const studyMaterialId = typeof body?.studyMaterialId === 'string' ? body.studyMaterialId : ''
      const action = body?.action
      if (!studyMaterialId) throw new Error('studyMaterialId is required')
      if (action !== 'opened' && action !== 'completed') {
        throw new Error("action must be 'opened' or 'completed'")
      }

      const material = await db.studyMaterial.findUnique({ where: { id: studyMaterialId } })
      if (!material || material.schoolId !== ctx.schoolId) throw new Error('NOT_FOUND')
      const targeted = await targetedMaterialIds(ctx.studentId)
      if (!materialVisibleToStudent(material, ctx, targeted)) throw new Error('NOT_FOUND')

      const now = new Date()
      const row = await db.learningActivity.upsert({
        where: { studentId_studyMaterialId: { studentId: ctx.studentId, studyMaterialId } },
        create: {
          schoolId: ctx.schoolId,
          studentId: ctx.studentId,
          studyMaterialId,
          openedAt: now,
          lastOpenedAt: now,
          completedAt: action === 'completed' ? now : null,
        },
        update: {
          lastOpenedAt: now,
          // Preserve the FIRST completion timestamp (idempotent semantics).
          ...(action === 'completed' ? { completedAt: undefined } : {}),
        },
      })
      // Prisma can't conditionally "set only if null" in one update — a
      // completed action on an already-completed row keeps its original
      // timestamp; a first completion stamps it now.
      let completedAt = row.completedAt
      if (action === 'completed' && !row.completedAt) {
        const updated = await db.learningActivity.update({
          where: { id: row.id },
          data: { completedAt: now },
        })
        completedAt = updated.completedAt
      }

      return {
        studyMaterialId,
        completed: !!completedAt,
        completedAt: completedAt ? completedAt.toISOString() : null,
        lastOpenedAt: row.lastOpenedAt.toISOString(),
      }
    },
    { roles: ['STUDENT'] },
  )
}
