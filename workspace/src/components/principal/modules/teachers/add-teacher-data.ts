// Static data, initial form state, and the buildNewTeacherRecord helper
// for the Add Teacher wizard. Kept separate so the wizard component
// file stays under the 300-line budget.

import { classList } from '@/lib/mock/school'
import type {
  TeacherRecord,
  PositionAssignment,
} from '@/lib/store/teachers-store'

export const availableClassesList: string[] = (classList && classList.length > 0)
  ? classList.map((c) => (typeof c === 'string' ? c : c.name))
  : [
      'Nursery', 'LKG', 'UKG',
      'Class 1-A', 'Class 2-A', 'Class 3-A', 'Class 4-A', 'Class 5-A',
      'Class 6-A', 'Class 7-A', 'Class 8-A', 'Class 9-A', 'Class 10-A',
      'Class 11-A', 'Class 12-A',
    ]

export const subjectList: string[] = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Science', 'English',
  'Hindi', 'Social Studies', 'History', 'Geography', 'Computer Science',
  'Economics', 'Business Studies', 'Accountancy', 'Physical Education',
  'Art & Craft', 'EVS', 'Music/Dance',
]

export const masterInchargePositions: string[] = [
  'Examination Incharge',
  'Sports Incharge',
  'Discipline Incharge',
  'Cultural Coordinator',
  'Transport Incharge',
  'Laboratory Incharge',
  'Library Incharge',
  'Time Table Coordinator',
  'Academic Incharge',
  'Fee & Scholarship Incharge',
  'House Master / Mistress',
]

export const workloadClassOptions: string[] = [
  'Nursery-A', 'LKG-A', 'UKG-A', 'Class 1-A', 'Class 2-A', 'Class 3-A',
  'Class 4-A', 'Class 5-A', 'Class 6-A', 'Class 7-A', 'Class 8-A',
  'Class 9-A', 'Class 10-A', 'Class 11-Sci-A', 'Class 12-Sci-A',
]

export const workloadSubjectOptions: string[] = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi',
  'Computer Science', 'Social Studies', 'Physical Education', 'Art & Craft',
]

export const allPermissions = [
  { key: 'view_assigned_classes', label: 'View Assigned Classes' },
  { key: 'enter_subject_marks', label: 'Enter Subject Marks' },
  { key: 'take_class_attendance', label: 'Take Class Attendance' },
  { key: 'view_own_timetable', label: 'View Own Timetable' },
  { key: 'view_full_class_profile', label: 'View Full Class Profile' },
  { key: 'generate_marksheets', label: 'Generate Marksheets' },
  { key: 'manage_school_exams', label: 'Manage School Exams' },
  { key: 'manage_discipline', label: 'Manage Discipline Notes' },
  { key: 'manage_sports', label: 'Manage Sports Rosters' },
  { key: 'manage_transports', label: 'Manage Transport Routes' },
  { key: 'manage_timetable', label: 'Master Timetable Editing' },
  { key: 'admin_broad_access', label: 'Broad Administrative Access' },
]

export interface AddTeacherForm {
  name: string; gender: 'Male' | 'Female'; dob: string; bloodGroup: string
  aadhaarNo: string; nationality: string; religion: string; category: string
  email: string; phone: string
  emergencyName: string; emergencyRelation: string; emergencyPhone: string
  currentAddress: string; permAddress: string; sameAddress: boolean
  district: string; state: string; pincode: string
  degree: string; specialization: string; institution: string
  year: string; score: string; profQualifications: string
  totalExperience: number; keyAchievements: string
  prevOrg: string; prevDesignation: string; prevSalary: number; prevDuration: string
  joiningDate: string; employmentType: 'Full Time' | 'Part Time' | 'Probation'
  salary: number; bankName: string; accountNo: string; ifscCode: string; branchName: string
  inchargePosition: string; classTeacherRole: string; assistantClassTeacherRole: string
  selectedClasses: string[]; selectedSubjects: string[]; remarks: string
}

export const initialFormState: AddTeacherForm = {
  name: 'Aniket Sharma',
  gender: 'Male',
  dob: '1992-05-18',
  bloodGroup: 'B+',
  aadhaarNo: '7829 4019 2837',
  nationality: 'Indian',
  religion: 'Hindu',
  category: 'General',
  email: 'aniket.sharma@demoschool.edu',
  phone: '+91 98765 11223',
  emergencyName: 'Sanjay Sharma',
  emergencyRelation: 'Father',
  emergencyPhone: '+91 98765 00000',
  currentAddress: 'B-102, Sector 15, Gurugram',
  permAddress: 'B-102, Sector 15, Gurugram',
  sameAddress: true,
  district: 'Gurugram',
  state: 'Haryana',
  pincode: '122001',
  degree: 'M.Sc. Mathematics',
  specialization: 'Pure Mathematics',
  institution: 'Delhi University',
  year: '2015',
  score: '82%',
  profQualifications: 'B.Ed, CTET Paper II',
  totalExperience: 7,
  keyAchievements: 'State Mathematics Quiz Coordinator 2023',
  prevOrg: 'DAP Public School',
  prevDesignation: 'Math Teacher',
  prevSalary: 50000,
  prevDuration: '2019–2025',
  joiningDate: '2025-08-01',
  employmentType: 'Full Time',
  salary: 68000,
  bankName: 'HDFC Bank',
  accountNo: '50100482910394',
  ifscCode: 'HDFC0000123',
  branchName: 'Sector 15 Gurugram',
  inchargePosition: 'None',
  classTeacherRole: 'None',
  assistantClassTeacherRole: 'None',
  selectedClasses: ['Class 9-A', 'Class 10-A'],
  selectedSubjects: ['Mathematics', 'Science'],
  remarks: 'Selected through Principal board interview on 15 July 2025.',
}

/**
 * Build a fully-formed TeacherRecord (with positions, salary breakdown,
 * appointment letter, and login credentials) from the wizard form state.
 */
export function buildNewTeacherRecord(form: AddTeacherForm): TeacherRecord {
  const seq = String(Math.floor(100 + Math.random() * 899))
  const empId = `EMP-${seq}`
  const teacherId = `TCH-2025-${seq}`
  const basic = Math.round(form.salary * 0.5)
  const hra = Math.round(form.salary * 0.2)
  const da = Math.round(form.salary * 0.15)
  const sa = Math.round(form.salary * 0.1)
  const pf = Math.round(form.salary * 0.05)

  const finalDepartment = form.inchargePosition !== 'None' ? form.inchargePosition : 'Academic'
  const finalDesignation = form.classTeacherRole !== 'None'
    ? `Class Teacher (${form.classTeacherRole})`
    : form.inchargePosition !== 'None'
      ? form.inchargePosition
      : 'Subject Teacher'

  const initPositions: PositionAssignment[] = [
    {
      id: `pa-init-${seq}`,
      positionId: 'pos-subject-teacher',
      positionTitle: 'Subject Teacher',
      assignedDate: new Date().toISOString().split('T')[0],
      assignedBy: 'Dr. Ananya Iyer',
      status: 'Active',
      effectiveDate: form.joiningDate,
    },
  ]

  if (form.inchargePosition !== 'None') {
    initPositions.push({
      id: `pa-inc-${seq}`,
      positionId: `pos-inc-${form.inchargePosition.toLowerCase().replace(/\s+/g, '-')}`,
      positionTitle: form.inchargePosition,
      assignedDate: new Date().toISOString().split('T')[0],
      assignedBy: 'Dr. Ananya Iyer',
      status: 'Active',
      effectiveDate: form.joiningDate,
    })
  }

  if (form.classTeacherRole !== 'None') {
    initPositions.push({
      id: `pa-ct-${seq}`,
      positionId: 'pos-class-teacher',
      positionTitle: `Class Teacher (${form.classTeacherRole})`,
      assignedDate: new Date().toISOString().split('T')[0],
      assignedBy: 'Dr. Ananya Iyer',
      status: 'Active',
      effectiveDate: form.joiningDate,
    })
  }

  if (form.assistantClassTeacherRole !== 'None') {
    initPositions.push({
      id: `pa-act-${seq}`,
      positionId: 'pos-asst-class-teacher',
      positionTitle: `Assistant Class Teacher (${form.assistantClassTeacherRole})`,
      assignedDate: new Date().toISOString().split('T')[0],
      assignedBy: 'Dr. Ananya Iyer',
      status: 'Active',
      effectiveDate: form.joiningDate,
    })
  }

  return {
    id: `T-${seq}`,
    employeeId: empId,
    teacherId,
    name: form.name,
    avatar: form.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
    gender: form.gender,
    dob: form.dob,
    bloodGroup: form.bloodGroup,
    aadhaarNo: form.aadhaarNo,
    nationality: form.nationality,
    religion: form.religion,
    category: form.category,
    email: form.email,
    phone: form.phone,
    emergencyContact: { name: form.emergencyName, relation: form.emergencyRelation, phone: form.emergencyPhone },
    currentAddress: form.currentAddress,
    permAddress: form.sameAddress ? form.currentAddress : form.permAddress,
    sameAddress: form.sameAddress,
    district: form.district,
    state: form.state,
    pincode: form.pincode,
    educationalQualifications: [{ degree: form.degree, specialization: form.specialization, institution: form.institution, year: form.year, score: form.score }],
    professionalQualifications: form.profQualifications.split(',').map((s) => s.trim()).filter(Boolean),
    totalExperience: Number(form.totalExperience),
    keyAchievements: form.keyAchievements,
    previousEmployment: { organization: form.prevOrg, designation: form.prevDesignation, lastSalary: Number(form.prevSalary), duration: form.prevDuration },
    joiningDate: form.joiningDate,
    employmentType: form.employmentType,
    department: finalDepartment,
    designation: finalDesignation,
    status: 'Active',
    attendance: 100,
    salary: Number(form.salary),
    salaryBreakdown: { basic, hra, da, specialAllowance: sa, pfDeduction: pf, netPay: form.salary - pf },
    bankDetails: { bankName: form.bankName, accountNo: form.accountNo, ifscCode: form.ifscCode, branchName: form.branchName },
    subjects: form.selectedSubjects,
    classes: form.selectedClasses,
    examResponsibilities: ['Invigilator'],
    positions: initPositions,
    documents: [
      { id: `doc-${seq}-1`, title: 'Educational Qualification Certificate', category: 'Qualification', fileName: 'Degree_Certificate.pdf', uploadDate: new Date().toISOString().split('T')[0], status: 'Verified' },
    ],
    appointmentLetter: {
      id: `APT-GWS-2025-${seq}`,
      officialLetterNo: `GWS/APT/2025/${seq}`,
      generatedDate: new Date().toISOString().split('T')[0],
      teacherName: form.name,
      employeeId: empId,
      designation: finalDesignation,
      department: finalDepartment,
      joiningDate: form.joiningDate,
      monthlySalary: Number(form.salary),
      annualSalary: Number(form.salary) * 12,
      workingHours: '08:00 AM – 03:30 PM',
      probationMonths: 6,
      noticePeriodDays: 60,
      termsAndConditions: [
        'Adherence to CBSE Code of Professional Conduct.',
        'Full dedication to classroom instructions and student progress evaluation.',
        '60 days notice period required prior to resignation.',
      ],
      principalName: 'Dr. Ananya Iyer',
      schoolSealAttached: true,
      qrVerificationId: `QR-APT-${empId}-${Date.now().toString(36).toUpperCase()}`,
      reportingAuthority: 'Dr. Ananya Iyer, Principal',
    },
    loginCredentials: {
      username: form.email,
      tempPassword: `GWS#Teacher${seq}`,
      passwordResetRequired: true,
      createdDate: new Date().toISOString().split('T')[0],
    },
    remarks: form.remarks,
  }
}
