import { NextRequest } from 'next/server'
import { unlink } from 'fs/promises'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'
import {
  isSafeStoredFileName,
  studyMaterialPath,
  toStudyMaterialMeta,
} from '@/lib/study-materials'

export const runtime = 'nodejs'

/// DELETE /api/study-materials/[id]
///
/// PRINCIPAL-only removal: deletes the row AND the stored file (a missing
/// file on disk does not block the row deletion — the metadata must never
/// outlive its delete intent). Strictly school-scoped (RLS on schoolId).
///
/// Returns the deleted row's metadata: { ok: true, data: StudyMaterialMeta }.
/// 404 when the row does not exist for this school.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params

      const material = await db.studyMaterial.findUnique({ where: { id } })
      if (!material) throw new Error('NOT_FOUND')
      if (material.schoolId !== schoolId) throw new Error('NOT_FOUND')

      let subjectName: string | null = null
      if (material.subjectId) {
        const subject = await db.subject.findFirst({
          where: { id: material.subjectId, schoolId },
          select: { name: true },
        })
        subjectName = subject?.name ?? null
      }

      // Best-effort byte removal — guarded by the same path safety check
      // as downloads; an already-missing file is fine (row still goes).
      if (isSafeStoredFileName(material.fileName)) {
        await unlink(studyMaterialPath(material.fileName)).catch(() => {})
      }

      await db.studyMaterial.delete({ where: { id } })

      return toStudyMaterialMeta(material, subjectName)
    },
    { roles: ['PRINCIPAL'] }
  )
}
