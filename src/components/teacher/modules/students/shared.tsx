'use client'

/**
 * Student Directory (Task 2-c) — shared derivation rules + small
 * presentational primitives used across the module's components.
 *
 * ── STATUS THRESHOLDS (the only labels on screen, defined HERE) ────────
 *
 *   AT RISK   attendance < 75%  OR  latest exam average < 40%
 *             — each metric only counts when it exists; a student with
 *               no attendance records AND no exam marks carries NO status
 *               (never a false "At Risk").
 *   STEADY    at least one metric exists and neither At Risk rule trips.
 *
 *   Top Attendance filter: attendance ≥ 95%.
 *   At Risk filter:        students matching the AT RISK rule above.
 *
 * These mirror the school-report convention (75% attendance minimum,
 * 40% pass line) and are the same numbers the summary cards and the
 * profile sheet use — change them here only.
 */

import type { DirectoryStudent } from './types'

export const AT_RISK_ATTENDANCE_PCT = 75
export const AT_RISK_AVERAGE_PCT = 40
export const TOP_ATTENDANCE_PCT = 95

export type DirectoryFilter = 'all' | 'at-risk' | 'top-attendance'

export const DIRECTORY_FILTERS: { key: DirectoryFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'at-risk', label: 'At Risk' },
  { key: 'top-attendance', label: 'Top Attendance' },
]

export type StudentStatusKey = 'at-risk' | 'steady'

export interface StudentStatus {
  key: StudentStatusKey
  label: string
}

/** The teacher-facing status of one student — null when nothing is on record. */
export function statusOf(s: DirectoryStudent): StudentStatus | null {
  const hasAttendance = s.attendance.pct != null
  const hasMarks = s.latestExam != null
  if (!hasAttendance && !hasMarks) return null
  if (isAtRisk(s)) return { key: 'at-risk', label: 'At Risk' }
  return { key: 'steady', label: 'Steady' }
}

/** AT RISK rule (see the threshold block at the top of this file). */
export function isAtRisk(s: DirectoryStudent): boolean {
  if (s.attendance.pct != null && s.attendance.pct < AT_RISK_ATTENDANCE_PCT) return true
  if (s.latestExam != null && s.latestExam.averagePct < AT_RISK_AVERAGE_PCT) return true
  return false
}

/** Top Attendance rule: attendance ≥ 95% (requires real records). */
export function isTopAttendance(s: DirectoryStudent): boolean {
  return s.attendance.pct != null && s.attendance.pct >= TOP_ATTENDANCE_PCT
}

/** Filter predicate for the roster's filter row. */
export function matchesFilter(s: DirectoryStudent, filter: DirectoryFilter): boolean {
  if (filter === 'at-risk') return isAtRisk(s)
  if (filter === 'top-attendance') return isTopAttendance(s)
  return true
}

/** Search by name, roll number or admission number (case-insensitive). */
export function matchesSearch(s: DirectoryStudent, raw: string): boolean {
  const q = raw.trim().toLowerCase()
  if (!q) return true
  return (
    s.name.toLowerCase().includes(q) ||
    (s.rollNo ?? '').toLowerCase().includes(q) ||
    (s.admissionNo ?? '').toLowerCase().includes(q)
  )
}

/** Tone class for an attendance percentage value. */
export function attendanceToneClass(pct: number | null): string {
  if (pct == null) return 'text-muted-foreground'
  if (pct < AT_RISK_ATTENDANCE_PCT) return 'text-rose-600 dark:text-rose-400'
  if (pct >= TOP_ATTENDANCE_PCT) return 'text-emerald-600 dark:text-emerald-400'
  return 'text-foreground'
}

/** Tone class for a latest-exam average percentage value. */
export function averageToneClass(avgPct: number | null): string {
  if (avgPct == null) return 'text-muted-foreground'
  if (avgPct < AT_RISK_AVERAGE_PCT) return 'text-rose-600 dark:text-rose-400'
  return 'text-foreground'
}

// ─── small presentational primitives ─────────────────────────────────

export function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <span className="w-24 shrink-0 text-muted-foreground">{label}:</span>
      <span className="min-w-0 flex-1 break-words font-medium">{value}</span>
    </div>
  )
}

/** The quiet uppercase section label used in the grid card + profile sheet. */
export function SectionLabel({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      {icon}
      {children}
    </p>
  )
}
