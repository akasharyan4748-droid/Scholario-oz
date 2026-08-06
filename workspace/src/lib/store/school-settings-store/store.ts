import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SchoolSettingsState } from './types'
import { initialState } from './initial-state'
import { createProfileSlice } from './slices/profile-slice'
import { createInventorySlice } from './slices/inventory-slice'
import { createAcademicConfigSlice } from './slices/academic-config-slice'
import { createAdmissionSlice } from './slices/admission-slice'

export const useSchoolSettingsStore = create<SchoolSettingsState>()(
  persist(
    (...a) => ({
      ...initialState,
      ...createProfileSlice(...a),
      ...createInventorySlice(...a),
      ...createAcademicConfigSlice(...a),
      ...createAdmissionSlice(...a),
    }),
    { name: 'scholario_school_settings_v1' }
  )
)
