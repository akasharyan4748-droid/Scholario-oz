'use client'

/**
 * SalaryEmployeeDrawer — per-employee payroll drawer.
 *
 * Structure: opaque sticky header (avatar · name · role) → tab bar →
 * independently-scrolling content. The sheet locks body scroll, so the
 * background never moves or bleeds through, and content starts directly
 * under the header with no gap.
 *
 * Tabs: Salary · Salary History · Payment History.
 * The session salary is presented as 🔒 Session Salary · 🔒 Locked —
 * editing happens only inside the temporary window and always as a
 * change the employee approves.
 */

import { useMemo, useState } from 'react'
import {
  ArrowDownRight, ArrowUpRight, Check, Clock, Eye, IndianRupee, Pencil, Plus, Send,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  useSalaryStore, currentPeriodKey, periodLabel, netPayableFor, confirmedPaidFor,
} from '@/lib/store/salary-store'
import type { SalaryPayment } from '@/lib/store/salary-store'
import { useSalaryUI } from './salary-ui-context'
import { PaymentDetailDialog, ReceiptViewDialog } from './payment-dialogs'
import {
  fmtDay, fmtDayYear, moneyMy, LockedBadge, SessionSalaryBadge, PaymentStatusBadge, RequestStatusBadge, useEditingWindow,
} from './salary-shared'

function nextPeriodKey(now = new Date()): string {
  return currentPeriodKey(new Date(now.getFullYear(), now.getMonth() + 1, 1))
}

export function SalaryEmployeeDrawer() {
  const { drawerEmployeeId, closeEmployee, openRecordPayment } = useSalaryUI()
  const employees = useSalaryStore((s) => s.employees)
  const salaries = useSalaryStore((s) => s.salaries)
  const payments = useSalaryStore((s) => s.payments)
  const receipts = useSalaryStore((s) => s.receipts)
  const changeRequests = useSalaryStore((s) => s.changeRequests)
  const adjustments = useSalaryStore((s) => s.adjustments)

  const [editOpen, setEditOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [detail, setDetail] = useState<SalaryPayment | null>(null)
  const [receiptNo, setReceiptNo] = useState<string | null>(null)

  const { allowed } = useEditingWindow()
  const employee = employees.find((e) => e.id === drawerEmployeeId) ?? null
  const state = drawerEmployeeId ? salaries[drawerEmployeeId] : undefined
  const periodKey = currentPeriodKey()

  const empPayments = useMemo(
    () => payments.filter((p) => p.employeeId === drawerEmployeeId)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [payments, drawerEmployeeId],
  )
  const empRequests = useMemo(
    () => changeRequests.filter((r) => r.employeeId === drawerEmployeeId),
    [changeRequests, drawerEmployeeId],
  )
  const monthAdjustments = useMemo(
    () => adjustments.filter((a) => a.employeeId === drawerEmployeeId && a.periodKey === periodKey),
    [adjustments, drawerEmployeeId, periodKey],
  )

  const receipt = receipts.find((r) => r.receiptNo === receiptNo) ?? null

  if (!employee) return null

  const payable = state ? netPayableFor({ salaries, adjustments }, employee.id, periodKey) : 0
  const confirmed = confirmedPaidFor(payments, employee.id, periodKey)
  const pendingRequest = empRequests.find((r) => r.status === 'Pending')
  const initials = employee.name.split(' ').map((n) => n[0]).slice(0, 2).join('')

  return (
    <>
      <Sheet open onOpenChange={(o) => !o && closeEmployee()}>
        <SheetContent side="right" className="sm:max-w-md w-full p-0 gap-0 overflow-hidden flex flex-col">
          {/* Opaque sticky header */}
          <div className="shrink-0 bg-background border-b border-border px-5 pt-5 pb-4 pr-12">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 shrink-0">
                <AvatarFallback className="text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{employee.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {employee.designation} · {employee.department} · {employee.employeeId}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs: fixed bar + independently scrolling content */}
          <Tabs defaultValue="salary" className="flex-1 min-h-0 flex flex-col gap-0">
            <div className="shrink-0 bg-background border-b border-border px-5 py-2.5">
              <TabsList className="h-8 bg-muted/60 p-0.5">
                <TabsTrigger value="salary" className="text-[11px] h-7 px-3">Salary</TabsTrigger>
                <TabsTrigger value="history" className="text-[11px] h-7 px-3">Salary History</TabsTrigger>
                <TabsTrigger value="payments" className="text-[11px] h-7 px-3">Payment History</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4">
              {/* ── Salary ── */}
              <TabsContent value="salary" className="mt-0 space-y-4">
                {/* Employment profile — the account references the existing
                    employee/teacher record (no duplicate master data). */}
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">Employment</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                    <div className="flex items-start justify-between gap-2"><span className="text-muted-foreground shrink-0">Employee ID</span><span className="font-mono font-medium">{employee.employeeId}</span></div>
                    <div className="flex items-start justify-between gap-2"><span className="text-muted-foreground shrink-0">Status</span><span className="font-medium">{employee.status}</span></div>
                    <div className="flex items-start justify-between gap-2"><span className="text-muted-foreground shrink-0">Designation</span><span className="font-medium text-right">{employee.designation}</span></div>
                    <div className="flex items-start justify-between gap-2"><span className="text-muted-foreground shrink-0">Department</span><span className="font-medium text-right">{employee.department}</span></div>
                    <div className="flex items-start justify-between gap-2"><span className="text-muted-foreground shrink-0">Joined</span><span className="font-medium">{fmtDayYear(employee.joiningDate)}</span></div>
                    <div className="flex items-start justify-between gap-2"><span className="text-muted-foreground shrink-0">Type</span><span className="font-medium">{employee.employeeType}</span></div>
                    {employee.bankAccount && (
                      <div className="col-span-2 flex items-start justify-between gap-2"><span className="text-muted-foreground shrink-0">Bank</span><span className="font-mono text-[10px]">•••• {employee.bankAccount.slice(-4)}{employee.bankIfsc ? ` · ${employee.bankIfsc}` : ''}</span></div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border bg-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <SessionSalaryBadge />
                    <LockedBadge />
                  </div>
                  <div className="flex items-end justify-between mt-3">
                    <div>
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Net Base / month</p>
                      <p className="text-2xl font-bold tabular-nums mt-1 leading-none">{state ? moneyMy(state.salary.netBase) : '—'}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">from {fmtDayYear(state?.salary.effectiveFrom ?? '')}</p>
                  </div>

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
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3 pt-3 border-t">{state?.salary.structureName}</p>
                </div>

                {/* This month */}
                <div className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">{periodLabel(periodKey)}</p>
                    <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => openRecordPayment({ employeeId: employee.id, periodKey })}>
                      <Plus className="h-3 w-3" /> Payment
                    </Button>
                  </div>
                  {monthAdjustments.length > 0 && (
                    <div className="space-y-1">
                      {monthAdjustments.map((a) => (
                        <div key={a.id} className="flex items-center justify-between text-xs rounded-lg bg-muted/40 px-2.5 py-1.5">
                          <span className="flex items-center gap-1.5">
                            {a.amount >= 0
                              ? <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                              : <ArrowDownRight className="h-3 w-3 text-rose-600" />}
                            {a.label}
                          </span>
                          <span className={cn('font-semibold tabular-nums', a.amount >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                            {a.amount >= 0 ? '+' : '−'}{moneyMy(Math.abs(a.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
                      <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">Payable</p>
                      <p className="text-xs font-bold tabular-nums mt-0.5">{moneyMy(payable)}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-500/[0.07] px-2.5 py-1.5">
                      <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">Confirmed</p>
                      <p className="text-xs font-bold tabular-nums mt-0.5 text-emerald-600 dark:text-emerald-400">{moneyMy(confirmed)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
                      <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">Balance</p>
                      <p className="text-xs font-bold tabular-nums mt-0.5">{moneyMy(Math.max(0, payable - confirmed))}</p>
                    </div>
                  </div>
                </div>

                {/* Pending change request */}
                {pendingRequest && (
                  <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Salary change sent</p>
                      <RequestStatusBadge status={pendingRequest.status} />
                    </div>
                    <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1.5 tabular-nums">
                      {moneyMy(pendingRequest.currentNet)} → {moneyMy(pendingRequest.proposedNet)} · from {periodLabel(pendingRequest.effectiveFrom.slice(0, 7))}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={allowed ? 'default' : 'outline'}
                    className={cn('h-8 text-xs gap-1.5', allowed && 'bg-emerald-600 hover:bg-emerald-700 text-white')}
                    onClick={() => (allowed ? setEditOpen(true) : toast.error('Salary editing is locked', { description: 'Enable editing in Settings first.' }))}
                  >
                    <Pencil className="h-3 w-3" /> Edit Salary
                  </Button>
                  <Button
                    variant="outline" size="sm" className="h-8 text-xs gap-1.5"
                    onClick={() => (allowed ? setAdjustOpen(true) : toast.error('Salary editing is locked', { description: 'Enable editing in Settings first.' }))}
                  >
                    <Plus className="h-3 w-3" /> Adjustment
                  </Button>
                </div>
              </TabsContent>

              {/* ── Salary History ── */}
              <TabsContent value="history" className="mt-0 space-y-2.5">
                {empRequests.map((r) => (
                  <div key={r.id} className="rounded-xl border bg-card p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold tabular-nums">
                        {moneyMy(r.currentNet)} → {moneyMy(r.proposedNet)}
                      </p>
                      <RequestStatusBadge status={r.status} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {fmtDayYear(r.requestedAt)} · sent by {r.requestedBy}
                      {r.note ? ` · ${r.note}` : ''}
                      {r.declineReason ? ` · “${r.declineReason}”` : ''}
                    </p>
                  </div>
                ))}
                {state?.history.map((h) => (
                  <div key={h.id} className="rounded-xl border bg-card p-3.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold tabular-nums">
                        {h.fromNet !== undefined ? `${moneyMy(h.fromNet)} → ${moneyMy(h.toNet)}` : moneyMy(h.toNet)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">
                        {fmtDayYear(h.date)} · by {h.by}{h.note ? ` · ${h.note}` : ''}
                      </p>
                    </div>
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  </div>
                ))}
                {empRequests.length === 0 && (!state || state.history.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-8">No salary changes yet.</p>
                )}
              </TabsContent>

              {/* ── Payment History ── */}
              <TabsContent value="payments" className="mt-0 space-y-1.5">
                {empPayments.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">No payments recorded yet.</p>
                )}
                {empPayments.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl border bg-card px-3.5 py-2.5">
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
                    <div className="flex items-center gap-0.5 shrink-0">
                      {p.receiptNo && (
                        <button
                          type="button" title="Receipt" aria-label="View receipt"
                          onClick={() => setReceiptNo(p.receiptNo!)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <IndianRupee className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button" title="View" aria-label="View payment"
                        onClick={() => setDetail(p)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </div>
          </Tabs>
        </SheetContent>
      </Sheet>

      <EditSalaryDialog open={editOpen} onOpenChange={setEditOpen} employeeId={employee.id} currentNet={state?.salary.netBase ?? 0} />
      <AdjustmentDialog open={adjustOpen} onOpenChange={setAdjustOpen} employeeId={employee.id} />
      <PaymentDetailDialog payment={detail} open={!!detail} onOpenChange={(o) => !o && setDetail(null)} />
      <ReceiptViewDialog receipt={receipt} open={!!receipt} onOpenChange={(o) => !o && setReceiptNo(null)} />
    </>
  )
}

// ─── Edit salary (sends an approval request to the employee) ─────────
// Exported so the Teacher Profile → Payroll tab runs the exact same
// editing-window + employee-approval flow as Salary & Payroll.

export function EditSalaryDialog({
  open, onOpenChange, employeeId, currentNet,
}: { open: boolean; onOpenChange: (o: boolean) => void; employeeId: string; currentNet: number }) {
  const requestSalaryChange = useSalaryStore((s) => s.requestSalaryChange)
  const allStructures = useSalaryStore((s) => s.structures)
  const structures = useMemo(() => allStructures.filter((st) => st.status === 'Active'), [allStructures])
  const [newNet, setNewNet] = useState('')
  const [structureId, setStructureId] = useState('')
  const [note, setNote] = useState('')

  const effOptions = useMemo(() => {
    const cur = currentPeriodKey()
    return [cur, nextPeriodKey()]
  }, [])
  const [eff, setEff] = useState(effOptions[1])

  const newNetNum = Number(newNet) || 0

  const handleSend = () => {
    try {
      requestSalaryChange({
        employeeId,
        proposedNet: newNetNum,
        structureId: structureId || undefined,
        effectiveFrom: eff,
        note: note || undefined,
      })
      toast.success('Salary change sent', { description: 'The employee needs to approve it.' })
      onOpenChange(false)
      setNewNet(''); setNote(''); setStructureId('')
    } catch (err) {
      toast.error('Could not send', { description: err instanceof Error ? err.message : undefined })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Pencil className="h-4 w-4" />
            </span>
            Edit Salary
          </DialogTitle>
          <DialogDescription>Current net {moneyMy(currentNet)} / month</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="es-net">New Net (₹/month)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input id="es-net" inputMode="numeric" className="pl-7 h-9 tabular-nums" placeholder={String(currentNet)} value={newNet} onChange={(e) => setNewNet(e.target.value.replace(/[^0-9]/g, ''))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Effective</Label>
              <Select value={eff} onValueChange={setEff}>
                <SelectTrigger className="h-9 w-full text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="z-[70]">
                  {effOptions.map((m) => <SelectItem key={m} value={m} className="text-xs">{periodLabel(m)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Structure</Label>
            <Select value={structureId} onValueChange={setStructureId}>
              <SelectTrigger className="h-9 w-full text-xs"><SelectValue placeholder="Keep current" /></SelectTrigger>
              <SelectContent className="z-[70]">
                {structures.map((st) => <SelectItem key={st.id} value={st.id} className="text-xs">{st.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="es-note">Note</Label>
            <Input id="es-note" className="h-9 text-xs" placeholder="e.g. Annual increment" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/[0.07] border border-amber-500/20 px-3 py-2">
            <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Awaiting employee approval</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" onClick={handleSend} disabled={!newNetNum || newNetNum === currentNet}>
            <Send className="h-3.5 w-3.5" /> Send for Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Monthly adjustment ──────────────────────────────────────────────

function AdjustmentDialog({
  open, onOpenChange, employeeId,
}: { open: boolean; onOpenChange: (o: boolean) => void; employeeId: string }) {
  const addAdjustment = useSalaryStore((s) => s.addAdjustment)
  const cur = currentPeriodKey()
  const prev = currentPeriodKey(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1))
  const [month, setMonth] = useState(cur)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState<'+' | '-'>('+')

  const amountNum = (Number(amount) || 0) * (mode === '-' ? -1 : 1)

  const handleAdd = () => {
    try {
      addAdjustment({ employeeId, periodKey: month, label, amount: amountNum })
      toast.success('Adjustment added', { description: `${label} · ${mode === '+' ? '+' : '−'}${moneyMy(Math.abs(amountNum))} · ${periodLabel(month)}` })
      onOpenChange(false)
      setLabel(''); setAmount('')
    } catch (err) {
      toast.error('Could not add', { description: err instanceof Error ? err.message : undefined })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Monthly Adjustment</DialogTitle>
          <DialogDescription>Applies to one month&apos;s payable</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="h-9 w-full text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="z-[70]">
                  {[cur, prev].map((m) => <SelectItem key={m} value={m} className="text-xs">{periodLabel(m)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <div className="grid grid-cols-2 gap-1.5">
                <Button type="button" size="sm" variant={mode === '+' ? 'default' : 'outline'} className={cn('h-9 text-xs gap-1', mode === '+' && 'bg-emerald-600 hover:bg-emerald-700 text-white')} onClick={() => setMode('+')}>
                  <ArrowUpRight className="h-3.5 w-3.5" /> Add
                </Button>
                <Button type="button" size="sm" variant={mode === '-' ? 'default' : 'outline'} className={cn('h-9 text-xs gap-1', mode === '-' && 'bg-rose-600 hover:bg-rose-700 text-white')} onClick={() => setMode('-')}>
                  <ArrowDownRight className="h-3.5 w-3.5" /> Reduce
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="adj-label">What is it for?</Label>
            <Input id="adj-label" className="h-9 text-xs" placeholder="e.g. Advance Recovery · Festival Bonus" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="adj-amt">Amount (₹)</Label>
            <div className="relative">
              <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input id="adj-amt" inputMode="numeric" className="pl-7 h-9 tabular-nums" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))} />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAdd} disabled={!label.trim() || !Number(amount)}>
            Add Adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
