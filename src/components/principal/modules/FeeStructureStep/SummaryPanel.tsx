import { ShoppingCart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatINR } from '@/lib/format'
import { LedgerRow } from './primitives'

export interface SummaryPanelProps {
  registrationFee: number
  admissionFee: number
  tuitionFee: number
  otherHeadsTotal: number
  examTotal: number
  booksTotal: number
  booksCount: number
  uniformTotal: number
  uniformCount: number
  activityKitTotal: number
  activityKitCount: number
  transportTotal: number
  hostelTotal: number
  grossFee: number
  scholarshipAmount: number
  waiverAmount: number
  netTotal: number
  initialInstallment: number
  remainingBalance: number
}

/** Real-time fee summary card (right column, sticky). */
export function SummaryPanel(props: SummaryPanelProps) {
  const {
    registrationFee, admissionFee, tuitionFee, otherHeadsTotal,
    examTotal, booksTotal, booksCount, uniformTotal, uniformCount,
    activityKitTotal, activityKitCount, transportTotal, hostelTotal,
    grossFee, scholarshipAmount, waiverAmount, netTotal,
    initialInstallment, remainingBalance,
  } = props

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sticky top-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <ShoppingCart className="h-4 w-4" /> Fee Summary
          </h4>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-mono font-bold text-[10px]">LIVE</Badge>
        </div>

        <div className="space-y-1.5 text-xs font-mono">
          <LedgerRow label="Registration" value={registrationFee} />
          <LedgerRow label="Admission Fee" value={admissionFee} />
          <LedgerRow label="Tuition (Annual)" value={tuitionFee} />
          <LedgerRow label="Development & Tech" value={otherHeadsTotal} />
          {examTotal > 0 && <LedgerRow label="Exam & Assessment" value={examTotal} />}
          {booksTotal > 0 && <LedgerRow label={`Books (${booksCount})`} value={booksTotal} />}
          {uniformTotal > 0 && <LedgerRow label={`Uniform (${uniformCount})`} value={uniformTotal} />}
          {activityKitTotal > 0 && <LedgerRow label={`Activity Kit (${activityKitCount})`} value={activityKitTotal} />}
          {transportTotal > 0 && <LedgerRow label="Transport" value={transportTotal} />}
          {hostelTotal > 0 && <LedgerRow label="Hostel" value={hostelTotal} />}

          <div className="pt-2 border-t border-border/60 flex justify-between font-bold text-foreground">
            <span>Gross Fee</span>
            <span className="tabular-nums">{formatINR(grossFee)}</span>
          </div>

          {scholarshipAmount > 0 && (
            <div className="flex justify-between text-violet-600 dark:text-violet-400">
              <span>Scholarship</span>
              <span className="tabular-nums">− {formatINR(scholarshipAmount)}</span>
            </div>
          )}
          {waiverAmount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Waiver / Discount</span>
              <span className="tabular-nums">− {formatINR(waiverAmount)}</span>
            </div>
          )}

          <div className="pt-2 border-t-2 border-border flex justify-between items-end text-foreground">
            <div>
              <span className="text-[10px] font-sans text-muted-foreground uppercase tracking-widest block font-bold">Total Payable</span>
              <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">{formatINR(netTotal)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-border/60 space-y-1.5">
            <div className="flex justify-between text-amber-600 dark:text-amber-400">
              <span>Initial Installment (40%)</span>
              <span className="tabular-nums">{formatINR(initialInstallment)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Remaining Balance</span>
              <span className="tabular-nums">{formatINR(remainingBalance)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
