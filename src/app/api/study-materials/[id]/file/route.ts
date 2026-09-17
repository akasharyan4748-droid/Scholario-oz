import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { api } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { readMaterialFile, canStudentAccess } from '@/lib/study-materials/service'

export const runtime = 'nodejs'

/// STUDY MATERIALS — SECURE FILE STREAM (spec §8, §11).
///
/// GET /api/study-materials/[id]/file[?download=1]
///
/// The ONLY way material bytes leave the server:
///   · STUDENT → the session's linked student must pass canStudentAccess
///     (PUBLISHED + school-wide / their class / explicitly listed). A
///     student can never fetch another class's, another school's or a
///     private material by guessing the id — the id is worthless without
///     authorization, and the storageKey never leaves the server.
///   · Staff (TEACHER/PRINCIPAL/MANAGEMENT) → the material must belong to
///     their school (tenant check).
///   · `download=1` → Content-Disposition: attachment (download action);
///     otherwise inline (preview).
///
/// Returns raw bytes (the api() wrapper passes Responses through).

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return api(async () => {
    const user = await getCurrentUser()
    if (!user || user.status !== 'ACTIVE') throw new Error('UNAUTHORIZED')

    const { id } = await params
    const material = await db.studyMaterial.findUnique({
      where: { id },
      include: { class: { select: { name: true } } },
    })
    if (!material) throw new Error('NOT_FOUND')

    if (user.schoolId !== material.schoolId) {
      // Cross-tenant access attempt — never reveal existence.
      throw new Error('NOT_FOUND')
    }

    if (user.role === 'STUDENT') {
      const me = await db.student.findFirst({ where: { userId: user.id } })
      if (!me || me.schoolId !== material.schoolId || !canStudentAccess(material, me)) {
        throw new Error('FORBIDDEN')
      }
    } else if (!['TEACHER', 'PRINCIPAL', 'MANAGEMENT'].includes(user.role)) {
      throw new Error('FORBIDDEN')
    }

    const bytes = await readMaterialFile(material.storageKey).catch(() => null)
    if (!bytes) throw new Error('The stored file is no longer available.')

    const download = req.nextUrl.searchParams.get('download') === '1'
    // sanitizeFileName ran at upload; fileName is display-safe metadata.
    const disposition = `${download ? 'attachment' : 'inline'}; filename="${material.fileName.replace(/"/g, '')}"`

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': material.mimeType,
        'Content-Length': String(bytes.length),
        'Content-Disposition': disposition,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  })
}
