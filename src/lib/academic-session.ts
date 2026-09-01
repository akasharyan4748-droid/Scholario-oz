'use client'

/**
 * academic-session — THE single source of truth for the school's active
 * academic session (SaaS-STAGE-1, session-derived rule).
 *
 * Rule: the Principal NEVER types a session. Every surface that needs the
 * academic session reads it from here (which derives it from the school's
 * configuration store). Display label format: "AY 2026–2027" (en dash).
 * Storage id format: "2026-2027" (hyphen — matches FeeTransaction /
 * FeeStructureVersion.academicYear and the fee store's
 * CURRENT_ACADEMIC_YEAR).
 *
 * Per-version snapshots: published fee structures keep the academicYear
 * they were published under (FeeStructureVersion / FeeStructureConfig
 * .academicYear). This module is only for the CURRENT active session —
 * never rewrite historical snapshots through it.
 */

import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'

/** Canonical active session id (hyphen format — storage/API format). */
export const ACTIVE_SESSION_ID = '2026-2027'

/** Normalize any session string ('2026–2027' en dash, '2026-2027' hyphen,
 *  '2026-27' short form) to the canonical hyphen id, or null when
 *  unparseable. Accepts any consecutive year pair. */
export function normalizeSessionId(raw: string | null | undefined): string | null {
  if (!raw) return null
  const m = raw.trim().match(/^(\d{4})\s*[–-]\s*(\d{2}|\d{4})$/)
  if (!m) return null
  const start = Number(m[1])
  const end = m[2].length === 4 ? Number(m[2]) : Number(`${String(start).slice(0, 2)}${m[2]}`)
  if (end !== start + 1) return null
  return `${start}-${end}`
}

/** "2026-2027" → "AY 2026–2027" (display label with en dash). */
export function formatSessionLabel(sessionId: string): string {
  return `AY ${sessionId.replace('-', '–')}`
}

/**
 * Read the school's active academic session id from the school
 * configuration store (falling back to the canonical constant when the
 * stored value is absent/unparseable). Non-hook variant for use outside
 * React (print engines, CSV export, etc.).
 */
export function getActiveAcademicSessionId(): string {
  try {
    const raw = useSchoolSettingsStore.getState().academics?.currentSession
    return normalizeSessionId(raw) ?? ACTIVE_SESSION_ID
  } catch {
    return ACTIVE_SESSION_ID
  }
}

/** Non-hook: active session display label, e.g. "AY 2026–2027". */
export function getActiveAcademicSessionLabel(): string {
  return formatSessionLabel(getActiveAcademicSessionId())
}

/**
 * React hook — the ONLY way UI components should read the active session.
 * Subscribes to school-settings so a session change re-renders consumers.
 */
export function useAcademicSession(): { id: string; label: string } {
  const raw = useSchoolSettingsStore((s) => s.academics?.currentSession)
  const id = normalizeSessionId(raw) ?? ACTIVE_SESSION_ID
  return { id, label: formatSessionLabel(id) }
}
