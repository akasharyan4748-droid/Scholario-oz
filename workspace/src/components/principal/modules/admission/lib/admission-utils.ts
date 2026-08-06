/**
 * Admission Utilities — shared logic layer
 * Feature flags · duplicate detection · seat validation · audit · automation
 *
 * Single source of truth: reads from useSchoolSettingsStore (Zustand persisted).
 * This bridges the legacy getSchoolSettings() singleton with the new feature-flag system.
 *
 * NOTE: This file is a barrel that re-exports the modular utilities for backwards
 * compatibility. Consumers can keep importing from './admission-utils' unchanged.
 */
'use client'

export { useAdmissionFeatureFlags, useSeatCapacity, useDuplicateDetectionConfig } from './hooks'
export { getSeatInfo, type SeatStatus, type SeatInfo } from './seats'
export { checkDuplicates, type DuplicateMatch } from './duplicate-detection'
export { buildAuditEntry, type AuditAction } from './audit'
export { generateAutomationResult, type AutomationResult } from './automation'
export { searchAdmissions } from './search'
export {
  shouldShowPreviousSchool,
  ADMISSION_TYPE_LABELS,
  type AdmissionType,
} from './admission-type'
