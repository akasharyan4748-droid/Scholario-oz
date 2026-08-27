/**
 * Admission Module — Constants, blank-data factory, and ID generators.
 *
 * Extracted from the original admission.tsx monolith (Task ID: 21).
 * Behaviour preserved byte-for-byte; only the file location has changed.
 */
import {
  User,
  Users,
  MapPin,
  GraduationCap,
  School as SchoolIcon,
  Bus,
  Wallet,
  Camera,
  FileText,
  CheckCircle2,
} from 'lucide-react'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import type { FeeDataState } from '../FeeStructureStep'
import type { AdmissionFormData, DocStatus } from './types'

/** Type alias preserved from the original monolith. */
export type FormData = AdmissionFormData

/** Wizard step definitions — natural order for school staff. */
export const STEPS = [
  { id: 1, label: 'Personal', icon: User },
  { id: 2, label: 'Parents', icon: Users },
  { id: 3, label: 'Address', icon: MapPin },
  { id: 4, label: 'Applying For', icon: GraduationCap },
  { id: 5, label: 'Previous School', icon: SchoolIcon },
  { id: 6, label: 'Transport', icon: Bus },
  { id: 7, label: 'Fee Structure', icon: Wallet },
  { id: 8, label: 'Photo', icon: Camera },
  { id: 9, label: 'Documents', icon: FileText },
  { id: 10, label: 'Review & Submit', icon: CheckCircle2 },
] as const

/** List of Indian States & UTs for Searchable State Selector. */
export const INDIAN_STATES = [
  'Uttar Pradesh',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi (NCT)',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
]

/**
 * Blank initial data — every field starts empty. No demo prefill ever.
 * Admission defaults (nationality, religion, state, district, session) are
 * inherited from the school's persisted settings automatically.
 */
export function createBlankData(): AdmissionFormData {
  const adm = useSchoolSettingsStore.getState().admissionSettings
  const activeSession = useSchoolSettingsStore.getState().academics.currentSession
  return {
    admissionType: 'fresh',
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'Female',
    bloodGroup: '',
    category: '',
    aadhaarNo: '',
    religion: adm.defaultReligion,
    nationality: adm.defaultNationality,

    fatherName: '',
    fatherOccupation: '',
    fatherPhone: '',
    fatherEmail: '',
    fatherAadhaar: '',
    motherName: '',
    motherOccupation: '',
    motherPhone: '',
    motherEmail: '',
    motherAadhaar: '',
    primaryComm: 'father',

    emergencyName: '',
    emergencyRelation: 'Guardian',
    emergencyPhone: '',

    currentAddress: '',
    country: 'India',
    state: adm.schoolState,
    district: adm.schoolDistrict,
    city: '',
    pincode: '',
    sameAsCurrentAddress: true,
    permAddress: '',
    permCountry: 'India',
    permState: adm.schoolState,
    permDistrict: adm.schoolDistrict,
    permCity: '',
    permPincode: '',

    previousSchool: '',
    previousLocation: '',
    previousBoard: '',
    previousYear: activeSession,
    previousClass: '',
    previousSection: '',
    stream: '',
    tcStatus: 'pending',
    tcNumber: '',
    tcDate: '',
    reasonForLeaving: '',
    previousMarks: '',
    academicRemarks: '',

    heightCm: '',
    weightKg: '',
    allergies: '',
    conditions: '',
    specialNeeds: '',
    emergencyNotes: '',
    medicationInstructions: '',
    doctorName: '',
    doctorPhone: '',
    vaccinationStatus: 'Pending',

    className: '',
    section: '',
    classPreferences: {},
    waitlisted: false,

    transportRequired: false,
    transportRoute: '',
    pickupPoint: '',
    dropPoint: '',
    hostelRequired: false,
    hostelRoomType: '',

    docStatuses: {} as Record<string, DocStatus>,
    photoUploaded: false,
    photoDataUrl: null as string | null,
    scannedAttachment: null as { fileName: string; date: string; confidence: number } | null,

    feeState: {
      bookSelections: {},
      uniformSelections: {},
      activityKitSelections: {},
      examGroups: { unitTest: false, termExam: false, customGroups: false },
      transportSelected: false,
      hostelSelected: false,
      discountCode: 'NONE',
      customDiscountValue: 0,
      customDiscountReason: '',
    } as FeeDataState,

    waiver: { applied: false },
  }
}

export const initialData: AdmissionFormData = createBlankData()

/* Generate a permanent, non-sequential, unguessable public Student ID.
   Format: SCH-STU-XXXX-XXXX-X (base32, excludes ambiguous chars).
   Never reused, never editable. Internal DB UUID stays separate. */
export function generatePublicStudentId(): string {
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I,O,0,1
  const pick = (n: number) => Array.from({ length: n }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('')
  return `SCH-STU-${pick(4)}-${pick(4)}-${pick(1)}`
}

export function generatePublicAdmissionNo(): string {
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const pick = (n: number) => Array.from({ length: n }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('')
  const year = new Date().getFullYear()
  return `SCH-ADM-${year}-${pick(4)}-${pick(2)}`
}
