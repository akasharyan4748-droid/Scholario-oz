/**
 * Admission type helpers — labels and Previous School step visibility rules.
 */
import type { AdmissionFeatureFlags } from '@/lib/store/school-settings-store'

/* ---------- Admission type helpers ---------- */
export type AdmissionType = 'fresh' | 'transfer' | 'readmission' | 'promotion'

export const ADMISSION_TYPE_LABELS: Record<AdmissionType, string> = {
  fresh: 'Fresh Admission',
  transfer: 'Transfer',
  readmission: 'Re-admission',
  promotion: 'Internal Promotion',
}

/**
 * Determines if the Previous School step should be shown based on admission type
 * and the class being applied for (for fresh admissions to pre-primary).
 */
export function shouldShowPreviousSchool(
  admissionType: AdmissionType,
  appliedClass: string,
  flags: AdmissionFeatureFlags
): boolean {
  if (!flags.enablePreviousSchool) return false
  if (admissionType === 'transfer') return true // mandatory for transfers
  if (admissionType === 'readmission') return true // fetch history
  if (admissionType === 'promotion') return false // internal, no previous school
  // Fresh admission: skip for configured pre-primary classes
  if (admissionType === 'fresh') {
    return !flags.previousSchoolSkipClasses.some((c) => appliedClass.includes(c))
  }
  return true
}
