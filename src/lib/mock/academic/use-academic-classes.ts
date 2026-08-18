'use client'

/**
 * useAcademicClasses — client-side resolver hook (Spec §28).
 *
 * Bridges the Students & Classes Zustand store (the mock academic source
 * of truth) to the Examination Create Exam UI. Returns Examination-level
 * classes with sections collapsed and subjects hydrated from the canonical
 * `academicSubjects` registry.
 *
 * This is the future-proof seam: when the next phase replaces mock data
 * with a real API, only this hook needs to change — Examination UI stays
 * the same.
 */

import { useMemo } from 'react'
import { useStudentsStore } from '@/lib/store/students-store'
import {
  resolveAcademicClasses,
  toExamLevelClasses,
  type ExamLevelClass,
} from '@/lib/mock/academic'

/**
 * Returns all active academic classes (sections collapsed, subjects
 * hydrated) for Examination consumption. Re-renders automatically when
 * the underlying Zustand store changes (add/archive/restore/rename).
 */
export function useAcademicClasses(): ExamLevelClass[] {
  const classes = useStudentsStore((s) => s.classes)
  const academicSubjects = useStudentsStore((s) => s.academicSubjects)

  return useMemo(() => {
    const resolved = resolveAcademicClasses(classes, academicSubjects)
    return toExamLevelClasses(resolved)
  }, [classes, academicSubjects])
}

/**
 * Returns active subjects for a specific class id (Spec §16).
 * Resolves through the canonical registry so renames propagate.
 */
export function useClassSubjects(classId: string | null | undefined) {
  const classes = useStudentsStore((s) => s.classes)
  const academicSubjects = useStudentsStore((s) => s.academicSubjects)

  return useMemo(() => {
    if (!classId) return []
    const cls = classes.find((c) => c.id === classId)
    if (!cls) return []
    return resolveAcademicClasses([cls], academicSubjects)[0]?.subjects ?? []
  }, [classes, academicSubjects, classId])
}
