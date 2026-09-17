/**
 * analytics/types — the client-side contract of
 * GET /api/teacher/analytics. Every field is derived from real
 * records (ExamMark / ExamSubjectConfig / Attendance); the route is
 * the single source of truth for thresholds and date labels.
 */

export interface AnalyticsClassRef {
  id: string
  label: string
  /** True for classes the teacher is class teacher of (selector default). */
  isClassTeacher: boolean
}

export interface LatestAssessment {
  examId: string
  name: string
  dateLabel: string
  status: string
  resultStatus: string
}

export interface ExamTrendPoint {
  examId: string
  name: string
  dateLabel: string
  /** Mean of the class's normalized marks in that exam (0–100). */
  avgPct: number
}

export interface SubjectAverage {
  subject: string
  /** Raw mean of entered marks. */
  avg: number
  /** maxMarks from ExamSubjectConfig — the honest denominator. */
  max: number
  pct: number
}

export interface AssessmentCompletion {
  examId: string
  examName: string
  dateLabel: string
  entered: number
  expected: number
  pct: number | null
}

export interface TopPerformer {
  studentId: string
  name: string
  rollNo: string | null
  avgPct: number
  subjects: number
}

export interface WeeklyAttendancePoint {
  key: string
  /** Real Monday of the week, e.g. "10 Aug". */
  label: string
  value: number
}

export interface AttendanceStats {
  total: number
  present: number
  late: number
  absent: number
  pct: number | null
  weeklyTrend: WeeklyAttendancePoint[]
}

export interface AttentionReason {
  kind: 'performance' | 'attendance'
  text: string
}

export interface AttentionStudent {
  studentId: string
  name: string
  rollNo: string | null
  /** Latest-assessment average — null when the student has no marks. */
  avgPct: number | null
  attendancePct: number | null
  attendanceRecords: number
  reasons: AttentionReason[]
}

export interface ClassAnalytics {
  classId: string
  label: string
  studentCount: number
  latestAssessment: LatestAssessment | null
  classAveragePct: number | null
  /** Students with at least one entered mark in the latest assessment. */
  gradedStudents: number
  subjectAverages: SubjectAverage[]
  examTrend: ExamTrendPoint[]
  assessmentCompletion: AssessmentCompletion | null
  topPerformers: TopPerformer[]
  attendance: AttendanceStats
  needingAttention: AttentionStudent[]
}

export interface AnalyticsPayload {
  classes: AnalyticsClassRef[]
  classAnalytics: ClassAnalytics[]
}
