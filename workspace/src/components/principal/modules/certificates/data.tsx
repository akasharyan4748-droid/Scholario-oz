'use client'

import {
  Award, ScrollText, FileText, IdCard, Receipt, FileCheck2,
} from 'lucide-react'
import { students } from '@/lib/mock/students'

/** Discriminator for the six certificate kinds the module can generate. */
export type CertType = 'bonafide' | 'tc' | 'character' | 'id' | 'fee' | 'migration'

/** Metadata describing a certificate tile in the generation grid. */
export interface CertMeta {
  key: CertType
  title: string
  desc: string
  icon: React.ReactNode
  gradient: string
}

/** The six certificate templates surfaced on the module landing grid. */
export const CERTS: CertMeta[] = [
  { key: 'bonafide', title: 'Bonafide Certificate', desc: 'Certifies that a student is currently enrolled at the school.', icon: <ScrollText className="h-6 w-6" />, gradient: 'from-emerald-500 to-teal-600' },
  { key: 'tc', title: 'Transfer Certificate', desc: 'Issued when a student leaves the school. Official handover document.', icon: <FileText className="h-6 w-6" />, gradient: 'from-amber-500 to-orange-600' },
  { key: 'character', title: 'Character Certificate', desc: 'Attests to the moral conduct and behaviour of the student.', icon: <Award className="h-6 w-6" />, gradient: 'from-violet-500 to-purple-600' },
  { key: 'id', title: 'ID Card', desc: 'Generate identity card with photo, class, and validity.', icon: <IdCard className="h-6 w-6" />, gradient: 'from-cyan-500 to-sky-600' },
  { key: 'fee', title: 'Fee Receipt', desc: 'Print duplicate fee receipt with full breakdown.', icon: <Receipt className="h-6 w-6" />, gradient: 'from-rose-500 to-pink-600' },
  { key: 'migration', title: 'Migration Certificate', desc: 'For board / university admissions. CBSE format.', icon: <FileCheck2 className="h-6 w-6" />, gradient: 'from-lime-500 to-green-600' },
]

export interface RecentCert {
  id: string
  type: string
  student: string
  class: string
  date: string
  ref: string
}

/** Mock log of certificates issued in the last 7 days (shown in the panel). */
export const RECENTLY_GENERATED: RecentCert[] = [
  { id: 'CG-001', type: 'Bonafide', student: 'Aarav Sharma', class: 'Class 2-A', date: '2025-11-26', ref: 'DSO/BON/2025/0421' },
  { id: 'CG-002', type: 'Transfer', student: 'Ira Malhotra', class: 'Class 1-A', date: '2025-11-22', ref: 'DSO/TC/2025/0118' },
  { id: 'CG-003', type: 'Character', student: 'Myra Iyer', class: 'Class 2-A', date: '2025-11-20', ref: 'DSO/CHR/2025/0094' },
  { id: 'CG-004', type: 'Fee Receipt', student: 'Diya Patel', class: 'Class 2-A', date: '2025-11-18', ref: 'DSO/FEE/2025/1043' },
  { id: 'CG-005', type: 'ID Card', student: 'Vihaan Agarwal', class: 'Class 2-A', date: '2025-11-15', ref: 'DSO/IDC/2025/0214' },
  { id: 'CG-006', type: 'Migration', student: 'Anika Desai', class: 'Class 12-A', date: '2025-11-10', ref: 'DSO/MIG/2025/0008' },
]

/** Convenience alias for the student shape used by every certificate preview. */
export type Student = typeof students[number]
