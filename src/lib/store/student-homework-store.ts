'use client'

// ============================================================
// STUDENT HOMEWORK STORE (STU-F)
// ------------------------------------------------------------
// Persisted homework submission state for the student role.
// Replaces the old local useState map (initialSubmitted) which was
// lost on every unmount — "Submitted" status + timestamps now
// survive navigation and reloads. Tenant-scoped like every other
// store. The closed/graded homework (teacher feedback) lives in the
// mock data; only ACTIVE submissions are user state, so they live
// here.
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createTenantScopedStorage } from '@/lib/tenant/tenant-storage'

/** One submission per homework id — the date it was submitted on. */
export interface HomeworkSubmission {
  /** ISO date (YYYY-MM-DD) the student submitted the homework. */
  submittedOn: string
}

interface StudentHomeworkState {
  /** homeworkId → submission record. */
  submitted: Record<string, HomeworkSubmission>
  markSubmitted: (homeworkId: string) => void
  resetSubmissions: () => void
}

export const useStudentHomeworkStore = create<StudentHomeworkState>()(
  persist(
    (set) => ({
      submitted: {},

      markSubmitted: (homeworkId) =>
        set((s) =>
          s.submitted[homeworkId]
            ? s
            : {
                submitted: {
                  ...s.submitted,
                  [homeworkId]: { submittedOn: new Date().toISOString().slice(0, 10) },
                },
              },
        ),

      resetSubmissions: () => set({ submitted: {} }),
    }),
    {
      name: 'scholario-student-homework-v1',
      storage: createTenantScopedStorage('scholario-student-homework-v1'),
      version: 1,
      partialize: (s) => ({ submitted: s.submitted }),
    },
  ),
)
