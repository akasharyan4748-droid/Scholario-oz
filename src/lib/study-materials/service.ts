// ============================================================
// STUDY MATERIALS — server-side service (Student Workspace §2–§13)
// ------------------------------------------------------------
// The single server-side enforcement point for the Study Materials
// repository: file validation, safe storage paths, audience/targeting
// resolution and student access checks. Every API route funnels
// through here so the rules exist exactly once.
//
// SECURITY MODEL:
//   · Files live OUTSIDE any client-reachable static tree, under
//     db/uploads/study-materials/<storageKey>. The storageKey is
//     server-generated randomness — the client NEVER influences it.
//   · A material is served ONLY after canStudentAccess()/staff check
//     passes server-side (spec §8: no private file may be fetched by
//     guessing a URL — the id alone is worthless without authorization).
//   · Tenant isolation: every query is school-scoped.
// ============================================================

import { randomBytes } from 'crypto'
import { mkdir, readFile, writeFile, unlink } from 'fs/promises'
import path from 'path'
import type { StudyMaterial, Student } from '@prisma/client'

export const MATERIAL_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const
export type MaterialStatus = (typeof MATERIAL_STATUSES)[number]

export const MATERIAL_AUDIENCES = ['SCHOOL', 'CLASS', 'STUDENTS'] as const
export type MaterialAudience = (typeof MATERIAL_AUDIENCES)[number]

/** Upload ceiling — generous for worksheets/notes, far below payload abuse. */
export const MAX_MATERIAL_BYTES = 15 * 1024 * 1024 // 15 MB

/**
 * Allowed types (spec §2: PDF, images, worksheets, notes, circulars,
 * presentations, study guides, question papers). Detected by extension +
 * signature sniffing — the client MIME header is never trusted (spec §9).
 */
const ALLOWED_TYPES: Record<string, { ext: string[]; mime: string; label: string }> = {
  pdf: { ext: ['pdf'], mime: 'application/pdf', label: 'PDF' },
  image: { ext: ['png', 'jpg', 'jpeg', 'webp', 'gif'], mime: 'image/*', label: 'Image' },
  text: { ext: ['txt', 'csv'], mime: 'text/*', label: 'Text' },
  doc: { ext: ['doc', 'docx'], mime: 'application/msword', label: 'Document' },
  sheet: { ext: ['xls', 'xlsx'], mime: 'application/vnd.ms-excel', label: 'Spreadsheet' },
  slides: { ext: ['ppt', 'pptx'], mime: 'application/vnd.ms-powerpoint', label: 'Presentation' },
}

export interface FileTypeCheck {
  ok: boolean
  mime: string
  kind: string // pdf | image | text | doc | sheet | slides
  ext: string
  label?: string
  error?: string
}

/** Determine the file type from extension + magic bytes (never client MIME). */
export function checkFileType(fileName: string, head: Buffer): FileTypeCheck {
  const ext = fileName.toLowerCase().split('.').pop() ?? ''
  const entry = Object.entries(ALLOWED_TYPES).find(([, v]) => v.ext.includes(ext))
  if (!entry) {
    return { ok: false, mime: '', kind: '', ext, error: `.${ext} files are not supported. Allowed: PDF, images, Word, Excel, PowerPoint, text.` }
  }
  const [kind, def] = entry
  // Signature sniffing where a stable magic exists.
  const hex = head.subarray(0, 8).toString('hex').toLowerCase()
  const sigOk =
    kind === 'pdf' ? head.subarray(0, 5).toString('latin1') === '%PDF-' :
    ext === 'png' ? hex.startsWith('89504e47') :
    ext === 'jpg' || ext === 'jpeg' ? hex.startsWith('ffd8ff') :
    ext === 'gif' ? hex.startsWith('47494638') :
    ext === 'docx' || ext === 'xlsx' || ext === 'pptx' ? hex.startsWith('504b0') :
    true // txt/csv/legacy binary formats lack cheap stable signatures
  if (!sigOk) {
    return { ok: false, mime: '', kind: '', ext, error: 'The file contents do not match its extension.' }
  }
  const mime = kind === 'image' ? imageMimeOf(ext) : def.mime
  return { ok: true, mime, kind, ext, label: def.label }
}

function imageMimeOf(ext: string): string {
  switch (ext) {
    case 'png': return 'image/png'
    case 'jpg':
    case 'jpeg': return 'image/jpeg'
    case 'webp': return 'image/webp'
    default: return 'image/gif'
  }
}

/**
 * Sanitize a display filename: basename only, no control chars, no path
 * tricks, bounded length. The result is what students SEE — storage paths
 * use the server-generated storageKey instead.
 */
export function sanitizeFileName(raw: string): string {
  const base = raw.split(/[/\\]/).pop() ?? 'material'
  const cleaned = base
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[^\w\-. ()'\[\]]+/g, '_')
    .replace(/^\.+/, '')
    .trim()
  const bounded = cleaned.length > 120 ? cleaned.slice(0, 117) + '...' : cleaned
  return bounded || 'material'
}

/* ── Storage ────────────────────────────────────────────────────────── */

const STORAGE_DIR = path.join(process.cwd(), 'db', 'uploads', 'study-materials')

export function materialStorageDir(): string {
  return STORAGE_DIR
}

/** New opaque storage key (never derived from client input). */
export function newStorageKey(ext: string): string {
  return `${Date.now().toString(36)}-${randomBytes(12).toString('hex')}.${ext}`
}

/** Resolve the absolute path for a storage key — REJECT traversal. */
export function materialFilePath(storageKey: string): string {
  if (!/^[a-z0-9-]+\.[a-z0-9]+$/i.test(storageKey)) {
    throw new Error('Invalid storage key.')
  }
  return path.join(STORAGE_DIR, storageKey)
}

export async function writeMaterialFile(storageKey: string, bytes: Buffer): Promise<void> {
  await mkdir(STORAGE_DIR, { recursive: true })
  await writeFile(materialFilePath(storageKey), bytes)
}

export async function readMaterialFile(storageKey: string): Promise<Buffer> {
  return readFile(materialFilePath(storageKey))
}

export async function deleteMaterialFile(storageKey: string): Promise<void> {
  try {
    await unlink(materialFilePath(storageKey))
  } catch {
    // Missing file is not a failure — the row is being removed regardless.
  }
}

/* ── Targeting + access ─────────────────────────────────────────────── */

export function parseStudentIds(material: Pick<StudyMaterial, 'studentIds'>): string[] {
  return material.studentIds.split(',').map((s) => s.trim()).filter(Boolean)
}

/**
 * Can THIS student see the material? (spec §4)
 *   · material must be PUBLISHED (students never see DRAFT/ARCHIVED)
 *   · SCHOOL audience → everyone in the tenant
 *   · CLASS audience → the student's class must match
 *   · STUDENTS audience → the student must be explicitly listed
 */
export function canStudentAccess(
  material: Pick<StudyMaterial, 'status' | 'audience' | 'classId' | 'studentIds'>,
  student: Pick<Student, 'id' | 'classId'>,
): boolean {
  if (material.status !== 'PUBLISHED') return false
  switch (material.audience) {
    case 'SCHOOL':
      return true
    case 'CLASS':
      return !!material.classId && material.classId === student.classId
    case 'STUDENTS':
      return parseStudentIds(material).includes(student.id)
    default:
      return false
  }
}

/** The public API shape — NEVER leaks storageKey or uploader user ids. */
export interface MaterialDto {
  id: string
  title: string
  description: string | null
  subject: string | null
  audience: MaterialAudience
  audienceLabel: string
  className: string | null
  fileName: string
  mimeType: string
  kind: string
  sizeBytes: number
  status: MaterialStatus
  uploadedByName: string
  createdAt: string
  updatedAt: string
}

export function kindOf(mime: string, fileName: string): string {
  if (mime === 'application/pdf') return 'pdf'
  if (mime.startsWith('image/')) return 'image'
  const ext = fileName.toLowerCase().split('.').pop() ?? ''
  if (['doc', 'docx'].includes(ext)) return 'doc'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'sheet'
  if (['ppt', 'pptx'].includes(ext)) return 'slides'
  return 'text'
}

export function audienceLabelOf(audience: string, className: string | null, studentCount: number): string {
  switch (audience) {
    case 'SCHOOL': return 'Whole school'
    case 'CLASS': return className ? `Class ${className}` : 'Class'
    case 'STUDENTS': return `${studentCount} student${studentCount === 1 ? '' : 's'}`
    default: return audience
  }
}

export function toMaterialDto(
  m: StudyMaterial & { class?: { name: string | null } | null },
): MaterialDto {
  const studentCount = parseStudentIds(m).length
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    subject: m.subject,
    audience: m.audience as MaterialAudience,
    audienceLabel: audienceLabelOf(m.audience, m.class?.name ?? null, studentCount),
    className: m.class?.name ?? null,
    fileName: m.fileName,
    mimeType: m.mimeType,
    kind: kindOf(m.mimeType, m.fileName),
    sizeBytes: m.sizeBytes,
    status: m.status as MaterialStatus,
    uploadedByName: m.uploadedByName,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }
}
