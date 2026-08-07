export interface Qualification {
  degree: string
  specialization: string
  institution: string
  year: string
  score: string
}

export interface TeacherDocument {
  id: string
  title: string
  category: 'ID Proof' | 'Qualification' | 'Experience' | 'Appointment' | 'Other'
  fileName: string
  uploadDate: string
  status: 'Verified' | 'Pending'
}

export interface PositionAssignment {
  id: string
  positionId: string
  positionTitle: string
  classAssigned?: string
  assignedDate: string
  assignedBy: string
  status: 'Active' | 'Pending Acceptance' | 'Rejected' | 'Pending Removal'
  rejectionReason?: string
  clarificationRequest?: string
  effectiveDate: string
  isEmergencyOverride?: boolean
  overrideReason?: string
}

export interface PositionDefinition {
  id: string
  title: string
  category: 'Academic' | 'Administrative' | 'Co-Curricular' | 'Management' | 'Custom'
  description: string
  isCustom?: boolean
  permissions: string[]
}

export interface AppointmentLetterData {
  id: string
  officialLetterNo: string
  generatedDate: string
  teacherName: string
  employeeId: string
  designation: string
  department: string
  joiningDate: string
  monthlySalary: number
  annualSalary: number
  workingHours: string
  probationMonths: number
  noticePeriodDays: number
  termsAndConditions: string[]
  principalName: string
  schoolSealAttached: boolean
  qrVerificationId: string
  reportingAuthority: string
}

export interface AuditLogItem {
  id: string
  timestamp: string
  category: 'Teacher Created' | 'Appointment Letter' | 'Subject Assigned' | 'Position Assigned' | 'Position Action' | 'Emergency Override' | 'Salary Updated' | 'Credentials Reset'
  actorName: string
  actorRole: string
  targetTeacherId: string
  targetTeacherName: string
  details: string
  isEmergencyOverride?: boolean
}

export interface TeacherRecord {
  id: string
  employeeId: string
  teacherId: string
  name: string
  avatar: string
  gender: 'Male' | 'Female' | 'Other'
  dob: string
  bloodGroup: string
  aadhaarNo: string
  nationality: string
  religion: string
  category: string
  passportPhotoUrl?: string

  // Contact & Address
  email: string
  phone: string
  emergencyContact: {
    name: string
    relation: string
    phone: string
  }
  currentAddress: string
  permAddress: string
  sameAddress: boolean
  district: string
  state: string
  pincode: string

  // Qualifications & Experience
  educationalQualifications: Qualification[]
  professionalQualifications: string[]
  totalExperience: number // years
  keyAchievements?: string
  previousEmployment: {
    organization: string
    designation: string
    lastSalary: number
    duration: string
  }

  // Joining & Department
  joiningDate: string
  employmentType: 'Full Time' | 'Part Time' | 'Probation' | 'Contract' | 'Guest'
  department: string
  designation: string
  status: 'Active' | 'On Leave' | 'Suspended' | 'Probation' | 'Relieved'
  attendance: number // %

  // Salary
  salary: number // Gross Monthly
  salaryBreakdown: {
    basic: number
    hra: number
    da: number
    specialAllowance: number
    pfDeduction: number
    netPay: number
  }
  bankDetails: {
    bankName: string
    accountNo: string
    ifscCode: string
    branchName: string
  }

  // Allocations
  subjects: string[]
  classes: string[]
  examResponsibilities: string[]

  // Positions & Permissions
  positions: PositionAssignment[]

  // Documents & Appointment
  documents: TeacherDocument[]
  appointmentLetter?: AppointmentLetterData

  // Login & Credentials
  isLocked?: boolean
  loginCredentials: {
    username: string
    tempPassword: string
    passwordResetRequired: boolean
    createdDate: string
    lastLogin?: string
  }

  pendingPayrollUpdate?: {
    proposalId: string
    proposedSalary: number
    code: string
    date: string
    proposedBreakdown: {
      basic: number
      hra: number
      da: number
      specialAllowance: number
      pfDeduction: number
      netPay: number
    }
  }

  remarks?: string
}

export interface TeachersStoreState {
  teachers: TeacherRecord[]
  positionsList: PositionDefinition[]
  auditLogs: AuditLogItem[]

  // Principal Actions
  addTeacher: (teacher: TeacherRecord) => void
  updateTeacher: (id: string, updates: Partial<TeacherRecord>) => void
  addCustomPosition: (position: Omit<PositionDefinition, 'id'>) => void
  assignPositionToTeacher: (teacherId: string, positionId: string, assignedBy?: string, classAssigned?: string) => void
  emergencyOverridePosition: (teacherId: string, positionId: string, reason: string, authCode: string, actorName?: string) => void
  removePositionFromTeacher: (teacherId: string, assignmentId: string, reason?: string, emergency?: boolean, authCode?: string) => void
  assignSubjectsAndClasses: (teacherId: string, subjects: string[], classes: string[], examResp?: string[]) => void
  regenerateAppointmentLetter: (teacherId: string, customTerms?: string[], newSalary?: number) => void
  resetTeacherPassword: (teacherId: string) => { username: string; tempPassword: string }
  toggleLockTeacherAccount: (teacherId: string, locked: boolean, reason?: string) => void
  requestPayrollRevision: (teacherId: string, newSalary: number) => { code: string }
  confirmPayrollRevision: (teacherId: string, code: string) => boolean
  terminateTeacher: (teacherId: string, reason: string, lockLogin: boolean) => void

  // Teacher Actions (Approval Workflow)
  acceptPosition: (teacherId: string, assignmentId: string) => void
  rejectPosition: (teacherId: string, assignmentId: string, reason: string) => void
  requestPositionClarification: (teacherId: string, assignmentId: string, query: string) => void

  // Logging Helper
  logAudit: (log: Omit<AuditLogItem, 'id' | 'timestamp'>) => void
}
