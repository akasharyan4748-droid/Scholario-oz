// Type definitions for the students store.
//
// All entity types (StudentRecord, ClassRecord, House, etc.) and the
// `StudentsState` store contract live here so they can be imported
// independently of the store implementation.

export type StudentStatus = 'Active' | 'Archived'
export type FeeStatus = 'Paid' | 'Partial' | 'Pending'
export type Gender = 'Male' | 'Female'

export interface TimelineEvent {
  id: string
  type: 'admission' | 'promotion' | 'transfer' | 'fee' | 'house' | 'archive' | 'restore'
  title: string
  description: string
  date: string
  by: string
}

export interface StudentRecord {
  id: string
  admissionNo: string
  rollNo: string
  name: string
  avatar: string
  gender: Gender
  classId: string
  className: string
  section: string
  dob: string
  bloodGroup: string
  category: string
  fatherName: string
  motherName: string
  guardianPhone: string
  guardianEmail: string
  guardianName: string
  city: string
  state: string
  hostel: boolean
  disciplinePoints: number
  address: string
  admissionDate: string
  previousSchool: string
  status: StudentStatus
  archiveReason?: string
  archiveDate?: string
  attendance: number
  feeStatus: FeeStatus
  feePaid: number
  feeTotal: number
  transport: boolean
  scholarship: number
  houseId?: string
  houseName?: string
  medical: string
  academics: {
    overallGrade: string
    overallPercent: number
    rankInClass: number
    subjects: { name: string; grade: string; percent: number; teacher: string }[]
  }
  attendanceTrend: { month: string; percent: number }[]
  achievements: { title: string; date: string; level: string }[]
  disciplineRecords: { date: string; type: string; description: string; points: number }[]
  documents: { id: string; title: string; type: string; uploadedDate: string; verified: boolean }[]
  transportRoute?: string
  timeline: TimelineEvent[]
}

export interface SectionRecord {
  id: string
  name: string
  classId: string
  capacity: number
  classTeacherId?: string
  room: string
}

export interface ClassRecord {
  id: string
  name: string
  grade: number
  level: 'Pre-Primary' | 'Primary' | 'Middle' | 'Secondary' | 'Senior Secondary'
  sections: SectionRecord[]
  capacity: number
  classTeacherId: string
  subjects: string[]
  room: string
  status: 'Active' | 'Archived'
}

export interface House {
  id: string
  name: string
  color: string
  motto: string
  captainId?: string
  viceCaptainId?: string
  points: number
  competitionWins: number
}

export interface PromotionRecord {
  id: string
  studentId: string
  studentName: string
  fromClass: string
  toClass: string
  academicYear: string
  feeCleared: boolean
  resultCleared: boolean
  attendanceCleared: boolean
  status: 'Pending' | 'Approved' | 'Completed' | 'Rejected'
  date: string
  requestedBy: string
}

export interface TransferRecord {
  id: string
  studentId: string
  studentName: string
  type: 'Section Change' | 'Class Change' | 'School Transfer' | 'Graduation' | 'Archive'
  fromClass: string
  toClass: string
  reason: string
  status: 'Pending' | 'Completed'
  date: string
}

export interface StudentsState {
  students: StudentRecord[]
  classes: ClassRecord[]
  houses: House[]
  promotions: PromotionRecord[]
  transfers: TransferRecord[]
  archiveStudent: (id: string, reason: string, by: string) => void
  restoreStudent: (id: string, by: string) => void
  transferStudent: (id: string, type: TransferRecord['type'], toClass: string, reason: string, by: string) => void
  assignHouse: (id: string, houseId: string, by: string) => void
  updateRollNumber: (id: string, roll: string, by: string) => void
  createPromotion: (ids: string[], from: string, to: string, year: string, by: string) => void
  approvePromotion: (id: string, by: string) => void
  executePromotion: (id: string, by: string) => void
  addHousePoints: (id: string, pts: number) => void
  assignHouseCaptain: (id: string, sid: string, role: 'captain' | 'vice') => void
  /** Replace the class-level Class Teacher. Pass null/undefined to clear. */
  updateClassTeacher: (classId: string, teacherId: string | null) => void
  /** Replace a section's Class Teacher. Pass null/undefined to clear. */
  updateSectionTeacher: (classId: string, sectionId: string, teacherId: string | null) => void
  /** Add a subject to a class (no-op if already allocated). */
  addClassSubject: (classId: string, subject: string) => void
  /** Archive a subject from a class — removes it from active allocation. */
  archiveClassSubject: (classId: string, subject: string) => void
  getStudentById: (id: string) => StudentRecord | undefined
  getClassById: (id: string) => ClassRecord | undefined
  getClassStudents: (classId: string) => StudentRecord[]
}
