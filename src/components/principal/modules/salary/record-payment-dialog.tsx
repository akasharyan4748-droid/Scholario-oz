'use client'

/**
 * RecordPaymentDialog — Principal records a payment for an employee-month.
 *
 * Layout: header → employee & month → payable summary → amount / date /
 * method / reference / bank → status note. The status note is a single
 * icon-first line (no sentences): "Pending employee receipt".
 *
 * The date picker is a Popover-portal calendar with collision flipping:
 * it opens below when there is room and above when there is not, never
 * overlaps the method field, never shifts the form, and never clips.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarIcon, Clock, IndianRupee } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useSalaryStore, type PaymentMethod } from '@/lib/store/salary-store'
import { netPayableFor, confirmedPaidFor, periodOptions, periodLabel, nextCashReference } from '@/lib/store/salary-store'
import { moneyMy } from './salary-shared'

const METHODS: PaymentMethod[] = ['Bank Transfer', 'UPI', 'Cash', 'Cheque']

// ─── Date field (portal calendar, collision-safe) ────────────────────

function PaymentDateField({ value, onChange, id }: { value: string; onChange: (iso: string) => void; id: string }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  // Placement is measured when the popover opens: flip to whichever side
  // has more room and clamp the height so the calendar can never clip
  // outside the viewport (it scrolls internally instead).
  const [placement, setPlacement] = useState<{ side: 'top' | 'bottom'; maxHeight: number }>({ side: 'bottom', maxHeight: 320 })

  const selected = useMemo(() => {
    if (!value) return undefined
    const d = new Date(`${value}T00:00:00`)
    return isNaN(d.getTime()) ? undefined : d
  }, [value])

  const handleOpenChange = (next: boolean) => {
    if (next && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      const below = window.innerHeight - r.bottom - 16
      const above = r.top - 16
      // Prefer opening upward so the calendar never covers the fields
      // below the date (method / reference / bank). Fall back downward
      // only when the top genuinely lacks room, clamped to the viewport.
      const side: 'top' | 'bottom' = above >= 240 ? 'top' : 'bottom'
      const space = side === 'bottom' ? below : above
      setPlacement({ side, maxHeight: Math.max(200, Math.min(320, space)) })
    }
    setOpen(next)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full h-9 justify-start font-normal tabular-nums',
            !value && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {value ? format(new Date(`${value}T00:00:00`), 'dd MMM yyyy') : <span>Payment date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side={placement.side}
        sideOffset={6}
        collisionPadding={8}
        className="z-[70] w-auto p-0 shadow-xl"
        style={{ maxHeight: placement.maxHeight + 4, overflow: 'hidden' }}
      >
        <div className="overflow-y-auto salary-scroll" style={{ maxHeight: placement.maxHeight }}>
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected ?? new Date()}
            onSelect={(d) => {
              if (d) {
                onChange(format(d, 'yyyy-MM-dd'))
                setOpen(false)
              }
            }}
            className="w-[268px] p-2"
            autoFocus
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── Dialog ──────────────────────────────────────────────────────────

interface RecordPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId?: string
  periodKey?: string
}

export function RecordPaymentDialog({ open, onOpenChange, employeeId, periodKey }: RecordPaymentDialogProps) {
  const employees = useSalaryStore((s) => s.employees)
  const salaries = useSalaryStore((s) => s.salaries)
  const adjustments = useSalaryStore((s) => s.adjustments)
  const payments = useSalaryStore((s) => s.payments)
  const settings = useSalaryStore((s) => s.settings)
  const recordPayment = useSalaryStore((s) => s.recordPayment)

  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status === 'Active' || e.status === 'On Leave'),
    [employees],
  )
  const months = useMemo(() => periodOptions(6), [])

  const [empId, setEmpId] = useState('')
  const [month, setMonth] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [method, setMethod] = useState<PaymentMethod>(settings.defaultMethod)
  const [reference, setReference] = useState('')
  const [bank, setBank] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reset / prefill each time the dialog opens.
  useEffect(() => {
    if (!open) return
    const emp = employeeId ?? activeEmployees[0]?.id ?? ''
    setEmpId(emp)
    setMonth(periodKey ?? months[0])
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setMethod(settings.defaultMethod)
    setReference('')
    setBank('')
    setSubmitting(false)
  }, [open, employeeId, periodKey])

  const employee = employees.find((e) => e.id === empId)

  // Payable summary for the selected employee-month.
  const payable = useMemo(
    () => (empId && month ? netPayableFor({ salaries, adjustments }, empId, month) : 0),
    [empId, month, salaries, adjustments],
  )
  const confirmed = useMemo(
    () => (empId && month ? confirmedPaidFor(payments, empId, month) : 0),
    [empId, month, payments],
  )
  const balance = Math.max(0, payable - confirmed)

  // Default the amount to the remaining balance.
  useEffect(() => {
    setAmount(balance > 0 ? String(balance) : '')
  }, [empId, month, balance])

  const refRequired = settings.referenceRequired[method]
  const showBank = method === 'Bank Transfer'
  const amountNum = Number(amount) || 0
  const overBalance = amountNum > balance

  // Cash carries no external transaction number — Scholario assigns the
  // school's internal payment reference automatically (CASH-YYYY-NNNN).
  // The preview below becomes the persisted value when submitted.
  const cashReference = useMemo(
    () => nextCashReference(
      payments.map((p) => p.reference),
      Number(date.slice(0, 4)) || new Date().getFullYear(),
    ),
    [payments, date],
  )

  const handleSubmit = () => {
    if (submitting) return
    setSubmitting(true)
    try {
      recordPayment({
        employeeId: empId,
        periodKey: month,
        amount: amountNum,
        date,
        method,
        reference: reference || undefined,
        bankAccount: bank || undefined,
      })
      toast.success('Payment recorded', {
        description: `${employee?.name} · ${moneyMy(amountNum)} · ${periodLabel(month)} — pending receipt`,
        classNames: {
          description: '!text-xs !font-medium !text-zinc-700 dark:!text-zinc-300',
        },
      })
      onOpenChange(false)
    } catch (err) {
      toast.error('Could not record payment', {
        description: err instanceof Error ? err.message : 'Check the payment details.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="h-4 w-4" />
            </span>
            Record Payment
          </DialogTitle>
          <DialogDescription>
            {employee ? `${employee.name} · ${employee.designation}` : 'Salary payment'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee & month */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Employee</Label>
              <Select value={empId} onValueChange={setEmpId}>
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent className="z-[70] max-h-72">
                  {activeEmployees.map((e) => (
                    <SelectItem key={e.id} value={e.id} className="text-xs">
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent className="z-[70]">
                  {months.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs">
                      {periodLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payable summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-muted/40 px-2.5 py-2">
              <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">Net Payable</p>
              <p className="text-sm font-bold tabular-nums mt-0.5">{moneyMy(payable)}</p>
            </div>
            <div className="rounded-lg bg-emerald-500/[0.07] px-2.5 py-2">
              <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">Confirmed</p>
              <p className="text-sm font-bold tabular-nums mt-0.5 text-emerald-600 dark:text-emerald-400">{moneyMy(confirmed)}</p>
            </div>
            <div className="rounded-lg bg-muted/40 px-2.5 py-2">
              <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">Balance</p>
              <p className="text-sm font-bold tabular-nums mt-0.5">{moneyMy(balance)}</p>
            </div>
          </div>

          {/* Amount & date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="rp-amount">Amount</Label>
              <div className="relative">
                <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="rp-amount"
                  inputMode="numeric"
                  className="pl-7 h-9 tabular-nums"
                  placeholder={balance > 0 ? String(balance) : '0'}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
              {overBalance && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                  Exceeds balance by {moneyMy(amountNum - balance)}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="rp-date">Date</Label>
              <PaymentDateField id="rp-date" value={date} onChange={setDate} />
            </div>
          </div>

          {/* Method & reference */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Payment Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[70]">
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor={method === 'Cash' ? undefined : 'rp-ref'}>
                Reference No.{method !== 'Cash' && refRequired ? <span className="text-rose-500"> *</span> : null}
              </Label>
              {method === 'Cash' ? (
                <div className="space-y-1">
                  <Input
                    aria-label="Cash payment reference"
                    readOnly
                    tabIndex={-1}
                    className="h-9 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300 bg-muted/50 cursor-default select-none focus-visible:ring-0"
                    value={cashReference}
                  />
                  <p className="text-[10px] leading-none text-muted-foreground">Auto-generated</p>
                </div>
              ) : (
                <Input
                  id="rp-ref"
                  className="h-9 text-xs"
                  placeholder={method === 'Cheque' ? 'CHQ-5521' : method === 'UPI' ? 'UPI-77213' : 'NEFT-88341'}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              )}
            </div>
          </div>

          {/* Bank account — only for bank transfers */}
          {showBank && (
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="rp-bank">Bank Account</Label>
              <Input
                id="rp-bank"
                className="h-9 text-xs tabular-nums"
                placeholder={employee?.bankAccount ?? '****0000'}
                value={bank}
                onChange={(e) => setBank(e.target.value)}
              />
            </div>
          )}

          {/* Status note — one icon line, no sentences */}
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/[0.07] border border-amber-500/20 px-3 py-2">
            <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Pending employee receipt</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSubmit}
            disabled={!empId || !month || !amountNum || !date || (method !== 'Cash' && refRequired && !reference.trim())}
          >
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
