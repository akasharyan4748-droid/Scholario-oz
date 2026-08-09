'use client'

/**
 * teachers-mock-store — reactive wrapper around the static teacher mock data.
 *
 * The mock at `lib/mock/teachers.ts` is a static array. This Zustand store
 * wraps that array as the single source of truth for teacher LIFECYCLE state
 * (active vs archived), so that archive / restore / delete mutations
 * propagate reactively to every consumer in the Class Details tabs.
 *
 * Brief section 7: "The same teacher entity should have one authoritative
 *   lifecycle. Students & Classes should consume that canonical source."
 *
 * Brief section 14 + L: "Test: Archive → Save → reload. Restore → Save →
 *   reload. State remains correct." — uses Zustand `persist` middleware
 *   so archive/restore/delete mutations survive page reloads.
 *
 * Brief section 17: teacher lifecycle states are:
 *   ACTIVE + ASSIGNED      → teacher appears in selector + assigned to a slot
 *   ACTIVE + UNASSIGNED    → teacher appears in selector, not assigned to this class
 *   ARCHIVED + UNASSIGNED  → teacher is hidden from selector, recoverable via Archive
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { teachers as seedTeachers, type Teacher } from '@/lib/mock/teachers'

export type TeacherWithArchive = Teacher

interface TeachersMockState {
  /** Live teacher records (seed data + runtime archive mutations). */
  teachers: Teacher[]
  /** Archive a teacher — hides them from active selectors. */
  archiveTeacher: (id: string) => void
  /** Restore an archived teacher — makes them selectable again. */
  restoreTeacher: (id: string) => void
  /** Permanently delete a teacher record. Irreversible. */
  deleteTeacher: (id: string) => void
  /** Reset to seed data (used for testing/demo cleanup). */
  resetToSeed: () => void
}

export const useTeachersMockStore = create<TeachersMockState>()(
  persist(
    (set) => ({
      teachers: seedTeachers,
      archiveTeacher: (id) =>
        set((state) => ({
          teachers: state.teachers.map((t) =>
            t.id === id
              ? { ...t, archived: true, archivedAt: new Date().toISOString() }
              : t
          ),
        })),
      restoreTeacher: (id) =>
        set((state) => ({
          teachers: state.teachers.map((t) =>
            t.id === id
              ? { ...t, archived: false, archivedAt: undefined }
              : t
          ),
        })),
      deleteTeacher: (id) =>
        set((state) => ({
          teachers: state.teachers.filter((t) => t.id !== id),
        })),
      resetToSeed: () => set({ teachers: seedTeachers }),
    }),
    {
      name: 'scholario-teachers-mock-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist the teachers array, not the action functions.
      partialize: (state) => ({ teachers: state.teachers }),
    }
  )
)

/**
 * Reactive teacher lookup hook.
 * Returns the teacher record (or undefined) and re-renders when the teacher's
 * archived status changes.
 */
export function useTeacher(id: string | null | undefined): Teacher | undefined {
  return useTeachersMockStore((s) =>
    id ? s.teachers.find((t) => t.id === id) : undefined
  )
}
