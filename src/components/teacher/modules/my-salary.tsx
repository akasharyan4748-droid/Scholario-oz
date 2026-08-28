'use client'

/**
 * MySalaryModule — the employee side of Salary & Payroll.
 *
 * Employees confirm the payments the Principal records:
 *   ✓ Received  → payment confirmed, receipt issued
 *   × Not Received → report with a reason, no receipt, principal notified
 *
 * Salary changes sent by the Principal are accepted or declined here too.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowDownRight, ArrowUpRight, BadgeCheck, Check, Clock, IndianRupee, Lock, X,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  useSalaryStore, currentPeriodKey, periodLabel, netPayableFor, confirmedPaidFor,
} from '@/lib/store/salary-store'
import type { SalaryPayment } from '@/lib/store/salary-store'
import { fmtDay, fmtDayYear, moneyMy, PaymentStatusBadge, SessionSalaryBadge } from '@/components/principal/modules/salary/salary-shared'
import { ReceiptViewDialog } from '@/components/principal/modules/salary/payment-dialogs'

export function MySalaryModule({ employeeId }: { employeeId: string }) {
  const employees = useSalaryStore((s) => s.employees)
  const salaries = useSalaryStore((s) => s.salaries)
  const payments = useSalaryStore((s) => s.payments)
  const receipts = useSalaryStore((s) => s.receipts)
  const changeRequests = useSalaryStore((s) => s.changeRequests)
  const adjustments = useSalaryStore((s) => s.adjustments)

  const [confirming, setConfirming] = useState<SalaryPayment | null>(null)
  const [reporting, setReporting] = useState<SalaryPayment | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [declining, setDeclining] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [receiptNo, setReceiptNo] = useState<string | null>(null)

  const employee = employees.find((e) => e.id === employeeId)
  const state = salaries[employeeId]
  const periodKey = currentPeriodKey()

  const myPayments = useMemo(
    () => payments.filter((p) => p.employeeId === employeeId)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [payments, employeeId],
  )
  const pending = myPayments.filter((p) => p.status === 'Pending Receipt')
  const pendingRequests = changeRequests.filter((r) => r.employeeId === employeeId && r.status === 'Pending')
  const monthAdjustments = adjustments.filter((a) => a.employeeId === employeeId && a.periodKey === periodKey)
  const receipt = receipts.find((r) => r.receiptNo === receiptNo) ?? null

  const payable = state ? netPayableFor({ salaries, adjustments }, employeeId, periodKey) : 0
  const confirmed = confirmedPaidFor(payments, employeeId, periodKey)

  const confirmReceipt = useSalaryStore((s) => s.confirmReceipt)
  const reportNotReceived = useSalaryStore((s) => s.reportNotReceived)
  const respondToChangeRequest = useSalaryStore((s) => s.respondToChangeRequest)

  if (!employee) {
    return <p className="text-xs text-muted-foreground">No salary record found.</p>
  }

  return (
    <div className="space-y-5">
      {/* Pending confirmations — the heart of the trust model */}
      {pending.length > 0 && (
        <div className="space-y-2.5">
          {pending.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                    Did you receive this payment?
                  </p>
                  <p className="text-base font-bold tabular-nums mt-1">{moneyMy(p.amount)}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
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
        </div>
      )}

      {/* Salary change requests */}
      {pendingRequests.map((r) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-violet-500/30 bg-violet-500/[0.06] p-4"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-semibold text-violet-800 dark:text-violet-200">Salary change request</p>
              <p className="text-base font-bold tabular-nums mt-1">
                {moneyMy(r.currentNet)} <ArrowUpRight className="h-4 w-4 inline text-violet-500" /> {moneyMy(r.proposedNet)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                from {periodLabel(r.effectiveFrom.slice(0, 7))}{r.note ? ` · ${r.note}` : ''}
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

      {/* My salary */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold">My Salary</p>
          <SessionSalaryBadge />
        </div>
        <p className="text-2xl font-bold tabular-nums mt-2">
          {state ? moneyMy(state.salary.netBase) : '—'}
          <span className="text-xs font-normal text-muted-foreground"> / month</span>
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          from {fmtDayYear(state?.salary.effectiveFrom ?? '')} · {state?.salary.structureName}
        </p>

        <div className="mt-4 space-y-1">
          {state?.salary.earnings.map((c) => (
            <div key={`e-${c.name}`} className="flex justify-between text-xs">
              <span className="text-muted-foreground">+ {c.name}</span>
              <span className="font-medium tabular-nums">{moneyMy(c.amount)}</span>
            </div>
          ))}
          {state?.salary.deductions.map((c) => (
            <div key={`d-${c.name}`} className="flex justify-between text-xs">
              <span className="text-muted-foreground">− {c.name}</span>
              <span className="font-medium tabular-nums text-rose-600 dark:text-rose-400">{moneyMy(c.amount)}</span>
            </div>
          ))}
          {monthAdjustments.map((a) => (
            <div key={a.id} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{a.amount >= 0 ? '+' : '−'} {a.label}</span>
              <span className={cn('font-medium tabular-nums', a.amount >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                {a.amount >= 0 ? '+' : '−'}{moneyMy(Math.abs(a.amount))}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t">
          <div>
            <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">{periodLabel(periodKey)} Payable</p>
            <p className="text-sm font-bold tabular-nums mt-0.5">{moneyMy(payable)}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">Confirmed</p>
            <p className="text-sm font-bold tabular-nums mt-0.5 text-emerald-600 dark:text-emerald-400">{moneyMy(confirmed)}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">Balance</p>
            <p className="text-sm font-bold tabular-nums mt-0.5">{moneyMy(Math.max(0, payable - confirmed))}</p>
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <p className="text-sm font-bold px-4 pt-4 pb-2">My Payments</p>
        {myPayments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No payments recorded yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {myPayments.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold tabular-nums">
                    {moneyMy(p.amount)} <span className="text-muted-foreground font-normal">· {p.monthLabel}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {p.method} · {fmtDay(p.date)}
                    {p.rejectionReason ? ` — “${p.rejectionReason}”` : ''}
                    {p.reversalReason ? ` — ${p.reversalReason}` : ''}
                  </p>
                </div>
                <PaymentStatusBadge status={p.status} />
                {p.receiptNo && (
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 px-2" onClick={() => setReceiptNo(p.receiptNo!)}>
                    <BadgeCheck className="h-3 w-3" /> {p.receiptNo}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm receipt dialog */}
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

      {/* Report not-received dialog */}
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

      {/* Decline salary change dialog */}
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

      <ReceiptViewDialog receipt={receipt} open={!!receipt} onOpenChange={(o) => !o && setReceiptNo(null)} />
    </div>
  )
}
