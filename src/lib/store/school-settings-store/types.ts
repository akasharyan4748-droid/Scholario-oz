export interface ClassConfig {
  id: string
  name: string
  sections: string[]
  stream?: string
}

export interface SubjectConfig {
  id: string
  name: string
  code: string
  category: 'Core' | 'Elective' | 'Vocational' | 'Activity'
  color: string
}

export interface BookItem {
  id: string
  classId: string
  className: string
  bookName: string
  publisher: string
  category: string
  price: number
  stock: number
  isMandatory: boolean
}

export interface UniformItem {
  id: string
  name: string
  category: 'Summer' | 'Winter' | 'Sports' | 'Formal'
  price: number
  sizes: string[]
  stock: number
}

/**
 * FINANCIAL CLASSIFICATION (Core vs Additional vs Examination).
 *
 * Every master catalogue head carries a coarse financial `kind` so the
 * system can distinguish three financially different concepts:
 *
 *   CORE        — Regular school fees that belong in a class's standard
 *                 annual fee structure (Tuition, Transport, Library…).
 *   EXAMINATION — Per-examination charges tied to exam definitions in the
 *                 Examination module (fee heads of this kind are hints for
 *                 the per-exam schedule, not ad-hoc charges).
 *   ADDITIONAL  — TEMPLATES for event-based / special collections
 *                 (Educational Tour, Workshop, Competition…). A catalogue
 *                 template does NOT mean every student owes it — the
 *                 Principal creates an actual Additional Charge event
 *                 (fee-store.additionalCharges) when the tour occurs.
 *
 * Optional for backward compatibility: pre-v3 persisted entries have no
 * `kind`; consumers must derive it via `deriveFeeHeadKind()` (Exam-type
 * heads → EXAMINATION, everything else → CORE).
 */
export type FeeHeadKind = 'CORE' | 'EXAMINATION' | 'ADDITIONAL'

/** Derive the financial kind for any FeeHeadConfig (persisted or new). */
export function deriveFeeHeadKind(h: { kind?: FeeHeadKind; type: string }): FeeHeadKind {
  if (h.kind) return h.kind
  return h.type === 'Exam' ? 'EXAMINATION' : 'CORE'
}

export interface FeeHeadConfig {
  id: string
  name: string
  type: 'Tuition' | 'Admission' | 'Annual' | 'Transport' | 'Lab' | 'Library' | 'Exam' | 'Activity' | 'Board' | 'Other'
  /** Financial classification — see FeeHeadKind above. */
  kind?: FeeHeadKind
  defaultAmount: number
  frequency: 'Monthly' | 'Quarterly' | 'Term' | 'Annual' | 'One-Time' | 'Half-Yearly' | 'Per Term'
  /** When true, this head no longer appears in the "pick from catalogue"
   *  picker for new fee structures. Existing structures keep their
   *  snapshot (versioning integrity). Default false. */
  archived?: boolean
  /** Free-form note shown in the picker ("Computer Lab maintenance + internet"). */
  description?: string
  /** When true, GST applies on this head; default false (most school fees are GST-exempt). */
  isTaxable?: boolean
  /** GST rate (%) when isTaxable — default 18. */
  taxRate?: number
  /** Optional HSN/SAC code for invoices. */
  gstHsnCode?: string
  /** When this default amount became effective (ISO date). */
  effectiveFrom?: string
}

export interface DiscountConfig {
  id: string
  name: string
  type: 'Percentage' | 'Fixed'
  value: number
  code: string
}

export interface PayGradeConfig {
  id: string
  grade: string
  title: string
  basePay: number
  hra: number
  da: number
  pfDeduction: number
}

export interface TransportRouteConfig {
  id: string
  name: string
  fare: number
  vehicleNo: string
  driverName: string
  driverPhone: string
  stopsCount: number
}

export interface HouseConfig {
  id: string
  name: string
  color: string
  captain?: string
  viceCaptain?: string
}

export interface AdmissionFormFieldRule {
  fieldKey: string
  label: string
  section: string
  visible: boolean
  required: boolean
}

// Admission feature flags — single source of truth for wizard conditional rendering
export interface AdmissionFeatureFlags {
  enableMedical: boolean
  enableHostel: boolean
  enableTransport: boolean
  enableEntranceExam: boolean
  enableInterview: boolean
  enablePreviousSchool: boolean
  enableScholarship: boolean
  enableFeeWaiver: boolean
  enableDocumentVerification: boolean
  enableAadhaar: boolean
  enableBloodGroup: boolean
  enableReligion: boolean
  enableCategory: boolean
  enableStudentPhoto: boolean
  enableParentPhoto: boolean
  enableSignature: boolean
  enableCustomFields: boolean
  // Classes for which previous school is auto-skipped on Fresh Admission
  previousSchoolSkipClasses: string[]
  // Board options if school follows multiple boards
  boards: string[]
}

// Per-class seat capacity & waitlist threshold
export interface ClassSeatConfig {
  className: string
  capacity: number
  enrolled: number
  waitlistThreshold: number
}

// Duplicate detection configuration
export interface DuplicateDetectionConfig {
  enabled: boolean
  blockThreshold: number       // 99-100 → block
  warnThreshold: number        // 70-95 → warn
  checkKeys: {
    aadhaar: boolean
    nameDob: boolean
    parentPhone: boolean
    parents: boolean
    previousSchool: boolean
    address: boolean
  }
}

// Waiver / concession audit record
export interface WaiverAuditEntry {
  id: string
  appliedBy: string
  appliedByRole: string
  approvalAuthority: string
  approvalDate: string
  reason: string
  amount: number
  timestamp: string
}

export interface SchoolSettingsState {
  // General Profile
  general: {
    schoolName: string
    shortName: string
    tagline: string
    affiliation: string
    address: string
    phone: string
    email: string
    website: string
    principalName: string
    vicePrincipalName: string
    established: number
    logoText: string
    brandColor: string
    principalSignatureUrl?: string
    officialSealUrl?: string
  }

  // Academics
  academics: {
    currentSession: string
    academicSessions: string[]
    board: string
    curriculum: string
    streams: string[]
    categories: string[]
    classes: ClassConfig[]
    subjects: SubjectConfig[]
    examStructures: { id: string; name: string; weightage: number }[]
  }

  // Timetable
  timetable: {
    workingDays: string[]
    startTime: string
    endTime: string
    periodDurationMinutes: number
    lunchBreakStart: string
    lunchBreakDurationMinutes: number
    assemblyDurationMinutes: number
    holidayRules: string
  }

  // Fees
  fees: {
    feeHeads: FeeHeadConfig[]
    discounts: DiscountConfig[]
    installmentsCount: number
    lateFeePerDay: number
    paymentRules: string
  }

  // Payroll
  payroll: {
    payGrades: PayGradeConfig[]
    pfRate: number
    esiRate: number
    tdsApplicable: boolean
  }

  // Bookstore
  bookStore: BookItem[]

  // Uniforms
  uniforms: UniformItem[]

  // Transport
  transport: {
    routes: TransportRouteConfig[]
  }

  // Library
  library: {
    categories: string[]
    maxBooksPerStudent: number
    issueDays: number
    lateFinePerDay: number
  }

  // House System
  houses: HouseConfig[]

  // Facilities
  facilities: {
    hasHostelFacility: boolean
    hasTransportFacility: boolean
  }

  // Admission Settings
  admissionSettings: {
    requiredDocs: string[]
    studentIdFormat: string
    rollNumberFormat: string
    autoEnrollBooks: boolean
    workflowSteps: string[]
    showPersonalDataOnLetter: boolean
    showDiscountBreakdown?: boolean
    rejectionRetentionDays: number
    fieldRules: AdmissionFormFieldRule[]
    featureFlags: AdmissionFeatureFlags
    seatCapacity: ClassSeatConfig[]
    duplicateDetection: DuplicateDetectionConfig
    waiverAudit: WaiverAuditEntry[]
    // Admission defaults — inherited by new applications automatically
    defaultNationality: string
    defaultReligion: string
    schoolState: string
    schoolDistrict: string
    previousBoards: string[]
  }

  // Actions
  updateGeneral: (data: Partial<SchoolSettingsState['general']>) => void
  updateAcademics: (data: Partial<SchoolSettingsState['academics']>) => void
  updateTimetable: (data: Partial<SchoolSettingsState['timetable']>) => void
  updateFees: (data: Partial<SchoolSettingsState['fees']>) => void
  updatePayroll: (data: Partial<SchoolSettingsState['payroll']>) => void
  addBook: (book: Omit<BookItem, 'id'>) => void
  removeBook: (id: string) => void
  addUniformItem: (item: Omit<UniformItem, 'id'>) => void
  removeUniformItem: (id: string) => void
  addHouse: (house: Omit<HouseConfig, 'id'>) => void
  updateHouse: (id: string, data: Partial<HouseConfig>) => void
  addFeeHead: (feeHead: Omit<FeeHeadConfig, 'id'>) => void
  updateFeeHead: (id: string, patch: Partial<FeeHeadConfig>) => void
  archiveFeeHead: (id: string) => void
  restoreFeeHead: (id: string) => void
  removeFeeHead: (id: string) => void
  addSubject: (sub: Omit<SubjectConfig, 'id'>) => void
  removeSubject: (id: string) => void
  addClass: (cls: Omit<ClassConfig, 'id'>) => void
  removeClass: (id: string) => void
  updateAdmissionSettings: (data: Partial<SchoolSettingsState['admissionSettings']>) => void
  updateAdmissionFeatureFlags: (data: Partial<AdmissionFeatureFlags>) => void
  updateSeatCapacity: (className: string, data: Partial<ClassSeatConfig>) => void
  updateDuplicateDetection: (data: Partial<DuplicateDetectionConfig>) => void
  addWaiverAudit: (entry: Omit<WaiverAuditEntry, 'id' | 'timestamp'>) => void
  updateFacilities: (data: Partial<SchoolSettingsState['facilities']>) => void
}
