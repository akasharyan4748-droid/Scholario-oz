import { readFile, stat } from 'fs/promises'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { avatarPath, AVATAR_EXT_TO_MIME, isSafeAvatarFileName } from '@/lib/avatar'

export const runtime = 'nodejs'

/**
 * GET /api/profile/avatar/[userId] — authorized avatar stream.
 *
 * Visibility: the photo at <img src> is fetched with the viewer's cookie,
 * so this route can authenticate per-request. A viewer may see a user's
 * avatar when they ARE that user, share the school, or are the platform
 * super admin — the same trust boundary the rest of the ERP uses for
 * cross-role identity surfaces. Never public, never cached cross-user.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const viewer = await getCurrentUser()
    if (!viewer) return unauthorized()

    const { userId } = await params
    const target = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, schoolId: true, avatar: true, status: true },
    })
    if (!target?.avatar || !isSafeAvatarFileName(target.avatar)) return notFound()

    const allowed =
      viewer.id === target.id ||
      viewer.role === 'SUPER_ADMIN' ||
      (target.schoolId !== null && viewer.schoolId === target.schoolId)
    if (!allowed) return forbidden()

    const filePath = avatarPath(target.avatar)
    const info = await stat(filePath).catch(() => null)
    if (!info || !info.isFile()) return notFound()

    const bytes = await readFile(filePath)
    const ext = target.avatar.split('.').pop() ?? ''
    const mime = AVATAR_EXT_TO_MIME[ext] ?? 'application/octet-stream'

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(bytes.byteLength),
        // Private per-viewer: the authorization is cookie-based, so caches
        // must not share the bytes across users/devices.
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 400 })
  }
}

function unauthorized() {
  return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
}
function forbidden() {
  return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 })
}
function notFound() {
  return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 })
}
