// ──────────────────────────────────────────────────────────────────────
// Examination templates — built-in starting configurations.
//
// Order reflects the standard Indian school academic calendar:
//   Unit Test 1 → Unit Test 2 → Half-Yearly → Unit Test 3 → Unit Test 4 → Annual
//
// Half-Yearly sits BETWEEN the unit-test cycles (not at the end), because
// that's where it falls in the actual academic year.
//
// Custom is intentionally NOT a primary template — it's a small secondary
// "+ Custom" affordance shown next to the standard templates.
// ──────────────────────────────────────────────────────────────────────

import { FileText, Calendar, Award, Settings, FlaskConical, ClipboardCheck, Mic } from 'lucide-react'
import type { ReactNode } from 'react'

export interface ExamTemplate {
  id: string
  name: string
  label: string
  shortLabel: string
  description: string
  icon: ReactNode
  accent: string
  isCustom?: boolean
}

export const EXAM_TEMPLATES: ExamTemplate[] = [
  { id: 'unit-test-1', name: 'Unit Test 1', label: 'Unit Test 1', shortLabel: 'UT 1', description: 'First periodic unit test', icon: <FileText className="h-4 w-4" />, accent: 'sky' },
  { id: 'unit-test-2', name: 'Unit Test 2', label: 'Unit Test 2', shortLabel: 'UT 2', description: 'Second periodic unit test', icon: <FileText className="h-4 w-4" />, accent: 'cyan' },
  { id: 'half-yearly', name: 'Half-Yearly Examination', label: 'Half-Yearly', shortLabel: 'Half-Yearly', description: 'Mid-session comprehensive examination', icon: <Calendar className="h-4 w-4" />, accent: 'violet' },
  { id: 'unit-test-3', name: 'Unit Test 3', label: 'Unit Test 3', shortLabel: 'UT 3', description: 'Third periodic unit test', icon: <FileText className="h-4 w-4" />, accent: 'teal' },
  { id: 'unit-test-4', name: 'Unit Test 4', label: 'Unit Test 4', shortLabel: 'UT 4', description: 'Fourth periodic unit test', icon: <FileText className="h-4 w-4" />, accent: 'indigo' },
  { id: 'annual', name: 'Annual Examination', label: 'Annual', shortLabel: 'Annual', description: 'End-of-session final examination', icon: <Award className="h-4 w-4" />, accent: 'emerald' },
  { id: 'practical', name: 'Practical Examination', label: 'Practical', shortLabel: 'Practical', description: 'Lab-based practical exam', icon: <FlaskConical className="h-4 w-4" />, accent: 'amber' },
  { id: 'pre-board', name: 'Pre-Board Examination', label: 'Pre-Board', shortLabel: 'Pre-Board', description: 'Board preparation examination', icon: <ClipboardCheck className="h-4 w-4" />, accent: 'rose' },
  { id: 'oral-viva', name: 'Oral / Viva Examination', label: 'Oral / Viva', shortLabel: 'Viva', description: 'Oral / viva voce examination', icon: <Mic className="h-4 w-4" />, accent: 'fuchsia' },
  { id: 'custom', name: 'Custom Examination', label: 'Custom', shortLabel: 'Custom', description: 'Build your own examination', icon: <Settings className="h-3.5 w-3.5" />, accent: 'slate', isCustom: true },
]

export const STANDARD_TEMPLATES = EXAM_TEMPLATES.filter((t) => !t.isCustom)
export const CUSTOM_TEMPLATE = EXAM_TEMPLATES.find((t) => t.isCustom)!
