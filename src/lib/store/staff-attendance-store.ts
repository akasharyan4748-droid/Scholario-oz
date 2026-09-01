'use client'

/**
 * staff-attendance-store — date-keyed staff attendance state.
 *
 * Brief §2-§15 (Phase 4): Every date has its own independent attendance
 * record with one of three states:
 *
 *   A. SUBMITTED / LOCKED    — read-only, immutable historical truth
 *   B. DRAFT / UNSUBMITTED   — editable, persisted across sessions
 *   C. NO ATTENDANCE ENTERED — editable, blank slate
 *
 * Brief §10 + §29: Drafts are persisted (localStorage) so they survive
 *   date changes, navigation, and page refreshes.
 *
 * Brief §11 + §14: Submission is EXPLICIT — `submitted: true` is a
 *   distinct flag, not inferred from "rows exist".
 *
 * Brief §16: Read-only rule is enforced in the store layer (the
 *   `mark()` / `markAllPresent()` / `submit()` actions refuse to
 *   mutate a submitted date). This is the "frontend bypass" guard —
 *   a real backend would also enforce this server-side.
 *
 * Brief §30 + §31: NO date-based hacks (`if date < today → readonly`).
 *   The state is determined entirely by the stored `submitted` flag.
 *   Demo seed data marks Dec 8 + Dec 9 as submitted to demonstrate
 *   the read-only behavior on past dates.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  getStaffAttendanceForDate,
  type StaffAttendanceRecord,
  type AttendanceStatus,
} from '@/lib/mock/attendance'

/** Today's canonical date — the only date that starts in DRAFT state. */
export const STAFF_TODAY_DATE = '2025-12-10'

/**
 * Brief §11: conceptual record model — submitted is explicit, not inferred.
 * One StaffDateState per date — keyed by `dateStr` (YYYY-MM-DD).
 */
export interface StaffDateState {
  date: string
  /** Explicit submission flag (Brief §14). `true` = read-only historical truth. */
  submitted: boolean
  /** ISO timestamp of submission (for display + audit). */
  submittedAt: string | null
  /** Submitted record — frozen snapshot of the records at submit time. */
  submittedRecords: StaffAttendanceRecord[]
  /** Current editable draft (the working state). Null = no draft yet. */
  draft: StaffAttendanceRecord[] | null
}

interface StaffAttendanceStoreState {
  /** Date-keyed attendance state. */
  byDate: Record<string, StaffDateState>
  /** Actions */
  getDateString: (date: string) => StaffDateState
  mark: (date: string, staffId: string, status: AttendanceStatus) => void
  markAllPresent: (date: string) => void
  submit: (date: string) => boolean
  /** Reset to seed (used by tests / dev only). */
  reset: () => void
}

/* ──────────────────────────────────────────────────────────
   Seed: Dec 8 + Dec 9 are pre-submitted (Brief §30: NOT date-hacks —
   these are real `submitted: true` records, used to demonstrate the
   read-only behavior on past dates).
   ────────────────────────────────────────────────────────── */
function buildSeed(): Record<string, StaffDateState> {
  const seed: Record<string, StaffDateState> = {}
  // Dec 8 — submitted historical record (read-only)
  const dec8Records = getStaffAttendanceForDate('2025-12-08')
  seed['2025-12-08'] = {
    date: '2025-12-08',
    submitted: true,
    submittedAt: '2025-12-08T10:15:00.000Z',
    submittedRecords: dec8Records,
    draft: dec8Records,
  }
  // Dec 9 — submitted historical record (read-only)
  const dec9Records = getStaffAttendanceForDate('2025-12-09')
  seed['2025-12-09'] = {
    date: '2025-12-09',
    submitted: true,
    submittedAt: '2025-12-09T10:08:00.000Z',
    submittedRecords: dec9Records,
    draft: dec9Records,
  }
  // Dec 10 — today: starts as DRAFT with the canonical seeded staff attendance.
  // This represents "today's attendance entered but not yet submitted" —
  // editable until the Principal presses Submit.
  // Uses the same `getStaffAttendanceForDate` builder as defaultDraft so the
  // hasUnsaved check produces `false` for the unmodified seed.
  seed[STAFF_TODAY_DATE] = {
    date: STAFF_TODAY_DATE,
    submitted: false,
    submittedAt: null,
    submittedRecords: [],
    draft: getStaffAttendanceForDate(STAFF_TODAY_DATE),
  }
  return seed
}

/** Build the "no attendance entered" state for a date with no record yet. */
function buildEmptyState(date: string): StaffDateState {
  return {
    date,
    submitted: false,
    submittedAt: null,
    submittedRecords: [],
    draft: null,
  }
}

/** Build the default draft records for a date (deterministic per date). */
function buildDefaultDraft(date: string): StaffAttendanceRecord[] {
  // Use the same date-keyed builder for ALL dates (including today) so
  // the hasUnsaved comparison is consistent — the seed draft for Dec 10
  // also uses getStaffAttendanceForDate(STAFF_TODAY_DATE).
  return getStaffAttendanceForDate(date)
}

export const useStaffAttendanceStore = create<StaffAttendanceStoreState>()(
  persist(
    (set, get) => ({
      byDate: buildSeed(),

      getDateString: (date) => {
        return get().byDate[date] ?? buildEmptyState(date)
      },

      /**
       * Brief §6: mark a single staff member's status for a date.
       * Brief §16: REFUSES to mutate a submitted date (frontend bypass guard).
       * Brief §27: persists the draft so it survives date changes / refresh.
       */
      mark: (date, staffId, status) => {
        const existing = get().byDate[date] ?? buildEmptyState(date)
        // Brief §4 + §16: submitted dates are read-only — refuse the mutation.
        if (existing.submitted) {
          if (typeof window !== 'undefined') {
            console.warn(
              `[staff-attendance] Cannot mark ${staffId} on ${date} — attendance already submitted (read-only).`
            )
          }
          return
        }
        const baseDraft = existing.draft ?? buildDefaultDraft(date)
        const nextDraft = baseDraft.map((r) => {
          if (r.id !== staffId) return r
          const checkIn = status === 'present'
            ? '08:30 AM'
            : status === 'late'
            ? '09:00 AM'
            : null
          return { ...r, status, checkIn }
        })
        set((state) => ({
          byDate: {
            ...state.byDate,
            [date]: { ...existing, draft: nextDraft },
          },
        }))
      },

      /**
       * Brief §3 + §19: Mark All Present — only for editable dates.
       * Brief §16: REFUSES on submitted dates (frontend bypass guard).
       */
      markAllPresent: (date) => {
        const existing = get().byDate[date] ?? buildEmptyState(date)
        if (existing.submitted) {
          if (typeof window !== 'undefined') {
            console.warn(
              `[staff-attendance] Cannot mark all present on ${date} — attendance already submitted (read-only).`
            )
          }
          return
        }
        const baseDraft = existing.draft ?? buildDefaultDraft(date)
        const nextDraft = baseDraft.map((r) => ({
          ...r,
          status: 'present' as AttendanceStatus,
          checkIn: '08:30 AM',
        }))
        set((state) => ({
          byDate: {
            ...state.byDate,
            [date]: { ...existing, draft: nextDraft },
          },
        }))
      },

      /**
       * Brief §7 + §15: Submit Attendance — finalizes the draft.
       * Brief §15: Returns false (rejects) if already submitted, preventing
       *   accidental double-submission.
       * Brief §16: After submission, the date is permanently read-only.
       * Brief §29: After submit, refresh still shows read-only (persisted).
       */
      submit: (date) => {
        const existing = get().byDate[date] ?? buildEmptyState(date)
        // Brief §15: prevent double submission
        if (existing.submitted) return false
        // If there's no draft, there's nothing to submit
        const draft = existing.draft ?? buildDefaultDraft(date)
        set((state) => ({
          byDate: {
            ...state.byDate,
            [date]: {
              ...existing,
              submitted: true,
              submittedAt: new Date().toISOString(),
              submittedRecords: draft,
              draft, // draft becomes the read-only snapshot too
            },
          },
        }))
        return true
      },

      reset: () => {
        set({ byDate: buildSeed() })
      },
    }),
    {
      name: 'scholario-staff-attendance',
      storage: createJSONStorage(() => {
        // Brief §10 + §29: persist to localStorage so drafts + submitted
        // states survive page refresh. Falls back to in-memory storage
        // if localStorage is unavailable (SSR / private browsing).
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          }
        }
        return window.localStorage
      }),
      partialize: (state) => ({ byDate: state.byDate }),
    }
  )
)

/* ──────────────────────────────────────────────────────────
   Brief §13: Date state helpers — for the calendar/day indicators.
   ────────────────────────────────────────────────────────── */
export type DateState = 'submitted' | 'draft' | 'empty'

export function getDateState(date: string): DateState {
  const state = useStaffAttendanceStore.getState().getDateString(date)
  if (state.submitted) return 'submitted'
  if (state.draft) return 'draft'
  return 'empty'
}

/**
 * Get all dates with a known state — used to render calendar day indicators.
 * Returns Map<dateStr, DateState>.
 */
export function getDateStateMap(): Record<string, DateState> {
  const byDate = useStaffAttendanceStore.getState().byDate
  const map: Record<string, DateState> = {}
  for (const [date, state] of Object.entries(byDate)) {
    if (state.submitted) map[date] = 'submitted'
    else if (state.draft) map[date] = 'draft'
    else map[date] = 'empty'
  }
  return map
}

/**
 * Brief §26: detect unsaved changes — when draft differs from submitted
 * records (for re-editing) or from the default seeded draft (for new dates).
 * Returns true if there are unsaved local changes that haven't been submitted.
 */
export function hasUnsavedChanges(date: string): boolean {
  const state = useStaffAttendanceStore.getState().getDateString(date)
  if (state.submitted) return false
  // If no draft at all, no changes
  if (!state.draft) return false
  // If draft exists and not submitted, there are pending unsaved changes.
  // Compare to the default draft (what would have been generated if the
  // user hadn't touched anything) to detect "no changes from default".
  const defaultDraft = buildDefaultDraft(date)
  if (defaultDraft.length !== state.draft.length) return true
  return state.draft.some((r, i) => {
    const base = defaultDraft[i]
    return base.status !== r.status || base.checkIn !== r.checkIn
  })
}
