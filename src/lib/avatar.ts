// ============================================================
// SS-1 — AVATAR STORAGE (server-side profile photo helpers)
// ------------------------------------------------------------
// Follows the RB-1 study-materials storage discipline: bytes live under
// db/uploads/avatars/<safe-file-name>, served ONLY through the authorized
// /api/profile/avatar/[userId] route (cookie-authenticated, same-school),
// never from /public. The on-disk fileName is server-generated (never from
// the user's upload name); User.avatar stores it, User.avatarUrl carries
// the serve path for <img src> (same-origin requests carry the cookie).
// ============================================================

import { randomBytes } from 'crypto'
import { mkdir } from 'fs/promises'
import path from 'path'

/** Absolute upload directory (db/uploads/avatars). */
export const AVATAR_UPLOAD_DIR = path.join(process.cwd(), 'db', 'uploads', 'avatars')

/** Idempotent directory bootstrap for the upload route. */
export async function ensureAvatarDir(): Promise<void> {
  await mkdir(AVATAR_UPLOAD_DIR, { recursive: true })
}

/** Upload ceiling — 5 MB (bytes). */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024

/** Allowed MIME types → canonical extension (narrow, image-only). */
export const AVATAR_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/** Content-Type by stored extension (download side). */
export const AVATAR_EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

/**
 * Light magic-byte sniff on top of the declared MIME — rejects polyglot
 * or mislabeled payloads before a single byte hits the disk.
 */
export function avatarBytesMatchMime(mime: string, buf: Buffer): boolean {
  if (buf.byteLength < 12) return false
  if (mime === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
  if (mime === 'image/png')
    return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
  if (mime === 'image/webp')
    return buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP'
  return false
}

/** Server-generated safe file name (userId-scoped prefix + random base). */
export function generateAvatarFileName(userId: string, mimeType: string): string {
  const ext = AVATAR_MIME_TO_EXT[mimeType] ?? 'bin'
  const id = `av${Date.now().toString(36)}${randomBytes(10).toString('hex')}`
  // Prefix with the sanitized user id so on-disk ownership is auditable.
  const safeUser = userId.replace(/[^a-z0-9]/gi, '').slice(0, 16).toLowerCase()
  return `${safeUser}-${id}.${ext}`
}

/** Defense-in-depth path guard (same policy as study materials). */
export function isSafeAvatarFileName(fileName: string): boolean {
  return /^[a-z0-9]+-[a-z0-9]+\.[a-z0-9]{1,8}$/.test(fileName)
}

/** Absolute path for a stored avatar (assumes the guard passed). */
export function avatarPath(fileName: string): string {
  return path.join(AVATAR_UPLOAD_DIR, fileName)
}

/** Public serve path for a user's avatar (cache-busted client-side). */
export function avatarServePath(userId: string): string {
  return `/api/profile/avatar/${userId}`
}
