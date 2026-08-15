// ──────────────────────────────────────────────────────────────────────
// Smart template engine — generates complete exam configuration from
// a template + dates + real school data (classes, subjects, rules).
// Pure functions — no React, no side effects.
// ──────────────────────────────────────────────────────────────────────

export type SubjectDifficulty = 'high' | 'normal' | 'light'

export interface TemplateScheduleConfig {
  shiftPolicy: 'single' | 'double'
  morningStart: string
  morningEnd: string
  afternoonStart: string
  afternoonEnd: string
  defaultDurationMin: number
}

export interface TemplateMarksConfig {
  defaultMaxMarks: number
  defaultPassMarks: number
  theoryMarks: number
  practicalMarks: number
  oralMarks: number
  passPercentage: number
  gradingType: string
}

export interface TemplateConfig {
  scheduling: TemplateScheduleConfig
  marks: TemplateMarksConfig
  allowLateSubmission: boolean
  allowResubmission: boolean
  multiDay: boolean
  boardOnly: boolean
}

export interface SubjectInfo {
  id: string
  name: string
  code: string | null
  difficulty: SubjectDifficulty
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
  shift: 'morning' | 'afternoon'
}

export interface GeneratedExamConfig {
  name: string
  type: string
  startDate: string
  endDate: string
  passPercentage: number
  gradingType: string
  allowLateSubmission: boolean
  allowResubmission: boolean
  selectedClassIds: string[]
  subjectsByClass: Record<string, Array<{
    subjectId: string
    maxMarks: number
    passMarks: number
    theoryMarks: number
    practicalMarks: number
  }>>
  schedule: GeneratedScheduleItem[]
  marksSummary: {
    totalPapers: number
    totalStudents: number
    totalMarksPerSubject: number
  }
}

// ─── Subject difficulty heuristic ────────────────────────────────────

const HIGH_DIFFICULTY_SUBJECTS = ['mathematics', 'physics', 'chemistry', 'biology', 'science']
const LIGHT_DIFFICULTY_SUBJECTS = ['art', 'music', 'physical education', 'sports', 'drawing']

export function inferSubjectDifficulty(subjectName: string): SubjectDifficulty {
  const name = subjectName.toLowerCase()
  if (HIGH_DIFFICULTY_SUBJECTS.some((s) => name.includes(s))) return 'high'
  if (LIGHT_DIFFICULTY_SUBJECTS.some((s) => name.includes(s))) return 'light'
  return 'normal'
}

// ─── Template configs ────────────────────────────────────────────────

export const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  'unit-test': {
    scheduling: {
      shiftPolicy: 'double',
      morningStart: '09:00',
      morningEnd: '10:00',
      afternoonStart: '13:00',
      afternoonEnd: '14:00',
      defaultDurationMin: 60,
    },
    marks: {
      defaultMaxMarks: 50,
      defaultPassMarks: 17,
      theoryMarks: 50,
      practicalMarks: 0,
      oralMarks: 0,
      passPercentage: 33,
      gradingType: 'marks',
    },
    allowLateSubmission: true,
    allowResubmission: true,
    multiDay: true,
    boardOnly: false,
  },
  'periodic-assessment': {
    scheduling: {
      shiftPolicy: 'single',
      morningStart: '09:00',
      morningEnd: '10:30',
      afternoonStart: '13:00',
      afternoonEnd: '14:30',
      defaultDurationMin: 90,
    },
    marks: {
      defaultMaxMarks: 50,
      defaultPassMarks: 17,
      theoryMarks: 50,
      practicalMarks: 0,
      oralMarks: 0,
      passPercentage: 33,
      gradingType: 'marks',
    },
    allowLateSubmission: true,
    allowResubmission: false,
    multiDay: false,
    boardOnly: false,
  },
  'half-yearly': {
    scheduling: {
      shiftPolicy: 'single',
      morningStart: '09:00',
      morningEnd: '12:00',
      afternoonStart: '13:00',
      afternoonEnd: '16:00',
      defaultDurationMin: 180,
    },
    marks: {
      defaultMaxMarks: 100,
      defaultPassMarks: 33,
      theoryMarks: 80,
      practicalMarks: 20,
      oralMarks: 0,
      passPercentage: 33,
      gradingType: 'marks',
    },
    allowLateSubmission: false,
    allowResubmission: false,
    multiDay: true,
    boardOnly: false,
  },
  'annual': {
    scheduling: {
      shiftPolicy: 'single',
      morningStart: '09:00',
      morningEnd: '12:00',
      afternoonStart: '13:00',
      afternoonEnd: '16:00',
      defaultDurationMin: 180,
    },
    marks: {
      defaultMaxMarks: 100,
      defaultPassMarks: 33,
      theoryMarks: 80,
      practicalMarks: 20,
      oralMarks: 0,
      passPercentage: 33,
      gradingType: 'marks',
    },
    allowLateSubmission: false,
    allowResubmission: false,
    multiDay: true,
    boardOnly: false,
  },
  'practical': {
    scheduling: {
      shiftPolicy: 'single',
      morningStart: '09:00',
      morningEnd: '11:00',
      afternoonStart: '13:00',
      afternoonEnd: '15:00',
      defaultDurationMin: 120,
    },
    marks: {
      defaultMaxMarks: 50,
      defaultPassMarks: 20,
      theoryMarks: 0,
      practicalMarks: 50,
      oralMarks: 0,
      passPercentage: 40,
      gradingType: 'marks',
    },
    allowLateSubmission: false,
    allowResubmission: false,
    multiDay: false,
    boardOnly: true,
  },
  'pre-board': {
    scheduling: {
      shiftPolicy: 'single',
      morningStart: '09:00',
      morningEnd: '12:00',
      afternoonStart: '13:00',
      afternoonEnd: '16:00',
      defaultDurationMin: 180,
    },
    marks: {
      defaultMaxMarks: 100,
      defaultPassMarks: 33,
      theoryMarks: 100,
      practicalMarks: 0,
      oralMarks: 0,
      passPercentage: 33,
      gradingType: 'marks',
    },
    allowLateSubmission: false,
    allowResubmission: false,
    multiDay: true,
    boardOnly: true,
  },
  'oral-viva': {
    scheduling: {
      shiftPolicy: 'single',
      morningStart: '09:00',
      morningEnd: '10:00',
      afternoonStart: '13:00',
      afternoonEnd: '14:00',
      defaultDurationMin: 60,
    },
    marks: {
      defaultMaxMarks: 20,
      defaultPassMarks: 8,
      theoryMarks: 0,
      practicalMarks: 0,
      oralMarks: 20,
      passPercentage: 40,
      gradingType: 'marks',
    },
    allowLateSubmission: false,
    allowResubmission: false,
    multiDay: false,
    boardOnly: false,
  },
  'custom': {
    scheduling: {
      shiftPolicy: 'single',
      morningStart: '09:00',
      morningEnd: '12:00',
      afternoonStart: '13:00',
      afternoonEnd: '16:00',
      defaultDurationMin: 180,
    },
    marks: {
      defaultMaxMarks: 100,
      defaultPassMarks: 33,
      theoryMarks: 100,
      practicalMarks: 0,
      oralMarks: 0,
      passPercentage: 33,
      gradingType: 'marks',
    },
    allowLateSubmission: true,
    allowResubmission: true,
    multiDay: false,
    boardOnly: false,
  },
}

// ─── Generate exam config from template + dates + real school data ──

export function generateExamConfig(
  templateId: string,
  templateName: string,
  startDate: string,
  endDate: string,
  classes: ClassInfo[],
  schoolRules: Record<string, string> = {},
): GeneratedExamConfig {
  const config = TEMPLATE_CONFIGS[templateId] ?? TEMPLATE_CONFIGS['custom']

  // Filter classes based on boardOnly
  let eligibleClasses = classes
  if (config.boardOnly) {
    eligibleClasses = classes.filter((c) => ['10', '12'].includes(c.gradeLevel ?? ''))
  }
  const selectedClassIds = eligibleClasses.map((c) => c.id)

  // Generate subjects per class
  const subjectsByClass: GeneratedExamConfig['subjectsByClass'] = {}
  for (const cls of eligibleClasses) {
    subjectsByClass[cls.id] = cls.subjects.map((s) => ({
      subjectId: s.id,
      maxMarks: config.marks.defaultMaxMarks,
      passMarks: config.marks.defaultPassMarks,
      theoryMarks: config.marks.theoryMarks,
      practicalMarks: config.marks.practicalMarks,
    }))
  }

  // Generate schedule
  const schedule = generateSchedule(templateId, startDate, endDate, eligibleClasses, config)

  // Summary
  const totalPapers = schedule.length
  const totalStudents = eligibleClasses.reduce((s, c) => s + c.studentCount, 0)

  return {
    name: templateName,
    type: getTemplateName(templateId),
    startDate,
    endDate: endDate || startDate,
    passPercentage: config.marks.passPercentage,
    gradingType: config.marks.gradingType,
    allowLateSubmission: config.allowLateSubmission,
    allowResubmission: config.allowResubmission,
    selectedClassIds,
    subjectsByClass,
    schedule,
    marksSummary: {
      totalPapers,
      totalStudents,
      totalMarksPerSubject: config.marks.defaultMaxMarks,
    },
  }
}

// ─── Smart scheduling engine ────────────────────────────────────────

function generateSchedule(
  templateId: string,
  startDateStr: string,
  endDateStr: string,
  classes: ClassInfo[],
  config: TemplateConfig,
): GeneratedScheduleItem[] {
  const items: GeneratedScheduleItem[] = []
  const start = new Date(startDateStr)
  const end = new Date(endDateStr || startDateStr)
  const days: Date[] = []
  const current = new Date(start)
  while (current <= end) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) { // Skip Sundays (0) and Saturdays (6)
      days.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }
  if (days.length === 0) days.push(new Date(start))

  let dayIdx = 0
  let morningSlot = true

  for (const cls of classes) {
    // Sort subjects by difficulty: high first (morning slots), light last
    const sortedSubjects = [...cls.subjects].sort((a, b) => {
      const order = { high: 0, normal: 1, light: 2 }
      return order[a.difficulty] - order[b.difficulty]
    })

    for (const subject of sortedSubjects) {
      const date = days[dayIdx % days.length]
      const dateStr = date.toISOString().split('T')[0]

      if (config.scheduling.shiftPolicy === 'double') {
        // Alternate morning/afternoon — avoid pairing two high-difficulty subjects
        const shift = morningSlot ? 'morning' : 'afternoon'
        const startTime = shift === 'morning' ? config.scheduling.morningStart : config.scheduling.afternoonStart
        const endTime = shift === 'morning' ? config.scheduling.morningEnd : config.scheduling.afternoonEnd

        items.push({
          classId: cls.id,
          subjectId: subject.id,
          date: dateStr,
          startTime,
          endTime,
          room: `Room ${100 + (dayIdx % 5)}`,
          invigilatorName: '',
          shift,
        })

        morningSlot = !morningSlot
        if (morningSlot) dayIdx++ // Next day after afternoon
      } else {
        // Single shift — one subject per day
        items.push({
          classId: cls.id,
          subjectId: subject.id,
          date: dateStr,
          startTime: config.scheduling.morningStart,
          endTime: config.scheduling.morningEnd,
          room: `Room ${100 + (dayIdx % 5)}`,
          invigilatorName: '',
          shift: 'morning',
        })
        dayIdx++
      }
    }
  }

  return items
}

function getTemplateName(templateId: string): string {
  const names: Record<string, string> = {
    'unit-test': 'Unit Test',
    'periodic-assessment': 'Periodic Assessment',
    'half-yearly': 'Half-Yearly',
    'annual': 'Annual Examination',
    'practical': 'Practical',
    'pre-board': 'Pre-Board',
    'oral-viva': 'Viva / Oral',
    'custom': 'Custom',
  }
  return names[templateId] ?? 'Custom'
}

// ─── Get template metadata for display ──────────────────────────────

export function getTemplateMetadata(templateId: string): Array<{ label: string; value: string }> {
  const config = TEMPLATE_CONFIGS[templateId]
  if (!config) return []

  const meta: Array<{ label: string; value: string }> = []
  meta.push({ label: 'Marks', value: String(config.marks.defaultMaxMarks) })

  if (config.scheduling.shiftPolicy === 'double') {
    meta.push({ label: 'Shift', value: 'Double shift' })
  } else if (config.multiDay) {
    meta.push({ label: 'Type', value: 'Multi-day' })
  }

  if (config.marks.practicalMarks > 0) {
    meta.push({ label: 'Components', value: `Theory ${config.marks.theoryMarks} + Practical ${config.marks.practicalMarks}` })
  }

  meta.push({ label: 'Schedule', value: 'Auto-generated' })

  return meta
}
