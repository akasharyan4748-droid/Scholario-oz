import { FeeDataState } from '../FeeStructureStep'

// Admission type — drives conditional wizard flow
export type AdmissionType = 'fresh' | 'transfer' | 'readmission' | 'promotion'

// Enhanced document verification status
export type DocVerificationStatus =
  | 'required'
  | 'optional'
  | 'pending'
  | 'rejected'
  | 'verified'
  | 'replace_requested'

export interface DocStatus {
  status: 'uploaded' | 'pending' | 'later'
  verificationStatus?: DocVerificationStatus
  fileName?: string
  ocrConfidence?: number
  verifiedBy?: string
  verificationTime?: string
  rejectionReason?: string
  required?: boolean
}

// Class selection preferences
export interface ClassPreferences {
  sectionPreference?: string
  languagePreference?: string
  secondLanguage?: string
  optionalSubjectPreference?: string
  board?: string
}

// Waiver / concession audit info
export interface WaiverInfo {
  applied: boolean
  appliedBy?: string
  appliedByRole?: string
  approvalAuthority?: string
  approvalDate?: string
  reason?: string
  amount?: number
  auditId?: string
}

export interface AdmissionFormData {
  // Admission Details
  admissionType: AdmissionType

  // Personal
  firstName: string
  lastName: string
  dob: string
  gender: 'Female' | 'Male' | 'Other'
  bloodGroup: string
  category: string
  aadhaarNo: string
  religion: string
  nationality: string

  // Parents
  fatherName: string
  fatherOccupation: string
  fatherPhone: string
  fatherEmail: string
  fatherAadhaar?: string
  motherName: string
  motherOccupation: string
  motherPhone: string
  motherEmail: string
  motherAadhaar?: string
  primaryComm?: 'father' | 'mother' | 'both'

  // Emergency
  emergencyName: string
  emergencyRelation: string
  emergencyPhone: string

  // Address
  currentAddress: string
  country: string
  state: string
  district: string
  city: string
  pincode: string
  sameAsCurrentAddress: boolean
  permAddress: string
  permCountry: string
  permState: string
  permDistrict: string
  permCity: string
  permPincode: string

  // Previous School (Academic History)
  previousSchool: string
  previousLocation?: string
  previousBoard?: string
  previousYear: string
  previousClass: string
  previousSection?: string
  stream?: string
  tcStatus?: 'uploaded' | 'pending' | 'exempted'
  tcNumber?: string
  tcDate?: string
  reasonForLeaving?: string
  previousMarks?: string
  academicRemarks?: string

  // Medical
  heightCm?: string
  weightKg?: string
  allergies: string
  conditions: string
  specialNeeds?: string
  emergencyNotes?: string
  medicationInstructions?: string
  doctorName: string
  doctorPhone: string
  vaccinationStatus?: 'Fully Vaccinated' | 'Partial' | 'Pending'

  // Class Allocation + Preferences
  className: string
  section: string
  classPreferences?: ClassPreferences
  waitlisted?: boolean

  // Transport & Hostel
  transportRequired: boolean
  transportRoute: string
  pickupPoint?: string
  dropPoint?: string
  hostelRequired: boolean
  hostelRoomType?: string

  // Documents & Photo
  docStatuses: Record<string, DocStatus>
  photoUploaded?: boolean
  photoDataUrl?: string | null
  scannedAttachment?: {
    fileName: string
    date: string
    confidence: number
  } | null
  feeState?: FeeDataState
  waiver?: WaiverInfo
}

export interface AdmissionRecord {
  id: string
  studentName: string
  className: string
  section: string
  admissionNo: string
  guardianName: string
  guardianPhone: string
  date: string
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Need Correction' | 'Resubmitted' | 'Approved' | 'Rejected' | 'Completed' | 'Archived'
  photoUploaded?: boolean
}
