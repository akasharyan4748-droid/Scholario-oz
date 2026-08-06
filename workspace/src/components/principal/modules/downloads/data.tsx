// Downloads module: types, categories, format styles, filters, stagger config.

import {
  FileText, FileSpreadsheet, BookOpen,
  Stethoscope, Bus, Home, Award, Receipt, IdCard,
  ClipboardList, GraduationCap, HeartPulse, ScrollText,
} from 'lucide-react'

export type Format = 'PDF' | 'DOCX' | 'XLSX'

export interface DocItem {
  name: string
  desc: string
  format: Format
  icon: React.ComponentType<{ className?: string }>
}

export interface Category {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
  /** tailwind gradient stops for the icon tile */
  gradient: string
  docs: DocItem[]
}

export const CATEGORIES: Category[] = [
  {
    key: 'admissions',
    label: 'Admissions',
    icon: ClipboardList,
    accent: 'text-emerald-600',
    gradient: 'from-emerald-500 to-teal-600',
    docs: [
      { name: 'Admission Form', desc: 'Standard new admission application form.', format: 'PDF', icon: FileText },
      { name: 'Registration Form', desc: 'Pre-admission registration for new students.', format: 'DOCX', icon: FileText },
      { name: 'School Prospectus', desc: 'Overview of school, facilities and curriculum.', format: 'PDF', icon: BookOpen },
      { name: 'School Tour Form', desc: 'Request a guided campus tour slot.', format: 'DOCX', icon: Home },
    ],
  },
  {
    key: 'student-records',
    label: 'Student Records',
    icon: IdCard,
    accent: 'text-cyan-600',
    gradient: 'from-cyan-500 to-sky-600',
    docs: [
      { name: 'Bonafide Certificate', desc: 'Confirms current enrolment at the school.', format: 'PDF', icon: ScrollText },
      { name: 'Transfer Certificate (TC) Format', desc: 'Official TC template for student withdrawal.', format: 'PDF', icon: FileText },
      { name: 'ID Card Template', desc: 'Editable identity card layout for students.', format: 'DOCX', icon: IdCard },
      { name: 'Character Certificate', desc: 'Attests to conduct and behaviour of student.', format: 'PDF', icon: Award },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    icon: Receipt,
    accent: 'text-amber-600',
    gradient: 'from-amber-500 to-orange-600',
    docs: [
      { name: 'Fee Receipt Template', desc: 'Standard fee receipt with auto-calc fields.', format: 'XLSX', icon: Receipt },
      { name: 'Fee Structure Sheet', desc: 'Class-wise annual fee structure breakdown.', format: 'XLSX', icon: FileSpreadsheet },
      { name: 'Salary Slip Template', desc: 'Monthly payroll slip template for staff.', format: 'XLSX', icon: FileSpreadsheet },
    ],
  },
  {
    key: 'health-transport',
    label: 'Health & Transport',
    icon: HeartPulse,
    accent: 'text-rose-600',
    gradient: 'from-rose-500 to-pink-600',
    docs: [
      { name: 'Medical Declaration Form', desc: 'Student health history and emergency contacts.', format: 'PDF', icon: Stethoscope },
      { name: 'Transport Application Form', desc: 'Apply for school bus pickup and drop.', format: 'PDF', icon: Bus },
      { name: 'Hostel Application Form', desc: 'Application for hostel boarding facility.', format: 'DOCX', icon: Home },
    ],
  },
  {
    key: 'academics',
    label: 'Academics',
    icon: GraduationCap,
    accent: 'text-violet-600',
    gradient: 'from-violet-500 to-purple-600',
    docs: [
      { name: 'Examination Form', desc: 'Board / internal exam registration form.', format: 'PDF', icon: ClipboardList },
      { name: 'Migration Certificate', desc: 'For board or university admission transfer.', format: 'PDF', icon: ScrollText },
      { name: 'Sports Participation Form', desc: 'Consent and details for sports events.', format: 'DOCX', icon: Award },
    ],
  },
]

export const FORMAT_STYLES: Record<Format, string> = {
  PDF: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20',
  DOCX: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
  XLSX: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
}

export const FILTERS = ['All', ...CATEGORIES.map((c) => c.label)] as const
export type Filter = (typeof FILTERS)[number]

export const STAGGER = { ease: [0.22, 1, 0.36, 1] as const }
