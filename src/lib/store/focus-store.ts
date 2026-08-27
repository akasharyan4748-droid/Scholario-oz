'use client'

/**
 * focus-store — cross-module deep-link requests from the command palette.
 *
 * When a palette result points at a real DB entity (student, fee, notice…),
 * the palette records a focus request before navigating; the target module
 * consumes it on mount to open the relevant profile/detail view directly.
 * The `ts` field acts as a trigger so repeat requests for the same entity
 * still fire effects.
 */

import { create } from 'zustand'

export interface FocusRequest {
  type: string
  id: string
  title: string
  moduleKey: string
  ts: number
}

interface FocusState {
  focus: FocusRequest | null
  setFocus: (f: Omit<FocusRequest, 'ts'>) => void
  clearFocus: () => void
}

export const useFocusStore = create<FocusState>((set) => ({
  focus: null,
  setFocus: (f) => set({ focus: { ...f, ts: Date.now() } }),
  clearFocus: () => set({ focus: null }),
}))
