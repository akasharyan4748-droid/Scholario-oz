'use client'

/**
 * timetable-store — canonical source of truth for the school's master timetable.
 *
 * Brief section 2 + 10 + 34: ONE authoritative timetable with a clear lifecycle:
 *   VIEW → EDIT → SAVE → PENDING PUBLISH → PUBLISH → NOTIFY → CHANGE INDICATORS
 *
 * Three-state model (Brief section 34):
 *   - `slots`: the CURRENT WORKING timetable (includes saved-but-unpublished changes)
 *   - `publishedSlots`: the LAST PUBLISHED snapshot (what students/teachers see)
 *   - `pendingChanges`: accumulated changes since the last publish
 *
 * Brief section 20 + 21: Change indicators last exactly 72 hours from the
 * publish timestamp, driven by `publishedAt` on each published change — NOT
 * session state or page-load counters.
 *
 * Brief section 26: ONE source of truth — the same `publishedChanges` data
 * powers notifications, timetable "Updated" indicators, and change summaries.
 *
 * Brief section 45: Persisted via Zustand `persist` + localStorage so
 * slots, published state, and change markers all survive reload.
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

/** Change types (Brief section 48) */
export type ChangeType =
  | 'teacher_changed'
  | 'room_changed'
  | 'period_changed'
  | 'subject_changed'
  | 'class_changed'
  | 'slot_added'
  | 'slot_removed'

/** A single change record (Brief section 48) */
export interface TimetableChange {
  id: string
  /** The slot that was affected (may not exist if slot was removed). */
  slotId: string
  type: ChangeType
  /** Human-readable summary, e.g. "Teacher changed: Rohan Mehta → Sunita Rao". */
  summary: string
  /** Short label for the affected context, e.g. "Class 2-A · Period 1". */
  context: string
  /** ISO timestamp when the change was published. */
  publishedAt: string
}

/** A published version snapshot (Brief section 19) */
export interface PublishedVersion {
  version: number
  publishedAt: string
  publishedBy: string
  changeCount: number
  changes: TimetableChange[]
}

/** 72 hours in milliseconds (Brief section 21) */
const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000

interface TimetableStoreState {
  /** Current working timetable (includes saved-but-unpublished changes). */
  slots: TimetableSlot[]
  /** Last published snapshot (what students/teachers consume). */
  publishedSlots: TimetableSlot[]
  /** Accumulated changes since last publish (cleared on publish). */
  pendingChanges: TimetableChange[]
  /** Publication history (newest first). */
  publications: PublishedVersion[]
  /** Current version number. */
  currentVersion: number

  // ── Slot mutations (working state) ──
  addSlot: (slot: TimetableSlot) => void
  updateSlot: (id: string, updates: Partial<TimetableSlot>) => void
  removeSlot: (id: string) => void
  duplicateSlot: (id: string, overrides?: Partial<TimetableSlot>) => void

  // ── Change tracking ──
  /** Record a change (called by save handlers when accumulating pending changes). */
  recordChange: (change: Omit<TimetableChange, 'id' | 'publishedAt'>) => void

  // ── Publish lifecycle ──
  /** Publish all pending changes: snapshot slots, create version, clear pending. */
  publish: (publishedBy: string) => PublishedVersion | null
  /** Check if there are unpublished saved changes. */
  hasPendingPublish: () => boolean

  // ── Utilities ──
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

      addSlot: (slot) =>
        set((state) => ({ slots: [...state.slots, slot] })),

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
        set({
          slots: INITIAL_SLOTS,
          publishedSlots: INITIAL_SLOTS,
          pendingChanges: [],
          publications: [],
          currentVersion: 1,
        }),
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

/**
 * Check if a slot was recently updated (within 72 hours of a publish).
 * Brief section 21 + 46: timestamp-based, NOT session-based.
 */
export function isRecentlyUpdated(slotId: string, publications: PublishedVersion[], now: number = Date.now()): boolean {
  for (const pub of publications) {
    const publishedAt = new Date(pub.publishedAt).getTime()
    if (now < publishedAt + SEVENTY_TWO_HOURS_MS) {
      // Within 72h window — check if this slot was affected
      if (pub.changes.some((c) => c.slotId === slotId)) {
        return true
      }
    }
  }
  return false
}

/**
 * Get the most recent change for a slot (for tooltip text).
 * Returns null if no recent change within 72h.
 */
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

/**
 * Format a human-friendly "time ago" label for change indicators.
 * Brief section 22: "Updated today", "Updated 2h ago".
 */
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

/**
 * Count active conflicts across ALL slots (for the summary card + publish guard).
 * Brief section 33: "Principal must never be able to publish an invalid timetable."
 */
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
