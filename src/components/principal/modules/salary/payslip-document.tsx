'use client'

/**
 * PayslipDocument — a professional school salary slip.
 *
 * A DOCUMENT, not a dashboard: white paper surface, letterhead school
 * identity, aligned employee information, real earnings/deductions
 * tables, a strong net-pay band, amount in words (always derived from
 * the actual net — never hardcoded), payment information that reflects
 * the live confirmation state, and a restrained system footer.
 *
 * Every number comes from the salary store's single calculation path:
 * the same structure components, adjustments and payments the Principal
 * sees in Salary & Payroll. Nothing here is an independent calculation.
 *
 * Print: window.print() prints ONLY the document (print CSS isolates
 * .payslip-print from the rest of the app), so "Save as PDF" from the
 * browser's print dialog produces a clean PDF payslip.
 */

import {
  Check, Clock, X,
} from 'lucide-react'

import { school } from '@/lib/mock/school'
import { teachers } from '@/lib/mock/teachers'
import { amountInWordsINR } from '@/lib/format'
import type {
  Employee, MonthlyAdjustment, SalaryPayment, SessionSalary,
} from '@/lib/store/salary-store'
import { periodLabel } from '@/lib/store/salary-store'
import { fmtDayYear } from './salary-shared'

// ─── Derived payment state for the slip ──────────────────────────────

interface PaymentSummary {
  overall: 'Confirmed' | 'Pending Receipt' | 'Not Received' | 'Unpaid'
  primary: SalaryPayment | null
  extraPayments: SalaryPayment[]
  receiptLine: string
}

function summarisePayments(payments: SalaryPayment[]): PaymentSummary {
  if (payments.length === 0) {
    return { overall: 'Unpaid', primary: null, extraPayments: [], receiptLine: '—' }
  }
  const confirmed = payments.find((p) => p.status === 'Confirmed')
  const pending = payments.find((p) => p.status === 'Pending Receipt')
  const notReceived = payments.find((p) => p.status === 'Not Received')
  const primary = confirmed ?? pending ?? notReceived ?? payments[0]
  const overall: PaymentSummary['overall'] =
    confirmed ? 'Confirmed' : pending ? 'Pending Receipt' : notReceived ? 'Not Received' : 'Unpaid'
  let receiptLine: string
  if (confirmed?.receiptNo) receiptLine = `Issued · ${confirmed.receiptNo}`
  else if (pending) receiptLine = 'Not issued — awaiting employee confirmation'
  else if (notReceived) receiptLine = 'Not issued — employee reported not received'
  else receiptLine = '—'
  return { overall, primary, extraPayments: payments.filter((p) => p.id !== primary.id), receiptLine }
}

// ─── Document ────────────────────────────────────────────────────────

export interface PayslipDocumentProps {
  employee: Employee
  session: SessionSalary
  periodKey: string
  /** Month adjustments for this employee (already inside `payable`). */
  adjustments: MonthlyAdjustment[]
  /** This employee's payments for the month (reversed excluded). */
  payments: SalaryPayment[]
  /** Net payable for the month (session net + adjustments). */
  payable: number
}

export function PayslipDocument({
  employee, session, periodKey, adjustments, payments, payable,
}: PayslipDocumentProps) {
  // Structure components + month adjustments = the full slip line items.
  // No second calculation: gross − deductions must land exactly on payable.
  const earningLines = [
    ...session.earnings,
    ...adjustments.filter((a) => a.amount > 0).map((a) => ({ name: a.label, type: 'Earning' as const, amount: a.amount })),
  ]
  const deductionLines = [
    ...session.deductions,
    ...adjustments.filter((a) => a.amount < 0).map((a) => ({ name: a.label, type: 'Deduction' as const, amount: Math.abs(a.amount) })),
  ]
  const gross = earningLines.reduce((s, c) => s + c.amount, 0)
  const totalDeductions = deductionLines.reduce((s, c) => s + c.amount, 0)

  const summary = summarisePayments(payments)
  const payState = summary.overall
  const monthName = periodLabel(periodKey)
  const subject = teachers.find((t) => t.id === employee.id)?.subjects.join(', ')
  const payslipNo = `PS-${periodKey}-${employee.employeeId}`

  return (
    <div className="payslip-print bg-white text-slate-800 rounded-lg border border-slate-200 shadow-sm print-color-adjust-exact">
      {/* ── Letterhead ── */}
      <div className="px-6 pt-5 pb-4 text-center border-b-2 border-slate-800">
        <div className="flex h-11 w-11 mx-auto items-center justify-center rounded-full border-[2.5px] border-slate-800 font-bold text-lg leading-none">
          {school.logo}
        </div>
        <p className="mt-2 text-[15px] font-bold tracking-[0.14em] uppercase">{school.name}</p>
        <p className="text-[9px] text-slate-500 mt-0.5">{school.address}</p>
        <p className="text-[9px] text-slate-500">
          Ph: {school.phone} &nbsp;·&nbsp; {school.email}
        </p>
        <p className="text-[9px] text-slate-500">{school.affiliation}</p>
      </div>

      {/* ── Title ── */}
      <div className="px-6 py-3.5 text-center bg-slate-50/70 border-b border-slate-200">
        <p className="text-[13px] font-bold tracking-[0.3em] uppercase">Salary Slip</p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          For the month of <span className="font-semibold text-slate-700">{monthName}</span>
          {' '}· Payslip No: <span className="font-mono">{payslipNo}</span>
        </p>
      </div>

      {/* ── Employee information ── */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
          <InfoRow label="Employee Name" value={employee.name} strong />
          <InfoRow label="Pay Period" value={monthName} />
          <InfoRow label="Employee ID" value={employee.employeeId} mono />
          <InfoRow label="Payment Date" value={summary.primary ? fmtDayYear(summary.primary.date) : '—'} />
          <InfoRow label="Designation" value={employee.designation} />
          <InfoRow label="Salary Structure" value={session.structureName} />
          <InfoRow label="Department" value={employee.department} />
          {subject ? <InfoRow label="Subject" value={subject} /> : <InfoRow label="Joined" value={fmtDayYear(employee.joiningDate)} />}
        </div>
      </div>

      {/* ── Earnings & Deductions ── */}
      <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-slate-200">
        <div>
          <TableHead label="Earnings" />
          <table className="w-full">
            <tbody>
              {earningLines.map((c, i) => <TableRow key={`${c.name}-${i}`} name={c.name} amount={c.amount} />)}
            </tbody>
            <tfoot>
              <tr className="border-t-[2.5px] border-slate-700">
                <td className="py-1.5 text-[10px] font-bold uppercase tracking-wider">Gross Earnings</td>
                <td className="py-1.5 text-right text-[11px] font-bold tabular-nums">{`₹${gross.toLocaleString('en-IN')}`}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div>
          <TableHead label="Deductions" />
          <table className="w-full">
            <tbody>
              {deductionLines.length === 0 && (
                <tr><td className="py-2 text-[11px] text-slate-400 italic">No deductions</td><td /></tr>
              )}
              {deductionLines.map((c, i) => <TableRow key={`${c.name}-${i}`} name={c.name} amount={c.amount} />)}
            </tbody>
            <tfoot>
              <tr className="border-t-[2.5px] border-slate-700">
                <td className="py-1.5 text-[10px] font-bold uppercase tracking-wider">Total Deductions</td>
                <td className="py-1.5 text-right text-[11px] font-bold tabular-nums">{`₹${totalDeductions.toLocaleString('en-IN')}`}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Net pay ── */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between bg-slate-900 text-white rounded-md px-4 py-3 print-color-adjust-exact">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase">Net Pay</p>
          <p className="text-xl font-bold tabular-nums">{`₹${Math.round(payable).toLocaleString('en-IN')}`}</p>
        </div>
        <p className="text-[10px] text-slate-500 mt-2">
          <span className="font-semibold text-slate-600">Amount in Words:</span>{' '}
          {amountInWordsINR(payable)}
        </p>
      </div>

      {/* ── Payment information ── */}
      <div className="px-6 py-4 border-b border-slate-200">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-2.5">Payment Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
          <div className="flex justify-between gap-3">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 pt-0.5">Payment Status</span>
            <StatusValue status={payState} />
          </div>
          <InfoRow label="Payment Method" value={summary.primary?.method ?? '—'} />
          <InfoRow label="Payment Date" value={summary.primary ? fmtDayYear(summary.primary.date) : '—'} />
          <InfoRow label="Receipt Status" value={summary.receiptLine} highlight={summary.overall === 'Confirmed'} />
        </div>
        {summary.extraPayments.length > 0 && (
          <div className="mt-3 pt-3 border-t border-dashed border-slate-200 space-y-1.5">
            {summary.extraPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 text-[10px]">
                <span className="text-slate-500">
                  {fmtDayYear(p.date)} · {p.method} · {`₹${Math.round(p.amount).toLocaleString('en-IN')}`}
                  {p.reference ? ` · ${p.reference}` : ''}
                </span>
                <StatusValue status={p.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-6 py-3.5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[8.5px] text-slate-400">This is a system-generated salary slip.</p>
          <p className="text-[8.5px] text-slate-400">Generated by SCHOLARIO Enterprise School ERP.</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-slate-500">Authorized by</p>
          <p className="text-[10px] font-semibold text-slate-700 border-t border-slate-400 pt-0.5 px-1">School Administration</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body * { visibility: hidden !important; }
          .payslip-print, .payslip-print * { visibility: visible !important; }
          .payslip-print {
            position: absolute !important;
            left: 0; top: 0; width: 100%;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}

// ─── Small document primitives ───────────────────────────────────────

function InfoRow({ label, value, mono, strong, highlight }: {
  label: string; value: string; mono?: boolean; strong?: boolean; highlight?: boolean
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[9px] uppercase tracking-wider text-slate-400 pt-0.5 shrink-0">{label}</span>
      <span className={`text-[11px] text-right ${strong ? 'font-bold' : 'font-medium'} ${mono ? 'font-mono' : ''} ${highlight ? 'text-emerald-700' : 'text-slate-700'}`}>
        {value}
      </span>
    </div>
  )
}

function TableHead({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between pb-1 border-b border-slate-300">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">{label}</p>
      <p className="text-[9px] uppercase tracking-wider text-slate-400">Amount</p>
    </div>
  )
}

function TableRow({ name, amount }: { name: string; amount: number }) {
  return (
    <tr className="border-b border-dashed border-slate-200">
      <td className="py-1.5 text-[11px] text-slate-700">{name}</td>
      <td className="py-1.5 text-right text-[11px] text-slate-800 tabular-nums">{`₹${Math.round(amount).toLocaleString('en-IN')}`}</td>
    </tr>
  )
}

/** Payment status as document text — same colors as the module's pills. */
function StatusValue({ status }: { status: SalaryPayment['status'] | 'Unpaid' }) {
  if (status === 'Confirmed') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
        <Check className="h-3 w-3" strokeWidth={3} /> Confirmed
      </span>
    )
  }
  if (status === 'Pending Receipt') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
        <Clock className="h-3 w-3" /> Pending Receipt
      </span>
    )
  }
  if (status === 'Not Received') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700">
        <X className="h-3 w-3" strokeWidth={3} /> Not Received
      </span>
    )
  }
  if (status === 'Reversed') {
    return <span className="text-[10px] font-semibold text-slate-500">Reversed</span>
  }
  return <span className="text-[10px] font-semibold text-slate-500">Unpaid</span>
}
