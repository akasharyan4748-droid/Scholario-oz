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
  isCustom?: boolean
}

export const EXAM_TEMPLATES: ExamTemplate[] = [
  { id: 'unit-test-1', name: 'Unit Test 1', label: 'Unit Test 1', description: 'First periodic unit test', icon: <FileText className="h-5 w-5" />, accent: 'sky' },
  { id: 'unit-test-2', name: 'Unit Test 2', label: 'Unit Test 2', description: 'Second periodic unit test', icon: <FileText className="h-5 w-5" />, accent: 'cyan' },
  { id: 'unit-test-3', name: 'Unit Test 3', label: 'Unit Test 3', description: 'Third periodic unit test', icon: <FileText className="h-5 w-5" />, accent: 'teal' },
  { id: 'unit-test-4', name: 'Unit Test 4', label: 'Unit Test 4', description: 'Fourth periodic unit test', icon: <FileText className="h-5 w-5" />, accent: 'indigo' },
  { id: 'half-yearly', name: 'Half-Yearly Examination', label: 'Half-Yearly Examination', description: 'Mid-session comprehensive examination', icon: <Calendar className="h-5 w-5" />, accent: 'violet' },
  { id: 'annual', name: 'Annual Examination', label: 'Annual Examination', description: 'End-of-session final examination', icon: <Award className="h-5 w-5" />, accent: 'emerald' },
  { id: 'custom', name: 'Custom Examination', label: 'Custom Examination', description: 'Build your own examination', icon: <Settings className="h-5 w-5" />, accent: 'slate', isCustom: true },
]

export function getTemplateById(id: string): ExamTemplate | undefined {
  return EXAM_TEMPLATES.find((t) => t.id === id)
}
