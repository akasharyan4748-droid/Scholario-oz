'use client'

/**
 * SalaryPaymentsSection — the payment trust model, Principal side.
 *
 * The Principal records payments and follows up. Employees confirm.
 * There is deliberately NO confirm/report action here: pending rows
 * carry 🕐 Pending Receipt and offer View / Review / Follow-up only.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle, Ban, Check, ChevronRight, Clock, Eye, IndianRupee,
  MessageCircle, Undo2, Wallet, X,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSalaryStore, type SalaryPayment } from '@/lib/store/salary-store'
import { periodOptions, periodLabel } from '@/lib/store/salary-store'
import { SummaryCard, SummaryCardGrid } from '../shared/summary-card'
import { useSalaryUI } from './salary-ui-context'
import { PaymentDetailDialog, ReceiptViewDialog } from './payment-dialogs'
import {
  SalaryPanel, PaymentStatusBadge, fmtDay, moneyMy, CompactEmpty,
} from './salary-shared'

export function SalaryPaymentsSection() {
  const payments = useSalaryStore((s) => s.payments)
  const receipts = useSalaryStore((s) => s.receipts)
  const markFollowedUp = useSalaryStore((s) => s.markFollowedUp)
  const { openRecordPayment, openEmployee } = useSalaryUI()

  const months = useMemo(() => periodOptions(6), [])
  const [month, setMonth] = useState(months[0])
  const [detail, setDetail] = useState<SalaryPayment | null>(null)
  const [receiptFor, setReceiptFor] = useState<string | null>(null)

  const monthPayments = useMemo(
    () => payments.filter((p) => p.periodKey === month)
      .sort((a, b) => b.date.localeCompare(a.date) || b.recordedAt.localeCompare(a.recordedAt)),
    [payments, month],
  )

  const pending = monthPayments.filter((p) => p.status === 'Pending Receipt')
  const confirmed = monthPayments.filter((p) => p.status === 'Confirmed')
  // Not-received reports are a cross-month follow-up queue — they stay
  // visible until the Principal follows up, whatever month is selected.
  const notReceived = payments.filter((p) => p.status === 'Not Received')
  const openReports = notReceived.filter((p) => !p.followedUpAt)
  const reversed = monthPayments.filter((p) => p.status === 'Reversed')

  const receipt = receipts.find((r) => r.receiptNo === receiptFor) ?? null

  const handleFollowUp = (p: SalaryPayment) => {
    markFollowedUp(p.id)
    toast.success('Follow-up noted', { description: `${p.employeeName} · ${moneyMy(p.amount)}` })
  }

  return (
    <div className="space-y-4">
      {/* Month selector + record action */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[70]">
              {months.map((m) => (
                <SelectItem key={m} value={m} className="text-xs">{periodLabel(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {monthPayments.length} payment{monthPayments.length === 1 ? '' : 's'} · {periodLabel(month)}
          </p>
        </div>
        {/* Same contextual treatment as the Overview → Staff Salaries button */}
        <Button
          variant="outline" size="sm" className="h-7 text-[11px] gap-1"
          onClick={() => openRecordPayment({ periodKey: month })}
        >
          <Wallet className="h-3 w-3" /> Record Payment
        </Button>
      </div>

      {/* KPI strip — same design language as Fee Management (SummaryCard) */}
      <SummaryCardGrid columns={4}>
        <SummaryCard
          icon={<Wallet className="h-4 w-4" />} label="Confirmed Paid"
          value={moneyMy(confirmed.reduce((s, p) => s + p.amount, 0))}
          sub={`${confirmed.length} payment${confirmed.length === 1 ? '' : 's'}`}
          tone="emerald" delay={0}
        />
        <SummaryCard
          icon={<Clock className="h-4 w-4" />} label="Pending Receipt"
          value={moneyMy(pending.reduce((s, p) => s + p.amount, 0))}
          sub={`${pending.length} awaiting confirmation`}
          tone="amber" delay={0.05}
        />
        <SummaryCard
          icon={<X className="h-4 w-4" />} label="Not Received"
          value={moneyMy(openReports.reduce((s, p) => s + p.amount, 0))}
          sub={openReports.length > 0 ? `${openReports.length} to follow up` : 'All clear'}
          tone={openReports.length > 0 ? 'rose' : 'slate'} delay={0.1}
        />
        <SummaryCard
          icon={<Undo2 className="h-4 w-4" />} label="Reversed"
          value={moneyMy(reversed.reduce((s, p) => s + p.amount, 0))}
          sub={`${reversed.length} entr${reversed.length === 1 ? 'y' : 'ies'}`}
          tone="slate" delay={0.15}
        />
      </SummaryCardGrid>

      {/* Not-received alert strip (principal notification) */}
      {openReports.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/[0.06] px-4 py-3"
        >
          <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
              {openReports.length} payment{openReports.length === 1 ? '' : 's'} reported not received
            </p>
            <p className="text-[11px] text-rose-600/80 dark:text-rose-300/70 mt-0.5">
              {openReports.map((p) => `${p.employeeName} · ${moneyMy(p.amount)}`).join('  ·  ')}
            </p>
          </div>
        </motion.div>
      )}

      {/* Pending receipt — Principal only records; employees confirm */}
      <SalaryPanel title="Pending Receipt" subtitle={`${pending.length} payment${pending.length === 1 ? '' : 's'} awaiting employee confirmation`}>
        {pending.length === 0 ? (
          <CompactEmpty icon={<Check className="h-3.5 w-3.5" />}>Nothing pending</CompactEmpty>
        ) : (
          <div className="divide-y divide-border -mx-4">
            {pending.map((p) => (
              <PaymentRow key={p.id} payment={p} onNameClick={() => openEmployee(p.employeeId)}>
                <IconAction label="View" onClick={() => setDetail(p)}><Eye className="h-3.5 w-3.5" /></IconAction>
                <IconAction label="Review" onClick={() => openEmployee(p.employeeId)}><ChevronRight className="h-3.5 w-3.5" /></IconAction>
                <IconAction label="Follow up" onClick={() => handleFollowUp(p)}><MessageCircle className="h-3.5 w-3.5" /></IconAction>
              </PaymentRow>
            ))}
          </div>
        )}
      </SalaryPanel>

      {/* Confirmed — receipts exist */}
      <SalaryPanel title="Confirmed" subtitle={`${confirmed.length} confirmed · receipts issued`}>
        {confirmed.length === 0 ? (
          <CompactEmpty icon={<Ban className="h-3.5 w-3.5" />}>No confirmed payments yet</CompactEmpty>
        ) : (
          <div className="divide-y divide-border -mx-4">
            {confirmed.map((p) => (
              <PaymentRow key={p.id} payment={p} onNameClick={() => openEmployee(p.employeeId)}>
                <span className="font-mono text-[10px] text-muted-foreground hidden sm:block">{p.receiptNo}</span>
                <IconAction label="Receipt" onClick={() => setReceiptFor(p.receiptNo!)}><IndianRupee className="h-3.5 w-3.5" /></IconAction>
                <IconAction label="View" onClick={() => setDetail(p)}><Eye className="h-3.5 w-3.5" /></IconAction>
              </PaymentRow>
            ))}
          </div>
        )}
      </SalaryPanel>

      {/* Not received — follow-up queue */}
      {notReceived.length > 0 && (
        <SalaryPanel title="Not Received" subtitle={`${notReceived.length} report${notReceived.length === 1 ? '' : 's'} from employees`}>
          <div className="divide-y divide-border -mx-4">
            {notReceived.map((p) => (
              <PaymentRow key={p.id} payment={p} showMonth onNameClick={() => openEmployee(p.employeeId)}>
                <IconAction label="View" onClick={() => setDetail(p)}><Eye className="h-3.5 w-3.5" /></IconAction>
                {!p.followedUpAt && (
                  <IconAction label="Follow up" onClick={() => handleFollowUp(p)}><MessageCircle className="h-3.5 w-3.5" /></IconAction>
                )}
              </PaymentRow>
            ))}
          </div>
        </SalaryPanel>
      )}

      {/* Reversed — collapsed history */}
      {reversed.length > 0 && (
        <SalaryPanel title="Reversed" subtitle={`${reversed.length} entr${reversed.length === 1 ? 'y' : 'ies'}`}>
          <div className="divide-y divide-border -mx-4">
            {reversed.map((p) => (
              <PaymentRow key={p.id} payment={p}>
                <IconAction label="View" onClick={() => setDetail(p)}><Eye className="h-3.5 w-3.5" /></IconAction>
              </PaymentRow>
            ))}
          </div>
        </SalaryPanel>
      )}

      <PaymentDetailDialog payment={detail} open={!!detail} onOpenChange={(o) => !o && setDetail(null)} />
      <ReceiptViewDialog receipt={receipt} open={!!receipt} onOpenChange={(o) => !o && setReceiptFor(null)} />
    </div>
  )
}

// ─── Row ─────────────────────────────────────────────────────────────

function PaymentRow({
  payment, children, onNameClick, showMonth,
}: { payment: SalaryPayment; children?: React.ReactNode; onNameClick?: () => void; showMonth?: boolean }) {
  const initials = payment.employeeName.split(' ').map((n) => n[0]).slice(0, 2).join('')
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-[10px] font-semibold bg-muted">{initials}</AvatarFallback>
      </Avatar>
      <button
        type="button"
        onClick={onNameClick}
        className={cn('min-w-0 flex-1 text-left', onNameClick && 'hover:underline underline-offset-2')}
      >
        <p className="text-xs font-semibold truncate">{payment.employeeName}</p>
        <p className="text-[10px] text-muted-foreground truncate">
          {moneyMy(payment.amount)} · {payment.method} · {fmtDay(payment.date)}{showMonth ? ` · ${payment.monthLabel}` : ''}
          {payment.rejectionReason ? ` — “${payment.rejectionReason}”` : ''}
          {payment.reversalReason ? ` — ${payment.reversalReason}` : ''}
        </p>
      </button>
      <PaymentStatusBadge status={payment.status} />
      {children && <div className="flex items-center gap-0.5 shrink-0">{children}</div>}
    </div>
  )
}

function IconAction({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      {children}
    </button>
  )
}
