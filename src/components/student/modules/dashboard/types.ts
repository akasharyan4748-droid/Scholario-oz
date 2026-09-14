'use client'

/**
 * Dashboard V2 (SD-3) — the response shape of the ONE server-side
 * aggregation (/api/student/dashboard). Every field is REAL data derived
 * server-side from the authenticated student's records; sections degrade
 * to null/empty independently (PHASE 32 — isolated failures).
 */

export interface DashboardStudent {
  name: string
  avatarUrl: string | null
  className: string | null
  section: string | null
  classLabel: string | null
  rollNo: string | null
  admissionNo: string | null
  classRoom: string | null
}

export interface DashboardClass {
  id: string
  period: number
  subject: string
  teacherName: string
  room: string
  startTime: string
  endTime: string
}

export interface DashboardAttendance {
  pct: number | null
  present: number
  late: number
  absent: number
  total: number
  windowLabel: string
  trend: { name: string; v: number }[]
  weekDelta: number | null
}

export interface DashboardSubjectMark {
  subject: string
  marks: number
  totalMarks: number
  grade: string
}

export interface DashboardAcademics {
  latest: {
    examId: string
    examName: string
    declaredAt: string
    subjects: DashboardSubjectMark[]
    pct: number | null
  }
  rank: { position: number; assessedCount: number } | null
  upcomingExam: { examName: string; startsAt: string; endsAt: string | null } | null
}

export interface DashboardFees {
  outstanding: number
  nearestDue: string | null
  items: { title: string; balance: number; dueDate: string | null }[]
}

export interface DashboardNotice {
  id: string
  title: string
  message: string
  audience: string
  priority: string
  sender: string
  createdAt: string
  read: boolean
}

export interface DashboardLearning {
  continueLearning: {
    id: string
    title: string
    subjectName: string | null
    lastOpenedAt: string | null
  } | null
  dueFlashcards: number
  nearestTask: { id: string; title: string; dueDate: string | null; subjectName: string | null } | null
}

export interface DashboardData {
  student: DashboardStudent | null
  timetable: { week: Record<string, DashboardClass[]> }
  attendance: DashboardAttendance
  academics: DashboardAcademics | null
  fees: DashboardFees
  notices: { unreadCount: number; importantUnread: number; latest: DashboardNotice[] }
  learning: DashboardLearning
  messages: { unreadCount: number; recentSenders: string[] }
  transport: {
    assigned: boolean
    routeName: string | null
    pickupWindow: string | null
    stopsCount: number
    vehicleNo: string | null
  }
  generatedAt: string
}
