// Static data, constants, types and helpers for the Salary & Payroll module.
// All payroll-related mock structures, donut splits and slip derivation live here.

import { salaryAnalytics, type SalaryRecord } from '@/lib/mock/finance'

/** Maps a SalaryRecord.status to a StatusBadge variant. */
export const statusVariant: Record<string, 'success' | 'warning' | 'neutral'> = {
  Paid: 'success',
  Processing: 'warning',
  Pending: 'neutral',
}

/** Department split donut data (headcount by department). */
export const deptSplit = [
  { name: 'Science', value: 18, color: 'oklch(0.55 0.14 162)' },
  { name: 'Maths', value: 12, color: 'oklch(0.65 0.16 75)' },
  { name: 'Languages', value: 22, color: 'oklch(0.6 0.18 300)' },
  { name: 'Social Sci.', value: 14, color: 'oklch(0.7 0.15 200)' },
  { name: 'CS', value: 8, color: 'oklch(0.55 0.16 250)' },
  { name: 'Commerce', value: 10, color: 'oklch(0.6 0.15 60)' },
  { name: 'Arts & Sports', value: 12, color: 'oklch(0.62 0.2 25)' },
]

/** Earnings vs Deductions donut data for the current month. */
export const earningsVsDeduction = [
  { name: 'Net Pay', value: salaryAnalytics.totalMonthly - salaryAnalytics.deductionsTotal, color: 'oklch(0.55 0.14 162)' },
  { name: 'Deductions', value: salaryAnalytics.deductionsTotal, color: 'oklch(0.62 0.2 25)' },
]

/** Payroll composition earnings breakdown rows. */
export const compositionEarnings = [
  { name: 'Basic Salary (50%)', amt: Math.round(salaryAnalytics.totalMonthly * 0.5), color: 'oklch(0.55 0.14 162)' },
  { name: 'HRA (20%)', amt: Math.round(salaryAnalytics.totalMonthly * 0.2), color: 'oklch(0.6 0.18 140)' },
  { name: 'DA (10%)', amt: Math.round(salaryAnalytics.totalMonthly * 0.1), color: 'oklch(0.65 0.16 75)' },
  { name: 'Allowances (20%)', amt: Math.round(salaryAnalytics.totalMonthly * 0.2), color: 'oklch(0.7 0.15 200)' },
]

/** Payroll composition deductions breakdown rows. */
export const compositionDeductions = [
  { name: 'Provident Fund (PF)', amt: Math.round(salaryAnalytics.deductionsTotal * 0.45), color: 'oklch(0.62 0.2 25)' },
  { name: 'Professional Tax', amt: Math.round(salaryAnalytics.deductionsTotal * 0.25), color: 'oklch(0.6 0.18 300)' },
  { name: 'Insurance Premium', amt: Math.round(salaryAnalytics.deductionsTotal * 0.18), color: 'oklch(0.55 0.16 250)' },
  { name: 'Other Deductions', amt: Math.round(salaryAnalytics.deductionsTotal * 0.12), color: 'oklch(0.65 0.16 75)' },
]

/** Stage of the Process Payroll multi-step dialog. */
export type ProcessStage = 'confirm' | 'processing' | 'success'

/** Steps shown in the processing stage of the payroll dialog. */
export const processSteps = [
  'Validating employee bank details',
  'Computing PF & tax deductions',
  'Initiating NEFT transfer',
  'Filing EPFO returns',
]

/** Confetti colours for the success stage. */
export const confettiColors = ['#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316']

/**
 * Reverse-engineer a typical Indian school payslip structure from a
 * SalaryRecord. Returns the earnings rows, deductions rows, basic salary and
 * provident fund components.
 */
export function makeSlip(r: SalaryRecord) {
  const basic = Math.round(r.gross * 0.5)
  const hra = Math.round(r.gross * 0.2)
  const da = Math.round(r.gross * 0.1)
  const allowances = r.gross - basic - hra - da
  const pf = Math.round(basic * 0.12)
  const tax = Math.round(r.deductions * 0.45)
  const insurance = Math.round(r.deductions * 0.25)
  const other = r.deductions - pf - tax - insurance
  const earnings = [
    { name: 'Basic Salary', amount: basic },
    { name: 'HRA (House Rent)', amount: hra },
    { name: 'Dearness Allowance', amount: da },
    { name: 'Special Allowances', amount: allowances },
  ]
  const deductions = [
    { name: 'Provident Fund (PF)', amount: pf },
    { name: 'Professional Tax', amount: tax },
    { name: 'Insurance Premium', amount: insurance },
    { name: 'Other Deductions', amount: other },
  ]
  return { earnings, deductions, basic, pf }
}
