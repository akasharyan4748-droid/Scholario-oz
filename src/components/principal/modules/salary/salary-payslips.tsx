'use client'

/**
 * SalaryPayslipsSection — per-month payslip states for every employee:
 * ▤ Unpaid · ▤ Pending · ▤ Paid. Viewing a payslip opens the
 * professional school salary-slip document (PayslipDocument) — the same
 * structure, adjustments and payment records the whole module uses.
 */

import { useMemo, useState } from 'react'
import { BadgeCheck, ChevronRight, FileText, Printer } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  useSalaryStore, periodOptions, periodLabel, netPayableFor, confirmedPaidFor,
} from '@/lib/store/salary-store'
import { useSalaryUI } from './salary-ui-context'
import { moneyMy, PayslipStateBadge } from './salary-shared'
import { ReceiptViewDialog } from './payment-dialogs'
import { PayslipDocument } from './payslip-document'

export function SalaryPayslipsSection() {
  const employees = useSalaryStore((s) => s.employees)
  const salaries = useSalaryStore((s) => s.salaries)
  const adjustments = useSalaryStore((s) => s.adjustments)
  const payments = useSalaryStore((s) => s.payments)
  const receipts = useSalaryStore((s) => s.receipts)
  const { openEmployee } = useSalaryUI()

  const months = useMemo(() => periodOptions(6), [])
  const [month, setMonth] = useState(months[0])
  const [viewing, setViewing] = useState<string | null>(null) // employeeId
  const [receiptNo, setReceiptNo] = useState<string | null>(null)

  const rows = useMemo(() => {
    return employees
      .filter((e) => e.status === 'Active' || e.status === 'On Leave')
      .map((e) => {
        const state = salaries[e.id]
        const payable = netPayableFor({ salaries, adjustments }, e.id, month)
        const confirmed = confirmedPaidFor(payments, e.id, month)
        const monthPayments = payments.filter((p) => p.employeeId === e.id && p.periodKey === month && p.status !== 'Reversed')
        const payState: 'Unpaid' | 'Pending' | 'Paid' = monthPayments.some((p) => p.status === 'Confirmed')
          ? 'Paid'
          : monthPayments.some((p) => p.status === 'Pending Receipt') ? 'Pending' : 'Unpaid'
        return { employee: e, state, payable, confirmed, payState, monthPayments }
      })
      .sort((a, b) => a.employee.name.localeCompare(b.employee.name))
  }, [employees, salaries, adjustments, payments, month])

  const counts = {
    paid: rows.filter((r) => r.payState === 'Paid').length,
    pending: rows.filter((r) => r.payState === 'Pending').length,
    unpaid: rows.filter((r) => r.payState === 'Unpaid').length,
  }

  const viewRow = viewing ? rows.find((r) => r.employee.id === viewing) : null
  const receipt = receipts.find((r) => r.receiptNo === receiptNo) ?? null
  const monthAdjustments = viewing ? adjustments.filter((a) => a.employeeId === viewing && a.periodKey === month) : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="z-[70]">
              {months.map((m) => <SelectItem key={m} value={m} className="text-xs">{periodLabel(m)}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {counts.paid} paid · {counts.pending} pending · {counts.unpaid} unpaid
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="max-h-[calc(100vh-280px)] min-h-[240px] overflow-y-auto salary-scroll">
          <div className="divide-y divide-border">
            {rows.map((r) => (
              <button
                key={r.employee.id}
                type="button"
                onClick={() => setViewing(r.employee.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-[10px] font-semibold bg-muted">{r.employee.avatar}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{r.employee.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {r.employee.designation} · {moneyMy(r.payable)}
                    {r.confirmed > 0 && <span className="text-emerald-600 dark:text-emerald-400"> · {moneyMy(r.confirmed)} confirmed</span>}
                  </p>
                </div>
                <PayslipStateBadge state={r.payState} />
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Professional payslip document */}
      <Dialog open={!!viewRow} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[92dvh] overflow-y-auto">
          {viewRow && viewRow.state && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400">
                    <FileText className="h-4 w-4" />
                  </span>
                  Payslip · {periodLabel(month)}
                </DialogTitle>
                <DialogDescription>
                  {viewRow.employee.name} · {viewRow.employee.designation} · {viewRow.employee.employeeId}
                </DialogDescription>
              </DialogHeader>

              <PayslipDocument
                employee={viewRow.employee}
                session={viewRow.state.salary}
                periodKey={month}
                adjustments={monthAdjustments}
                payments={viewRow.monthPayments}
                payable={viewRow.payable}
              />

              <div className="flex justify-between items-center gap-2 flex-wrap">
                <Button
                  variant="outline" size="sm" className="h-8 text-xs gap-1.5"
                  onClick={() => window.print()}
                >
                  <Printer className="h-3.5 w-3.5" /> Print / Save PDF
                </Button>
                <div className="flex items-center gap-2">
                  {viewRow.monthPayments.some((p) => p.receiptNo) && (
                    <Button
                      variant="outline" size="sm" className="h-8 text-xs gap-1.5"
                      onClick={() => setReceiptNo(viewRow.monthPayments.find((p) => p.receiptNo)?.receiptNo ?? null)}
                    >
                      <BadgeCheck className="h-3.5 w-3.5" /> View Receipt
                    </Button>
                  )}
                  <Button
                    variant="ghost" size="sm" className="h-8 text-xs"
                    onClick={() => { setViewing(null); openEmployee(viewRow.employee.id) }}
                  >
                    Open Payroll →
                  </Button>
                </div>
              </div>
            </>
          )}
          {viewRow && !viewRow.state && (
            <p className="text-xs text-muted-foreground py-6 text-center">
              No salary record for {viewRow.employee.name}.
            </p>
          )}
        </DialogContent>
      </Dialog>

      <ReceiptViewDialog receipt={receipt} open={!!receipt} onOpenChange={(o) => !o && setReceiptNo(null)} />
    </div>
  )
}
