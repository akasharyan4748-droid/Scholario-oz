/**
 * Teacher settings store — scoped to the Teachers module.
 *
 * Persisted under localStorage key `scholario_teacher_settings_v1`.
 * Mirrors the Admission Settings pattern so the UX is consistent.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TeacherFlags {
  enablePhotoUpload: boolean
  enableSignatureUpload: boolean
  enableAadhaar: boolean
  enablePanCard: boolean
  enableBankDetails: boolean
  enableEducationalCertificates: boolean
  enableExperienceLetters: boolean
  enableMedicalFitness: boolean
  enablePayrollIntegration: boolean
  enableLeaveTracking: boolean
  enableAttendanceTracking: boolean
  enableCustomFields: boolean
}

export interface TeacherSettings {
  teacherIdPrefix: string
  teacherIdDigits: number
  joiningWorkflow: 'auto' | 'approval'
  probationMonths: number
  defaultNoticePeriodDays: number
  flags: TeacherFlags
}

const DEFAULT_FLAGS: TeacherFlags = {
  enablePhotoUpload: true,
  enableSignatureUpload: false,
  enableAadhaar: true,
  enablePanCard: true,
  enableBankDetails: true,
  enableEducationalCertificates: true,
  enableExperienceLetters: false,
  enableMedicalFitness: true,
  enablePayrollIntegration: true,
  enableLeaveTracking: true,
  enableAttendanceTracking: true,
  enableCustomFields: false,
}

const DEFAULT_SETTINGS: TeacherSettings = {
  teacherIdPrefix: 'EMP',
  teacherIdDigits: 4,
  joiningWorkflow: 'approval',
  probationMonths: 6,
  defaultNoticePeriodDays: 30,
  flags: DEFAULT_FLAGS,
}

interface TeacherSettingsState extends TeacherSettings {
  updateFlags: (patch: Partial<TeacherFlags>) => void
  updateSettings: (patch: Partial<Omit<TeacherSettings, 'flags'>>) => void
  resetAll: () => void
}

export const useTeacherSettingsStore = create<TeacherSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      updateFlags: (patch) =>
        set((s) => ({ flags: { ...s.flags, ...patch } })),
      updateSettings: (patch) => set((s) => ({ ...s, ...patch })),
      resetAll: () => set({ ...DEFAULT_SETTINGS, flags: { ...DEFAULT_FLAGS } }),
    }),
    {
      name: 'scholario_teacher_settings_v1',
      version: 1,
    }
  )
)
