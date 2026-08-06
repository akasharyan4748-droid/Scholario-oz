import type React from 'react'
import {
  SlidersHorizontal, Stethoscope, Home, Bus,
  Award, HeartPulse, FileStack, Users, Building2,
  Lock, type LucideIcon,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export interface AdmissionSettingsPageProps {
  onBack: () => void
}

/* ------------------------------------------------------------------ */
/*  Feature flag shape (subset that's still editable in the UI)        */
/*  The full underlying shape is unchanged — we just don't surface     */
/*  every key as a toggle anymore.                                     */
/* ------------------------------------------------------------------ */

export function getFlagsShape() {
  return {
    enableMedical: false, enableHostel: false, enableTransport: false,
    enableEntranceExam: false, enableInterview: false, enablePreviousSchool: false,
    enableScholarship: false, enableFeeWaiver: false, enableDocumentVerification: false,
    enableAadhaar: false, enableBloodGroup: false, enableReligion: false,
    enableCategory: false, enableStudentPhoto: false, enableParentPhoto: false,
    enableSignature: false, enableCustomFields: false,
  }
}

export type FlagKey = keyof ReturnType<typeof getFlagsShape>

/* ------------------------------------------------------------------ */
/*  General-tab section metadata                                       */
/*  Each section maps to a small set of toggles. Sections with empty   */
/*  keys arrays render custom content (Privacy, Duplicate Detection). */
/* ------------------------------------------------------------------ */

export type GeneralSectionId =
  | 'privacy'
  | 'duplicate'
  | 'medical'
  | 'transportHostel'
  | 'financial'
  | 'documents'
  | 'advanced'

export interface GeneralSectionMeta {
  id: GeneralSectionId
  title: string
  icon: LucideIcon
  /** toggles that belong to this section — empty means custom content */
  keys?: FlagKey[]
}

export const GENERAL_SECTIONS: GeneralSectionMeta[] = [
  { id: 'privacy', title: 'Privacy', icon: Lock, keys: [] },
  { id: 'duplicate', title: 'Duplicate Detection', icon: SlidersHorizontal, keys: [] },
  { id: 'medical', title: 'Medical', icon: Stethoscope, keys: ['enableMedical'] },
  { id: 'transportHostel', title: 'Transport & Hostel', icon: Bus, keys: ['enableTransport', 'enableHostel'] },
  { id: 'financial', title: 'Financial', icon: Award, keys: ['enableScholarship', 'enableFeeWaiver'] },
  { id: 'documents', title: 'Documents', icon: FileStack, keys: ['enableStudentPhoto', 'enableParentPhoto', 'enableSignature'] },
  { id: 'advanced', title: 'Advanced', icon: SlidersHorizontal, keys: ['enableCustomFields'] },
]

/* ------------------------------------------------------------------ */
/*  Field-tab section metadata                                         */
/* ------------------------------------------------------------------ */

export interface FieldSectionMeta {
  id: string
  title: string
  icon: LucideIcon
}

export const FIELD_SECTIONS: FieldSectionMeta[] = [
  { id: 'Personal', title: 'Personal', icon: Users },
  { id: 'Parents', title: 'Parents', icon: Users },
  { id: 'Previous School', title: 'Previous School', icon: Building2 },
  { id: 'Medical', title: 'Medical', icon: Stethoscope },
  { id: 'Transport & Hostel', title: 'Hostel & Transport', icon: Bus },
]

/* ------------------------------------------------------------------ */
/*  Human labels for the toggles that are surfaced in the UI.          */
/* ------------------------------------------------------------------ */

export const FLAG_LABELS: Record<FlagKey, string> = {
  enableMedical: 'Medical Section',
  enableHostel: 'Hostel Facility',
  enableTransport: 'Transport Facility',
  enableEntranceExam: 'Entrance Exam',
  enableInterview: 'Interview Stage',
  enablePreviousSchool: 'Previous School',
  enableScholarship: 'Scholarship',
  enableFeeWaiver: 'Fee Waiver',
  enableDocumentVerification: 'Document Verification',
  enableAadhaar: 'Aadhaar Number',
  enableBloodGroup: 'Blood Group',
  enableReligion: 'Religion',
  enableCategory: 'Social Category',
  enableStudentPhoto: 'Student Photo',
  enableParentPhoto: 'Parent Photo',
  enableSignature: 'Signature Upload',
  enableCustomFields: 'Custom Fields',
}

/* re-exports kept for any external consumers that still reference these */
export const PRIVACY_SAFEGUARD_FIELDS = ['Religion', 'Category', 'Blood Group', 'Gender', 'Aadhaar']
export const DUPLICATE_MATCH_KEY_LABELS: Record<string, string> = {
  aadhaar: 'Aadhaar Number',
  nameDob: 'Name + DOB',
  parentPhone: 'Parent Phone',
  parents: 'Parent Names',
  previousSchool: 'Previous School',
  address: 'Address',
}

// Backward-compat export (kept so any old imports don't break — not used by new UI).
export interface FeatureToggle {
  key: FlagKey
  label: string
  desc: string
  icon: React.ElementType
  section: string
}
export const FEATURE_TOGGLES: FeatureToggle[] = []
