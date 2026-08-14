// ──────────────────────────────────────────────────────────────────────
// Examination domain types — shared between API routes, services, and UI.
// ──────────────────────────────────────────────────────────────────────

export interface AuthUserLike {
  id: string
  email: string
  name: string | null
  role: string
  schoolId: string | null
}

export const EXAM_TYPES = [
  'Unit Test',
  'Periodic Assessment',
  'Term Examination',
  'Half-Yearly',
  'Annual Examination',
  'Pre-Board',
  'Practical',
  'Viva / Oral',
  'Internal Assessment',
  'Custom',
] as const
export type ExamType = string

// ─── Exam type categories ────────────────────────────────────────────

export interface ExamTypeMeta {
  name: string
  category: 'academic' | 'board' | 'other'
  description: string
  boardOnly?: boolean
}

export const EXAM_TYPE_META: ExamTypeMeta[] = [
  { name: 'Unit Test', category: 'academic', description: 'Short periodic assessment' },
  { name: 'Periodic Assessment', category: 'academic', description: 'Regular evaluation check' },
  { name: 'Term Examination', category: 'academic', description: 'End-of-term examination' },
  { name: 'Half-Yearly', category: 'academic', description: 'Mid-session comprehensive examination' },
  { name: 'Annual Examination', category: 'academic', description: 'End-of-session examination' },
  { name: 'Pre-Board', category: 'board', description: 'Board preparation examination', boardOnly: true },
  { name: 'Practical', category: 'board', description: 'Practical / laboratory evaluation', boardOnly: true },
  { name: 'Viva / Oral', category: 'other', description: 'Oral evaluation' },
  { name: 'Internal Assessment', category: 'other', description: 'Continuous evaluation' },
  { name: 'Custom', category: 'other', description: 'Custom examination type' },
]

export const EXAM_STATUSES = ['Draft', 'Scheduled', 'Ongoing', 'Completed', 'Cancelled'] as const
export type ExamStatus = (typeof EXAM_STATUSES)[number]

export const RESULT_STATUSES = [
  'Not Started',
  'Marks Entry',
  'Under Verification',
  'Result Ready',
  'Result Declared',
] as const
export type ResultStatus = (typeof RESULT_STATUSES)[number]

export const MARK_STATUSES = ['PRESENT', 'ABSENT', 'MEDICAL', 'EXEMPTED'] as const
export type MarkStatus = (typeof MARK_STATUSES)[number]

export const WORKFLOW_STATUSES = ['DRAFT', 'SUBMITTED', 'VERIFIED', 'LOCKED'] as const
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number]

export const GRADE_BOUNDARIES = [
  { grade: 'A+', minPct: 90, color: 'emerald' },
  { grade: 'A', minPct: 80, color: 'emerald' },
  { grade: 'B+', minPct: 70, color: 'sky' },
  { grade: 'B', minPct: 60, color: 'amber' },
  { grade: 'C', minPct: 50, color: 'orange' },
  { grade: 'D', minPct: 33, color: 'rose' },
  { grade: 'E', minPct: 0, color: 'rose' },
] as const

export const PASSING_PERCENTAGE_DEFAULT = 33

export function getGradeForPercentage(pct: number): {
  grade: string
  color: string
} {
  for (const b of GRADE_BOUNDARIES) {
    if (pct >= b.minPct) return { grade: b.grade, color: b.color }
  }
  return { grade: 'E', color: 'rose' }
}

// ─── API shape types (returned to client) ────────────────────────────

export interface ExamSubjectConfigDTO {
  id: string
  examId: string
  classId: string
  subjectId: string
  subjectName: string
  subjectCode: string | null
  maxMarks: number
  passMarks: number
  theoryMarks: number
  practicalMarks: number
  sortOrder: number
}

export interface ExamClassDTO {
  id: string
  examId: string
  classId: string
  className: string
  gradeLevel: string | null
  section: string | null
  studentCount: number
}

export interface ScheduleItemDTO {
  id: string
  examId: string
  classId: string
  className: string
  subjectId: string | null
  subjectName: string | null
  date: string // ISO date
  startTime: string
  endTime: string
  room: string | null
  invigilatorId: string | null
  invigilatorName: string | null
}

export interface StudentDTO {
  id: string
  rollNo: string | null
  admissionNo: string | null
  name: string
  classId: string | null
}

export interface ExamMarkDTO {
  id: string
  examId: string
  classId: string
  subjectId: string
  studentId: string
  studentName: string
  studentRollNo: string | null
  marksObtained: number | null
  status: MarkStatus
  workflowStatus: WorkflowStatus
  originalMarks: number | null
  graceMarks: number
  graceReason: string | null
  remarks: string | null
  enteredBy: string | null
  enteredAt: string | null
  verifiedBy: string | null
  verifiedAt: string | null
  lockedBy: string | null
}

export interface ExamDTO {
  id: string
  schoolId: string
  name: string
  type: string
  session: string | null
  term: string | null
  status: string
  resultStatus: string
  passPercentage: number
  startDate: string | null
  endDate: string | null
  declaredAt: string | null
  declaredBy: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
  classes: ExamClassDTO[]
  subjects: ExamSubjectConfigDTO[]
  schedule: ScheduleItemDTO[]
  markSummary: {
    total: number
    entered: number
    locked: number
    submitted: number
    verified: number
    pct: number
  }
}

export interface CreateExamInput {
  name: string
  type: string
  session?: string
  startDate?: string
  endDate?: string
  passPercentage?: number
  classIds: string[]
  // For each classId: which subjects and the per-subject marks config
  subjectsByClass: Record<
    string,
    Array<{
      subjectId: string
      maxMarks?: number
      passMarks?: number
      theoryMarks?: number
      practicalMarks?: number
    }>
  >
  // Optional initial schedule (subject + class + date + time + room)
  schedule?: Array<{
    classId: string
    subjectId: string
    date: string
    startTime: string
    endTime: string
    room?: string
    invigilatorName?: string
  }>
}

export interface SetMarkInput {
  classId: string
  subjectId: string
  studentId: string
  marksObtained: number | null
  status: MarkStatus
  remarks?: string
}

export interface AuditLogDTO {
  id: string
  examId: string
  userId: string | null
  userName: string | null
  action: string
  entity: string | null
  entityId: string | null
  oldValue: string | null
  newValue: string | null
  createdAt: string
}

// ─── Result engine types ────────────────────────────────────────────

export interface SubjectResult {
  subjectId: string
  subjectName: string
  maxMarks: number
  passMarks: number
  marksObtained: number | null
  status: MarkStatus
  isAbsent: boolean
  passed: boolean
  percentage: number
}

export interface StudentResult {
  studentId: string
  studentName: string
  rollNo: string | null
  className: string
  classId: string
  subjects: SubjectResult[]
  totalObtained: number
  totalMax: number
  percentage: number
  grade: string
  gradeColor: string
  passed: boolean
  subjectsPassed: number
  subjectsCount: number
  isAbsentInAll: boolean
  rank: number | null
}

export interface ExamAnalyticsDTO {
  totalStudents: number
  passed: number
  failed: number
  passRate: number
  averagePercentage: number
  highestPercentage: number
  lowestPercentage: number
  gradeDistribution: Record<string, number>
  subjectPerformance: Array<{
    subjectId: string
    subjectName: string
    averagePercentage: number
    averageMarks: number
    entered: number
    total: number
  }>
  toppers: Array<{
    rank: number
    studentId: string
    name: string
    rollNo: string | null
    className: string
    percentage: number
    total: number
    maxTotal: number
    grade: string
  }>
}
