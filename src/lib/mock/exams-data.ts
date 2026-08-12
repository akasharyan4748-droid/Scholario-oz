// Examinations data model — ONE coherent chain:
//   Exam → Exam Subjects → Exam Schedule → Class/Section → Students → Marks → Result → Analytics
//
// Brief §3 + §10: Configurable examination structure with flexible marks.
// Brief §4: All numbers DERIVED from actual data — no fake analytics.
// Brief §8: Separate exam status from result status.
// Brief §16: Absent ≠ Zero ≠ Not Entered — distinct states.
// Brief §29: Single source of truth for all examination screens.

import { classSections } from '@/lib/mock/attendance'
import { class2AAttendance } from '@/lib/mock/attendance'

// ──────────────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────────────

export type ExamType = 'Unit Test' | 'Term Examination' | 'Half-Yearly' | 'Annual' | 'Pre-Board' | 'Practical' | 'Periodic Assessment'

export type ExamStatus = 'Draft' | 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled'

export type ResultStatus = 'Not Started' | 'Marks Entry' | 'Under Verification' | 'Result Ready' | 'Result Declared'

export type AcademicSession = '2025–2026'

export interface ExamSubject {
  id: string
  name: string
  maxMarks: number
  passingMarks: number
  theoryMarks: number
  practicalMarks: number
}

export interface ScheduleEntry {
  subjectId: string
  subjectName: string
  className: string
  date: string
  startTime: string
  endTime: string
  room: string
  invigilator: string
}

export interface StudentMark {
  studentId: string
  studentName: string
  rollNo: string
  marksObtained: number | null  // null = not entered
  isAbsent: boolean
}

export interface SubjectMarks {
  subjectId: string
  subjectName: string
  maxMarks: number
  marks: StudentMark[]
}

export interface ExamClassConfig {
  classId: string
  className: string
  subjects: ExamSubject[]
  marks: SubjectMarks[]
}

export interface Exam {
  id: string
  name: string
  type: ExamType
  session: AcademicSession
  startDate: string
  endDate: string
  classes: string[]
  status: ExamStatus
  resultStatus: ResultStatus
  classConfigs: ExamClassConfig[]
  schedule: ScheduleEntry[]
  createdAt: string
}

// ──────────────────────────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────────────────────────

export const EXAM_TYPES: ExamType[] = [
  'Unit Test', 'Term Examination', 'Half-Yearly', 'Annual', 'Pre-Board', 'Practical', 'Periodic Assessment',
]

export const EXAM_STATUSES: ExamStatus[] = [
  'Draft', 'Scheduled', 'Ongoing', 'Completed', 'Cancelled',
]

export const RESULT_STATUSES: ResultStatus[] = [
  'Not Started', 'Marks Entry', 'Under Verification', 'Result Ready', 'Result Declared',
]

export const ACADEMIC_SESSION: AcademicSession = '2025–2026'

export const PASSING_PERCENTAGE = 33

export const GRADE_BOUNDARIES = [
  { grade: 'A+', minPct: 90, color: 'text-emerald-600 dark:text-emerald-400' },
  { grade: 'A', minPct: 80, color: 'text-emerald-600 dark:text-emerald-400' },
  { grade: 'B+', minPct: 70, color: 'text-sky-600 dark:text-sky-400' },
  { grade: 'B', minPct: 60, color: 'text-amber-600 dark:text-amber-400' },
  { grade: 'C', minPct: 50, color: 'text-orange-600 dark:text-orange-400' },
  { grade: 'D', minPct: 33, color: 'text-rose-600 dark:text-rose-400' },
  { grade: 'E', minPct: 0, color: 'text-rose-600 dark:text-rose-400' },
]

// ──────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────────────────────────────────────

export function getGradeForPercentage(pct: number): { grade: string; color: string } {
  for (const b of GRADE_BOUNDARIES) {
    if (pct >= b.minPct) return { grade: b.grade, color: b.color }
  }
  return { grade: 'E', color: 'text-rose-600 dark:text-rose-400' }
}

export function calculateResult(exam: Exam, classId: string, studentId: string) {
  const classConfig = exam.classConfigs.find((c) => c.classId === classId)
  if (!classConfig) return null

  let totalObtained = 0
  let totalMax = 0
  let subjectsPassed = 0
  let subjectsCount = 0
  let isAbsent = false

  for (const sm of classConfig.marks) {
    const mark = sm.marks.find((m) => m.studentId === studentId)
    if (!mark) continue
    subjectsCount++
    totalMax += sm.maxMarks
    if (mark.isAbsent) {
      isAbsent = true
      totalObtained += 0
    } else if (mark.marksObtained !== null) {
      totalObtained += mark.marksObtained
      if (mark.marksObtained >= sm.maxMarks * (PASSING_PERCENTAGE / 100)) {
        subjectsPassed++
      }
    }
  }

  const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0
  const { grade, color } = getGradeForPercentage(percentage)
  const passed = subjectsPassed === subjectsCount && !isAbsent

  return {
    totalObtained,
    totalMax,
    percentage: Math.round(percentage * 100) / 100,
    grade,
    gradeColor: color,
    passed,
    isAbsent,
    subjectsCount,
    subjectsPassed,
  }
}

/** Calculate marks entry progress for a class+subject */
export function getMarksProgress(exam: Exam, classId: string, subjectId: string): { entered: number; total: number; pct: number } {
  const classConfig = exam.classConfigs.find((c) => c.classId === classId)
  if (!classConfig) return { entered: 0, total: 0, pct: 0 }
  const subject = classConfig.marks.find((m) => m.subjectId === subjectId)
  if (!subject) return { entered: 0, total: 0, pct: 0 }
  const total = subject.marks.length
  const entered = subject.marks.filter((m) => m.marksObtained !== null || m.isAbsent).length
  return { entered, total, pct: total > 0 ? Math.round((entered / total) * 100) : 0 }
}

/** Get overall marks progress for an exam */
export function getExamMarksProgress(exam: Exam): { entered: number; total: number; pct: number } {
  let entered = 0
  let total = 0
  for (const cc of exam.classConfigs) {
    for (const sm of cc.marks) {
      total += sm.marks.length
      entered += sm.marks.filter((m) => m.marksObtained !== null || m.isAbsent).length
    }
  }
  return { entered, total, pct: total > 0 ? Math.round((entered / total) * 100) : 0 }
}

// ──────────────────────────────────────────────────────────────────────
// SEED DATA — internally consistent
// ──────────────────────────────────────────────────────────────────────

export const DEFAULT_SUBJECTS_2A: ExamSubject[] = [
  { id: 'sub-eng', name: 'English', maxMarks: 50, passingMarks: 17, theoryMarks: 50, practicalMarks: 0 },
  { id: 'sub-mat', name: 'Mathematics', maxMarks: 50, passingMarks: 17, theoryMarks: 50, practicalMarks: 0 },
  { id: 'sub-sci', name: 'Science', maxMarks: 50, passingMarks: 17, theoryMarks: 40, practicalMarks: 10 },
  { id: 'sub-soc', name: 'Social Studies', maxMarks: 50, passingMarks: 17, theoryMarks: 50, practicalMarks: 0 },
  { id: 'sub-hin', name: 'Hindi', maxMarks: 50, passingMarks: 17, theoryMarks: 50, practicalMarks: 0 },
  { id: 'sub-csc', name: 'Computer Science', maxMarks: 50, passingMarks: 17, theoryMarks: 30, practicalMarks: 20 },
]

function buildMarksForClass2A(subjectId: string, maxMarks: number, seed: number): StudentMark[] {
  return class2AAttendance.map((s, i) => {
    // Deterministic per student+subject
    const r = ((seed + i * 7 + subjectId.charCodeAt(0) * 3) % 100) / 100
    if (r < 0.03) {
      // 3% absent
      return { studentId: s.rollNo, studentName: s.name, rollNo: s.rollNo, marksObtained: null, isAbsent: true }
    }
    // 85-100% of max marks
    const pct = 0.65 + (r - 0.03) * 0.35
    const marks = Math.round(maxMarks * pct)
    return { studentId: s.rollNo, studentName: s.name, rollNo: s.rollNo, marksObtained: marks, isAbsent: false }
  })
}

function buildClassConfig2A(): ExamClassConfig {
  return {
    classId: 'class-2-a',
    className: 'Class 2-A',
    subjects: DEFAULT_SUBJECTS_2A,
    marks: DEFAULT_SUBJECTS_2A.map((sub, idx) => ({
      subjectId: sub.id,
      subjectName: sub.name,
      maxMarks: sub.maxMarks,
      marks: buildMarksForClass2A(sub.id, sub.maxMarks, idx * 13 + 7),
    })),
  }
}

function buildSchedule2A(examId: string, startDate: string): ScheduleEntry[] {
  const subjects = DEFAULT_SUBJECTS_2A
  return subjects.map((sub, idx) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + idx)
    return {
      subjectId: sub.id,
      subjectName: sub.name,
      className: 'Class 2-A',
      date: date.toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      room: idx % 2 === 0 ? 'Room 102' : 'Room 103',
      invigilator: idx % 2 === 0 ? 'Rohan Mehta' : 'Priya Nair',
    }
  })
}

// ──────────────────────────────────────────────────────────────────────
// SEED EXAMS
// ──────────────────────────────────────────────────────────────────────

export const EXAMS: Exam[] = [
  {
    id: 'EX01',
    name: 'Unit Test 1',
    type: 'Unit Test',
    session: '2025–2026',
    startDate: '2025-07-08',
    endDate: '2025-07-12',
    classes: ['Class 2-A'],
    status: 'Completed',
    resultStatus: 'Result Declared',
    classConfigs: [buildClassConfig2A()],
    schedule: buildSchedule2A('EX01', '2025-07-08'),
    createdAt: '2025-06-15T10:00:00Z',
  },
  {
    id: 'EX02',
    name: 'Unit Test 2',
    type: 'Unit Test',
    session: '2025–2026',
    startDate: '2025-09-08',
    endDate: '2025-09-12',
    classes: ['Class 2-A'],
    status: 'Completed',
    resultStatus: 'Result Declared',
    classConfigs: [buildClassConfig2A()],
    schedule: buildSchedule2A('EX02', '2025-09-08'),
    createdAt: '2025-08-20T10:00:00Z',
  },
  {
    id: 'EX03',
    name: 'Unit Test 3',
    type: 'Unit Test',
    session: '2025–2026',
    startDate: '2025-11-18',
    endDate: '2025-11-22',
    classes: ['Class 2-A'],
    status: 'Completed',
    resultStatus: 'Result Declared',
    classConfigs: [buildClassConfig2A()],
    schedule: buildSchedule2A('EX03', '2025-11-18'),
    createdAt: '2025-10-25T10:00:00Z',
  },
  {
    id: 'EX04',
    name: 'Term 1 Examination',
    type: 'Term Examination',
    session: '2025–2026',
    startDate: '2025-09-15',
    endDate: '2025-09-26',
    classes: ['Class 2-A'],
    status: 'Completed',
    resultStatus: 'Under Verification',
    classConfigs: [buildClassConfig2A()],
    schedule: buildSchedule2A('EX04', '2025-09-15'),
    createdAt: '2025-08-25T10:00:00Z',
  },
  {
    id: 'EX05',
    name: 'Unit Test 4',
    type: 'Unit Test',
    session: '2025–2026',
    startDate: '2025-12-15',
    endDate: '2025-12-19',
    classes: ['Class 2-A'],
    status: 'Scheduled',
    resultStatus: 'Not Started',
    classConfigs: [{
      classId: 'class-2-a',
      className: 'Class 2-A',
      subjects: DEFAULT_SUBJECTS_2A,
      marks: DEFAULT_SUBJECTS_2A.map((sub) => ({
        subjectId: sub.id,
        subjectName: sub.name,
        maxMarks: sub.maxMarks,
        marks: class2AAttendance.map((s) => ({
          studentId: s.rollNo,
          studentName: s.name,
          rollNo: s.rollNo,
          marksObtained: null,
          isAbsent: false,
        })),
      })),
    }],
    schedule: buildSchedule2A('EX05', '2025-12-15'),
    createdAt: '2025-11-20T10:00:00Z',
  },
  {
    id: 'EX06',
    name: 'Term 2 Examination',
    type: 'Term Examination',
    session: '2025–2026',
    startDate: '2026-02-20',
    endDate: '2026-03-05',
    classes: ['Class 2-A'],
    status: 'Scheduled',
    resultStatus: 'Not Started',
    classConfigs: [{
      classId: 'class-2-a',
      className: 'Class 2-A',
      subjects: DEFAULT_SUBJECTS_2A,
      marks: DEFAULT_SUBJECTS_2A.map((sub) => ({
        subjectId: sub.id,
        subjectName: sub.name,
        maxMarks: sub.maxMarks,
        marks: class2AAttendance.map((s) => ({
          studentId: s.rollNo,
          studentName: s.name,
          rollNo: s.rollNo,
          marksObtained: null,
          isAbsent: false,
        })),
      })),
    }],
    schedule: buildSchedule2A('EX06', '2026-02-20'),
    createdAt: '2025-12-01T10:00:00Z',
  },
]

// ──────────────────────────────────────────────────────────────────────
// DERIVED ANALYTICS — computed from actual exam data
// ──────────────────────────────────────────────────────────────────────

export function getExamAnalytics(examId: string) {
  const exam = EXAMS.find((e) => e.id === examId)
  if (!exam) return null

  const classConfig = exam.classConfigs[0]
  if (!classConfig) return null

  const results = class2AAttendance.map((student) => {
    return calculateResult(exam, classConfig.classId, student.rollNo)
  }).filter(Boolean)

  if (results.length === 0) return null

  const passed = results.filter((r) => r!.passed).length
  const passRate = results.length > 0 ? (passed / results.length) * 100 : 0

  // Grade distribution
  const gradeDist: Record<string, number> = {}
  results.forEach((r) => {
    const grade = r!.grade
    gradeDist[grade] = (gradeDist[grade] || 0) + 1
  })

  // Subject performance
  const subjectPerf: { subject: string; avg: number }[] = []
  for (const sm of classConfig.marks) {
    const enteredMarks = sm.marks.filter((m) => m.marksObtained !== null && !m.isAbsent)
    if (enteredMarks.length === 0) continue
    const avg = enteredMarks.reduce((s, m) => s + (m.marksObtained || 0), 0) / enteredMarks.length
    const pct = (avg / sm.maxMarks) * 100
    subjectPerf.push({ subject: sm.subjectName, avg: Math.round(pct * 10) / 10 })
  }

  // Class toppers
  const toppers = [...results]
    .sort((a, b) => b!.percentage - a!.percentage)
    .slice(0, 5)
    .map((r, i) => ({
      rank: i + 1,
      studentId: class2AAttendance[i].rollNo,
      name: class2AAttendance[i].name,
      rollNo: class2AAttendance[i].rollNo,
      percentage: r!.percentage,
      total: r!.totalObtained,
      maxTotal: r!.totalMax,
      grade: r!.grade,
    }))

  return {
    totalStudents: results.length,
    passed,
    passRate: Math.round(passRate * 10) / 10,
    gradeDistribution: gradeDist,
    subjectPerformance: subjectPerf,
    toppers,
    averagePercentage: Math.round((results.reduce((s, r) => s + r!.percentage, 0) / results.length) * 10) / 10,
  }
}

// ──────────────────────────────────────────────────────────────────────
// FILTER TABS
// ──────────────────────────────────────────────────────────────────────

export type ExamFilter = 'all' | 'scheduled' | 'ongoing' | 'completed' | 'results'

export function filterExams(exams: Exam[], filter: ExamFilter): Exam[] {
  switch (filter) {
    case 'scheduled': return exams.filter((e) => e.status === 'Scheduled')
    case 'ongoing': return exams.filter((e) => e.status === 'Ongoing')
    case 'completed': return exams.filter((e) => e.status === 'Completed')
    case 'results': return exams.filter((e) => e.resultStatus === 'Result Declared')
    default: return exams
  }
}

// ──────────────────────────────────────────────────────────────────────
// STATUS HELPERS
// ──────────────────────────────────────────────────────────────────────

export const EXAM_STATUS_STYLES: Record<ExamStatus, string> = {
  'Draft': 'bg-muted text-muted-foreground border-border',
  'Scheduled': 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
  'Ongoing': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  'Completed': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  'Cancelled': 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
}

export const RESULT_STATUS_STYLES: Record<ResultStatus, string> = {
  'Not Started': 'bg-muted/60 text-muted-foreground border-border',
  'Marks Entry': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  'Under Verification': 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
  'Result Ready': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
  'Result Declared': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
}

export const EXAM_TYPE_STYLES: Record<ExamType, string> = {
  'Unit Test': 'bg-primary/10 text-primary border-primary/20',
  'Term Examination': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
  'Half-Yearly': 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
  'Annual': 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  'Pre-Board': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  'Practical': 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20',
  'Periodic Assessment': 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
}
