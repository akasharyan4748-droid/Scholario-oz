import type React from 'react'
import {
  SlidersHorizontal, ShieldAlert, FileText, Users, Stethoscope, Home, Bus,
  Award, HeartPulse, ShieldCheck, ScanLine, Building2,
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
