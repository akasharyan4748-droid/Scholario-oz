export interface AdmissionLetterData {
  admissionNo: string
  refNo?: string
  studentId?: string
  regNo?: string
  admissionDate: string
  academicSession: string
  student: {
    firstName: string
    lastName: string
    dob: string
    photoUploaded?: boolean
    photoUrl?: string
  }
  parents: {
    fatherName: string
    fatherOccupation: string
    fatherPhone: string
    fatherEmail: string
    motherName: string
    motherOccupation: string
    motherPhone: string
  }
  address?: {
    currentAddress?: string
    district?: string
    state?: string
    pincode?: string
  }
  academic: {
    className: string
    section: string
    stream?: string
    rollNo?: string
    previousSchool?: string
    previousBoard?: string
  }
  fees: {
    registrationFee?: number
    admissionFee: number
    tuitionFee: number
    annualCharges?: number
    activityFee?: number
    transportFee?: number
    examFee?: number
    booksTotal?: number
    selectedBooksTitles?: string[]
    subtotal?: number
    totalAnnualFee?: number
    discountName?: string
    discountApplied?: number
    discountAmount?: number
    finalPayable: number
    paymentMethod?: string
  }
  credentials?: {
    loginId: string
    tempPassword: string
  }
  qrCodeData?: string
  digitalVerificationId?: string
}

export interface OfficialAdmissionLetterProps {
  data: AdmissionLetterData
  onClose?: () => void
}
