'use client'

/**
 * PaymentDetailDialog — full details of one payment.
 * ReceiptViewDialog — the formal receipt of a confirmed payment.
 *
 * Receipts only exist for payments the employee confirmed (✓).
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Landmark, Printer } from 'lucide-react'
import { toast } from 'sonner'
import type { PaymentReceipt, SalaryPayment } from '@/lib/store/salary-store'
import { fmtDayYear, moneyMy, PaymentStatusBadge } from './salary-shared'

// ─── Payment detail ──────────────────────────────────────────────────

export function PaymentDetailDialog({
  payment, open, onOpenChange,
}: { payment: SalaryPayment | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  if (!payment) return null
  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: 'Employee', value: payment.employeeName },
    { label: 'Month', value: payment.monthLabel },
    { label: 'Amount', value: moneyMy(payment.amount) },
    { label: 'Date', value: fmtDayYear(payment.date) },
    { label: 'Method', value: payment.method },
    ...(payment.reference ? [{ label: 'Reference', value: <span className="font-mono text-xs">{payment.reference}</span> }] : []),
    ...(payment.bankAccount ? [{ label: 'Bank Account', value: <span className="font-mono text-xs">{payment.bankAccount}</span> }] : []),
    ...(payment.netPayable > 0 ? [{ label: 'Month Payable', value: moneyMy(payment.netPayable) }] : []),
    { label: 'Status', value: <PaymentStatusBadge status={payment.status} /> },
    ...(payment.receiptNo ? [{ label: 'Receipt', value: <span className="font-mono text-xs">{payment.receiptNo}</span> }] : []),
    ...(payment.rejectionReason ? [{ label: 'Reason', value: payment.rejectionReason }] : []),
    ...(payment.reversalReason ? [{ label: 'Reversal Reason', value: payment.reversalReason }] : []),
    { label: 'Recorded By', value: `${payment.recordedBy} · ${fmtDayYear(payment.recordedAt)}` },
    ...(payment.confirmedAt ? [{ label: 'Confirmed', value: `${payment.confirmedBy ?? payment.employeeName} · ${fmtDayYear(payment.confirmedAt)}` }] : []),
    ...(payment.rejectedAt ? [{ label: 'Reported', value: `${payment.rejectedBy ?? payment.employeeName} · ${fmtDayYear(payment.rejectedAt)}` }] : []),
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
          <DialogDescription>{payment.employeeName} · {payment.monthLabel}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start justify-between gap-3 text-xs">
              <span className="text-muted-foreground shrink-0">{r.label}</span>
              <span className="font-medium text-right">{r.value}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Receipt view ────────────────────────────────────────────────────

export function ReceiptViewDialog({
  receipt, open, onOpenChange,
}: { receipt: PaymentReceipt | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  if (!receipt) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Landmark className="h-4 w-4" />
            </span>
            Payment Receipt
          </DialogTitle>
          <DialogDescription>{receipt.receiptNo}</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{receipt.employeeName}</p>
              <p className="text-xs text-muted-foreground">{receipt.monthLabel}</p>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-0">✓ Confirmed</Badge>
          </div>
          <Separator />
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold tabular-nums">{moneyMy(receipt.amount)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span>{receipt.method}</span></div>
            {receipt.reference && <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono">{receipt.reference}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Paid On</span><span>{fmtDayYear(receipt.date)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Confirmed</span><span>{fmtDayYear(receipt.confirmedAt)}</span></div>
          </div>
          <Separator />
          <p className="text-[10px] text-muted-foreground">
            Confirmed by the employee on {fmtDayYear(receipt.confirmedAt)}.
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline" size="sm" className="h-8 text-xs gap-1.5"
            onClick={() => toast.success('Receipt sent to print', { description: receipt.receiptNo })}
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
