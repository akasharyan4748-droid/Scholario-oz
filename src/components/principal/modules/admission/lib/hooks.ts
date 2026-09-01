/**
 * Admission Hooks — React hooks backed by the persisted school settings store.
 */
'use client'

import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import type {
  AdmissionFeatureFlags,
  ClassSeatConfig,
  DuplicateDetectionConfig,
} from '@/lib/store/school-settings-store'

/* ---------- Feature flag accessor (React hook) ---------- */
export function useAdmissionFeatureFlags(): AdmissionFeatureFlags {
  return useSchoolSettingsStore((s) => s.admissionSettings.featureFlags)
}

export function useSeatCapacity(): ClassSeatConfig[] {
  return useSchoolSettingsStore((s) => s.admissionSettings.seatCapacity)
}

export function useDuplicateDetectionConfig(): DuplicateDetectionConfig {
  return useSchoolSettingsStore((s) => s.admissionSettings.duplicateDetection)
}
