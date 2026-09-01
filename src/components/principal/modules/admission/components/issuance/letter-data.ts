import { AdmissionLetterData } from '../../../OfficialAdmissionLetter'
import type { AdmissionApplication } from '@/lib/store/admission-store'

export interface IssuanceArtifacts {
  admissionNo: string
  studentId: string
  rollNo: string
  regNo: string
  loginId: string
  tempPassword: string
  letterData: AdmissionLetterData
}

export function buildIssuanceArtifacts(app: AdmissionApplication): IssuanceArtifacts {
  const formData = app.formData
  const isCompleted = app.status === 'Completed'

  const admissionNo = isCompleted ? app.admissionNo : app.admissionNo.replace('DRAFT-', '') || `ADM-2026-0842`
  const studentId = isCompleted ? app.studentId : app.studentId.replace('DRAFT-', '') || `STU-2026-0842`
  const rollNo = app.rollNo && app.rollNo !== '—' ? app.rollNo : '01'
  const regNo = isCompleted ? app.regNo : `REG-CBSE-2026-8812`

  const loginId = isCompleted && app.generatedCredentials ? app.generatedCredentials.loginId : `${formData.firstName.toUpperCase()}_2026`
  const tempPassword = isCompleted && app.generatedCredentials ? app.generatedCredentials.tempPassword : `Scholario@2026`

  // Letter Data Assembly
  const letterData: AdmissionLetterData = {
    admissionNo,
    studentId,
    regNo,
    admissionDate: isCompleted ? app.submittedDate : new Date().toISOString().split('T')[0],
    academicSession: app.academicSession || '2025–2026',
    student: {
      firstName: formData.firstName,
      lastName: formData.lastName,
      dob: formData.dob,



      photoUrl: undefined,
    },
    parents: {
      fatherName: formData.fatherName,
      fatherOccupation: formData.fatherOccupation,
      fatherPhone: formData.fatherPhone,
      fatherEmail: formData.fatherEmail,
      motherName: formData.motherName,
      motherOccupation: formData.motherOccupation,
      motherPhone: formData.motherPhone,
    },
    address: {
      currentAddress: formData.currentAddress,
      district: formData.district,
      state: formData.state,
      pincode: formData.pincode,
    },
    academic: {
      className: formData.className,
      section: formData.section,
      stream: formData.stream,
      rollNo,
      previousSchool: formData.previousSchool,
      previousBoard: formData.previousBoard,
    },
    fees: {
      totalAnnualFee: 86000,
      admissionFee: 15000,
      tuitionFee: 45000,
      activityFee: 8000,
      transportFee: formData.transportRequired ? 18000 : 0,
      discountApplied: 10000,
      finalPayable: 76000,
      paymentMethod: app.feeData?.paymentMethod || 'Online Banking',
    },
    qrCodeData: `https://verify.demoschool.edu/admission/${admissionNo}`,
    digitalVerificationId: `VER-2026-HASH-${admissionNo.slice(-4)}-CBSE`,
  }

  return {
    admissionNo,
    studentId,
    rollNo,
    regNo,
    loginId,
    tempPassword,
    letterData,
  }
}
