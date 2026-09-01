import type { StateCreator } from 'zustand'
import type { AdmissionStatus, AdmissionStoreState } from '../types'
import { students, Student } from '@/lib/mock/students'

export const createCompletionSlice: StateCreator<
  AdmissionStoreState,
  [],
  [],
  Pick<AdmissionStoreState, 'completeAdmission'>
> = (set, get) => ({
  completeAdmission: (appId, issuanceDetails) => {
    const state = get()
    const now = new Date().toISOString().split('T')[0]
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const app = state.applications.find((a) => a.id === appId)
    if (!app) return null

    // Generate permanent, non-sequential, unguessable public IDs (never reused)
    const RAND_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const randId = (n: number) => Array.from({ length: n }, () => RAND_ALPHABET[Math.floor(Math.random() * RAND_ALPHABET.length)]).join('')
    const year = new Date().getFullYear()
    const finalAdmissionNo = issuanceDetails?.admissionNo || `SCH-ADM-${year}-${randId(4)}-${randId(2)}`
    const finalStudentId = issuanceDetails?.studentId || `SCH-STU-${randId(4)}-${randId(4)}-${randId(1)}`
    const finalRollNo = issuanceDetails?.rollNo || (app.rollNo !== '—' ? app.rollNo : '01')
    const finalRegNo = issuanceDetails?.regNo || `REG-${year}-${randId(6)}`

    const loginId = `${app.formData.firstName.toUpperCase()}_2026`
    const tempPassword = `Scholario@${Math.floor(Math.random() * 9000 + 1000)}`

    const updatedApps = state.applications.map((item) =>
      item.id === appId
        ? {
            ...item,
            status: 'Completed' as AdmissionStatus,
            admissionNo: finalAdmissionNo,
            studentId: finalStudentId,
            rollNo: finalRollNo,
            regNo: finalRegNo,
            lastUpdatedDate: now,
            generatedCredentials: {
              loginId,
              tempPassword,
              portalUrl: 'https://portal.scholario.app',
            },
            notificationsSent: {
              sms: true,
              email: true,
              whatsapp: true,
              dispatchedAt: `${now} ${nowTime}`,
            },
            auditTrail: [
              ...item.auditTrail,
              {
                id: `a-${Date.now()}`,
                timestamp: `${now} ${nowTime}`,
                action: 'Admission Completed & Issued',
                actor: 'Admission Office',
                notes: `Admission Issued (${finalAdmissionNo}). Student account activated.`,
              },
            ],
          }
        : item
    )

    set({ applications: updatedApps })

    // Generate student object to return
    const newStudent: Student = {
      id: finalStudentId,
      admissionNo: finalAdmissionNo,
      rollNo: finalRollNo,
      name: app.applicantName,
      avatar: `${app.formData.firstName[0] || 'S'}${app.formData.lastName[0] || 'T'}`,
      gender: app.formData.gender as 'Male' | 'Female',
      className: app.formData.className || 'Class 2',
      section: app.formData.section || 'A',
      dob: app.formData.dob || '2017-08-14',
      bloodGroup: app.formData.bloodGroup || 'O+',
      fatherName: app.formData.fatherName || 'Parent',
      motherName: app.formData.motherName || 'Parent',
      guardianPhone: app.formData.fatherPhone || app.formData.motherPhone || '+91 98100 00000',
      email: app.formData.fatherEmail || app.formData.motherEmail || 'parent@gmail.com',
      address: app.formData.currentAddress || 'Gurugram',
      admissionDate: now,
      previousSchool: app.formData.previousSchool || 'N/A',
      status: 'Active',
      attendance: 100,
      feeStatus: 'Paid',
      feePaid: 86000,
      feeTotal: 86000,
      transport: app.formData.transportRequired,
      hostel: app.formData.hostelRequired,
      scholarship: 0,
      photo: `${app.formData.firstName[0] || 'S'}${app.formData.lastName[0] || 'T'}`,
      libraryId: `LIB-${Math.floor(Math.random() * 8000 + 1000)}`,
      medical: app.formData.allergies || 'No known allergies',
    }

    // Push to mock students array if present
    if (students && !students.some((s) => s.id === newStudent.id || s.admissionNo === newStudent.admissionNo)) {
      students.unshift(newStudent)
    }

    return newStudent
  },
})
