'use client'

/**
 * MySalaryModule — the teacher's "My Salary & Payments" workspace.
 *
 * PRIVACY / SCOPING: every read below is filtered to `employeeId` — this
 * module renders ONLY the signed-in teacher's own salary, payments,
 * receipts and change requests. No other employee's data is ever read.
 *
 * Information architecture (top → bottom, Marks Entry design language):
 *   1. Current Salary        — gross / deductions / net / effective from.
 *      Net is ALWAYS computed (gross − deductions) and lands exactly on
 *      the session's netBase — never a second hardcoded number.
 *   2. Salary Breakdown      — every component of the applied scale, plus
 *      the current month's adjustments when present.
 *   3. Trust workflow        — the payment lifecycle, presented honestly:
 *      the Principal records a payment → "Pending Receipt" (awaiting
 *      YOUR confirmation) → you confirm ✓ Received (status Confirmed,
 *      receipt issued, audit logged) or report × Not Received (no
 *      receipt, Principal notified). Salary change requests from the
 *      Principal are accepted / declined here too.
 *   4. Payslips              — one row per paid month: view the slip
 *      document + a real PDF download (enabled once confirmed).
 *   5. Payment History       — every payment with honestly derived
 *      per-month gross/deductions and the actual paid amount.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowDownRight, ArrowUpRight, BadgeCheck, CalendarDays, Check, ChevronDown,
  Download, FileText, Wallet, X,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { PageTransition } from '@/components/shared/ui'
import { ModuleToolbar } from '../teacher-panel/module-toolbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  useSalaryStore, currentPeriodKey, periodLabel, sessionLabelOf, netPayableFor,
} from '@/lib/store/salary-store'
import type { MonthlyAdjustment, SalaryPayment, SessionSalary } from '@/lib/store/salary-store'
import {
  fmtDay, fmtDayYear, moneyMy, PaymentStatusBadge, PayslipStateBadge, SessionSalaryBadge,
} from '@/components/principal/modules/salary/salary-shared'
import { ReceiptViewDialog } from '@/components/principal/modules/salary/payment-dialogs'
import { PayslipDocument } from '@/components/principal/modules/salary/payslip-document'
import { HubStatCards, type HubStat } from './shared/hub-stat-cards'
import { downloadTeacherPayslip } from './salary-payslip-pdf'

// ─── Per-month derivation (single calculation path) ──────────────────

/**
 * Per-month gross & deductions, derived honestly from the applied session
 * structure plus that month's adjustments: positive adjustments (bonuses)
 * add to gross; the absolute value of negative ones (recoveries) adds to
 * deductions. Net Pay in the history table is the payment's amount —
 * what was actually paid, not a recomputation.
 */
function monthGrossDeductions(
  session: SessionSalary | undefined,
  monthAdjustments: MonthlyAdjustment[],
): { gross: number; deductions: number } {
  const gross = (session?.earnings.reduce((s, c) => s + c.amount, 0) ?? 0)
    + monthAdjustments.filter((a) => a.amount > 0).reduce((s, a) => s + a.amount, 0)
  const deductions = (session?.deductions.reduce((s, c) => s + c.amount, 0) ?? 0)
    + monthAdjustments.filter((a) => a.amount < 0).reduce((s, a) => s + Math.abs(a.amount), 0)
  return { gross, deductions }
}

/** Status priority for a month's "primary" payment (what the row shows). */
const STATUS_PRIORITY: Record<SalaryPayment['status'], number> = {
  'Confirmed': 0,
  'Pending Receipt': 1,
  'Not Received': 2,
  'Reversed': 3,
}

interface PayslipMonth {
  periodKey: string
  monthLabel: string
  /** The month's representative payment (a confirmed one wins). */
  primary: SalaryPayment
  payments: SalaryPayment[]
}

/** Honest muted reason while a month's payslip actions are disabled. */
function payslipHint(status: SalaryPayment['status']): string {
  switch (status) {
    case 'Pending Receipt': return 'Available once the payment is confirmed'
    case 'Not Received': return 'You reported this payment as not received — no payslip was issued'
    case 'Reversed': return 'This payment entry was reversed by the school'
    default: return ''
  }
}

// ─── Module ──────────────────────────────────────────────────────────

export function MySalaryModule({ employeeId }: { employeeId: string }) {
  // Teacher-only scoping: every selector result below is filtered by
  // `employeeId` before it reaches the UI.
  const employees = useSalaryStore((s) => s.employees)
  const salaries = useSalaryStore((s) => s.salaries)
  const payments = useSalaryStore((s) => s.payments)
  const receipts = useSalaryStore((s) => s.receipts)
  const changeRequests = useSalaryStore((s) => s.changeRequests)
  const adjustments = useSalaryStore((s) => s.adjustments)
  const confirmReceipt = useSalaryStore((s) => s.confirmReceipt)
  const reportNotReceived = useSalaryStore((s) => s.reportNotReceived)
  const respondToChangeRequest = useSalaryStore((s) => s.respondToChangeRequest)

  const [confirming, setConfirming] = useState<SalaryPayment | null>(null)
  const [reporting, setReporting] = useState<SalaryPayment | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [declining, setDeclining] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [receiptNo, setReceiptNo] = useState<string | null>(null)
  const [payslipMonth, setPayslipMonth] = useState<PayslipMonth | null>(null)
  const [breakdownOpen, setBreakdownOpen] = useState(true)

  const employee = employees.find((e) => e.id === employeeId)
  const salaryState = salaries[employeeId]
  const session = salaryState?.salary
  const periodKey = currentPeriodKey()

  const myPayments = useMemo(
    () => payments.filter((p) => p.employeeId === employeeId)
      .sort((a, b) => b.date.localeCompare(a.date) || b.recordedAt.localeCompare(a.recordedAt)),
    [payments, employeeId],
  )
  const pending = myPayments.filter((p) => p.status === 'Pending Receipt')
  const pendingRequests = changeRequests.filter((r) => r.employeeId === employeeId && r.status === 'Pending')
  const monthAdjustments = useMemo(
    () => adjustments.filter((a) => a.employeeId === employeeId && a.periodKey === periodKey),
    [adjustments, employeeId, periodKey],
  )
  const latestConfirmed = myPayments.find((p) => p.status === 'Confirmed') ?? null

  // One row per month that has a payment, newest first.
  const payslipMonths = useMemo<PayslipMonth[]>(() => {
    const byKey = new Map<string, SalaryPayment[]>()
    for (const p of myPayments) {
      const list = byKey.get(p.periodKey) ?? []
      list.push(p)
      byKey.set(p.periodKey, list)
    }
    return Array.from(byKey.entries())
      .map(([key, list]) => ({
        periodKey: key,
        monthLabel: list[0].monthLabel,
        primary: [...list].sort(
          (a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status] || b.date.localeCompare(a.date),
        )[0],
        payments: list,
      }))
      .sort((a, b) => b.periodKey.localeCompare(a.periodKey))
  }, [myPayments])

  // Structure numbers — net is computed, never a separate constant.
  const grossBase = session?.earnings.reduce((s, c) => s + c.amount, 0) ?? 0
  const deductionBase = session?.deductions.reduce((s, c) => s + c.amount, 0) ?? 0
  const netPay = grossBase - deductionBase
  const payable = session ? netPayableFor({ salaries, adjustments }, employeeId, periodKey) : 0

  const receipt = receipts.find((r) => r.receiptNo === receiptNo) ?? null

  const stats: HubStat[] = session ? [
    {
      key: 'gross', label: 'Monthly Gross', value: moneyMy(grossBase), icon: ArrowUpRight,
      context: `${session.structureName} scale`,
    },
    {
      key: 'deductions', label: 'Deductions', value: moneyMy(deductionBase), icon: ArrowDownRight,
      tone: 'rose', context: session.deductions.map((d) => d.name).join(' · ') || '—',
    },
    {
      key: 'net', label: 'Net Pay', value: moneyMy(netPay), icon: Wallet, tone: 'emerald',
      context: 'Per month · after deductions',
    },
    {
      key: 'effective', label: 'Effective From', value: fmtDayYear(session.effectiveFrom), icon: CalendarDays,
      context: `Session ${sessionLabelOf(salaryState.session)}`,
    },
  ] : []

  const handleDownloadPayslip = (m: PayslipMonth) => {
    if (!employee || !session) return
    const adj = adjustments.filter((a) => a.employeeId === employeeId && a.periodKey === m.periodKey)
    // Slip lines = structure components + that month's adjustments.
    const earnings = [
      ...session.earnings,
      ...adj.filter((a) => a.amount > 0).map((a) => ({ name: a.label, amount: a.amount })),
    ]
    const deductions = [
      ...session.deductions,
      ...adj.filter((a) => a.amount < 0).map((a) => ({ name: a.label, amount: Math.abs(a.amount) })),
    ]
    // Net on the single calculation path — for a confirmed month it lands
    // exactly on the amount that was paid.
    const net = earnings.reduce((s, c) => s + c.amount, 0) - deductions.reduce((s, c) => s + c.amount, 0)
    downloadTeacherPayslip({
      teacherName: employee.name,
      designation: employee.designation,
      employeeId: employee.employeeId,
      monthLabel: m.monthLabel,
      earnings,
      deductions,
      netPay: net,
      payment: {
        method: m.primary.method,
        reference: m.primary.reference,
        date: m.primary.date,
        receiptNo: m.primary.receiptNo,
      },
    })
    toast.success('Payslip downloaded', { description: `${m.monthLabel} · ${moneyMy(net)}` })
  }

  if (!employee) {
    return (
      <p className="text-xs text-muted-foreground">No salary record found.</p>
    )
  }

  const sessionLabel = salaryState ? sessionLabelOf(salaryState.session) : null

  return (
    <PageTransition className="space-y-4 sm:space-y-5">
      <ModuleToolbar
        context={`${employee.name} · ${employee.designation}${sessionLabel ? ` · Academic Session ${sessionLabel}` : ''}`}
        action={<SessionSalaryBadge />}
      />

      {/* ── 1 · Current salary summary ─────────────────────────────── */}
      {session ? (
        <HubStatCards stats={stats} />
      ) : (
        <div className="rounded-xl border border-border bg-card px-4 py-6 text-center">
          <p className="text-xs font-medium text-muted-foreground">
            No salary structure has been assigned to you for this session yet.
          </p>
        </div>
      )}

      {/* ── 2 · Salary breakdown ───────────────────────────────────── */}
      {session && (
        <div className="rounded-xl border border-border bg-card">
          <button
            type="button"
            onClick={() => setBreakdownOpen((o) => !o)}
            aria-expanded={breakdownOpen}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
          >
            <div className="min-w-0">
              <p className="text-sm font-bold">Salary Breakdown</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {session.structureName} scale · effective {fmtDayYear(session.effectiveFrom)}
              </p>
            </div>
            <ChevronDown
              className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', breakdownOpen && 'rotate-180')}
              aria-hidden="true"
            />
          </button>

          {breakdownOpen && (
            <div className="border-t border-border px-4 pt-4 pb-4 sm:px-5">
              <div className="grid gap-5 sm:grid-cols-2 sm:gap-8">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2">Earnings</p>
                  <div className="space-y-1.5">
                    {session.earnings.map((c) => (
                      <div key={`e-${c.name}`} className="flex items-baseline justify-between gap-3 text-xs">
                        <span className="text-muted-foreground truncate">+ {c.name}</span>
                        <span className="font-semibold tabular-nums">{moneyMy(c.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2.5 flex items-baseline justify-between gap-3 border-t border-dashed border-border pt-2 text-xs">
                    <span className="font-semibold">Gross Earnings</span>
                    <span className="font-bold tabular-nums">{moneyMy(grossBase)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2">Deductions</p>
                  <div className="space-y-1.5">
                    {session.deductions.map((c) => (
                      <div key={`d-${c.name}`} className="flex items-baseline justify-between gap-3 text-xs">
                        <span className="text-muted-foreground truncate">− {c.name}</span>
                        <span className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">{moneyMy(c.amount)}</span>
                      </div>
                    ))}
                    {session.deductions.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">No deductions</p>
                    )}
                  </div>
                  <div className="mt-2.5 flex items-baseline justify-between gap-3 border-t border-dashed border-border pt-2 text-xs">
                    <span className="font-semibold">Total Deductions</span>
                    <span className="font-bold tabular-nums text-rose-600 dark:text-rose-400">{moneyMy(deductionBase)}</span>
                  </div>
                </div>
              </div>

              {/* Current-month adjustments — rendered only when present */}
              {monthAdjustments.length > 0 && (
                <div className="mt-4 rounded-lg bg-muted/40 px-3 py-2.5">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1.5">
                    {periodLabel(periodKey)} adjustments
                  </p>
                  <div className="space-y-1">
                    {monthAdjustments.map((a) => (
                      <div key={a.id} className="flex items-baseline justify-between gap-3 text-xs">
                        <span className="text-muted-foreground truncate">
                          {a.amount >= 0 ? '+ ' : '− '}{a.label}
                        </span>
                        <span className={cn(
                          'font-semibold tabular-nums',
                          a.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
                        )}>
                          {a.amount >= 0 ? '+' : '−'}{moneyMy(Math.abs(a.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
                <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-300">
                  Net Pay · per month
                </p>
                <p className="font-display text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {moneyMy(netPay)}
                </p>
              </div>
              {monthAdjustments.length > 0 && (
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  {periodLabel(periodKey)} payable: {moneyMy(payable)} (net pay + adjustments)
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 3 · Trust workflow: payments awaiting YOUR confirmation ── */}
      {pending.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4 sm:p-5"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold tracking-wider text-amber-700/80 dark:text-amber-300/80">
                Pending receipt — awaiting your confirmation
              </p>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mt-1.5">
                Did you receive this payment?
              </p>
              <p className="font-display text-2xl font-bold tabular-nums mt-1">{moneyMy(p.amount)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {p.monthLabel} · {p.method} · {fmtDayYear(p.date)}{p.reference ? ` · ${p.reference}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => { setConfirming(p); setReportReason('') }}
              >
                <Check className="h-3.5 w-3.5" /> Received
              </Button>
              <Button
                size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-rose-300 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                onClick={() => { setReporting(p); setReportReason('') }}
              >
                <X className="h-3.5 w-3.5" /> Not Received
              </Button>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Salary change requests from the Principal */}
      {pendingRequests.map((r) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-violet-500/30 bg-violet-500/[0.06] p-4 sm:p-5"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold tracking-wider text-violet-700/80 dark:text-violet-300/80">
                Salary change request
              </p>
              <p className="font-display text-2xl font-bold tabular-nums mt-1.5">
                {moneyMy(r.currentNet)} <ArrowUpRight className="inline h-4 w-4 text-violet-500" aria-hidden="true" /> {moneyMy(r.proposedNet)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 truncate">
                from {periodLabel(r.effectiveFrom.slice(0, 7))}{r.note ? ` · ${r.note}` : ''} · requested by {r.requestedBy}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  respondToChangeRequest(r.id, true)
                  toast.success('Salary change accepted', { description: `${moneyMy(r.proposedNet)} / month from ${periodLabel(r.effectiveFrom.slice(0, 7))}` })
                }}
              >
                <Check className="h-3.5 w-3.5" /> Accept
              </Button>
              <Button
                size="sm" variant="outline" className="h-8 text-xs gap-1.5"
                onClick={() => { setDeclining(r.id); setDeclineReason('') }}
              >
                <X className="h-3.5 w-3.5" /> Decline
              </Button>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Latest confirmed payment (quiet context when nothing is pending) */}
      {pending.length === 0 && latestConfirmed && (
        <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Latest payment</p>
            <p className="mt-1.5 text-sm font-bold">
              {latestConfirmed.monthLabel} · Net Pay <span className="tabular-nums">{moneyMy(latestConfirmed.amount)}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Paid · {latestConfirmed.method} · confirmed {fmtDayYear(latestConfirmed.confirmedAt ?? latestConfirmed.date)}
              {latestConfirmed.receiptNo ? ` · Receipt ${latestConfirmed.receiptNo}` : ''}
            </p>
          </div>
          {latestConfirmed.receiptNo && (
            <Button
              variant="outline" size="sm" className="h-8 text-xs gap-1.5"
              onClick={() => setReceiptNo(latestConfirmed.receiptNo!)}
            >
              <BadgeCheck className="h-3.5 w-3.5" /> View Receipt
            </Button>
          )}
        </div>
      )}

      {/* ── 4 · Payslips ───────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="px-4 pt-4 pb-3 sm:px-5">
          <p className="text-sm font-bold">Payslips</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            A payslip is issued for each month once you confirm its payment.
          </p>
        </div>
        {payslipMonths.length === 0 ? (
          <p className="border-t border-border py-6 text-center text-xs text-muted-foreground">
            No payments recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-border border-t border-border">
            {payslipMonths.map((m) => {
              const confirmed = m.primary.status === 'Confirmed'
              return (
                <div key={m.periodKey} className="flex items-center gap-3 px-4 py-3 flex-wrap sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">
                      {m.monthLabel}
                      <span className="font-normal text-muted-foreground"> · Net Pay {moneyMy(m.primary.amount)}</span>
                    </p>
                    {!confirmed && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{payslipHint(m.primary.status)}</p>
                    )}
                  </div>
                  {confirmed
                    ? <PayslipStateBadge state="Paid" label="Paid" />
                    : m.primary.status === 'Pending Receipt'
                      ? <PayslipStateBadge state="Pending" label="Pending Receipt" />
                      : <PaymentStatusBadge status={m.primary.status} />}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline" size="sm" className="h-8 text-xs gap-1.5"
                      disabled={!confirmed} onClick={() => setPayslipMonth(m)}
                    >
                      <FileText className="h-3.5 w-3.5" /> View Payslip
                    </Button>
                    <Button
                      variant="outline" size="sm" className="h-8 text-xs gap-1.5"
                      disabled={!confirmed} onClick={() => handleDownloadPayslip(m)}
                    >
                      <Download className="h-3.5 w-3.5" /> Download PDF
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 5 · Payment history ────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="px-4 pt-4 pb-3 sm:px-5">
          <p className="text-sm font-bold">Payment History</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Every payment recorded for your salary account.
          </p>
        </div>
        {myPayments.length === 0 ? (
          <p className="border-t border-border py-6 text-center text-xs text-muted-foreground">
            No payments recorded yet.
          </p>
        ) : (
          <div className="border-t border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 px-3 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Month</TableHead>
                  <TableHead className="h-9 px-3 text-[10px] uppercase font-bold tracking-wider text-muted-foreground text-right">Gross</TableHead>
                  <TableHead className="h-9 px-3 text-[10px] uppercase font-bold tracking-wider text-muted-foreground text-right">Deductions</TableHead>
                  <TableHead className="h-9 px-3 text-[10px] uppercase font-bold tracking-wider text-muted-foreground text-right">Net Pay</TableHead>
                  <TableHead className="h-9 px-3 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="h-9 px-3 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Paid Date</TableHead>
                  <TableHead className="h-9 px-3 text-[10px] uppercase font-bold tracking-wider text-muted-foreground text-right">Payslip</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myPayments.map((p) => {
                  // Honest per-month derivation: structure + that month's
                  // adjustments; Net Pay is what was actually paid.
                  const adj = adjustments.filter((a) => a.employeeId === employeeId && a.periodKey === p.periodKey)
                  const { gross, deductions } = monthGrossDeductions(session, adj)
                  const month = payslipMonths.find((m) => m.periodKey === p.periodKey)
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="px-3 py-2.5 text-xs font-semibold">{p.monthLabel}</TableCell>
                      <TableCell className="px-3 py-2.5 text-xs tabular-nums text-right">
                        {session ? moneyMy(gross) : '—'}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-xs tabular-nums text-right text-rose-600 dark:text-rose-400">
                        {session ? moneyMy(deductions) : '—'}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-xs tabular-nums text-right font-bold">{moneyMy(p.amount)}</TableCell>
                      <TableCell className="px-3 py-2.5"><PaymentStatusBadge status={p.status} /></TableCell>
                      <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">{fmtDay(p.date)}</TableCell>
                      <TableCell className="px-3 py-2.5 text-right">
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 w-7 p-0"
                          disabled={!p.receiptNo}
                          title={p.receiptNo ? 'View payslip' : 'Payslip available once the payment is confirmed'}
                          onClick={() => { if (p.receiptNo && month) setPayslipMonth(month) }}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span className="sr-only">View payslip for {p.monthLabel}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ── Dialogs ────────────────────────────────────────────────── */}

      {/* Confirm receipt — a receipt is issued once you confirm */}
      <Dialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm receipt</DialogTitle>
            <DialogDescription>
              {confirming ? `${moneyMy(confirming.amount)} · ${confirming.monthLabel} · ${confirming.method} · ${fmtDayYear(confirming.date)}` : ''}
            </DialogDescription>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            A receipt is issued once you confirm. Please check the amount before confirming.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirming(null)}>Cancel</Button>
            <Button
              size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              onClick={() => {
                if (!confirming) return
                confirmReceipt(confirming.id, employee.name)
                toast.success('Payment confirmed', { description: `Receipt issued for ${moneyMy(confirming.amount)} · ${confirming.monthLabel}` })
                setConfirming(null)
              }}
            >
              <Check className="h-3.5 w-3.5" /> Yes, I received it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report not received — principal is notified */}
      <Dialog open={!!reporting} onOpenChange={(o) => !o && setReporting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Report not received</DialogTitle>
            <DialogDescription>
              {reporting ? `${moneyMy(reporting.amount)} · ${reporting.monthLabel} · ${reporting.method} · ${fmtDayYear(reporting.date)}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="nr-reason">What happened?</Label>
            <Input
              id="nr-reason" className="h-9 text-xs"
              placeholder="e.g. Amount not credited to my account"
              value={reportReason} onChange={(e) => setReportReason(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              No receipt is issued. The Principal is notified and will follow up.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setReporting(null)}>Cancel</Button>
            <Button
              size="sm" variant="destructive" className="gap-1.5"
              disabled={!reportReason.trim()}
              onClick={() => {
                if (!reporting) return
                try {
                  reportNotReceived(reporting.id, reportReason, employee.name)
                  toast.success('Reported — principal notified', { description: 'No receipt was issued for this payment.' })
                  setReporting(null)
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Could not report')
                }
              }}
            >
              <X className="h-3.5 w-3.5" /> Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline salary change */}
      <Dialog open={!!declining} onOpenChange={(o) => !o && setDeclining(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Decline salary change</DialogTitle>
            <DialogDescription>Optional — tell the Principal why</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="dc-reason">Reason</Label>
            <Input
              id="dc-reason" className="h-9 text-xs"
              placeholder="e.g. Would like to discuss first"
              value={declineReason} onChange={(e) => setDeclineReason(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeclining(null)}>Cancel</Button>
            <Button
              size="sm" variant="destructive"
              onClick={() => {
                if (!declining) return
                respondToChangeRequest(declining, false, declineReason)
                toast('Salary change declined')
                setDeclining(null)
              }}
            >
              Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payslip document — the same slip the school issues, on screen */}
      <Dialog open={!!payslipMonth} onOpenChange={(o) => !o && setPayslipMonth(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
          {payslipMonth && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <FileText className="h-4 w-4" />
                  </span>
                  Payslip · {payslipMonth.monthLabel}
                </DialogTitle>
                <DialogDescription>
                  {payslipMonth.primary.receiptNo
                    ? `Receipt ${payslipMonth.primary.receiptNo} · confirmed ${fmtDayYear(payslipMonth.primary.confirmedAt ?? payslipMonth.primary.date)}`
                    : `${employee.name} · ${employee.designation}`}
                </DialogDescription>
              </DialogHeader>

              {session ? (
                <PayslipDocument
                  employee={employee}
                  session={session}
                  periodKey={payslipMonth.periodKey}
                  adjustments={adjustments.filter((a) => a.employeeId === employeeId && a.periodKey === payslipMonth.periodKey)}
                  payments={payslipMonth.payments}
                  payable={netPayableFor({ salaries, adjustments }, employeeId, payslipMonth.periodKey)}
                />
              ) : (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  No salary structure on file for this session.
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="outline" size="sm" className="h-8 text-xs gap-1.5"
                  onClick={() => handleDownloadPayslip(payslipMonth)}
                >
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </Button>
                {payslipMonth.primary.receiptNo && (
                  <Button
                    variant="outline" size="sm" className="h-8 text-xs gap-1.5"
                    onClick={() => setReceiptNo(payslipMonth.primary.receiptNo!)}
                  >
                    <BadgeCheck className="h-3.5 w-3.5" /> View Receipt
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ReceiptViewDialog receipt={receipt} open={!!receipt} onOpenChange={(o) => !o && setReceiptNo(null)} />
    </PageTransition>
  )
}
