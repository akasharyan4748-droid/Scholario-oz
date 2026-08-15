// ──────────────────────────────────────────────────────────────────────
// Smart template engine — generates exam config + schedule from
// template + dates + real school data.
//
// KEY PRINCIPLES:
//   • One schedule slot per SUBJECT (not per class). Multiple selected
//     classes share the same slot.
//   • Sunday is always skipped (day index 0).
//   • Unit Test: 2 papers/day, 1hr each, 15min gap (09:00-10:00, 10:15-11:15)
//   • Half-Yearly/Annual: 1 paper/day, 3h15m (09:00-12:15)
//   • Pass percentage is FIXED at 33% globally — not configurable per exam.
//   • Date range validation surfaces required vs available working days.
// ──────────────────────────────────────────────────────────────────────

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
  stream: string | null
  studentCount: number
  subjects: SubjectInfo[]
}

export interface GeneratedScheduleItem {
  subjectId: string
  subjectName: string
  date: string
  startTime: string
  endTime: string
  room: string
  invigilatorName: string
  classIds: string[] // multiple classes share one slot
}

export interface GeneratedSubjectConfig {
  subjectId: string
  maxMarks: number
  theoryMarks: number
  practicalMarks: number
}

export interface TemplateMeta {
  maxMarks: number
  theoryMarks: number
  practicalMarks: number
  papersPerDay: number
  paperDurationMin: number
  gapMin: number
  hasPractical: boolean
}

export interface GeneratedExamConfig {
  name: string
  type: string
  startDate: string
  endDate: string
  passPercentage: number
  selectedClassIds: string[]
  subjects: GeneratedSubjectConfig[]
  schedule: GeneratedScheduleItem[]
  hasPractical: boolean
}

export const TEMPLATE_METAS: Record<string, TemplateMeta> = {
  'unit-test-1': { maxMarks: 50, theoryMarks: 50, practicalMarks: 0, papersPerDay: 2, paperDurationMin: 60, gapMin: 15, hasPractical: false },
  'unit-test-2': { maxMarks: 50, theoryMarks: 50, practicalMarks: 0, papersPerDay: 2, paperDurationMin: 60, gapMin: 15, hasPractical: false },
  'unit-test-3': { maxMarks: 50, theoryMarks: 50, practicalMarks: 0, papersPerDay: 2, paperDurationMin: 60, gapMin: 15, hasPractical: false },
  'unit-test-4': { maxMarks: 50, theoryMarks: 50, practicalMarks: 0, papersPerDay: 2, paperDurationMin: 60, gapMin: 15, hasPractical: false },
  'half-yearly': { maxMarks: 100, theoryMarks: 70, practicalMarks: 30, papersPerDay: 1, paperDurationMin: 195, gapMin: 0, hasPractical: true },
  'annual': { maxMarks: 100, theoryMarks: 70, practicalMarks: 30, papersPerDay: 1, paperDurationMin: 195, gapMin: 0, hasPractical: true },
  'custom': { maxMarks: 100, theoryMarks: 100, practicalMarks: 0, papersPerDay: 1, paperDurationMin: 180, gapMin: 0, hasPractical: false },
}

export function getTemplateMeta(templateId: string): TemplateMeta {
  return TEMPLATE_METAS[templateId] ?? TEMPLATE_METAS['custom']
}

// ─── Generate exam config ────────────────────────────────────────────

export function generateExamConfig(
  templateId: string,
  templateLabel: string,
  startDate: string,
  endDate: string,
  classes: ClassInfo[],
  subjects: SubjectInfo[],
  examTime: string = '09:00',
): GeneratedExamConfig {
  const meta = getTemplateMeta(templateId)
  const hasPractical = meta.practicalMarks > 0
  const selectedClassIds = classes.map((c) => c.id)

  const subjectConfigs: GeneratedSubjectConfig[] = subjects.map((s) => ({
    subjectId: s.id,
    maxMarks: meta.maxMarks,
    theoryMarks: meta.theoryMarks,
    practicalMarks: meta.practicalMarks,
  }))

  const schedule = generateSchedule(templateId, startDate, endDate, subjects, classes, meta, examTime)

  return {
    name: templateLabel,
    type: templateLabel,
    startDate,
    endDate: endDate || startDate,
    passPercentage: FIXED_PASS_PERCENTAGE,
    selectedClassIds,
    subjects: subjectConfigs,
    schedule,
    hasPractical,
  }
}

// ─── Smart scheduling engine ────────────────────────────────────────
// One slot per subject. All selected classes share that slot.
// Sunday is always skipped.

function generateSchedule(
  templateId: string,
  startDateStr: string,
  endDateStr: string,
  subjects: SubjectInfo[],
  classes: ClassInfo[],
  meta: TemplateMeta,
  examTime: string = '09:00',
): GeneratedScheduleItem[] {
  const start = new Date(startDateStr)
  const end = new Date(endDateStr || startDateStr)

  // Collect working days (skip Sunday = 0)
  const workingDays: Date[] = []
  const current = new Date(start)
  current.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  while (current <= end) {
    if (current.getDay() !== 0) workingDays.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  // If no working days (e.g. range is entirely Sundays), fall back to start date
  if (workingDays.length === 0) workingDays.push(new Date(start))

  const allClassIds = classes.map((c) => c.id)
  const items: GeneratedScheduleItem[] = []

  let dayIdx = 0
  let papersToday = 0
  const startTimeBase = examTime || '09:00'

  for (const subject of subjects) {
    const date = workingDays[dayIdx % workingDays.length]
    const dateStr = date.toISOString().split('T')[0]

    if (meta.papersPerDay === 2) {
      // Unit Test: 2 papers/day, 1hr each, 15min gap
      const shift = papersToday // 0 = first, 1 = second
      const startTime = shift === 0 ? startTimeBase : addTime(startTimeBase, meta.paperDurationMin + meta.gapMin)
      const endTime = addTime(startTime, meta.paperDurationMin)

      items.push({
        subjectId: subject.id,
        subjectName: subject.name,
        date: dateStr,
        startTime,
        endTime,
        room: '',
        invigilatorName: '',
        classIds: [...allClassIds], // ALL classes share this slot
      })

      papersToday++
      if (papersToday >= meta.papersPerDay) {
        papersToday = 0
        dayIdx++
      }
    } else {
      // Half-Yearly/Annual: 1 paper/day, 3h15m
      const endTime = addTime(startTimeBase, meta.paperDurationMin)
      items.push({
        subjectId: subject.id,
        subjectName: subject.name,
        date: dateStr,
        startTime: startTimeBase,
        endTime,
        room: '',
        invigilatorName: '',
        classIds: [...allClassIds],
      })
      dayIdx++
    }
  }

  return items
}

// ─── Validate date range ────────────────────────────────────────────

export interface ScheduleValidation {
  isValid: boolean
  requiredDays: number
  availableDays: number
  message: string
}

export function validateDateRange(
  templateId: string,
  startDateStr: string,
  endDateStr: string,
  subjectCount: number,
): ScheduleValidation {
  const meta = getTemplateMeta(templateId)
  const start = new Date(startDateStr)
  const end = new Date(endDateStr || startDateStr)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  // Count working days (skip Sunday)
  let availableDays = 0
  const current = new Date(start)
  while (current <= end) {
    if (current.getDay() !== 0) availableDays++
    current.setDate(current.getDate() + 1)
  }

  // Required days = ceil(subjects / papersPerDay)
  const requiredDays = Math.ceil(subjectCount / meta.papersPerDay)

  if (availableDays === 0) {
    return {
      isValid: false,
      requiredDays,
      availableDays,
      message: `Selected date range contains no working days (all Sundays?). Choose a different date range.`,
    }
  }

  if (availableDays < requiredDays) {
    return {
      isValid: false,
      requiredDays,
      availableDays,
      message: `Selected date range is not sufficient for all papers. ${subjectCount} subjects require ${requiredDays} working days (max ${meta.papersPerDay} papers/day, Sundays skipped), but only ${availableDays} working days are available.`,
    }
  }

  return { isValid: true, requiredDays, availableDays, message: '' }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function addTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const hrs = Math.floor(total / 60)
  const mins = total % 60
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}
