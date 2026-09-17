'use client'

/**
 * previous-school — canonical derivation of a student's Previous School.
 *
 * The value shown in the Student Profile must come from the student's
 * actual admission/enrolment record — never a fabricated placeholder.
 * Three real cases exist in the Scholario data model:
 *
 *   CASE A — No previous school on the admission record
 *            → the field stays BLANK (the row is omitted; never "N/A").
 *
 *   CASE B — Student came from another school
 *            → display the exact stored previous-school name.
 *
 *   CASE C — Student was already enrolled in THIS school and progressed
 *            to the next class/session (internal promotion)
 *            → resolve to the school's actual current name. Two signals:
 *              a) the stored previous school IS this school (name match),
 *              b) the canonical enrolment timeline carries a `promotion`
 *                 event (executePromotion writes one) while no external
 *                 previous school was recorded.
 *
 * The derivation reads ONLY canonical data (StudentRecord + the school
 * identity resolved from School Settings) — no duplicate fields, no
 * UI-side hardcoding.
 */

import { useMemo } from 'react'
import { useSchoolProfile, type SchoolProfile } from '@/lib/school-profile'
import type { StudentRecord } from '@/lib/store/students-store'

/** Pure derivation — usable outside React (exports, documents, seeds). */
export function derivePreviousSchool(
  student: Pick<StudentRecord, 'previousSchool' | 'timeline'>,
  school: Pick<SchoolProfile, 'name' | 'shortName'>,
): string | null {
  const raw = student.previousSchool?.trim()

  if (raw) {
    const current = school.name.trim().toLowerCase()
    const short = school.shortName.trim().toLowerCase()
    const entered = raw.toLowerCase()
    // CASE C(a) — the recorded previous school is this same school
    // (e.g. promoted from Class 1 to Class 2 within the school).
    if (entered === current || entered === short) return school.name.trim()
    // CASE B — an actual external previous school.
    return raw
  }

  // CASE C(b) — no external previous school recorded, but the canonical
  // enrolment history shows an in-school promotion: the student's
  // previous "school" is this school itself.
  if ((student.timeline ?? []).some((e) => e.type === 'promotion')) {
    return school.name.trim()
  }

  // CASE A — genuinely no previous-school information.
  return null
}

/** Reactive hook for Student surfaces (re-derives when the school
 *  identity or the student record changes). Returns `null` when the
 *  field should stay blank. */
export function usePreviousSchool(
  student: Pick<StudentRecord, 'previousSchool' | 'timeline'>,
): string | null {
  const school = useSchoolProfile()
  return useMemo(() => derivePreviousSchool(student, school), [student, school])
}
