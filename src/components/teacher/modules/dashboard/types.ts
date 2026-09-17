'use client'

/**
 * TeacherDashboard (TWC-FE-4) — the response shape of the ONE server-side
 * aggregation (GET /api/teacher/dashboard). Every field is REAL data derived
 * server-side from the signed-in teacher's records (timetable cells, class
 * teacher scope, curriculum progress, Teacher Hub counts, Notification
 * rows). The former static mock identity (Class 2-A, fake charts) is gone.
 *
 * Nullable fields mirror the server serializers honestly (Timetable
 * startTime/endTime/room are nullable; employeeId may be unmapped).
 */

export interface TeacherIdentity {
  name: string
  employeeId: string | null
}

export interface TeacherPeriod {
  period: number
  startTime: string | null
  endTime: string | null
  subjectName: string
  classLabel: string
  room: string | null
}

export interface TeacherToday {
  weekday: string
  date: string
  periods: TeacherPeriod[]
}

export interface TeachingAssignment {
  classId: string
  classLabel: string
  subjectId: string
  subjectName: string
  periodsPerWeek: number
}

export interface ClassTeacherClass {
  classId: string
  classLabel: string
  studentCount: number
}

export interface AttendanceCounts {
  present: number
  absent: number
  late: number
  leave: number
}

export interface AttendanceSnapshot {
  classId: string
  classLabel: string
  studentCount: number
  marked: boolean
  counts: AttendanceCounts
}

export interface CurriculumTopicStatus {
  topicName: string
  unitName: string
  status: LessonTopicState
  endDate: string | null
}

export interface CurriculumProgress {
  completed: number
  total: number
  pct: number
}

export interface CurriculumAssignment {
  classId: string
  classLabel: string
  subjectId: string
  subjectName: string
  progress: CurriculumProgress
  todayTopic: CurriculumTopicStatus | null
  todayReason: string | null
}

/** Statuses produced by src/lib/lesson-schedule.ts (documented value set). */
export type LessonTopicState =
  | 'completed'
  | 'today'
  | 'in-progress'
  | 'needs-rescheduling'
  | 'upcoming'

export interface TeacherHubCounts {
  unreadMessages: number
  openFollowUps: number
  openConcerns: number
}

export interface TeacherNotice {
  id: string
  title: string
  message: string
  priority: string
  sender: string
  createdAt: string
}

export interface TeacherDashboardData {
  teacher: TeacherIdentity
  today: TeacherToday
  assignments: TeachingAssignment[]
  classTeacherOf: ClassTeacherClass[]
  attendance: AttendanceSnapshot[]
  curriculum: CurriculumAssignment[]
  hub: TeacherHubCounts
  notices: TeacherNotice[]
}
