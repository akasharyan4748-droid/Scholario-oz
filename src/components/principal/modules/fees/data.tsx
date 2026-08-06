'use client'

import {
  Smartphone, CreditCard, Building2, Banknote, FileText,
} from 'lucide-react'
import { students } from '@/lib/mock/students'
import type { FeeTransaction } from '@/lib/mock/finance'

/* ----------------------------------------------------------------
   Static config — payment methods + category accents
   ---------------------------------------------------------------- */

export type PayStage = 'form' | 'processing' | 'success' | 'receipt'

export const paymentMethods = [
  { id: 'UPI', label: 'UPI', desc: 'GPay · PhonePe · Paytm', icon: <Smartphone className="h-5 w-5" />, gradient: 'from-emerald-400 to-teal-500', badge: 'Recommended' },
  { id: 'Card', label: 'Card', desc: 'Credit / Debit', icon: <CreditCard className="h-5 w-5" />, gradient: 'from-amber-400 to-orange-500', badge: '' },
  { id: 'Net Banking', label: 'Net Banking', desc: 'All major banks', icon: <Building2 className="h-5 w-5" />, gradient: 'from-cyan-400 to-sky-500', badge: '' },
  { id: 'Cash', label: 'Cash', desc: 'Counter payment', icon: <Banknote className="h-5 w-5" />, gradient: 'from-rose-400 to-pink-500', badge: '' },
  { id: 'Cheque', label: 'Cheque', desc: 'DD / Cheque', icon: <FileText className="h-5 w-5" />, gradient: 'from-violet-400 to-purple-500', badge: '' },
]

export const modeIcon: Record<FeeTransaction['mode'], React.ReactNode> = {
  UPI: <Smartphone className="h-3 w-3" />,
  Card: <CreditCard className="h-3 w-3" />,
  'Net Banking': <Building2 className="h-3 w-3" />,
  Cash: <Banknote className="h-3 w-3" />,
  Cheque: <FileText className="h-3 w-3" />,
}

export const modeAccent: Record<FeeTransaction['mode'], string> = {
  UPI: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
  Card: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
  'Net Banking': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-cyan-500/20',
  Cash: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20',
  Cheque: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-violet-500/20',
}

export const modeVariant: Record<FeeTransaction['status'], 'success' | 'warning' | 'danger'> = {
  Success: 'success',
  Pending: 'warning',
  Failed: 'danger',
}

// Category visual accents — emerald / amber / violet / cyan / rose palette
export const categoryAccent: Record<string, { ring: string; chip: string; bar: string; dot: string }> = {
  'Pre-Primary': { ring: 'ring-cyan-500/30', chip: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400', bar: 'oklch(0.7 0.15 200)', dot: 'bg-cyan-500' },
  Primary:       { ring: 'ring-emerald-500/30', chip: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', bar: 'oklch(0.55 0.14 162)', dot: 'bg-emerald-500' },
  Middle:        { ring: 'ring-amber-500/30', chip: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', bar: 'oklch(0.65 0.16 75)', dot: 'bg-amber-500' },
  Secondary:     { ring: 'ring-violet-500/30', chip: 'bg-violet-500/10 text-violet-600 dark:text-violet-400', bar: 'oklch(0.6 0.18 300)', dot: 'bg-violet-500' },
  Senior:        { ring: 'ring-rose-500/30', chip: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', bar: 'oklch(0.62 0.2 25)', dot: 'bg-rose-500' },
}

// Purpose options for the Collect Payment dialog dropdown.
export const purposeOptions = [
  'Annual Fee — Q1',
  'Annual Fee — Q2',
  'Annual Fee — Q3',
  'Annual Fee — Q4',
  'Partial Payment',
  'Transport Fee',
  'Exam Fee',
  'Late Fine',
]

/* ----------------------------------------------------------------
   Principal Cash Requests — initial seed for the approval flow
   ---------------------------------------------------------------- */
export interface PrincipalCashRequest {
  id: string
  studentName: string
  admissionNo: string
  class: string
  promotedClass: string
  amount: number
  receiver: string
  date: string
  status: 'Pending Principal Acceptance' | 'Collected by Teacher' | 'Confirmed by Principal'
}

/* Pending dues — derived from students with partial/pending fee status */
export const pendingDues = students
  .filter((s) => s.feeStatus !== 'Paid')
  .map((s) => {
    const outstanding = s.feeTotal - s.feePaid
    const monthsOverdue = s.feeStatus === 'Pending' ? 3 : 1
    const fine = monthsOverdue * 500
    return {
      id: s.id,
      name: s.name,
      admissionNo: s.admissionNo,
      avatar: s.avatar,
      className: `${s.className}-${s.section}`,
      outstanding,
      fine,
      total: outstanding + fine,
      monthsOverdue,
      lastPayment: s.feeStatus === 'Partial' ? '2025-09-15' : '2025-07-12',
      guardian: s.guardianPhone,
    }
  })
