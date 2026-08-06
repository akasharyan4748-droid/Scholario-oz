import type { StateCreator } from 'zustand'
import type { AdmissionStoreState } from '../types'

export const createSelectionSlice: StateCreator<
  AdmissionStoreState,
  [],
  [],
  Pick<AdmissionStoreState, 'selectedApplicationId' | 'selectApplication' | 'deleteArchivedApplication'>
> = (set, get) => ({
  selectedApplicationId: 'APP-2026-001',

  selectApplication: (id) => set({ selectedApplicationId: id }),

  deleteArchivedApplication: (appId) => {
    const state = get()
    set({
      applications: state.applications.filter((a) => a.id !== appId),
      selectedApplicationId: state.selectedApplicationId === appId ? null : state.selectedApplicationId,
    })
  },
})
