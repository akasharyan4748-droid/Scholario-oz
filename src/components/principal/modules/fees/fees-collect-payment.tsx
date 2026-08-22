'use client'

/**
 * fees-collect-payment — Complete collect payment workflow modal.
 *
 * Stages:
 *   1. find     — find student (by name / ID / admission / roll / class / section)
 *   2. review   — see outstanding, select fee head + amount + mode
 *   3. confirm  — review all details, validate, submit
 *   4. success  — payment recorded, receipt available
 *
 * Validation:
 *   - amount > 0
 *   - payment mode active
 *   - reference number required for non-cash modes
 *   - duplicate reference check
 *   - student exists in canonical record
 */

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Wallet, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight,
  ArrowLeft, IndianRupee, Sparkles, Loader2,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useFeeStore, type PaymentMode, type StudentFeeAccount } from '@/lib/store/fee-store'
import { useStudentsStore } from '@/lib/store/students-store'
import { formatINR } from '@/lib/format'
import { ModeIcon, modeAccent, FeeStatusBadge } from './fees-shared'
import { ReceiptPreview, downloadReceiptHTML, printReceipt } from './fees-receipt'

type Stage = 'find' | 'review' | 'confirm' | 'processing' | 'success'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-selected student (from Pending Dues / Student Accounts). */
  preselectStudentId?: string
  /** Called when a payment is successfully recorded. */
  onRecorded?: () => void
}

const PURPOSE_OPTIONS = [
  'Annual Fee — Q1', 'Annual Fee — Q2', 'Annual Fee — Q3', 'Annual Fee — Q4',
  'Partial Payment', 'Transport Fee', 'Exam Fee', 'Late Fine', 'Library Fee', 'Activity Fee',
]

export function CollectPaymentModal({ open, onOpenChange, preselectStudentId, onRecorded }: Props) {
  const students = useStudentsStore((s) => s.students)
  const recordPayment = useFeeStore((s) => s.recordPayment)
  const paymentModes = useFeeStore((s) => s.paymentModes)
  const receiptSettings = useFeeStore((s) => s.receiptSettings)

  const [stage, setStage] = useState<Stage>('find')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(preselectStudentId ?? null)
  const [amount, setAmount] = useState<number>(0)
  const [purpose, setPurpose] = useState<string>(PURPOSE_OPTIONS[0])
  const [feeHead, setFeeHead] = useState<string>('Tuition')
  const [mode, setMode] = useState<PaymentMode>('UPI')
  const [referenceNo, setReferenceNo] = useState('')
  const [meta, setMeta] = useState<{ bankName?: string; chequeNumber?: string; chequeDate?: string; cardLast4?: string; upiId?: string; neftUtr?: string }>({})
  const [error, setError] = useState<string | null>(null)
  const [recordedTxnId, setRecordedTxnId] = useState<string | null>(null)

  // Reset on open
  useEffect(() => {
    if (open) {
      setStage(preselectStudentId ? 'review' : 'find')
      setSelectedId(preselectStudentId ?? null)
      setAmount(0)
      setPurpose(PURPOSE_OPTIONS[0])
      setFeeHead('Tuition')
      setMode('UPI')
      setReferenceNo('')
      setMeta({})
      setError(null)
      setRecordedTxnId(null)
    }
  }, [open, preselectStudentId])

  const selectedStudent = useMemo(() => students.find((s) => s.id === selectedId) ?? null, [students, selectedId])

  const searchResults = useMemo(() => {
    if (!search) return students.slice(0, 8)
    const q = search.toLowerCase()
    return students.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.admissionNo.toLowerCase().includes(q) ||
      s.rollNo.toLowerCase().includes(q) ||
      s.className.toLowerCase().includes(q) ||
      s.section.toLowerCase().includes(q),
    ).slice(0, 12)
  }, [students, search])

  const outstanding = selectedStudent ? Math.max(0, selectedStudent.feeTotal - (selectedStudent.scholarship ?? 0) - selectedStudent.feePaid) : 0
  const lateFee = selectedStudent && selectedStudent.feeStatus === 'Pending' ? 1500 : 0
  const totalDue = outstanding + lateFee

  const handleSubmit = () => {
    if (!selectedStudent) return
    setError(null)
    setStage('processing')
    setTimeout(() => {
      const result = recordPayment({
        studentId: selectedStudent.id,
        amount,
        mode,
        purpose,
        feeHead,
        collectedBy: 'Principal',
        referenceNo: referenceNo || undefined,
        meta,
      })
      if (result.success && result.transaction) {
        setRecordedTxnId(result.transaction.id)
        setStage('success')
        onRecorded?.()
      } else {
        setError(result.error ?? 'Payment failed.')
        setStage('confirm')
      }
    }, 1100)
  }

  const recordedTxn = useFeeStore((s) => recordedTxnId ? s.transactions.find((t) => t.id === recordedTxnId) : null)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <Wallet className="h-4 w-4" />
            </div>
            Collect Fee Payment
          </DialogTitle>
          <DialogDescription>
            Stage {stage === 'find' ? 1 : stage === 'review' ? 2 : stage === 'confirm' ? 3 : stage === 'processing' ? 4 : 5} of 5 — {stageDescription(stage)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <AnimatePresence mode="wait">
            {/* ─── Stage 1: FIND STUDENT ─── */}
            {stage === 'find' && (
              <motion.div key="find" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 py-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, ID, admission no, roll no, class, section…"
                    className="pl-8 h-9 text-xs"
                  />
                </div>
                <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                  {searchResults.map((s) => {
                    const out = Math.max(0, s.feeTotal - (s.scholarship ?? 0) - s.feePaid)
                    return (
                      <button
                        key={s.id}
                        onClick={() => { setSelectedId(s.id); setStage('review'); setAmount(out > 0 ? out : s.feeTotal) }}
                        className="w-full text-left rounded-lg border border-border/60 hover:border-primary/40 hover:bg-muted/30 px-3 py-2 transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold shrink-0">
                            {s.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{s.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{s.admissionNo} · {s.className}-{s.section} · Roll {s.rollNo}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {out > 0 ? (
                            <>
                              <p className="text-[10px] text-muted-foreground">Outstanding</p>
                              <p className="text-xs font-bold text-rose-600 tabular-nums">{formatINR(out, true)}</p>
                            </>
                          ) : (
                            <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-700 border-emerald-500/20">Paid</Badge>
                          )}
                        </div>
                      </button>
                    )
                  })}
                  {searchResults.length === 0 && (
                    <div className="py-8 text-center">
                      <Search className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No students match your search.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ─── Stage 2: REVIEW ─── */}
            {stage === 'review' && selectedStudent && (
              <motion.div key="review" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-3 py-2">
                <SelectedStudentCard student={selectedStudent} outstanding={outstanding} lateFee={lateFee} totalDue={totalDue} />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Amount (₹)</Label>
                    <Input
                      type="number"
                      value={amount || ''}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="font-display font-semibold tabular-nums"
                      placeholder="0"
                    />
                    {amount > outstanding && outstanding > 0 && (
                      <p className="text-[10px] text-amber-600 flex items-center gap-1">
                        <AlertCircle className="h-2.5 w-2.5" /> Exceeds outstanding by {formatINR(amount - outstanding, true)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Fee Head</Label>
                    <select value={feeHead} onChange={(e) => setFeeHead(e.target.value)} className="w-full h-9 rounded-md border border-border bg-background px-2 text-xs">
                      {['Tuition', 'Transport', 'Library', 'Exam', 'Activity', 'Late Fee', 'Admission', 'Registration'].map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px]">Purpose</Label>
                  <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full h-9 rounded-md border border-border bg-background px-2 text-xs">
                    {PURPOSE_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <Label className="text-[11px] mb-1.5 block">Payment Method</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {paymentModes.filter((m) => m.active).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-all',
                          mode === m.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:border-primary/40',
                        )}
                      >
                        <span className={cn('flex h-6 w-6 items-center justify-center rounded-md', modeAccent(m.id))}>
                          <ModeIcon mode={m.id} className="h-3 w-3" />
                        </span>
                        <span className="text-[10px] font-medium truncate">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode-specific reference fields */}
                <ModeReferenceFields mode={mode} referenceNo={referenceNo} setReferenceNo={setReferenceNo} meta={meta} setMeta={setMeta} />
              </motion.div>
            )}

            {/* ─── Stage 3: CONFIRM ─── */}
            {stage === 'confirm' && selectedStudent && (
              <motion.div key="confirm" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-3 py-2">
                {error && (
                  <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-2 flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-rose-700 dark:text-rose-300">{error}</p>
                  </div>
                )}
                <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-2">Confirm Payment</p>
                  <div className="space-y-1.5 text-xs">
                    <ConfirmRow label="Student" value={selectedStudent.name} />
                    <ConfirmRow label="Student ID" value={selectedStudent.admissionNo} />
                    <ConfirmRow label="Class" value={`${selectedStudent.className}-${selectedStudent.section}`} />
                    <ConfirmRow label="Fee Head" value={feeHead} />
                    <ConfirmRow label="Purpose" value={purpose} />
                    <ConfirmRow label="Amount" value={formatINR(amount)} bold />
                    <ConfirmRow label="Payment Mode" value={mode} />
                    {referenceNo && <ConfirmRow label="Reference No" value={referenceNo} />}
                    {meta.bankName && <ConfirmRow label="Bank" value={meta.bankName} />}
                    {meta.chequeNumber && <ConfirmRow label="Cheque No" value={meta.chequeNumber} />}
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-muted/30 border border-border p-2.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <p className="text-[11px] text-muted-foreground">Receipt will be generated on success.</p>
                </div>
              </motion.div>
            )}

            {/* ─── Stage 4: PROCESSING ─── */}
            {stage === 'processing' && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-12 text-center">
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-emerald-500/20 border-t-emerald-500"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-emerald-500" />
                  </div>
                </div>
                <p className="text-sm font-semibold mt-4">Recording Payment…</p>
                <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">{formatINR(amount)} via {mode}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-3 flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3" /> Do not close this window
                </p>
              </motion.div>
            )}

            {/* ─── Stage 5: SUCCESS + RECEIPT ─── */}
            {stage === 'success' && recordedTxn && (
              <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 py-2">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="flex flex-col items-center text-center py-3"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg mb-2">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <p className="font-display text-base font-bold text-emerald-700 dark:text-emerald-400">Payment Recorded</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{recordedTxn.receiptNo} · {formatINR(recordedTxn.amount)}</p>
                </motion.div>

                <div className="flex justify-center overflow-x-auto">
                  <ReceiptPreview
                    transaction={recordedTxn}
                    settings={receiptSettings}
                    onPrint={() => { printReceipt(recordedTxn, receiptSettings); toast.success('Print dialog opened') }}
                    onDownload={() => { downloadReceiptHTML(recordedTxn, receiptSettings); toast.success('Receipt downloaded', { description: `${recordedTxn.receiptNo}.html` }) }}
                  />
                </div>

                <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-2.5 flex items-start gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-muted-foreground">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">Payment recorded</p>
                    <p>Student balance, transactions, and reports updated.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter>
          {stage === 'find' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          )}
          {stage === 'review' && (
            <>
              <Button variant="outline" onClick={() => setStage('find')}><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
              <Button
                onClick={() => setStage('confirm')}
                disabled={!amount || amount <= 0}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              >
                Review <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          {stage === 'confirm' && (
            <>
              <Button variant="outline" onClick={() => setStage('review')}><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
              <Button
                onClick={handleSubmit}
                disabled={!amount || amount <= 0}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white min-w-[140px]"
              >
                <IndianRupee className="h-3.5 w-3.5" /> Pay {formatINR(amount)}
              </Button>
            </>
          )}
          {stage === 'success' && (
            <Button onClick={() => onOpenChange(false)} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
              <CheckCircle2 className="h-3.5 w-3.5" /> Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function stageDescription(stage: Stage): string {
  switch (stage) {
    case 'find': return 'Find student'
    case 'review': return 'Review outstanding + enter payment'
    case 'confirm': return 'Confirm details'
    case 'processing': return 'Recording payment'
    case 'success': return 'Receipt generated'
  }
}

function SelectedStudentCard({ student, outstanding, lateFee, totalDue }: { student: ReturnType<typeof useStudentsStore.getState>['students'][0]; outstanding: number; lateFee: number; totalDue: number }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-semibold shrink-0">
            {student.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{student.name}</p>
            <p className="text-[10px] text-muted-foreground font-mono">{student.admissionNo} · {student.className}-{student.section} · Roll {student.rollNo}</p>
          </div>
        </div>
        <FeeStatusBadge status={student.feeStatus === 'Paid' ? 'Paid' : student.feeStatus === 'Partial' ? 'Partially Paid' : 'Overdue'} />
      </div>
      <div className="grid grid-cols-3 gap-2 mt-2.5">
        <div className="rounded-md bg-card/60 px-2 py-1.5 text-center">
          <p className="text-[9px] text-muted-foreground uppercase">Outstanding</p>
          <p className="text-sm font-bold text-rose-600 tabular-nums">{formatINR(outstanding, true)}</p>
        </div>
        <div className="rounded-md bg-card/60 px-2 py-1.5 text-center">
          <p className="text-[9px] text-muted-foreground uppercase">Late Fee</p>
          <p className="text-sm font-bold text-amber-600 tabular-nums">{lateFee > 0 ? formatINR(lateFee, true) : '—'}</p>
        </div>
        <div className="rounded-md bg-card/60 px-2 py-1.5 text-center">
          <p className="text-[9px] text-muted-foreground uppercase">Total Due</p>
          <p className="text-sm font-bold tabular-nums">{formatINR(totalDue, true)}</p>
        </div>
      </div>
    </div>
  )
}

function ModeReferenceFields({ mode, referenceNo, setReferenceNo, meta, setMeta }: {
  mode: PaymentMode
  referenceNo: string
  setReferenceNo: (v: string) => void
  meta: { bankName?: string; chequeNumber?: string; chequeDate?: string; cardLast4?: string; upiId?: string; neftUtr?: string }
  setMeta: (m: typeof meta) => void
}) {
  if (mode === 'Cash') {
    return (
      <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-2.5 flex items-start gap-2">
        <AlertCircle className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground">Cash payment will require Principal verification before receipt is issued.</p>
      </div>
    )
  }
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px]">Reference No / Transaction ID</Label>
      <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder={mode === 'UPI' ? 'UPI-XXXXXXXXXX' : mode === 'Cheque' ? 'CHQ-XXXX' : mode === 'Card' ? 'CARD-****1234' : 'Reference number'} className="text-xs font-mono" />
      {mode === 'Cheque' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Bank Name</Label>
            <Input value={meta.bankName ?? ''} onChange={(e) => setMeta({ ...meta, bankName: e.target.value })} placeholder="HDFC / ICICI…" className="text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Cheque Date</Label>
            <Input type="date" value={meta.chequeDate ?? ''} onChange={(e) => setMeta({ ...meta, chequeDate: e.target.value })} className="text-xs" />
          </div>
        </div>
      )}
    </div>
  )
}

function ConfirmRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(bold && 'font-bold')}>{value}</span>
    </div>
  )
}
