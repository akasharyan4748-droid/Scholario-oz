'use client'

/**
 * timetable-store — canonical source of truth for the school's master timetable.
 *
 * Brief section 7 + 27: Three-tier state model:
 *   - `slots`: APPLIED working timetable (saved, may be unpublished)
 *   - `publishedSlots`: LAST PUBLISHED snapshot (what students/teachers see)
 *   - `pendingChanges`: accumulated changes since last publish (cleared on publish)
 *
 * Draft state is managed in the React component (index.tsx) as `draftSlots`:
 *   - Edit mode mutates `draftSlots` (local state, NOT the store)
 *   - Apply Changes: commits draftSlots → store `slots` + records changes
 *   - Cancel: discards draftSlots (store unchanged)
 *
 * Brief section 57: Changes retain old → new info for visual indicators.
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

/** Change types */
export type ChangeType =
  | 'teacher_changed'
  | 'room_changed'
  | 'period_changed'
  | 'subject_changed'
  | 'class_changed'
  | 'slot_added'
  | 'slot_removed'

/** A single change record with old → new info (Brief section 57) */
export interface TimetableChange {
  id: string
  slotId: string
  type: ChangeType
  /** Human-readable summary, e.g. "Teacher changed". */
  summary: string
  /** Short context, e.g. "Class 2-A · Period 1". */
  context: string
  /** Old value (for old → new display). */
  oldValue?: string
  /** New value (for old → new display). */
  newValue?: string
  /** Compact old → new label for the change indicator, e.g. "Rohan → Sunita". */
  changeLabel?: string
  /** ISO timestamp when the change was published. */
  publishedAt: string
}

export interface PublishedVersion {
  version: number
  publishedAt: string
  publishedBy: string
  changeCount: number
  changes: TimetableChange[]
}

const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000

interface TimetableStoreState {
  slots: TimetableSlot[]
  publishedSlots: TimetableSlot[]
  pendingChanges: TimetableChange[]
  publications: PublishedVersion[]
  currentVersion: number

  addSlot: (slot: TimetableSlot) => void
  updateSlot: (id: string, updates: Partial<TimetableSlot>) => void
  removeSlot: (id: string) => void
  duplicateSlot: (id: string, overrides?: Partial<TimetableSlot>) => void
  recordChange: (change: Omit<TimetableChange, 'id' | 'publishedAt'>) => void
  publish: (publishedBy: string) => PublishedVersion | null
  hasPendingPublish: () => boolean
  resetToSeed: () => void
}

export const useTimetableStore = create<TimetableStoreState>()(
  persist(
    (set, get) => ({
      slots: INITIAL_SLOTS,
      publishedSlots: INITIAL_SLOTS,
      pendingChanges: [],
      publications: [],
      currentVersion: 1,

      addSlot: (slot) => set((state) => ({ slots: [...state.slots, slot] })),
      updateSlot: (id, updates) =>
        set((state) => ({ slots: state.slots.map((s) => (s.id === id ? { ...s, ...updates } : s)) })),
      removeSlot: (id) => set((state) => ({ slots: state.slots.filter((s) => s.id !== id) })),
      duplicateSlot: (id, overrides) =>
        set((state) => {
          const original = state.slots.find((s) => s.id === id)
          if (!original) return state
          return { slots: [...state.slots, { ...original, ...overrides, id: `tt-${Date.now().toString().slice(-6)}` }] }
        }),
      recordChange: (change) =>
        set((state) => ({
          pendingChanges: [
            ...state.pendingChanges,
            { ...change, id: `chg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, publishedAt: new Date().toISOString() },
          ],
        })),
      publish: (publishedBy) => {
        const state = get()
        if (state.pendingChanges.length === 0) return null
        const version: PublishedVersion = {
          version: state.currentVersion + 1,
          publishedAt: new Date().toISOString(),
          publishedBy,
          changeCount: state.pendingChanges.length,
          changes: [...state.pendingChanges],
        }
        set({
          publishedSlots: [...state.slots],
          publications: [version, ...state.publications],
          pendingChanges: [],
          currentVersion: version.version,
        })
        return version
      },
      hasPendingPublish: () => get().pendingChanges.length > 0,
      resetToSeed: () =>
        set({ slots: INITIAL_SLOTS, publishedSlots: INITIAL_SLOTS, pendingChanges: [], publications: [], currentVersion: 1 }),
    }),
    {
      name: 'scholario-timetable-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        slots: state.slots,
        publishedSlots: state.publishedSlots,
        pendingChanges: state.pendingChanges,
        publications: state.publications,
        currentVersion: state.currentVersion,
      }),
    }
  )
)

/** Check if a slot was recently updated (within 72 hours). */
export function isRecentlyUpdated(slotId: string, publications: PublishedVersion[], now: number = Date.now()): boolean {
  for (const pub of publications) {
    const publishedAt = new Date(pub.publishedAt).getTime()
    if (now < publishedAt + SEVENTY_TWO_HOURS_MS) {
      if (pub.changes.some((c) => c.slotId === slotId)) return true
    }
  }
  return false
}

/** Get the most recent change for a slot (for tooltip text). */
export function getRecentChange(slotId: string, publications: PublishedVersion[], now: number = Date.now()): TimetableChange | null {
  for (const pub of publications) {
    const publishedAt = new Date(pub.publishedAt).getTime()
    if (now < publishedAt + SEVENTY_TWO_HOURS_MS) {
      const change = pub.changes.find((c) => c.slotId === slotId)
      if (change) return change
    }
  }
  return null
}

export function formatTimeAgo(isoTimestamp: string, now: number = Date.now()): string {
  const then = new Date(isoTimestamp).getTime()
  const diffMs = now - then
  const diffH = Math.floor(diffMs / (60 * 60 * 1000))
  if (diffH < 1) return 'just now'
  if (diffH < 24) return `${diffH}h ago`
  const diffDays = Math.floor(diffH / 24)
  if (diffDays === 1) return 'yesterday'
  return `${diffDays}d ago`
}

export function detectConflicts(
  slots: TimetableSlot[],
  form: { day: DayType; period: number; teacherId: string; room: string; className: string },
  excludeSlotId?: string
) {
  const teacherConflict = slots.find((s) => s.day === form.day && s.period === form.period && s.teacherId === form.teacherId && s.id !== excludeSlotId)
  const roomConflict = slots.find((s) => s.day === form.day && s.period === form.period && s.room === form.room && s.id !== excludeSlotId)
  const classConflict = slots.find((s) => s.day === form.day && s.period === form.period && s.className === form.className && s.id !== excludeSlotId)
  return { teacherConflict, roomConflict, classConflict, hasConflict: Boolean(teacherConflict || roomConflict || classConflict) }
}

export function countAllConflicts(slots: TimetableSlot[]): number {
  const teacherSlots = new Map<string, number>()
  const roomSlots = new Map<string, number>()
  for (const s of slots) {
    const tKey = `${s.day}-${s.period}-${s.teacherId}`
    teacherSlots.set(tKey, (teacherSlots.get(tKey) || 0) + 1)
    const rKey = `${s.day}-${s.period}-${s.room}`
    roomSlots.set(rKey, (roomSlots.get(rKey) || 0) + 1)
  }
  let count = 0
  teacherSlots.forEach((c) => { if (c > 1) count += c - 1 })
  roomSlots.forEach((c) => { if (c > 1) count += c - 1 })
  return count
}
