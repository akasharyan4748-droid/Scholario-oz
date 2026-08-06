import type React from 'react'
import {
  SlidersHorizontal, ShieldAlert, FileText, Users, Stethoscope, Home, Bus,
  Award, HeartPulse, ShieldCheck, ScanLine, Building2,
  Lock, Workflow, Banknote, FileStack, type LucideIcon,
} from 'lucide-react'

export interface FieldConfigModalProps {
  open: boolean
  onClose: () => void
}

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

export interface FeatureToggle {
  key: keyof ReturnType<typeof getFlagsShape>
  label: string
  desc: string
  icon: React.ElementType
  section: string
}

// Original toggles — kept intact for backward compat with any other consumers.
export const FEATURE_TOGGLES: FeatureToggle[] = [
  { key: 'enableMedical', label: 'Medical Section', desc: 'Health info, allergies, doctor', icon: Stethoscope, section: 'Wizard Sections' },
  { key: 'enableHostel', label: 'Hostel Facility', desc: 'Hostel allocation & room type', icon: Home, section: 'Wizard Sections' },
  { key: 'enableTransport', label: 'Transport Facility', desc: 'Bus route & pickup point', icon: Bus, section: 'Wizard Sections' },
  { key: 'enableEntranceExam', label: 'Entrance Exam', desc: 'Exam gate before admission', icon: ScanLine, section: 'Workflow Gates' },
  { key: 'enableInterview', label: 'Interview Stage', desc: 'Principal/panel interview', icon: Users, section: 'Workflow Gates' },
  { key: 'enablePreviousSchool', label: 'Previous School', desc: 'Academic history & TC', icon: Building2, section: 'Wizard Sections' },
  { key: 'enableScholarship', label: 'Scholarship', desc: 'Merit-based concession', icon: Award, section: 'Financial' },
  { key: 'enableFeeWaiver', label: 'Fee Waiver', desc: 'Discretionary waiver with audit', icon: HeartPulse, section: 'Financial' },
  { key: 'enableDocumentVerification', label: 'Document Verification', desc: 'Verifier workflow on docs', icon: ShieldCheck, section: 'Verification' },
  { key: 'enableAadhaar', label: 'Aadhaar Number', desc: 'Student aadhaar capture', icon: ScanLine, section: 'Personal Fields' },
  { key: 'enableBloodGroup', label: 'Blood Group', desc: 'Medical record field', icon: HeartPulse, section: 'Personal Fields' },
  { key: 'enableReligion', label: 'Religion', desc: 'Demographic field', icon: ShieldAlert, section: 'Personal Fields' },
  { key: 'enableCategory', label: 'Social Category', desc: 'General/OBC/SC/ST/EWS', icon: Users, section: 'Personal Fields' },
  { key: 'enableStudentPhoto', label: 'Student Photo', desc: 'Passport photo upload', icon: FileText, section: 'Documents' },
  { key: 'enableParentPhoto', label: 'Parent Photo', desc: 'Guardian photo upload', icon: FileText, section: 'Documents' },
  { key: 'enableSignature', label: 'Signature Upload', desc: 'Digital signature capture', icon: FileText, section: 'Documents' },
  { key: 'enableCustomFields', label: 'Custom Fields', desc: 'School-specific extra fields', icon: SlidersHorizontal, section: 'Advanced' },
]

/* ------------------------------------------------------------------ */
/*  Section metadata for the redesigned General tab.                  */
/*  Maps each existing toggle to a cleaner top-level section.          */
/* ------------------------------------------------------------------ */

export type GeneralSectionId =
  | 'privacy'
  | 'workflow'
  | 'medical'
  | 'transportHostel'
  | 'financial'
  | 'documents'
  | 'personalFields'
  | 'advanced'

export interface GeneralSectionMeta {
  id: GeneralSectionId
  title: string
  icon: LucideIcon
  /** short, single-line description shown beneath the section title */
  hint: string
  /** toggles that belong to this section (keys reference getFlagsShape) */
  keys: Array<keyof ReturnType<typeof getFlagsShape>>
}

export const GENERAL_SECTIONS: GeneralSectionMeta[] = [
  {
    id: 'workflow',
    title: 'Workflow',
    icon: Workflow,
    hint: 'Admission stages and verification gates',
    keys: ['enableEntranceExam', 'enableInterview', 'enableDocumentVerification', 'enablePreviousSchool'],
  },
  {
    id: 'medical',
    title: 'Medical',
    icon: Stethoscope,
    hint: 'Health info and medical record fields',
    keys: ['enableMedical', 'enableBloodGroup'],
  },
  {
    id: 'transportHostel',
    title: 'Transport & Hostel',
    icon: Bus,
    hint: 'Optional facilities offered during admission',
    keys: ['enableTransport', 'enableHostel'],
  },
  {
    id: 'financial',
    title: 'Financial',
    icon: Banknote,
    hint: 'Scholarships, waivers and concessions',
    keys: ['enableScholarship', 'enableFeeWaiver'],
  },
  {
    id: 'documents',
    title: 'Documents',
    icon: FileStack,
    hint: 'Photo and signature uploads',
    keys: ['enableStudentPhoto', 'enableParentPhoto', 'enableSignature'],
  },
  {
    id: 'personalFields',
    title: 'Personal Fields',
    icon: Users,
    hint: 'Sensitive demographic fields on the form',
    keys: ['enableAadhaar', 'enableReligion', 'enableCategory'],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    icon: SlidersHorizontal,
    hint: 'Custom fields, retention and skip rules',
    keys: ['enableCustomFields'],
  },
]

/* ------------------------------------------------------------------ */
/*  Section metadata for the redesigned Fields tab.                    */
/*  Grouped by the `section` field on each FieldRule.                  */
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
/*  Section metadata for Duplicate Detection tab.                     */
/* ------------------------------------------------------------------ */

export const DUPLICATE_MATCH_KEY_LABELS: Record<string, string> = {
  aadhaar: 'Aadhaar Number',
  nameDob: 'Name + DOB',
  parentPhone: 'Parent Phone',
  parents: 'Parent Names',
  previousSchool: 'Previous School',
  address: 'Address',
}

/* ------------------------------------------------------------------ */
/*  Privacy safeguard — the always-active notice in the Privacy       */
/*  section of the General tab. Kept here so the modal can render it   */
/*  consistently.                                                      */
/* ------------------------------------------------------------------ */

export const PRIVACY_SAFEGUARD_FIELDS = [
  'Religion',
  'Category',
  'Blood Group',
  'Gender',
  'Aadhaar',
]
