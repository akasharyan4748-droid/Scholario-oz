'use client'

/**
 * FeeCollections — the TEACHER's real fee-collection experience
 * (PAY-REWORK-1 spec §3/§22).
 *
 * Replaces the old mock "re-admission cash collections" panel (local
 * useState, never touched the fee ledger) with the canonical flow:
 *
 *   1. Teacher records a collection received from a parent (Cash, or a
 *      transfer reference the parent shows proof of) against a student in
 *      THEIR class — one `recordPayment` with collectorRole 'teacher'.
 *   2. The payment becomes 'Under Verification' — a teacher can NEVER
 *      self-verify, change ledger records, or issue an official receipt.
 *   3. The Principal sees the SAME record in Fee Management → Payments →
 *      Cash Verification and verifies/rejects it.
 *   4. Only after verification does the receipt become official — then the
 *      teacher can view/print it for the parent.
 *
 * ONE canonical payment record everywhere; this panel is a role-specific
 * VIEW of it (status wording: "Collected — Awaiting verification" → "Paid").
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Banknote, Plus, Info, Wallet } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFeeStore, useFeeData, type FeeTransaction, type PaymentMode } from '@/lib/store/fee-store'
import { useStudentsStore } from '@/lib/store/students-store'
import { useAuth } from '@/lib/store/auth-store'
import { useLiveAlerts } from '@/lib/store/live-alerts-store'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { FeeStatusBadge, paymentStatusLabel } from '@/components/principal/modules/fees/fees-shared'
import { ReceiptRowActions, ReceiptViewDialog } from '@/components/principal/modules/fees/fee-receipt-a5'
import { toast } from 'sonner'

// This teacher panel scopes to the class the module manages (Class 2-A).
const CLASS_ID = 'C05'
const SECTION = 'A'

const FEE_HEADS = ['Tuition', 'Management & Maintenance', 'Transport', 'Examination Fee', 'Book & Stationery', 'Other']
const MODES: Array<{ id: PaymentMode; label: string; hint: string; needsRef: boolean }> = [
  { id: 'Cash', label: 'Cash', hint: 'Parent handed cash to you', needsRef: false },
  { id: 'UPI', label: 'UPI', hint: 'Parent shows UPI transfer proof', needsRef: true },
  { id: 'Bank Transfer', label: 'Bank Transfer', hint: 'NEFT / IMPS with reference', needsRef: true },
]

export function FeeCollectionsPanel() {
  const user = useAuth((s) => s.user)
  const teacherName = user?.name ?? 'Teacher'
  const { accounts } = useFeeData()
  const students = useStudentsStore((s) => s.students)
  const transactions = useFeeStore((s) => s.transactions)
  const recordPayment = useFeeStore((s) => s.recordPayment)
  const receiptSettings = useFeeStore((s) => s.receiptSettings)
  const addAlert = useLiveAlerts((s) => s.addAlert)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [feeHead, setFeeHead] = useState('Tuition')
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState<PaymentMode>('Cash')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [viewing, setViewing] = useState<FeeTransaction | null>(null)

  // Class roster — the teacher's own class only (server-side permission
  // boundary mirrors this: a teacher never sees another class's accounts).
  const classStudents = useMemo(
    () => students.filter((s) => s.classId === CLASS_ID && s.section === SECTION && s.status === 'Active'),
    [students],
  )

  // THIS teacher's recorded collections — role-specific view of the one
  // canonical ledger (never a second copy of the data).
  const myCollections = useMemo(
    () => transactions.filter((t) => t.collectorRole === 'teacher' && t.collectedBy === teacherName).slice(0, 6),
    [transactions, teacherName],
  )

  const selectedStudent = classStudents.find((s) => s.id === studentId)
  const selectedAccount = accounts.find((a) => a.studentId === studentId)
  const amt = Number(amount) || 0
  const modeCfg = MODES.find((m) => m.id === mode)!
  const overpay = selectedAccount && amt > selectedAccount.totalDue && selectedAccount.totalDue > 0

  const reset = () => {
    setStudentId(''); setFeeHead('Tuition'); setAmount(''); setMode('Cash'); setReference(''); setNote('')
  }

  const handleSubmit = () => {
    if (!selectedStudent) { toast.error('Select the student'); return }
    if (!amt || amt <= 0) { toast.error('Enter the amount collected'); return }
    if (modeCfg.needsRef && reference.trim().length < 4) { toast.error('Enter the transfer reference from the parent'); return }

    const result = recordPayment({
      studentId: selectedStudent.id,
      amount: amt,
      mode,
      feeHead,
      purpose: note.trim() || `Fee collected by class teacher (${mode})`,
      collectedBy: teacherName,
      collectorRole: 'teacher', // cannot self-verify — Principal verifies
      referenceNo: modeCfg.needsRef ? reference.trim() : undefined,
    })

    if (!result.success) {
      toast.error('Could not record collection', { description: result.error })
      return
    }

    toast.success('Collection recorded', {
      description: `${formatINR(amt, true)} from ${selectedStudent.name} — awaiting Principal verification.`,
    })
    // Principal-side alert (existing alerts centre architecture).
    addAlert({
      id: `alert-${Date.now()}`,
      severity: 'high',
      title: `Teacher collection awaiting verification`,
      desc: `${teacherName} collected ${formatINR(amt, true)} from ${selectedStudent.name} (${feeHead}).`,
      color: 'amber',
      navKey: 'fees',
      isNew: true,
      time: 'just now',
    })

    setDialogOpen(false)
    reset()
  }

  return (
    <>
      <GlassCard className="p-4 sm:p-5 border border-border space-y-3">
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-border flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Wallet className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Fee Collections</h3>
              <p className="text-[11px] text-muted-foreground">
                Class 2-A · collections you record are verified by the Principal before they become official
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-8"
          >
            <Plus className="h-3.5 w-3.5" /> Record Collection
          </Button>
        </div>

        {myCollections.length === 0 ? (
          <div className="flex items-start gap-2.5 px-1 py-2">
            <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
            <p className="text-[11px] text-muted-foreground">
              No collections recorded yet. When a parent hands you a fee payment, use <span className="font-medium text-foreground">Record Collection</span> — the office sees it instantly and confirms it the same day.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {myCollections.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.15) }}
                className="py-2 flex items-center gap-3 first:pt-0"
              >
                <span className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-md ring-1',
                  t.status === 'Success'
                    ? 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20'
                    : t.status === 'Failed'
                      ? 'bg-rose-500/10 text-rose-600 ring-rose-500/20'
                      : 'bg-amber-500/10 text-amber-600 ring-amber-500/20',
                )} aria-hidden>
                  <Banknote className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{t.studentName}</p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {t.feeHead} · {t.mode} · {formatDate(t.date)}
                    {t.status === 'Failed' && t.verificationNote ? <span className="text-rose-600"> · {t.verificationNote}</span> : null}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold tabular-nums leading-tight">{formatINR(t.amount, true)}</p>
                  <div className="mt-0.5 flex justify-end">
                    <FeeStatusBadge status={paymentStatusLabel(t.status, 'teacher')} />
                  </div>
                </div>
                {/* Receipt access only once verified (spec §11/§22) */}
                {t.status === 'Success' && (
                  <ReceiptRowActions transaction={t} settings={receiptSettings} onView={setViewing} />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Record Collection dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) reset() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Record Fee Collection</DialogTitle>
            <DialogDescription className="text-[11px]">
              Money you collect goes to the school office for same-day verification. You cannot mark it verified yourself.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label className="text-[11px]">Student</Label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-2 text-xs"
              >
                <option value="">Select student…</option>
                {classStudents.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} · {s.admissionNo}</option>
                ))}
              </select>
              {selectedAccount && selectedAccount.totalDue > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  Outstanding: <span className="font-semibold tabular-nums">{formatINR(selectedAccount.totalDue, true)}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px]">Fee Head</Label>
                <select value={feeHead} onChange={(e) => setFeeHead(e.target.value)} className="w-full h-9 rounded-md border border-border bg-background px-2 text-xs">
                  {FEE_HEADS.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Amount (₹)</Label>
                <Input
                  type="number" min="1" inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px]">Payment Mode</Label>
              <div className="grid grid-cols-3 gap-2">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setMode(m.id); if (!m.needsRef) setReference('') }}
                    className={cn(
                      'rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors',
                      mode === m.id ? 'border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300' : 'border-border hover:border-emerald-500/40',
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">{modeCfg.hint}</p>
            </div>

            {modeCfg.needsRef && (
              <div className="space-y-1.5">
                <Label className="text-[11px]">Transfer Reference</Label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="UPI / UTR reference from the parent"
                  className="h-9 text-xs font-mono"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[11px]">Note (optional)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Quarterly fee handed by father" className="h-9 text-xs" />
            </div>

            {overpay && (
              <p className="text-[10px] text-amber-600">
                Amount exceeds the student's outstanding dues ({formatINR(selectedAccount!.totalDue, true)}) — the office will verify the split.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setDialogOpen(false); reset() }}>Cancel</Button>
            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSubmit}>
              Record Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReceiptViewDialog
        transaction={viewing}
        settings={receiptSettings}
        open={viewing !== null}
        onOpenChange={(o) => { if (!o) setViewing(null) }}
        actor={teacherName}
      />
    </>
  )
}
