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

export interface FeeHeadConfig {
  id: string
  name: string
  type: 'Tuition' | 'Admission' | 'Annual' | 'Transport' | 'Lab' | 'Library' | 'Exam' | 'Other'
  defaultAmount: number
  frequency: 'Monthly' | 'Quarterly' | 'Term' | 'Annual' | 'One-Time'
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
