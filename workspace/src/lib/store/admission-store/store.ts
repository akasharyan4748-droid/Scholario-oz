import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AdmissionStoreState } from './types'
import { initialApplications } from './seed-data'
import { createSelectionSlice } from './slices/selection-slice'
import { createDraftSlice } from './slices/draft-slice'
import { createReviewSlice } from './slices/review-slice'
import { createDecisionSlice } from './slices/decision-slice'
import { createCompletionSlice } from './slices/completion-slice'

export const useAdmissionStore = create<AdmissionStoreState>()(
  persist(
    (...a) => ({
      applications: initialApplications,
      ...createSelectionSlice(...a),
      ...createDraftSlice(...a),
      ...createReviewSlice(...a),
      ...createDecisionSlice(...a),
      ...createCompletionSlice(...a),
    }),
    {
      name: 'scholario_admission_store',
    }
  )
)
