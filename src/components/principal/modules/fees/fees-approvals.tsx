'use client'

/**
 * FeesApprovalsSection — Cash approval workflow with full context.
 *
 * Each pending cash request shows:
 *   - Student + amount + fee head
 *   - Collected by (teacher) + collection date + submission time
 *   - Notes from teacher
 *   - Student outstanding at time of submission (snapshot for context)
 *
 * Actions:
 *   - Approve → creates verified transaction + audit record + receipt
 *   - Reject → with reason + audit record
 *   - Request Clarification → with reason + audit record
 *
 * Also shows historical approvals for auditability.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, Check, X, AlertCircle, MessageSquare, Banknote, History,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFeeData, useFeeStore, type CashRequest } from '@/lib/store/fee-store'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { FeePanel, FeeEmptyState, FeeStatusBadge } from './fees-shared'
import { toast } from 'sonner'

export function FeesApprovalsSection({ data }: { data: ReturnType<typeof useFeeData> }) {
  const { cashRequests, audit } = data
  const approveCashRequest = useFeeStore((s) => s.approveCashRequest)
  const rejectCashRequest = useFeeStore((s) => s.rejectCashRequest)
  const requestClarification = useFeeStore((s) => s.requestClarification)

  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [clarifyId, setClarifyId] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  const pending = cashRequests.filter((r) => r.status === 'Pending Principal Acceptance' || r.status === 'Collected by Teacher')
  const resolved = cashRequests.filter((r) => r.status !== 'Pending Principal Acceptance' && r.status !== 'Collected by Teacher')
  const cashAudit = audit.filter((a) => a.entityType === 'cash_request')

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5">
          <p className="text-[9px] uppercase text-amber-700 dark:text-amber-300 font-semibold tracking-wider">Pending Approval</p>
          <p className="text-base font-bold tabular-nums mt-0.5">{pending.length}</p>
          <p className="text-[9px] text-muted-foreground">awaiting principal review</p>
        </div>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5">
          <p className="text-[9px] uppercase text-emerald-700 dark:text-emerald-300 font-semibold tracking-wider">Pending Amount</p>
          <p className="text-base font-bold tabular-nums mt-0.5">{formatINR(pending.reduce((s, r) => s + r.amount, 0), true)}</p>
          <p className="text-[9px] text-muted-foreground">in cash awaiting approval</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-2.5">
          <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">Resolved Today</p>
          <p className="text-base font-bold tabular-nums mt-0.5">{resolved.length}</p>
          <p className="text-[9px] text-muted-foreground">all-time approvals/rejections</p>
        </div>
      </div>

      {/* Cash workflow explainer */}
      <div className="rounded-lg bg-sky-500/5 border border-sky-500/20 p-2.5 flex items-start gap-2">
        <ShieldCheck className="h-3.5 w-3.5 text-sky-600 shrink-0 mt-0.5" />
        <div className="text-[11px] text-muted-foreground">
          <p className="font-semibold text-sky-700 dark:text-sky-300">Cash Payment Verification</p>
          <p className="mt-0.5">Teachers submit cash collections for Principal verification. Approved payments generate a receipt and are recorded for audit.</p>
        </div>
      </div>

      {/* Pending approvals */}
      <FeePanel
        title="Pending Cash Approvals"
        subtitle={`${pending.length} requests awaiting your decision`}
      >
        {pending.length === 0 ? (
          <FeeEmptyState
            icon={<Check className="h-6 w-6" />}
            title="No pending cash approvals"
            description="All submitted cash collections have been processed."
          />
        ) : (
          <div className="space-y-2">
            {pending.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-lg border border-border/60 bg-card p-3"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
                      <Banknote className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{r.studentName}</p>
                      <p className="text-[9px] text-muted-foreground font-mono">{r.admissionNo} · {r.className}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold tabular-nums text-emerald-600">{formatINR(r.amount, true)}</p>
                    <FeeStatusBadge status={r.status} />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                  <div className="rounded-md bg-muted/30 px-2 py-1">
                    <p className="text-[8px] text-muted-foreground uppercase font-semibold">Fee Head</p>
                    <p className="text-[10px] font-medium truncate">{r.feeHead}</p>
                  </div>
                  <div className="rounded-md bg-muted/30 px-2 py-1">
                    <p className="text-[8px] text-muted-foreground uppercase font-semibold">Collected By</p>
                    <p className="text-[10px] font-medium truncate">{r.collectedBy}</p>
                  </div>
                  <div className="rounded-md bg-muted/30 px-2 py-1">
                    <p className="text-[8px] text-muted-foreground uppercase font-semibold">Collected At</p>
                    <p className="text-[10px] font-medium">{formatDate(r.collectedAt)}</p>
                  </div>
                  <div className="rounded-md bg-muted/30 px-2 py-1">
                    <p className="text-[8px] text-muted-foreground uppercase font-semibold">Student Balance (then)</p>
                    <p className="text-[10px] font-bold tabular-nums">{r.contextBalanceAtSubmission ? formatINR(r.contextBalanceAtSubmission, true) : '—'}</p>
                  </div>
                </div>

                {r.notes && (
                  <div className="rounded-md bg-amber-500/5 border border-amber-500/20 p-2 mb-2">
                    <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium flex items-start gap-1.5">
                      <MessageSquare className="h-3 w-3 shrink-0 mt-0.5" />
                      {r.notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-1 pt-2 border-t border-border/40">
                  <Button
                    size="sm"
                    className="h-7 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                    onClick={() => {
                      approveCashRequest(r.id, 'Principal')
                      toast.success('Cash approved & receipt issued', { description: `${formatINR(r.amount)} approved for ${r.studentName}.` })
                    }}
                  >
                    <Check className="h-3 w-3" /> Approve & Issue Receipt
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] gap-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                    onClick={() => { setClarifyId(r.id); setReason('') }}
                  >
                    <MessageSquare className="h-3 w-3" /> Clarify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] gap-1 text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                    onClick={() => { setRejectingId(r.id); setReason('') }}
                  >
                    <X className="h-3 w-3" /> Reject
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </FeePanel>

      {/* Resolved history */}
      <FeePanel title="Approval History" subtitle={`${resolved.length} resolved requests`}>
        {resolved.length === 0 ? (
          <FeeEmptyState icon={<History className="h-5 w-5" />} title="No resolved approvals" description="Approved and rejected requests will appear here." />
        ) : (
          <div className="space-y-1.5">
            {resolved.map((r) => (
              <div key={r.id} className="flex items-center gap-2 rounded-md hover:bg-muted/30 px-2 py-1.5 transition-colors">
                <span className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1',
                  r.status === 'Confirmed by Principal' ? 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20' : 'bg-rose-500/10 text-rose-600 ring-rose-500/20',
                )}>
                  {r.status === 'Confirmed by Principal' ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{r.studentName} · <span className="text-muted-foreground font-mono text-[10px]">{r.admissionNo}</span></p>
                  <p className="text-[9px] text-muted-foreground">{r.collectedBy} · {formatDate(r.submittedAt)}</p>
                  {r.reason && <p className="text-[9px] text-amber-600 italic">"{r.reason}"</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold tabular-nums">{formatINR(r.amount, true)}</p>
                  <FeeStatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </FeePanel>

      {/* Audit log for cash requests */}
      <FeePanel title="Activity Log" subtitle="record of approval actions">
        {cashAudit.length > 0 ? (
          <div className="space-y-1.5">
            {cashAudit.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-start gap-2 rounded-md border border-border/40 px-2 py-1.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sky-500/10 text-sky-600">
                  <ShieldCheck className="h-3 w-3" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium">{a.description}</p>
                  <p className="text-[9px] text-muted-foreground">{formatDate(a.timestamp)} · by {a.actor}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <FeeEmptyState icon={<ShieldCheck className="h-5 w-5" />} title="No approval actions yet" />
        )}
      </FeePanel>

      {/* Reject modal */}
      <AnimatePresence>
        {rejectingId && (
          <ReasonModal
            title="Reject Cash Request"
            description="Provide a reason for rejecting this cash submission. The teacher will be notified."
            reason={reason}
            setReason={setReason}
            onClose={() => setRejectingId(null)}
            onSubmit={() => {
              const req = cashRequests.find((r) => r.id === rejectingId)
              rejectCashRequest(rejectingId, 'Principal', reason || 'No reason provided')
              toast.error('Cash request rejected', { description: `${req?.studentName ?? ''} — ${reason || 'No reason provided'}` })
              setRejectingId(null)
              setReason('')
            }}
            submitLabel="Reject"
            submitVariant="destructive"
          />
        )}
      </AnimatePresence>

      {/* Clarify modal */}
      <AnimatePresence>
        {clarifyId && (
          <ReasonModal
            title="Request Clarification"
            description="Describe what information is missing or unclear. The teacher must respond before approval."
            reason={reason}
            setReason={setReason}
            onClose={() => setClarifyId(null)}
            onSubmit={() => {
              const req = cashRequests.find((r) => r.id === clarifyId)
              requestClarification(clarifyId, 'Principal', reason || 'Please provide more details.')
              toast.info('Clarification requested', { description: `${req?.studentName ?? ''} — awaiting teacher response` })
              setClarifyId(null)
              setReason('')
            }}
            submitLabel="Request"
            submitVariant="amber"
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ReasonModal({ title, description, reason, setReason, onClose, onSubmit, submitLabel, submitVariant }: {
  title: string
  description: string
  reason: string
  setReason: (v: string) => void
  onClose: () => void
  onSubmit: () => void
  submitLabel: string
  submitVariant: 'destructive' | 'amber'
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
        className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            {submitVariant === 'destructive' ? <AlertCircle className="h-4 w-4 text-rose-600" /> : <MessageSquare className="h-4 w-4 text-amber-600" />}
            {title}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
        </div>
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter your reason…"
          rows={3}
          className="w-full text-xs rounded-md border border-border bg-background px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="flex items-center justify-end gap-1 mt-3">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            className={cn(
              'h-7 text-xs',
              submitVariant === 'destructive' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white',
            )}
            onClick={onSubmit}
          >
            {submitLabel}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
