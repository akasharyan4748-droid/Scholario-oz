'use client'

/**
 * ptm-store — meeting-day PTM state (notes, ratings, completions),
 * persisted to localStorage so teacher notes survive navigation and
 * refreshes. Slot overrides are merged over the immutable published
 * schedule (lib/mock/ptm) — the plan is never mutated here.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ptmSchedule, type PTMSlot } from '@/lib/mock/ptm'

export interface SlotOverride {
  notes?: string
  rating?: number
  status?: PTMSlot['status']
}

interface PtmStoreState {
  /** Slot id → teacher's overrides for that meeting. */
  overrides: Record<string, SlotOverride>
  saveMeeting: (slotId: string, notes: string, rating?: number) => void
  reset: () => void
}

export const usePtmStore = create<PtmStoreState>()(
  persist(
    (set) => ({
      overrides: {},
      saveMeeting: (slotId, notes, rating) => {
        set((state) => ({
          overrides: {
            ...state.overrides,
            [slotId]: {
              ...state.overrides[slotId],
              notes: notes.trim() || undefined,
              rating: rating ?? state.overrides[slotId]?.rating,
              status: 'completed',
            },
          },
        }))
      },
      reset: () => set({ overrides: {} }),
    }),
    {
      name: 'scholario-ptm-meetings',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} }
        }
        return window.localStorage
      }),
      partialize: (state) => ({ overrides: state.overrides }),
    },
  ),
)

/** The live slot list: published schedule + this teacher's overrides. */
export function liveSlots(): PTMSlot[] {
  const overrides = usePtmStore.getState().overrides
  return ptmSchedule.map((s) => {
    const o = overrides[s.id]
    return o ? { ...s, notes: o.notes ?? s.notes, rating: o.rating ?? s.rating, status: o.status ?? s.status } : s
  })
}
