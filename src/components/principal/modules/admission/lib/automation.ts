/**
 * Automation helpers executed on admission approval.
 */

/* ---------- Automation on approval ---------- */
export interface AutomationResult {
  admissionNo: string
  studentId: string
  loginId: string
  tempPassword: string
  portalUrl: string
  profilesCreated: string[]
}

/**
 * Generates admission number, student ID, and login credentials on approval.
 * Mirrors the logic in admission-store.completeAdmission but exposed for preview.
 */
export function generateAutomationResult(studentIdFormat: string, className: string): AutomationResult {
  const year = new Date().getFullYear()
  const seq = Math.floor(1000 + Math.random() * 9000)
  const admissionNo = studentIdFormat.replace(/X+/g, String(seq)) || `ADM-${year}-${seq}`
  const studentId = `STU-${year}-${seq}`
  const loginId = `student${seq}`
  const tempPassword = `Sch@${year}${seq.toString().slice(-4)}`
  return {
    admissionNo,
    studentId,
    loginId,
    tempPassword,
    portalUrl: '/portal',
    profilesCreated: [
      'Student Profile',
      'Parent Profile',
      'Fee Ledger',
      'Attendance Profile',
      'Library Profile',
      'ID Card Request',
      'Timetable Allocation',
      'Notification Sent',
    ],
  }
}
