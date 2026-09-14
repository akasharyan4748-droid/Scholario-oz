import { NextRequest } from 'next/server'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { Readable } from 'stream'
import { db } from '@/lib/db'
import { withUser, schoolScoped } from '@/lib/api'
import {
  isSafeStoredFileName,
  studyMaterialPath,
  contentDispositionAttachment,
} from '@/lib/study-materials'
import { requireStudent, materialVisibleToStudent, targetedMaterialIds } from '@/lib/learning'

export const runtime = 'nodejs'

/// GET /api/study-materials/[id]/download
///
/// SERVER-AUTHORIZED file download — the ONLY reader of the upload
/// directory, path-guarded, never served statically.
///
/// Authorization (L2D spec §33/§70 — publication state is now part of
/// the check):
///   · SCHOOL scope always (RLS — a foreign id is an honest 404).
///   · STUDENT: published AND authorized (whole-school / my class label /
///     targeted at me). Anything else is an honest 404.
///   · TEACHER: any PUBLISHED material of the school; DRAFT/ARCHIVED only
///     for the uploader (their own work-in-progress).
///   · PRINCIPAL: any status for their school.
///
/// The bytes stream from db/uploads/study-materials with the stored
/// mimeType and a Content-Disposition: attachment header carrying the
/// original filename. 404 when the row is missing OR the file is gone.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withUser(
    async (user) => {
      const schoolId = schoolScoped(user)
      const { id } = await params

      const material = await db.studyMaterial.findUnique({ where: { id } })
      if (!material) throw new Error('NOT_FOUND')
      // RLS — a material from another school is indistinguishable from
      // "does not exist" for this caller.
      if (material.schoolId !== schoolId) throw new Error('NOT_FOUND')

      // ── Publication-state-aware authorization (L2D) ──────────────────
      if (user.role === 'STUDENT') {
        const ctx = await requireStudent(user)
        const targeted = await targetedMaterialIds(ctx.studentId)
        if (!materialVisibleToStudent(material, ctx, targeted)) throw new Error('NOT_FOUND')
      } else if (user.role === 'TEACHER') {
        // Published rows are readable school-wide; drafts/archives stay
        // with their uploader until a principal or the uploader publishes.
        if (material.status !== 'published' && material.uploadedById !== user.id) {
          throw new Error('FORBIDDEN')
        }
      }
      // PRINCIPAL — full school-scoped access, any status (unchanged).

      if (!isSafeStoredFileName(material.fileName)) throw new Error('NOT_FOUND')

      const filePath = studyMaterialPath(material.fileName)
      let size: number
      try {
        const st = await stat(filePath)
        if (!st.isFile()) throw new Error('NOT_FOUND')
        size = st.size
      } catch {
        // Row exists but the bytes are gone — honest 404, never a 500.
        throw new Error('NOT_FOUND')
      }

      const nodeStream = createReadStream(filePath)
      const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream<Uint8Array>

      return new Response(webStream, {
        status: 200,
        headers: {
          'Content-Type': material.mimeType,
          'Content-Length': String(size),
          'Content-Disposition': contentDispositionAttachment(material.originalName),
          // Authorized per-session content — never shared-cached.
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    },
    { roles: ['STUDENT', 'TEACHER', 'PRINCIPAL'] },
  )
}
