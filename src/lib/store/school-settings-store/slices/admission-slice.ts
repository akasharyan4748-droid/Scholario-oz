import type { StateCreator } from 'zustand'
import type { SchoolSettingsState } from '../types'

export const createAdmissionSlice: StateCreator<
  SchoolSettingsState,
  [],
  [],
  Pick<
    SchoolSettingsState,
    | 'updateAdmissionSettings'
    | 'updateAdmissionFeatureFlags'
    | 'updateSeatCapacity'
    | 'updateDuplicateDetection'
    | 'addWaiverAudit'
  >
> = (set) => ({
  updateAdmissionSettings: (data) =>
    set((state) => ({
      admissionSettings: { ...state.admissionSettings, ...data },
    })),

  updateAdmissionFeatureFlags: (data) =>
    set((state) => ({
      admissionSettings: {
        ...state.admissionSettings,
        featureFlags: { ...state.admissionSettings.featureFlags, ...data },
      },
    })),

  updateSeatCapacity: (className, data) =>
    set((state) => ({
      admissionSettings: {
        ...state.admissionSettings,
        seatCapacity: state.admissionSettings.seatCapacity.map((c) =>
          c.className === className ? { ...c, ...data } : c
        ),
      },
    })),

  updateDuplicateDetection: (data) =>
    set((state) => ({
      admissionSettings: {
        ...state.admissionSettings,
        duplicateDetection: { ...state.admissionSettings.duplicateDetection, ...data },
      },
    })),

  addWaiverAudit: (entry) =>
    set((state) => ({
      admissionSettings: {
        ...state.admissionSettings,
        waiverAudit: [
          {
            ...entry,
            id: `waiver-${Date.now()}`,
            timestamp: new Date().toISOString(),
          },
          ...state.admissionSettings.waiverAudit,
        ],
      },
    })),
})
