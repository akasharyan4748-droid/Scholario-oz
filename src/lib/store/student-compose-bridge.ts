'use client'

// ============================================================
// STUDENT COMPOSE BRIDGE — cross-module contextual entry point
// ------------------------------------------------------------
// §19 of the Fees brief: Fees must create CONTEXTUAL entry points into
// the CENTRAL messaging system (never a second messaging system).
// This tiny NON-persisted UI store is the contract: any module drops a
// prefilled compose draft + navigates to 'messages'; the Messages
// module consumes the draft on mount (opens the New Message dialog
// prefilled) and clears it. One system, contextual entries.

import { create } from 'zustand'

export interface ComposeDraft {
  teacherId: string
  teacherName: string
  teacherSubject: string
  subject: string
  body: string
}

interface StudentComposeBridgeState {
  draft: ComposeDraft | null
  /** Drop a prefilled draft (then navigate to 'messages'). */
  setDraft: (draft: ComposeDraft) => void
  /** Consumed by the Messages module on mount. */
  clearDraft: () => void
}

export const useStudentComposeBridge = create<StudentComposeBridgeState>()((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
}))
