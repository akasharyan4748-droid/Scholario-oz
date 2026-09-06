'use client'

import type { ReactNode } from 'react'
import {
  CreditCard, Smartphone, Building2,
} from 'lucide-react'
import { DEFAULT_PAYMENT_MODES } from '@/lib/store/fee-store-data'
// SaaS-STAGE-2A §20 — payment-channel policy: the student online rails are
// CHANNELS over the fee store's ONE payment-mode vocabulary, so this list is
// DERIVED from the canonical DEFAULT_PAYMENT_MODES (fee-store-data) instead
// of duplicating it here. Only active ONLINE rails (UPI / Card / Net
// Banking) are offered; offline modes (Cash / Bank Transfer) are office
// channels handled by the school, and Cheque is deprecated.

// Aarav's fee breakdown — mirrors the CANONICAL Class 2 (C05) fee structure
// from the fee engine: Tuition ₹250 × 12 + Management & Maintenance ₹500 +
// Transport ₹500 × 12 (opted in). ₹4,750 of ₹9,500 paid (Term 1 instalment).
export const feeBreakdown = [
  { name: 'Tuition Fee', amount: 3000, paid: 3000 },
  { name: 'Management & Maintenance', amount: 500, paid: 500 },
  { name: 'Transport Fee', amount: 6000, paid: 1250 },
]

/** Shape consumed by payment-form-stage.tsx (unchanged). */
export interface StudentPaymentMethod {
  /** Legacy lowercase form id (upi/card/netbanking) — mapped back to the
   *  canonical PaymentMode in the pay handler. */
  id: string
  /** Canonical label from the fee store's payment-mode vocabulary. */
  label: string
  desc: string
  icon: ReactNode
  gradient: string
  badge: string
}

/** Presentation metadata per online rail, keyed by the canonical
 *  PaymentMode id — keeps the store vocabulary as the single source while
 *  the student UI keeps its icons/copy. */
const ONLINE_RAIL_META: Record<string, Omit<StudentPaymentMethod, 'id' | 'label' | 'badge'>> = {
  UPI: { desc: 'GPay, PhonePe, Paytm', icon: <Smartphone className="h-5 w-5" />, gradient: 'from-violet-400 to-purple-500' },
  Card: { desc: 'Credit / Debit Card', icon: <CreditCard className="h-5 w-5" />, gradient: 'from-emerald-400 to-teal-500' },
  'Net Banking': { desc: 'All major banks', icon: <Building2 className="h-5 w-5" />, gradient: 'from-amber-400 to-orange-500' },
}

const ONLINE_RAILS = ['UPI', 'Card', 'Net Banking'] as const

export const paymentMethods: StudentPaymentMethod[] = DEFAULT_PAYMENT_MODES
  .filter((m) => m.active && (ONLINE_RAILS as readonly string[]).includes(m.id))
  .map((mode, index) => ({
    // Legacy form ids preserved for the existing method → mode mapping.
    id: mode.id === 'UPI' ? 'upi' : mode.id === 'Card' ? 'card' : mode.id === 'Net Banking' ? 'netbanking' : mode.id,
    label: mode.label,
    ...ONLINE_RAIL_META[mode.id],
    badge: index === 0 ? 'Recommended' : '',
  }))

export type PayStage = 'form' | 'processing' | 'success' | 'receipt'

export interface PaymentStudentInfo {
  name: string
  admissionNo: string
  email: string
  className: string
  section: string
}
