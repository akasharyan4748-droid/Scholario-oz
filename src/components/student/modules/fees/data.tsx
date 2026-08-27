'use client'

import {
  CreditCard, Smartphone, Building2,
} from 'lucide-react'

// Aarav's payment history (GWS2024018)
export const myTransactions = [
  { id: 'TXN018A', receiptNo: 'RCP-2024-1018', amount: 42000, mode: 'UPI' as const, status: 'Success' as const, date: '2024-04-15', purpose: 'Annual Fee — Q1' },
  { id: 'TXN018B', receiptNo: 'RCP-2024-1018B', amount: 22000, mode: 'UPI' as const, status: 'Success' as const, date: '2024-07-12', purpose: 'Annual Fee — Q2 (Partial)' },
]

// Fee breakdown
export const feeBreakdown = [
  { name: 'Tuition Fee', amount: 60000, paid: 46000 },
  { name: 'Transport Fee', amount: 18000, paid: 12000 },
  { name: 'Library Fee', amount: 2000, paid: 2000 },
  { name: 'Exam Fee', amount: 3000, paid: 2000 },
  { name: 'Activity Fee', amount: 3000, paid: 2000 },
]

export const paymentMethods = [
  { id: 'upi', label: 'UPI', desc: 'GPay, PhonePe, Paytm', icon: <Smartphone className="h-5 w-5" />, gradient: 'from-violet-400 to-purple-500', badge: 'Recommended' },
  { id: 'card', label: 'Card', desc: 'Credit / Debit Card', icon: <CreditCard className="h-5 w-5" />, gradient: 'from-emerald-400 to-teal-500', badge: '' },
  { id: 'netbanking', label: 'Net Banking', desc: 'All major banks', icon: <Building2 className="h-5 w-5" />, gradient: 'from-amber-400 to-orange-500', badge: '' },
]

export type PayStage = 'form' | 'processing' | 'success' | 'receipt'

export interface PaymentStudentInfo {
  name: string
  admissionNo: string
  email: string
  className: string
  section: string
}

export type RenewalStatus = 'open' | 'pending_cash' | 'approved'

export type RenewalPayType = 'online' | 'cash'

export type RenewalReceiver = 'Ananya Sharma (Class Teacher)' | 'Dr. Ramesh Varma (Principal)' | 'Central Accounts Desk'

export type RenewalStage = 'form' | 'processing' | 'receipt'

export interface RenewalReceiptData {
  receiptNo: string
  txnId: string
  date: string
  amount: number
  mode: string
  receiver: string
  status: string
}

export const RENEWAL_RECEIVERS: { value: RenewalReceiver; label: string }[] = [
  { value: 'Ananya Sharma (Class Teacher)', label: 'Ananya Sharma — Class Teacher (Class 10-A)' },
  { value: 'Dr. Ramesh Varma (Principal)', label: 'Dr. Ramesh Varma — Principal' },
  { value: 'Central Accounts Desk', label: 'Central Accounts Desk' },
]

export const initialRenewalReceiptData: RenewalReceiptData = {
  receiptNo: 'RCP-2025-RENEW-018',
  txnId: 'TXN-2025-884210',
  date: new Date().toISOString().split('T')[0],
  amount: 65000,
  mode: 'Cash Payment',
  receiver: 'Ananya Sharma (Class Teacher)',
  status: 'Pending Teacher Acceptance',
}
