// ──────────────────────────────────────────────────────────────────────
// Examination templates — built-in starting configurations.
// Exactly: Unit Test 1-4, Half-Yearly, Annual, Custom.
// ──────────────────────────────────────────────────────────────────────

import { FileText, Calendar, Award, Settings } from 'lucide-react'
import type { ReactNode } from 'react'

export interface ExamTemplate {
  id: string
  name: string
  label: string
  description: string
  icon: ReactNode
  accent: string
  category: 'unit-test' | 'term' | 'custom'
  isCustom?: boolean
  metadata: TemplateMetadata
}

export interface TemplateMetadata {
  maxMarks: number
  theoryMarks?: number
  practicalMarks?: number
  papersPerDay: number
  paperDurationMin: number
  gapMin: number
  scheduleType: string
}

export const EXAM_TEMPLATES: ExamTemplate[] = [
  {
    id: 'unit-test-1',
    name: 'Unit Test 1',
    label: 'Unit Test 1',
    description: 'First periodic unit test',
    icon: <FileText className="h-5 w-5" />,
    accent: 'sky',
    category: 'unit-test',
    metadata: {
      maxMarks: 50, papersPerDay: 2, paperDurationMin: 60, gapMin: 15,
      scheduleType: 'Double shift', theoryMarks: 50, practicalMarks: 0,
    },
  },
  {
    id: 'unit-test-2',
    name: 'Unit Test 2',
    label: 'Unit Test 2',
    description: 'Second periodic unit test',
    icon: <FileText className="h-5 w-5" />,
    accent: 'cyan',
    category: 'unit-test',
    metadata: {
      maxMarks: 50, papersPerDay: 2, paperDurationMin: 60, gapMin: 15,
      scheduleType: 'Double shift', theoryMarks: 50, practicalMarks: 0,
    },
  },
  {
    id: 'unit-test-3',
    name: 'Unit Test 3',
    label: 'Unit Test 3',
    description: 'Third periodic unit test',
    icon: <FileText className="h-5 w-5" />,
    accent: 'teal',
    category: 'unit-test',
    metadata: {
      maxMarks: 50, papersPerDay: 2, paperDurationMin: 60, gapMin: 15,
      scheduleType: 'Double shift', theoryMarks: 50, practicalMarks: 0,
    },
  },
  {
    id: 'unit-test-4',
    name: 'Unit Test 4',
    label: 'Unit Test 4',
    description: 'Fourth periodic unit test',
    icon: <FileText className="h-5 w-5" />,
    accent: 'indigo',
    category: 'unit-test',
    metadata: {
      maxMarks: 50, papersPerDay: 2, paperDurationMin: 60, gapMin: 15,
      scheduleType: 'Double shift', theoryMarks: 50, practicalMarks: 0,
    },
  },
  {
    id: 'half-yearly',
    name: 'Half-Yearly Examination',
    label: 'Half-Yearly Examination',
    description: 'Mid-session comprehensive examination',
    icon: <Calendar className="h-5 w-5" />,
    accent: 'violet',
    category: 'term',
    metadata: {
      maxMarks: 100, theoryMarks: 70, practicalMarks: 30,
      papersPerDay: 1, paperDurationMin: 195, gapMin: 0,
      scheduleType: 'One paper/day · 3h 15m',
    },
  },
  {
    id: 'annual',
    name: 'Annual Examination',
    label: 'Annual Examination',
    description: 'End-of-session final examination',
    icon: <Award className="h-5 w-5" />,
    accent: 'emerald',
    category: 'term',
    metadata: {
      maxMarks: 100, theoryMarks: 70, practicalMarks: 30,
      papersPerDay: 1, paperDurationMin: 195, gapMin: 0,
      scheduleType: 'One paper/day · 3h 15m',
    },
  },
  {
    id: 'custom',
    name: 'Custom Examination',
    label: 'Custom Examination',
    description: 'Build your own examination',
    icon: <Settings className="h-5 w-5" />,
    accent: 'slate',
    category: 'custom',
    isCustom: true,
    metadata: {
      maxMarks: 100, papersPerDay: 1, paperDurationMin: 180, gapMin: 0,
      scheduleType: 'Manual',
    },
  },
]

export function getTemplateById(id: string): ExamTemplate | undefined {
  return EXAM_TEMPLATES.find((t) => t.id === id)
}

export function getMetadataBadges(template: ExamTemplate): string[] {
  const m = template.metadata
  const badges: string[] = []
  badges.push(`${m.maxMarks} marks`)
  if (m.theoryMarks && m.practicalMarks && m.practicalMarks > 0) {
    badges.push(`${m.theoryMarks} + ${m.practicalMarks}`)
  }
  if (m.papersPerDay > 1) {
    badges.push(`${m.papersPerDay} papers/day`)
    badges.push(`${m.paperDurationMin}min each`)
    if (m.gapMin > 0) badges.push(`${m.gapMin}min gap`)
  } else {
    badges.push('1 paper/day')
    const hrs = Math.floor(m.paperDurationMin / 60)
    const mins = m.paperDurationMin % 60
    badges.push(`${hrs}h${mins > 0 ? ` ${mins}m` : ''}`)
  }
  return badges
}
