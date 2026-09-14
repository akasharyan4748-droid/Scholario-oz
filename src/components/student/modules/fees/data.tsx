'use client'

import type { ReactNode } from 'react'
import {
  CreditCard, Smartphone, Building2,
} from 'lucide-react'
import { DEFAULT_PAYMENT_MODES } from '@/lib/store/fee-store-data'

/**
 * Student Fees module data — presentation metadata ONLY.
 *
 * EVERY financial figure in this module is derived at runtime from the
 * canonical fee engine (`computeAccount` over the ONE fee ledger): the
 * balance, the structure breakdown, concessions, late fees and receipts.
 * Nothing monetary is hardcoded here — the old fabricated breakdown
 * (₹ amounts + per-head "paid" splits that didn't tie to any ledger) is
 * gone.
 */

/** Online payment rails offered in the checkout — DERIVED from the
 *  canonical DEFAULT_PAYMENT_MODES (fee-store-data) instead of duplicated
 *  here. Only active ONLINE rails (UPI / Card / Net Banking) are offered;
 *  offline modes (Cash / Bank Transfer) are office channels handled by the
 *  school, and Cheque is deprecated. */
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

/** Checkout stage machine — the payment flow the server owns:
 *   amount → review → gateway (checkout sheet) → verifying (server
 *   signature check) → success (official receipt) | failed.
 * The client NEVER decides success; 'success' only renders after
 * /api/student/payments/verify returned ok. */
export type PayStage = 'amount' | 'review' | 'gateway' | 'verifying' | 'success' | 'failed'

export interface PaymentStudentInfo {
  name: string
  admissionNo: string
  className: string
  section: string
}

// ─── Server payment API contract (see src/app/api/student/payments/*) ────

export interface PaymentConfigResponse {
  available: boolean
  provider: 'razorpay' | 'sandbox' | null
  mode: 'live' | 'test' | 'sandbox' | null
  keyId: string | null
}

export interface PaymentOrderResponse {
  orderId: string
  receiptNo: string
  amountPaise: number
  currency: 'INR'
  mode: 'live' | 'test' | 'sandbox'
  keyId?: string | null
  /** Sandbox mode ONLY — the server-minted confirmation the client relays
   *  to /verify (the signature is still verified server-side). */
  paymentId?: string
  signature?: string
  sandbox?: { paymentId: string; signature: string }
  txnId: string
}

export interface PaymentVerifyResponse {
  receiptNo: string
  amount: number
  method: string
  status: string
  gatewayPaymentId: string
  txnId: string
  paidAt: string
}

/** Canonical amount formatting for the flow (server amounts are rupees). */
export const MODE_FROM_FORM_ID: Record<string, 'UPI' | 'Card' | 'Net Banking'> = {
  upi: 'UPI',
  card: 'Card',
  netbanking: 'Net Banking',
}
