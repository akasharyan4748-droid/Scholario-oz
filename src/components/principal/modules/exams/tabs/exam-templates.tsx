// ──────────────────────────────────────────────────────────────────────
// Examination templates — built-in starting configurations.
// Each template provides sensible defaults for a common exam type.
// The Principal selects one and customizes it.
// ──────────────────────────────────────────────────────────────────────

import { FileText, ClipboardCheck, Calendar, Award, TestTube, GraduationCap, Mic, Settings } from 'lucide-react'
import type { ReactNode } from 'react'

export interface ExamTemplate {
  id: string
  name: string
  label: string
  description: string
  icon: ReactNode
  accent: string // tailwind color base
  category: 'academic' | 'board' | 'other'
  boardOnly?: boolean
  defaults: {
    type: string
    defaultName: string
    passPercentage: number
    gradingType: string
    allowLateSubmission: boolean
    allowResubmission: boolean
    defaultMaxMarks: number
    defaultPassMarks: number
    showPractical: boolean
    showOral: boolean
    multiDay: boolean
  }
}

export const EXAM_TEMPLATES: ExamTemplate[] = [
  {
    id: 'unit-test',
    name: 'Unit Test',
    label: 'Unit Test',
    description: 'Short periodic assessment',
    icon: <FileText className="h-5 w-5" />,
    accent: 'sky',
    category: 'academic',
    defaults: {
      type: 'Unit Test',
      defaultName: 'Unit Test',
      passPercentage: 33,
      gradingType: 'marks',
      allowLateSubmission: true,
      allowResubmission: true,
      defaultMaxMarks: 50,
      defaultPassMarks: 17,
      showPractical: false,
      showOral: false,
      multiDay: false,
    },
  },
  {
    id: 'periodic-assessment',
    name: 'Periodic Assessment',
    label: 'Periodic Assessment',
    description: 'Regular evaluation check',
    icon: <ClipboardCheck className="h-5 w-5" />,
    accent: 'cyan',
    category: 'academic',
    defaults: {
      type: 'Periodic Assessment',
      defaultName: 'Periodic Assessment',
      passPercentage: 33,
      gradingType: 'marks',
      allowLateSubmission: true,
      allowResubmission: false,
      defaultMaxMarks: 50,
      defaultPassMarks: 17,
      showPractical: false,
      showOral: false,
      multiDay: false,
    },
  },
  {
    id: 'half-yearly',
    name: 'Half-Yearly',
    label: 'Half-Yearly Examination',
    description: 'Mid-session comprehensive exam',
    icon: <Calendar className="h-5 w-5" />,
    accent: 'violet',
    category: 'academic',
    defaults: {
      type: 'Half-Yearly',
      defaultName: 'Half-Yearly Examination',
      passPercentage: 33,
      gradingType: 'marks',
      allowLateSubmission: false,
      allowResubmission: false,
      defaultMaxMarks: 100,
      defaultPassMarks: 33,
      showPractical: false,
      showOral: false,
      multiDay: true,
    },
  },
  {
    id: 'annual',
    name: 'Annual',
    label: 'Annual Examination',
    description: 'End-of-session final exam',
    icon: <Award className="h-5 w-5" />,
    accent: 'emerald',
    category: 'academic',
    defaults: {
      type: 'Annual Examination',
      defaultName: 'Annual Examination',
      passPercentage: 33,
      gradingType: 'marks',
      allowLateSubmission: false,
      allowResubmission: false,
      defaultMaxMarks: 100,
      defaultPassMarks: 33,
      showPractical: false,
      showOral: false,
      multiDay: true,
    },
  },
  {
    id: 'practical',
    name: 'Practical',
    label: 'Practical Examination',
    description: 'Laboratory / practical evaluation',
    icon: <TestTube className="h-5 w-5" />,
    accent: 'amber',
    category: 'board',
    boardOnly: true,
    defaults: {
      type: 'Practical',
      defaultName: 'Practical Examination',
      passPercentage: 40,
      gradingType: 'marks',
      allowLateSubmission: false,
      allowResubmission: false,
      defaultMaxMarks: 50,
      defaultPassMarks: 20,
      showPractical: true,
      showOral: false,
      multiDay: false,
    },
  },
  {
    id: 'pre-board',
    name: 'Pre-Board',
    label: 'Pre-Board Examination',
    description: 'Board preparation assessment',
    icon: <GraduationCap className="h-5 w-5" />,
    accent: 'indigo',
    category: 'board',
    boardOnly: true,
    defaults: {
      type: 'Pre-Board',
      defaultName: 'Pre-Board Examination',
      passPercentage: 33,
      gradingType: 'marks',
      allowLateSubmission: false,
      allowResubmission: false,
      defaultMaxMarks: 100,
      defaultPassMarks: 33,
      showPractical: false,
      showOral: false,
      multiDay: true,
    },
  },
  {
    id: 'oral-viva',
    name: 'Oral / Viva',
    label: 'Oral / Viva Examination',
    description: 'Spoken evaluation',
    icon: <Mic className="h-5 w-5" />,
    accent: 'rose',
    category: 'other',
    defaults: {
      type: 'Viva / Oral',
      defaultName: 'Oral / Viva Examination',
      passPercentage: 40,
      gradingType: 'marks',
      allowLateSubmission: false,
      allowResubmission: false,
      defaultMaxMarks: 20,
      defaultPassMarks: 8,
      showPractical: false,
      showOral: true,
      multiDay: false,
    },
  },
  {
    id: 'custom',
    name: 'Custom',
    label: 'Custom Examination',
    description: 'Build from scratch',
    icon: <Settings className="h-5 w-5" />,
    accent: 'slate',
    category: 'other',
    defaults: {
      type: 'Custom',
      defaultName: '',
      passPercentage: 33,
      gradingType: 'marks',
      allowLateSubmission: true,
      allowResubmission: true,
      defaultMaxMarks: 100,
      defaultPassMarks: 33,
      showPractical: false,
      showOral: false,
      multiDay: false,
    },
  },
]

export function getTemplateById(id: string): ExamTemplate | undefined {
  return EXAM_TEMPLATES.find((t) => t.id === id)
}

// Filter templates based on whether selected classes include board classes (grade 10, 12)
export function getTemplatesForClasses(selectedGradeLevels: string[]): ExamTemplate[] {
  const hasBoardClass = selectedGradeLevels.some((g) => ['10', '12'].includes(g))
  return EXAM_TEMPLATES.filter((t) => !t.boardOnly || hasBoardClass)
}
