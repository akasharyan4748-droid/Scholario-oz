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

export const runtime = 'nodejs'

/// GET /api/study-materials/[id]/download
///
/// SERVER-AUTHORIZED file download. Roles: STUDENT / TEACHER / PRINCIPAL;
/// strictly school-scoped — the row must belong to the caller's school
/// (RLS; the id alone is never trusted). The bytes stream from
/// db/uploads/study-materials with the stored mimeType and a
/// Content-Disposition: attachment header carrying the original filename.
///
/// NEVER served statically: this route is the only reader of the upload
/// directory, and the stored fileName is path-guarded before use.
///
/// 404 when the row is missing OR the file is gone on disk.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    { roles: ['STUDENT', 'TEACHER', 'PRINCIPAL'] }
  )
}
