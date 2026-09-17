'use client'

// ============================================================
// STUDY MATERIALS — client data layer
// ------------------------------------------------------------
// Thin typed fetchers over the server API + a NON-persisted mirror of
// the student's AUTHORIZED material list (the server filters by
// audience/authorization — the mirror only ever holds what the server
// already authorized, which is what makes the global search
// permission-aware for free, spec §12).
// ============================================================

import { create } from 'zustand'

export interface StudyMaterialDto {
  id: string
  title: string
  description: string | null
  subject: string | null
  audience: 'SCHOOL' | 'CLASS' | 'STUDENTS'
  audienceLabel: string
  className: string | null
  fileName: string
  mimeType: string
  kind: string
  sizeBytes: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  uploadedByName: string
  createdAt: string
  updatedAt: string
}

interface ApiEnvelope<T> {
  ok: boolean
  data?: T
  error?: string
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin' })
  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null
  if (!res.ok || !json?.ok || json.data === undefined) {
    throw new Error(json?.error || `The request failed (${res.status}).`)
  }
  return json.data
}

// ── Student list ─────────────────────────────────────────────────────

export interface StudentMaterialsResponse {
  role: string
  className: string
  materials: StudyMaterialDto[]
}

export async function fetchMyMaterials(signal?: AbortSignal): Promise<StudentMaterialsResponse> {
  const res = await fetch('/api/study-materials', { credentials: 'same-origin', signal })
  const json = (await res.json().catch(() => null)) as ApiEnvelope<StudentMaterialsResponse> | null
  if (!res.ok || !json?.ok || !json.data) {
    throw new Error(json?.error || `Could not load study materials (${res.status}).`)
  }
  return json.data
}

/** Download/preview URL for a material (server-authorizes every stream). */
export function materialFileUrl(id: string, download = false): string {
  return `/api/study-materials/${id}/file${download ? '?download=1' : ''}`
}

// ── Mirror store (authorized student list → powers global search) ────

interface StudentMaterialsState {
  materials: StudyMaterialDto[]
  loadedAt: string | null
  setMaterials: (materials: StudyMaterialDto[]) => void
}

export const useStudentMaterialsStore = create<StudentMaterialsState>((set) => ({
  materials: [],
  loadedAt: null,
  setMaterials: (materials) => set({ materials, loadedAt: new Date().toISOString() }),
}))

// ── Staff side (teacher / principal managers) ────────────────────────

export interface UploadContext {
  classes: { id: string; name: string }[]
  students: { id: string; name: string; rollNo: string; classId: string }[]
  subjects: string[]
}

export async function fetchUploadContext(): Promise<UploadContext> {
  return getJson<UploadContext>('/api/study-materials/context')
}

export async function fetchSchoolMaterials(): Promise<StudyMaterialDto[]> {
  const data = await getJson<{ role: string; className: string; materials: StudyMaterialDto[] }>(
    '/api/study-materials'
  )
  return data.materials
}

export interface UploadMaterialInput {
  title: string
  subject: string | null
  description: string | null
  audience: 'SCHOOL' | 'CLASS' | 'STUDENTS'
  classId: string | null
  studentIds: string[]
  status: 'PUBLISHED' | 'DRAFT'
  file: File
}

export async function uploadMaterial(input: UploadMaterialInput): Promise<StudyMaterialDto> {
  const form = new FormData()
  form.set('title', input.title)
  if (input.subject) form.set('subject', input.subject)
  if (input.description) form.set('description', input.description)
  form.set('audience', input.audience)
  if (input.audience === 'CLASS' && input.classId) form.set('classId', input.classId)
  if (input.audience === 'STUDENTS' && input.studentIds.length > 0) {
    form.set('studentIds', input.studentIds.join(','))
  }
  form.set('status', input.status)
  form.set('file', input.file)

  const res = await fetch('/api/study-materials', { method: 'POST', body: form, credentials: 'same-origin' })
  const json = (await res.json().catch(() => null)) as ApiEnvelope<StudyMaterialDto> | null
  if (!res.ok || !json?.ok || !json.data) {
    throw new Error(json?.error || 'The upload was not accepted.')
  }
  return json.data
}

export async function patchMaterial(
  id: string,
  patch: { status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'; title?: string; description?: string | null; subject?: string | null }
): Promise<StudyMaterialDto> {
  const res = await fetch(`/api/study-materials/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
    credentials: 'same-origin',
  })
  const json = (await res.json().catch(() => null)) as ApiEnvelope<StudyMaterialDto> | null
  if (!res.ok || !json?.ok || !json.data) {
    throw new Error(json?.error || 'The update was not accepted.')
  }
  return json.data
}

export async function deleteMaterial(id: string): Promise<void> {
  const res = await fetch(`/api/study-materials/${id}`, { method: 'DELETE', credentials: 'same-origin' })
  const json = (await res.json().catch(() => null)) as ApiEnvelope<{ deleted: boolean }> | null
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || 'The material could not be deleted.')
  }
}
