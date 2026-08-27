'use client'

/**
 * Student-side helpers for the Applications & Forms module.
 *
 * IDENTITY MODEL (two records, one demo student):
 *   • DISPLAY identity  — the mock roster student (`getStudentById('STU-2024-018')`,
 *     Aarav Sharma) used across the student panel.
 *   • FINANCIAL identity — the CANONICAL twin in the students store, matched by
 *     `admissionNo` (DSO2024018). Submissions and payments MUST use this record —
 *     the fee store validates canonical ids only, and payment derivation joins
 *     on `studentId`.
 *   Fallback when no twin exists: first Active canonical student whose class
 *   name starts with "Class 2" (the demo student's class).
 */

import { useMemo } from 'react'
import { getStudentById } from '@/lib/mock/students'
import { useStudentsStore, type StudentRecord } from '@/lib/store/students-store'
import {
  useApplicationsStore,
  type ApplicationAuditEvent,
  type CombinedSubmissionStatus,
  type StudentSubmissionIdentity,
} from '@/lib/store/applications-store'

export const DEMO_STUDENT_ID = 'STU-2024-018'

/** Display + canonical identity pair for the demo student. */
export interface StudentIdentityPair {
  /** Display identity from the mock roster (the student-panel face). */
  display: ReturnType<typeof getStudentById>
  /** Canonical record — used for submissions, payments and eligibility. */
  canonical: StudentRecord
}

/** Reactive hook resolving the canonical (financial) identity. */
export function useDemoStudent(): StudentIdentityPair | null {
  const students = useStudentsStore((s) => s.students)
  return useMemo(() => {
    const canonical = resolveCanonicalStudent(students)
    if (!canonical) return null
    return { display: getStudentById(DEMO_STUDENT_ID), canonical }
  }, [students])
}

/** Resolve the canonical (financial) identity for the demo student (non-reactive). */
export function resolveCanonicalStudent(students: StudentRecord[]): StudentRecord | undefined {
  const mock = getStudentById(DEMO_STUDENT_ID)
  if (mock) {
    const twin = students.find((s) => s.admissionNo === mock.admissionNo && s.status === 'Active')
    if (twin) return twin
  }
  return students.find((s) => s.status === 'Active' && s.className.startsWith('Class 2'))
}

/** Snapshot bundle the store expects on every submission. */
export function buildSubmissionIdentity(canonical: StudentRecord): StudentSubmissionIdentity {
  return {
    id: canonical.id,
    name: canonical.name,
    admissionNo: canonical.admissionNo,
    className: canonical.className,
    classId: canonical.classId,
    section: canonical.section,
    guardianName: canonical.guardianName,
    guardianPhone: canonical.guardianPhone,
  }
}

/**
 * Append an audit event to the applications store.
 *
 * NOTE: the store contract documents an `addAuditEvent` action, but the
 * current applications-store build does not export one. This helper writes
 * the exact same `ApplicationAuditEvent` shape through the store's public
 * `setState` — same prepend order as the store's internal `pushAudit` —
 * without touching the store file. If the action lands upstream, swap the
 * body to `useApplicationsStore.getState().addAuditEvent(ev)`.
 */
export function addAuditEvent(ev: Omit<ApplicationAuditEvent, 'id'>): void {
  useApplicationsStore.setState((state) => ({
    audit: [
      {
        ...ev,
        id: `AEV-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
      },
      ...state.audit,
    ],
  }))
}

/** Whole days until a yyyy-mm-dd deadline (negative once passed). */
export function daysUntil(dateStr: string, now: Date = new Date()): number {
  const target = new Date(`${dateStr}T23:59:59`)
  if (Number.isNaN(target.getTime())) return Number.NaN
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000)
}

/** Quiet chip tint per combined submission status. */
export function submissionStatusChipClass(status: CombinedSubmissionStatus): string {
  switch (status) {
    case 'Approved':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
    case 'Paid · Under Review':
    case 'Under Review':
      return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-400'
    case 'Awaiting Payment':
    case 'Awaiting Verification':
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'
    case 'Correction Required':
    case 'Rejected':
      return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400'
    case 'Physical Doc Pending':
    case 'Physical Doc Verification':
      return 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-400'
    case 'Withdrawn':
      return 'border-border bg-muted/50 text-muted-foreground'
    default:
      return 'border-border bg-muted/40 text-foreground'
  }
}
