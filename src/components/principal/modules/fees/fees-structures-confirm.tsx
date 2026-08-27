'use client'

/**
 * FeesStructuresConfirmDialog — Review + double confirmation for any
 * versioned Fee Structure publish / schedule action.
 *
 * Step 1: Review Changes
 *   - OLD VALUE → NEW VALUE for each changed fee head
 *   - Effective Date (editable for schedule mode)
 *   - Affected classes + student count
 *   - Reason field (required for every financial change)
 *
 * Step 2: Confirm
 *   - For high-impact changes (affecting > 100 students OR > 10%
 *     increase in total amount): the principal MUST type the exact
 *     phrase "UPDATE FEE STRUCTURE" before the final Confirm & Publish
 *     button becomes enabled.
 *
 * The dialog never destroys history — on confirm, the parent calls
 * `publishFeeStructureVersion` or `scheduleFeeStructureVersion`, both
 * of which create a new version with an immutable audit log entry.
 */

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, ArrowRight, Check, X, Calendar, Users,
  FileText, ShieldAlert, ShieldCheck, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import type { FeeHead, FeeStructureConfig } from '@/lib/store/fee-store'
import { computeHeadsTotal } from '@/lib/store/fee-store'
import { useStudentsStore } from '@/lib/store/students-store'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface ConfirmChangesProps {
  open: boolean
  structure: FeeStructureConfig
  oldHeads: FeeHead[]
  newHeads: FeeHead[]
  effectiveFrom: string
  mode: 'publish' | 'schedule' | 'revision'
  onConfirm: (reason: string, effectiveFrom: string) => void
  onClose: () => void
}

const HIGH_IMPACT_STUDENT_THRESHOLD = 100
const HIGH_IMPACT_PCT_THRESHOLD = 10 // % total amount increase

export function FeesStructuresConfirmDialog({
  open, structure, oldHeads, newHeads, effectiveFrom: initialEffectiveFrom, mode, onConfirm, onClose,
}: ConfirmChangesProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [reason, setReason] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState(initialEffectiveFrom)
  const [confirmText, setConfirmText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reset internal state when the dialog is opened.
  useEffect(() => {
    if (open) {
      setStep(1)
      setReason('')
      setEffectiveFrom(initialEffectiveFrom)
      setConfirmText('')
      setSubmitting(false)
    }
  }, [open, initialEffectiveFrom])

  // Compute affected students using the same className → classLevel logic
  // as computeAccount. Inlined here to avoid a new store export.
  const affectedStudents = useMemo(() => {
    const students = useStudentsStore.getState().students
    return students.filter((s) => s.status === 'Active').filter((s) => {
      const level =
        s.className.includes('11') || s.className.includes('12') ? 'Senior Secondary' :
        s.className.includes('9') || s.className.includes('10') ? 'Secondary' :
        s.className.match(/Class [6-8]/) ? 'Middle' :
        s.className.match(/Class [1-5]/) ? 'Primary' : 'Pre-Primary'
      return level === structure.classLevel
    }).length
  }, [structure.classLevel])

  // Compute the diff between old and new heads.
  const changes = useMemo(() => {
    const rows: { headName: string; oldValue: number; newValue: number; kind: 'added' | 'removed' | 'modified' | 'unchanged' }[] = []
    const seen = new Set<string>()
    for (const h of newHeads) {
      seen.add(h.name)
      const old = oldHeads.find((o) => o.name === h.name)
      if (!old) {
        rows.push({ headName: h.name, oldValue: 0, newValue: h.amount, kind: 'added' })
      } else if (old.amount !== h.amount) {
        rows.push({ headName: h.name, oldValue: old.amount, newValue: h.amount, kind: 'modified' })
      }
    }
    for (const h of oldHeads) {
      if (!seen.has(h.name)) {
        rows.push({ headName: h.name, oldValue: h.amount, newValue: 0, kind: 'removed' })
      }
    }
    return rows
  }, [oldHeads, newHeads])

  const oldTotal = computeHeadsTotal(oldHeads)
  const newTotal = computeHeadsTotal(newHeads)
  const totalDiff = newTotal - oldTotal
  const pctDiff = oldTotal > 0 ? (totalDiff / oldTotal) * 100 : 0

  const isHighImpact = affectedStudents > HIGH_IMPACT_STUDENT_THRESHOLD || pctDiff > HIGH_IMPACT_PCT_THRESHOLD
  const reasonValid = reason.trim().length >= 10
  const confirmTextValid = !isHighImpact || confirmText.trim() === 'UPDATE FEE STRUCTURE'
  const hasChanges = changes.length > 0
  const effectiveDateValid = !!effectiveFrom

  const canProceedToStep2 = hasChanges && reasonValid && effectiveDateValid
  const canSubmit = canProceedToStep2 && confirmTextValid && !submitting

  const submit = () => {
    if (!canSubmit) return
    setSubmitting(true)
    // Slight delay so the user sees the "Working…" state — preserves the
    // enterprise feel of a financial commit.
    setTimeout(() => {
      onConfirm(reason.trim(), effectiveFrom)
      setSubmitting(false)
    }, 350)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="bg-card border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-border bg-gradient-to-br from-amber-500/5 via-transparent to-transparent">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1',
                    isHighImpact ? 'bg-rose-500/10 text-rose-600 ring-rose-500/20' : 'bg-amber-500/10 text-amber-600 ring-amber-500/20',
                  )}>
                    {isHighImpact ? <ShieldAlert className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold truncate">
                      {mode === 'revision' ? 'Submit Revision' : mode === 'publish' ? 'Publish New Version' : 'Schedule New Version'} — {structure.className}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Step {step} of 2 · {step === 1 ? 'Review Changes' : 'Confirm & Commit'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {step === 1 ? (
                <Step1Review
                  changes={changes}
                  oldTotal={oldTotal}
                  newTotal={newTotal}
                  totalDiff={totalDiff}
                  pctDiff={pctDiff}
                  affectedStudents={affectedStudents}
                  structure={structure}
                  reason={reason}
                  setReason={setReason}
                  effectiveFrom={effectiveFrom}
                  setEffectiveFrom={setEffectiveFrom}
                  mode={mode as 'publish' | 'schedule' | 'revision'}
                  reasonValid={reasonValid}
                  feeHeadsCount={newHeads.filter((h) => h.active).length}
                />
              ) : (
                <Step2Confirm
                  isHighImpact={isHighImpact}
                  confirmText={confirmText}
                  setConfirmText={setConfirmText}
                  mode={mode as 'publish' | 'schedule' | 'revision'}
                  structure={structure}
                  newTotal={newTotal}
                  affectedStudents={affectedStudents}
                  effectiveFrom={effectiveFrom}
                  reason={reason}
                />
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border bg-muted/30 px-5 py-3 flex items-center justify-between gap-2">
              <div className="text-[10px] text-muted-foreground">
                {step === 1
                  ? hasChanges ? `${changes.length} change${changes.length === 1 ? '' : 's'} to review` : 'No changes detected'
                  : isHighImpact ? 'High-impact change — type the confirmation phrase' : 'Ready to commit'}
              </div>
              <div className="flex items-center gap-2">
                {step === 2 && (
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setStep(1)} disabled={submitting}>
                    Back
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onClose} disabled={submitting}>
                  Cancel
                </Button>
                {step === 1 ? (
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={!canProceedToStep2}
                    onClick={() => setStep(2)}
                  >
                    Continue to Confirm <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className={cn(
                      'h-8 text-xs gap-1.5 text-white',
                      isHighImpact ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700',
                    )}
                    disabled={!canSubmit}
                    onClick={submit}
                  >
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    {mode === 'revision' ? 'Submit Revision' : mode === 'publish' ? 'Confirm & Publish' : 'Confirm & Schedule'}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Step 1: Review Changes ─────────────────────────────────────────

interface Step1Props {
  changes: { headName: string; oldValue: number; newValue: number; kind: 'added' | 'removed' | 'modified' | 'unchanged' }[]
  oldTotal: number
  newTotal: number
  totalDiff: number
  pctDiff: number
  affectedStudents: number
  structure: FeeStructureConfig
  reason: string
  setReason: (v: string) => void
  effectiveFrom: string
  setEffectiveFrom: (v: string) => void
  mode: 'publish' | 'schedule' | 'revision'
  reasonValid: boolean
  /** Number of active fee heads in the new version. Fix 5 (FEE-CORRECT). */
  feeHeadsCount: number
}

function Step1Review({
  changes, oldTotal, newTotal, totalDiff, pctDiff, affectedStudents, structure,
  reason, setReason, effectiveFrom, setEffectiveFrom, mode, reasonValid, feeHeadsCount,
}: Step1Props) {
  const today = new Date().toISOString().split('T')[0]
  return (
    <div className="space-y-4">
      {/* Summary stats — Fix 5 (FEE-CORRECT): added a Fee Heads stat so
          the operator sees both the financial total AND the structural
          breadth of the change before committing. */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
          <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider flex items-center gap-1"><Users className="h-2.5 w-2.5" /> Affected</p>
          <p className="text-sm font-bold tabular-nums mt-0.5">{affectedStudents}</p>
          <p className="text-[9px] text-muted-foreground">students in {structure.className}</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
          <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider flex items-center gap-1"><FileText className="h-2.5 w-2.5" /> Fee Heads</p>
          <p className="text-sm font-bold tabular-nums mt-0.5">{feeHeadsCount}</p>
          <p className="text-[9px] text-muted-foreground">active heads in new version</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
          <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> Effective</p>
          <p className="text-sm font-bold tabular-nums mt-0.5">{effectiveFrom || '—'}</p>
          <p className="text-[9px] text-muted-foreground">{mode === 'schedule' ? 'scheduled' : 'after 60% acknowledgement'}</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
          <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">Old Total</p>
          <p className="text-sm font-bold tabular-nums mt-0.5">{formatINR(oldTotal, true)}</p>
        </div>
        <div className={cn(
          'rounded-lg px-2.5 py-1.5',
          totalDiff > 0 ? 'bg-rose-500/10' : totalDiff < 0 ? 'bg-emerald-500/10' : 'bg-muted/40',
        )}>
          <p className={cn(
            'text-[9px] uppercase font-semibold tracking-wider',
            totalDiff > 0 ? 'text-rose-700 dark:text-rose-300' : totalDiff < 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground',
          )}>New Total</p>
          <p className={cn(
            'text-sm font-bold tabular-nums mt-0.5',
            totalDiff > 0 ? 'text-rose-700 dark:text-rose-300' : totalDiff < 0 ? 'text-emerald-700 dark:text-emerald-300' : '',
          )}>{formatINR(newTotal, true)}</p>
          {totalDiff !== 0 && (
            <p className="text-[9px] text-muted-foreground">
              {totalDiff > 0 ? '+' : ''}{formatINR(totalDiff, true)} ({pctDiff > 0 ? '+' : ''}{pctDiff.toFixed(1)}%)
            </p>
          )}
        </div>
      </div>

      {/* Fix 5 (FEE-CORRECT): "Future dues only" clarification banner —
          makes the financial-safety guarantee explicit before the user
          commits. Mirrors the existing "What is preserved" language used
          in the delete dialog. */}
      <div className="rounded-md border border-sky-500/30 bg-sky-500/5 px-3 py-2">
        <p className="text-[11px] text-sky-700 dark:text-sky-300 font-semibold flex items-center gap-1.5 mb-1">
          <ShieldCheck className="h-3.5 w-3.5" /> Future dues only
        </p>
        <ul className="text-[10px] text-muted-foreground space-y-0.5 ml-5 list-disc">
          <li>This change affects <span className="font-semibold text-foreground">future dues</span> — students who haven't paid yet will be charged against the new version.</li>
          <li>Existing <span className="font-semibold text-foreground">payments and receipts will NOT be changed</span> — already-issued receipts keep their original amounts.</li>
          <li>Existing <span className="font-semibold text-foreground">concessions will NOT be changed</span> — sibling / staff-ward / scholarship concessions stay on the student's record.</li>
        </ul>
      </div>

      {/* Effective date (for schedule mode, editable) */}
      {mode === 'schedule' && (
        <div>
          <Label className="text-[11px] font-medium">Effective Date <span className="text-rose-500">*</span></Label>
          <Input
            type="date"
            value={effectiveFrom}
            min={today}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            className="h-8 text-xs mt-1 max-w-[200px]"
          />
          <p className="text-[10px] text-muted-foreground mt-1">The new version becomes current on this date.</p>
        </div>
      )}

      {/* Change list */}
      <div>
        <p className="text-[11px] font-semibold mb-1.5 flex items-center gap-1.5">
          <FileText className="h-3 w-3" /> Fee Head Changes
        </p>
        {changes.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-[11px] text-muted-foreground">
            No changes detected — old and new heads are identical.
          </div>
        ) : (
          <div className="rounded-md border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-2.5 py-1.5 bg-muted/40 text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">
              <span>Fee Head</span>
              <span className="text-right">Old</span>
              <span className="text-right">New</span>
              <span className="text-right">Change</span>
            </div>
            <div className="max-h-56 overflow-y-auto divide-y divide-border/40">
              {changes.map((c, i) => {
                const diff = c.newValue - c.oldValue
                const kindLabel = c.kind === 'added' ? 'NEW' : c.kind === 'removed' ? 'DEL' : 'MOD'
                const kindAccent = c.kind === 'added' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : c.kind === 'removed' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                return (
                  <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-2.5 py-1.5 text-[11px] items-center hover:bg-muted/20">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Badge variant="outline" className={cn('text-[7px] py-0 px-1 h-3.5 font-mono', kindAccent)}>{kindLabel}</Badge>
                      <span className="truncate font-medium">{c.headName}</span>
                    </div>
                    <span className="font-mono tabular-nums text-right text-muted-foreground">{c.oldValue === 0 ? '—' : formatINR(c.oldValue, true)}</span>
                    <span className="font-mono tabular-nums text-right font-semibold">{c.newValue === 0 ? '—' : formatINR(c.newValue, true)}</span>
                    <span className={cn(
                      'font-mono tabular-nums text-right font-semibold',
                      diff > 0 ? 'text-rose-600' : diff < 0 ? 'text-emerald-600' : 'text-muted-foreground',
                    )}>
                      {diff === 0 ? '—' : (diff > 0 ? '+' : '') + formatINR(diff, true)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Reason (required) */}
      <div>
        <Label className="text-[11px] font-medium flex items-center gap-1">
          Reason for change <span className="text-rose-500">*</span>
          {!reasonValid && reason.length > 0 && <span className="text-[9px] text-rose-500 ml-1">(min 10 chars)</span>}
        </Label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Annual revision approved by Management Committee on 12-Nov-2025. Tuition hiked 8% to cover inflation; Library fee restructured."
          rows={3}
          className="text-xs mt-1 resize-none"
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          This reason is recorded in the immutable audit log and included in the parent notification.
        </p>
      </div>
    </div>
  )
}

// ─── Step 2: Confirm ────────────────────────────────────────────────

interface Step2Props {
  isHighImpact: boolean
  confirmText: string
  setConfirmText: (v: string) => void
  mode: 'publish' | 'schedule' | 'revision'
  structure: FeeStructureConfig
  newTotal: number
  affectedStudents: number
  effectiveFrom: string
  reason: string
}

function Step2Confirm({
  isHighImpact, confirmText, setConfirmText, mode, structure, newTotal, affectedStudents, effectiveFrom, reason,
}: Step2Props) {
  return (
    <div className="space-y-4">
      {/* Recap */}
      <div className={cn(
        'rounded-lg border p-3',
        isHighImpact ? 'border-rose-500/30 bg-rose-500/5' : 'border-emerald-500/30 bg-emerald-500/5',
      )}>
        <div className="flex items-start gap-2">
          {isHighImpact ? <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" /> : <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />}
          <div className="text-[11px] leading-relaxed">
            <p className={cn('font-semibold', isHighImpact ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300')}>
              {isHighImpact ? 'High-impact change — additional confirmation required' : 'Standard impact — ready to commit'}
            </p>
            <p className="text-muted-foreground mt-1">
              You are about to {mode === 'revision' ? 'submit a revision of' : mode === 'publish' ? 'publish' : 'schedule'} a new version of
              <span className="font-semibold text-foreground"> {structure.className}</span> with a
              total of <span className="font-semibold text-foreground tabular-nums">{formatINR(newTotal, true)}</span>,
              affecting <span className="font-semibold text-foreground tabular-nums">{affectedStudents}</span> students,
              effective <span className="font-semibold text-foreground">{effectiveFrom}</span>.
            </p>
            <p className="text-muted-foreground mt-1">
              Reason: <span className="italic text-foreground">"{reason}"</span>
            </p>
          </div>
        </div>
      </div>

      {/* What will happen */}
      <div className="rounded-md border border-border bg-muted/20 p-3">
        <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1.5">What will happen</p>
        <ul className="text-[11px] space-y-1 text-muted-foreground">
          <li className="flex items-start gap-1.5"><Check className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" /> A new version (immutable snapshot) is created</li>
          <li className="flex items-start gap-1.5"><Check className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" /> {mode === 'revision' ? 'Published version keeps applying until 60% of guardians approve' : mode === 'publish' ? 'Previous current version is archived' : 'Current version stays active until the effective date'}</li>
          <li className="flex items-start gap-1.5"><Check className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" /> An audit log entry is recorded (cannot be edited or deleted)</li>
          <li className="flex items-start gap-1.5"><Check className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" /> Affected parents are notified via Push + SMS + Email</li>
          <li className="flex items-start gap-1.5"><Check className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" /> <span><span className="font-semibold text-foreground">Future dues only</span> — only students who haven't paid yet are affected.</span></li>
          <li className="flex items-start gap-1.5"><Check className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" /> Existing <span className="font-semibold text-foreground">payments and receipts will NOT be changed</span> — already-issued receipts keep their original amounts.</li>
          <li className="flex items-start gap-1.5"><Check className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" /> Existing <span className="font-semibold text-foreground">concessions will NOT be changed</span> — sibling / staff-ward / scholarship concessions stay on the student's record.</li>
        </ul>
      </div>

      {/* High-impact confirmation */}
      {isHighImpact && (
        <div>
          <Label className="text-[11px] font-medium flex items-center gap-1.5">
            <ShieldAlert className="h-3 w-3 text-rose-600" />
            Type the phrase below to confirm <span className="text-rose-500">*</span>
          </Label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder='Type "UPDATE FEE STRUCTURE"'
            className="mt-1 font-mono text-xs"
            autoFocus
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            This change affects {affectedStudents} students. Type the exact phrase
            <code className="mx-1 px-1 py-0.5 rounded bg-muted text-foreground font-mono text-[10px]">UPDATE FEE STRUCTURE</code>
            to enable the final confirmation.
          </p>
        </div>
      )}
    </div>
  )
}
