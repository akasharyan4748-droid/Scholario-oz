'use client'

/**
 * FeesVerificationQueue — the cash-verification workflow, embedded in the
 * Payments operations page.
 *
 * UX principle (Summary → Decision with progressive disclosure):
 * each pending item shows the decision context at a glance — student,
 * admission no, class, amount, fee head, collector, collection date,
 * balance at submission, notes — and the three decision actions.
 * The confirm modals then show the full impact (balance before/after,
 * what approving/rejecting does) before the Principal commits.
 *
 * Business logic is UNCHANGED from the original approvals implementation:
 *   - Approve  → creates verified transaction + audit record + receipt +
 *                updates the student account
 *   - Reject   → mandatory reason → audit record (no transaction posted)
 *   - Clarify  → message → audit record, moves to "Clarification Requested"
 * Safety preserved: duplicate approval blocked, mandatory reject reason,
 * loading states, immutable audit entries.
 *
 * Flat layout (no box-inside-box): plain sections with divide-y rows.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, X, AlertCircle, MessageSquare, Banknote,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFeeData, useFeeStore, type CashRequest } from '@/lib/store/fee-store'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { FeeEmptyState, FeeStatusBadge } from './fees-shared'
import { toast } from 'sonner'

// Rejection reasons (structured list + "Other" with custom text)
const REJECT_REASONS = [
  'Incorrect amount',
  'Incorrect student',
  'Duplicate collection',
  'Insufficient evidence',
  'Invalid collection',
  'Other',
] as const

export function FeesVerificationQueue({ data }: { data: ReturnType<typeof useFeeData> }) {
  const { cashRequests, accounts } = data
  const approveCashRequest = useFeeStore((s) => s.approveCashRequest)
  const rejectCashRequest = useFeeStore((s) => s.rejectCashRequest)
  const requestClarification = useFeeStore((s) => s.requestClarification)

  // Modal state
  const [approvingReq, setApprovingReq] = useState<CashRequest | null>(null)
  const [rejectingReq, setRejectingReq] = useState<CashRequest | null>(null)
  const [clarifyReq, setClarifyReq] = useState<CashRequest | null>(null)
  const [rejectReason, setRejectReason] = useState<string>('')
  const [rejectNote, setRejectNote] = useState<string>('')
  const [clarifyMessage, setClarifyMessage] = useState<string>('')
  const [actionLoading, setActionLoading] = useState(false)

  const pending = cashRequests.filter((r) => r.status === 'Pending Principal Acceptance' || r.status === 'Collected by Teacher' || r.status === 'Clarification Requested')
  const resolved = cashRequests.filter((r) => r.status === 'Confirmed by Principal' || r.status === 'Rejected')

  // Compute the student's current outstanding for the approve modal
  const getStudentOutstanding = (studentId: string): number => {
    const acct = accounts.find((a) => a.studentId === studentId)
    return acct?.outstanding ?? 0
  }

  const handleApprove = () => {
    if (!approvingReq) return
    setActionLoading(true)
    approveCashRequest(approvingReq.id, 'Principal')
    toast.success('Payment approved successfully', {
      description: `Receipt issued for ${approvingReq.studentName}. Transaction posted to ledger.`,
    })
    setActionLoading(false)
    setApprovingReq(null)
  }

  const handleReject = () => {
    if (!rejectingReq) return
    const reason = rejectReason === 'Other' ? rejectNote : rejectReason
    if (!reason.trim()) {
      toast.error('Reason required', { description: 'Please select or enter a rejection reason.' })
      return
    }
    setActionLoading(true)
    rejectCashRequest(rejectingReq.id, 'Principal', reason)
    toast.error('Cash request rejected', {
      description: `${rejectingReq.studentName} — ${reason}. Teacher will be notified.`,
    })
    setActionLoading(false)
    setRejectingReq(null)
    setRejectReason('')
    setRejectNote('')
  }

  const handleClarify = () => {
    if (!clarifyReq) return
    if (!clarifyMessage.trim()) {
      toast.error('Message required', { description: 'Please enter a clarification message.' })
      return
    }
    setActionLoading(true)
    requestClarification(clarifyReq.id, 'Principal', clarifyMessage)
    toast.info('Clarification requested', {
      description: `${clarifyReq.studentName} — awaiting teacher response.`,
    })
    setActionLoading(false)
    setClarifyReq(null)
    setClarifyMessage('')
  }

  const pendingAmount = pending.reduce((s, r) => s + r.amount, 0)

  return (
    <div className="space-y-6">
      {/* ── Payments awaiting verification (the actionable queue) ─────── */}
      <section>
        <div className="flex items-baseline justify-between gap-3 mb-1 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Payments Awaiting Verification</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Cash collections submitted by teachers. Approving issues the receipt and posts the
              payment to the ledger.
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
            {pending.length} payment{pending.length === 1 ? '' : 's'} · {formatINR(pendingAmount, true)} awaiting
          </span>
        </div>

        {pending.length === 0 ? (
          <FeeEmptyState
            icon={<Check className="h-6 w-6" />}
            title="All caught up"
            description="No cash collections are waiting for your verification."
          />
        ) : (
          <div className="divide-y divide-border">
            {pending.map((r, i) => {
              const isPending = r.status === 'Pending Principal Acceptance' || r.status === 'Collected by Teacher'
              const isClarification = r.status === 'Clarification Requested'
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="py-3.5 first:pt-1"
                >
                  {/* Summary row — who, what, how much, what state */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md ring-1 bg-amber-500/10 text-amber-600 ring-amber-500/20"
                        title="Cash collection"
                      >
                        <Banknote className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{r.studentName}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{r.admissionNo} · {r.className}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold tabular-nums leading-tight">{formatINR(r.amount, true)}</p>
                      <FeeStatusBadge status={r.status} />
                    </div>
                  </div>

                  {/* Decision context — flat definition grid, no boxes */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 mt-2.5 text-[10px]">
                    <div className="min-w-0">
                      <span className="text-muted-foreground">Fee head · </span>
                      <span className="font-medium">{r.feeHead}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-muted-foreground">Mode · </span>
                      <span className="font-medium">Cash</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-muted-foreground">Collected by · </span>
                      <span className="font-medium truncate">{r.collectedBy}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-muted-foreground">Collected on · </span>
                      <span className="font-medium">{formatDate(r.collectedAt)}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-muted-foreground">Reference · </span>
                      <span className="font-medium font-mono">{r.referenceNo ?? '—'}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-muted-foreground">Balance then · </span>
                      <span className="font-bold tabular-nums">{r.contextBalanceAtSubmission ? formatINR(r.contextBalanceAtSubmission, true) : '—'}</span>
                    </div>
                  </div>

                  {/* Teacher's submitted note */}
                  {r.notes && (
                    <p className="mt-2 text-[10px] text-muted-foreground italic flex items-start gap-1.5">
                      <MessageSquare className="h-3 w-3 shrink-0 mt-px text-amber-600/70" />
                      {r.notes}
                    </p>
                  )}

                  {/* Clarification context (if the teacher was already asked) */}
                  {isClarification && r.reason && (
                    <p className="mt-1.5 text-[10px] text-sky-700 dark:text-sky-300 flex items-start gap-1.5">
                      <AlertCircle className="h-3 w-3 shrink-0 mt-px" />
                      Clarification requested: {r.reason}
                    </p>
                  )}

                  {/* Decision actions */}
                  <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                    <Button
                      size="sm"
                      className="h-7 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setApprovingReq(r)}
                      disabled={!isPending && !isClarification}
                    >
                      <Check className="h-3 w-3" /> Approve &amp; Issue Receipt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] gap-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                      onClick={() => { setClarifyReq(r); setClarifyMessage('') }}
                      disabled={!isPending && !isClarification}
                    >
                      <MessageSquare className="h-3 w-3" /> Request Clarification
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] gap-1 text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                      onClick={() => { setRejectingReq(r); setRejectReason(''); setRejectNote('') }}
                      disabled={!isPending && !isClarification}
                    >
                      <X className="h-3 w-3" /> Reject
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Recently resolved (compact audit of decisions) ───────────── */}
      {resolved.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <h3 className="text-sm font-semibold text-foreground">Recently Resolved</h3>
            <span className="text-[10px] text-muted-foreground">{resolved.length} resolved</span>
          </div>
          <div className="divide-y divide-border">
            {resolved.map((r) => (
              <div key={r.id} className="flex items-center gap-2.5 py-2">
                <span className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1',
                  r.status === 'Confirmed by Principal' ? 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20' : 'bg-rose-500/10 text-rose-600 ring-rose-500/20',
                )}>
                  {r.status === 'Confirmed by Principal' ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">
                    {r.studentName} · <span className="text-muted-foreground font-mono text-[10px]">{r.admissionNo}</span>
                  </p>
                  <p className="text-[9px] text-muted-foreground truncate">
                    {r.collectedBy} · {formatDate(r.submittedAt)}
                    {r.reason && <span className="text-amber-600 italic"> — "{r.reason}"</span>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold tabular-nums">{formatINR(r.amount, true)}</p>
                  <FeeStatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Confirmation modals (business logic unchanged) ───────────── */}
      <AnimatePresence>
        {approvingReq && (
          <ApproveModal
            req={approvingReq}
            currentOutstanding={getStudentOutstanding(approvingReq.studentId)}
            loading={actionLoading}
            onClose={() => setApprovingReq(null)}
            onConfirm={handleApprove}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rejectingReq && (
          <RejectModal
            req={rejectingReq}
            reason={rejectReason}
            setReason={setRejectReason}
            note={rejectNote}
            setNote={setRejectNote}
            loading={actionLoading}
            onClose={() => setRejectingReq(null)}
            onConfirm={handleReject}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {clarifyReq && (
          <ClarifyModal
            req={clarifyReq}
            message={clarifyMessage}
            setMessage={setClarifyMessage}
            loading={actionLoading}
            onClose={() => setClarifyReq(null)}
            onConfirm={handleClarify}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Approve Modal ──────────────────────────────────────────────────

function ApproveModal({ req, currentOutstanding, loading, onClose, onConfirm }: {
  req: CashRequest
  currentOutstanding: number
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const balanceAfter = Math.max(0, currentOutstanding - req.amount)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" />
            Approve Cash Payment?
          </h3>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Student</span>
            <span className="font-medium">{req.studentName}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Class</span>
            <span className="font-medium">{req.className}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Fee Head</span>
            <span className="font-medium">{req.feeHead}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Amount Submitted</span>
            <span className="font-bold tabular-nums text-emerald-600">{formatINR(req.amount, true)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Collected By</span>
            <span className="font-medium">{req.collectedBy}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Collected At</span>
            <span className="font-medium">{formatDate(req.collectedAt)}</span>
          </div>
          <div className="flex justify-between text-xs pt-2 border-t border-border/40">
            <span className="text-muted-foreground">Balance Before</span>
            <span className="font-bold tabular-nums text-rose-600">{formatINR(currentOutstanding, true)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Balance After</span>
            <span className="font-bold tabular-nums text-emerald-600">{formatINR(balanceAfter, true)}</span>
          </div>
          <div className="rounded-md bg-emerald-500/5 border border-emerald-500/20 p-2 mt-2">
            <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
              This will approve the cash collection, generate a receipt, post the transaction, update the student's fee account, reduce outstanding dues, and create an audit entry.
            </p>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {loading ? 'Approving...' : 'Approve & Issue Receipt'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Reject Modal ───────────────────────────────────────────────────

function RejectModal({ req, reason, setReason, note, setNote, loading, onClose, onConfirm }: {
  req: CashRequest
  reason: string
  setReason: (v: string) => void
  note: string
  setNote: (v: string) => void
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            Reject Cash Payment
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">{req.studentName} · {formatINR(req.amount, true)}</p>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Reason <span className="text-rose-600">*</span></label>
            <div className="grid grid-cols-2 gap-1.5 mt-1.5">
              {REJECT_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={cn(
                    'text-xs px-2 py-1.5 rounded-md border text-left transition-colors',
                    reason === r
                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted/40',
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          {reason === 'Other' && (
            <div>
              <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Custom Reason <span className="text-rose-600">*</span></label>
              <input
                autoFocus
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter custom reason…"
                className="w-full text-xs rounded-md border border-border bg-background px-2 py-1.5 mt-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
            </div>
          )}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Additional Note (optional)</label>
            <textarea
              value={note && reason !== 'Other' ? note : ''}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any additional context…"
              rows={2}
              className="w-full text-xs rounded-md border border-border bg-background px-2 py-1.5 mt-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
          </div>
          <div className="rounded-md bg-rose-500/5 border border-rose-500/20 p-2">
            <p className="text-[10px] text-rose-700 dark:text-rose-300">
              No transaction will be posted. No receipt will be issued. Student balance will NOT change. The collector will be notified with the reason.
            </p>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button size="sm" className="h-8 text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white" onClick={onConfirm} disabled={loading || !reason}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            {loading ? 'Rejecting...' : 'Reject Payment'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Clarify Modal ──────────────────────────────────────────────────

function ClarifyModal({ req, message, setMessage, loading, onClose, onConfirm }: {
  req: CashRequest
  message: string
  setMessage: (v: string) => void
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-amber-600" />
            Request Clarification
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">{req.studentName} · {formatINR(req.amount, true)}</p>
        </div>
        <div className="p-4 space-y-2">
          <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Message to Collector <span className="text-rose-600">*</span></label>
          <textarea
            autoFocus
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Please upload the original deposit slip and confirm the amount collected."
            rows={3}
            className="w-full text-xs rounded-md border border-border bg-background px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
          <div className="rounded-md bg-amber-500/5 border border-amber-500/20 p-2">
            <p className="text-[10px] text-amber-700 dark:text-amber-300">
              The collector will be notified. The request will move to "Clarification Requested" status until the teacher responds.
            </p>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button size="sm" className="h-8 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white" onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
            {loading ? 'Sending...' : 'Send Clarification'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
