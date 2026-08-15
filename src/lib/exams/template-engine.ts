// ──────────────────────────────────────────────────────────────────────
// Smart template engine — generates complete exam configuration from
// a template + dates + real school data.
// Fixed 33% passing rule — no UI field for passing percentage.
// ──────────────────────────────────────────────────────────────────────

import type { ExamTemplate } from '@/components/principal/modules/exams/tabs/exam-templates'

export const FIXED_PASS_PERCENTAGE = 33

export interface SubjectInfo {
  id: string
  name: string
  code: string | null
}

export interface ClassInfo {
  id: string
  name: string
  gradeLevel: string | null
  studentCount: number
  subjects: SubjectInfo[]
}

export interface GeneratedScheduleItem {
  classId: string
  subjectId: string
  date: string
  startTime: string
  endTime: string
  room: string
  invigilatorName: string
  shift: number // 1 = morning, 2 = afternoon
}

export interface GeneratedSubjectConfig {
  subjectId: string
  maxMarks: number
  passMarks: number
  theoryMarks: number
  practicalMarks: number
}

export interface GeneratedExamConfig {
  name: string
  type: string
  templateId: string
  startDate: string
  endDate: string
  passPercentage: number
  gradingType: string
  allowLateSubmission: boolean
  allowResubmission: boolean
  selectedClassIds: string[]
  subjectsByClass: Record<string, GeneratedSubjectConfig[]>
  schedule: GeneratedScheduleItem[]
  hasPractical: boolean
  summary: {
    totalPapers: number
    totalStudents: number
    totalClasses: number
    totalSubjects: number
    marksPerSubject: number
  }
}

// ─── Generate exam config from template + dates + real school data ──

export function generateExamConfig(
  template: ExamTemplate,
  startDate: string,
  endDate: string,
  classes: ClassInfo[],
): GeneratedExamConfig {
  const meta = template.metadata
  const selectedClassIds = classes.map((c) => c.id)
  const hasPractical = (meta.practicalMarks ?? 0) > 0

  // Generate subjects per class
  const subjectsByClass: Record<string, GeneratedSubjectConfig[]> = {}
  for (const cls of classes) {
    subjectsByClass[cls.id] = cls.subjects.map((s) => ({
      subjectId: s.id,
      maxMarks: meta.maxMarks,
      passMarks: Math.round(meta.maxMarks * FIXED_PASS_PERCENTAGE / 100),
      theoryMarks: meta.theoryMarks ?? meta.maxMarks,
      practicalMarks: meta.practicalMarks ?? 0,
    }))
  }

  // Generate schedule
  const schedule = generateSchedule(template, startDate, endDate, classes)

  const totalSubjects = Object.values(subjectsByClass).reduce((s, subs) => s + subs.length, 0)
  const totalStudents = classes.reduce((s, c) => s + c.studentCount, 0)

  return {
    name: template.label,
    type: template.name,
    templateId: template.id,
    startDate,
    endDate: endDate || startDate,
    passPercentage: FIXED_PASS_PERCENTAGE,
    gradingType: 'marks',
    allowLateSubmission: template.category === 'unit-test',
    allowResubmission: template.category === 'unit-test',
    selectedClassIds,
    subjectsByClass,
    schedule,
    hasPractical,
    summary: {
      totalPapers: schedule.length,
      totalStudents,
      totalClasses: classes.length,
      totalSubjects,
      marksPerSubject: meta.maxMarks,
    },
  }
}

// ─── Smart scheduling engine ────────────────────────────────────────

function generateSchedule(
  template: ExamTemplate,
  startDateStr: string,
  endDateStr: string,
  classes: ClassInfo[],
): GeneratedScheduleItem[] {
  const meta = template.metadata
  const start = new Date(startDateStr)
  const end = new Date(endDateStr || startDateStr)

  // Collect working days (skip Sunday=0)
  const days: Date[] = []
  const current = new Date(start)
  while (current <= end) {
    if (current.getDay() !== 0) days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  if (days.length === 0) days.push(new Date(start))

  const items: GeneratedScheduleItem[] = []
  const startTimeBase = '09:00'

  for (const cls of classes) {
    let dayIdx = 0
    let papersToday = 0

    for (let i = 0; i < cls.subjects.length; i++) {
      const subject = cls.subjects[i]
      const date = days[dayIdx % days.length]
      const dateStr = date.toISOString().split('T')[0]

      if (meta.papersPerDay === 2) {
        // Unit Test: 2 papers/day, 1hr each, 15min gap
        const shift = papersToday === 0 ? 1 : 2
        const startTime = shift === 1 ? '09:00' : '10:15'
        const endTime = shift === 1 ? '10:00' : '11:15'

        items.push({
          classId: cls.id, subjectId: subject.id, date: dateStr,
          startTime, endTime, room: '', invigilatorName: '', shift,
        })

        papersToday++
        if (papersToday >= meta.papersPerDay) {
          papersToday = 0
          dayIdx++
        }
      } else {
        // Half-Yearly/Annual: 1 paper/day, 3h15m
        const endTime = addMinutes(startTimeBase, meta.paperDurationMin)
        items.push({
          classId: cls.id, subjectId: subject.id, date: dateStr,
          startTime: startTimeBase, endTime, room: '', invigilatorName: '', shift: 1,
        })
        dayIdx++
      }
    }
  }

  return items
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const hrs = Math.floor(total / 60)
  const mins = total % 60
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

// ─── Validate schedule ──────────────────────────────────────────────

export interface ScheduleWarning {
  type: 'insufficient_dates' | 'duplicate_subject' | 'overlap'
  message: string
  affectedItems?: string[]
}

export function validateSchedule(
  config: GeneratedExamConfig,
  template: ExamTemplate,
): ScheduleWarning[] {
  const warnings: ScheduleWarning[] = []
  const meta = template.metadata

  // Check if enough dates for one-paper-per-day
  if (meta.papersPerDay === 1) {
    for (const cls of config.selectedClassIds) {
      const classSubjects = config.subjectsByClass[cls] ?? []
      const classSchedule = config.schedule.filter((s) => s.classId === cls)
      const uniqueDates = new Set(classSchedule.map((s) => s.date))
      const requiredDays = classSubjects.length

      if (uniqueDates.size < requiredDays) {
        warnings.push({
          type: 'insufficient_dates',
          message: `Selected date range is insufficient. ${classSubjects.length} subjects require ${requiredDays} examination days (1 paper/day), but only ${uniqueDates.size} days are available.`,
        })
        break
      }
    }
  }

  // Check for duplicate subject on same day (for one-paper-per-day)
  if (meta.papersPerDay === 1) {
    const seen = new Map<string, string>()
    for (const item of config.schedule) {
      const key = `${item.classId}-${item.date}`
      if (seen.has(key)) {
        warnings.push({
          type: 'duplicate_subject',
          message: 'Two papers scheduled on the same day for a one-paper-per-day examination.',
        })
        break
      }
      seen.set(key, item.subjectId)
    }
  }

  // Check for more than allowed papers per day
  const dayMap = new Map<string, number>()
  for (const item of config.schedule) {
    const key = `${item.classId}-${item.date}`
    dayMap.set(key, (dayMap.get(key) ?? 0) + 1)
  }
  for (const [key, count] of dayMap) {
    if (count > meta.papersPerDay) {
      warnings.push({
        type: 'overlap',
        message: `${count} papers on the same day. Maximum allowed: ${meta.papersPerDay}.`,
      })
      break
    }
  }

  return warnings
}
