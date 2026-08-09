'use client'

/**
 * timetable-store — canonical source of truth for the school's master timetable.
 *
 * Brief section 1 + 18 + 19: ONE canonical scheduling source of truth that
 * will eventually power Principal / Teacher / Student views.
 *
 * Brief section 37: "All timetable mutations must actually persist through
 * the existing application state architecture." Uses Zustand `persist`
 * middleware so slots survive page reloads (localStorage).
 *
 * Brief section 38: Preserves existing demo data (Rohan Mehta, Priya Nair,
 * etc.) as the seed state.
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  INITIAL_SLOTS,
  type TimetableSlot,
  type TimetableFormState,
  type DayType,
} from './data'

export { INITIAL_SLOTS }
export type { TimetableSlot, TimetableFormState, DayType }

interface TimetableStoreState {
  /** Live timetable slots (seed data + runtime mutations). */
  slots: TimetableSlot[]
  /** Add a new slot. */
  addSlot: (slot: TimetableSlot) => void
  /** Update an existing slot by id. */
  updateSlot: (id: string, updates: Partial<TimetableSlot>) => void
  /** Remove a slot by id. */
  removeSlot: (id: string) => void
  /** Duplicate a slot (optionally to a different day/period). */
  duplicateSlot: (id: string, overrides?: Partial<TimetableSlot>) => void
  /** Reset to seed data (for testing/demo cleanup). */
  resetToSeed: () => void
}

export const useTimetableStore = create<TimetableStoreState>()(
  persist(
    (set) => ({
      slots: INITIAL_SLOTS,
      addSlot: (slot) => set((state) => ({ slots: [...state.slots, slot] })),
      updateSlot: (id, updates) =>
        set((state) => ({
          slots: state.slots.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),
      removeSlot: (id) =>
        set((state) => ({ slots: state.slots.filter((s) => s.id !== id) })),
      duplicateSlot: (id, overrides) =>
        set((state) => {
          const original = state.slots.find((s) => s.id === id)
          if (!original) return state
          const newSlot: TimetableSlot = {
            ...original,
            ...overrides,
            id: `tt-${Date.now().toString().slice(-6)}`,
          }
          return { slots: [...state.slots, newSlot] }
        }),
      resetToSeed: () => set({ slots: INITIAL_SLOTS }),
    }),
    {
      name: 'scholario-timetable-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ slots: state.slots }),
    }
  )
)

/**
 * Conflict detection — checks if a given form state would create a
 * teacher, room, or class double-booking.
 *
 * Brief section 14: Real-time conflict detection while the user selects.
 */
export function detectConflicts(
  slots: TimetableSlot[],
  form: { day: DayType; period: number; teacherId: string; room: string; className: string },
  excludeSlotId?: string
) {
  const teacherConflict = slots.find(
    (s) =>
      s.day === form.day &&
      s.period === form.period &&
      s.teacherId === form.teacherId &&
      s.id !== excludeSlotId
  )
  const roomConflict = slots.find(
    (s) =>
      s.day === form.day &&
      s.period === form.period &&
      s.room === form.room &&
      s.id !== excludeSlotId
  )
  const classConflict = slots.find(
    (s) =>
      s.day === form.day &&
      s.period === form.period &&
      s.className === form.className &&
      s.id !== excludeSlotId
  )
  return {
    teacherConflict,
    roomConflict,
    classConflict,
    hasConflict: Boolean(teacherConflict || roomConflict || classConflict),
  }
}
