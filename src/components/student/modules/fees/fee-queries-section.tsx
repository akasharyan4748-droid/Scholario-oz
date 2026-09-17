'use client'

/**
 * fees/fee-queries-section — FEE REQUESTS / DISPUTE (FEES-R §21).
 *
 * "Something doesn't look right?" → a minimal structured request the
 * student can raise against the real ledger (issue-type chips, the
 * related transaction auto-selected from THEIR transactions, a short
 * message). Submission persists a real request (REQ-2026-###) with a
 * timeline that starts at 'Submitted' — and the office's side of the
 * story renders on the same timeline.
 *
 * SECURITY/HONESTY (§21/§22): the student can only ever SUBMIT and READ.
 * There is no student-facing action that resolves, edits or withdraws a
 * request — status advances come from the school side only. The office
 * gets a live alert the moment a request lands (same convention the
 * manual-payment verification flow uses).
 */

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, FileQuestion, LifeBuoy, Send } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { formatINR, formatDate } from '@/lib/format'
import { toast } from 'sonner'
import type { FeeTransaction } from '@/lib/store/fee-store'
import {
  useStudentFeeQueriesStore,
  FEE_QUERY_ISSUE_TYPES,
  isQueryOpen,
  latestStatusOf,
  type FeeQueryIssueType,
} from '@/lib/store/student-fee-queries-store'
import { useLiveAlerts } from '@/lib/store/live-alerts-store'

interface FeeQueriesSectionProps {
  /** The student's real transactions (related-transaction picker). */
  transactions: FeeTransaction[]
  /** Form dialog open state — shared so Get help routes can open it. */
  formOpen: boolean
  onFormOpenChange: (open: boolean) => void
}

const STEP_TONE: Record<string, { dot: string; text: string }> = {
  Submitted: { dot: 'bg-muted-foreground/60', text: 'text-foreground' },
  'Under review': { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400' },
  Resolved: { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
}

export function FeeQueriesSection({ transactions, formOpen, onFormOpenChange }: FeeQueriesSectionProps) {
  const queries = useStudentFeeQueriesStore((s) => s.queries)
  const submitFeeQuery = useStudentFeeQueriesStore((s) => s.submitFeeQuery)
  const addAlert = useLiveAlerts((s) => s.addAlert)

  const openCount = queries.filter(isQueryOpen).length

  // Newest transaction first — the picker (and its default) follow the
  // ledger's real chronology, never array insertion order.
  const sortedTxns = useMemo(
    () => [...transactions].sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1
      return (a.recordedAt ?? '') < (b.recordedAt ?? '') ? 1 : -1
    }),
    [transactions],
  )

  // ── Form state (reset every time the dialog opens) ───────────────────
  const [issueType, setIssueType] = useState<FeeQueryIssueType>('Payment missing')
  const [relatedReceipt, setRelatedReceipt] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (formOpen) {
      setIssueType('Payment missing')
      // Default: the most recent transaction on the ledger (§21 — the
      // related transaction is AUTO-selected, not hand-typed).
      setRelatedReceipt(sortedTxns.length > 0 ? sortedTxns[0]?.receiptNo ?? null : null)
      setMessage('')
    }
  }, [formOpen, sortedTxns])

  const messageTooShort = message.trim().length < 10

  const handleSubmit = () => {
    const res = submitFeeQuery({
      issueType,
      ...(relatedReceipt ? { relatedTxnReceiptNo: relatedReceipt } : {}),
      message,
    })
    if (!res.ok) {
      toast.error('Could not submit the request', { description: res.error })
      return
    }
    // Office-side visibility — same live-alert convention the manual
    // payment verification flow uses (the office sees the new case).
    addAlert({
      id: `alert-feequery-${Date.now()}`,
      severity: 'high',
      title: 'Fee query raised',
      desc: `${res.query.id} · ${res.query.issueType}${res.query.relatedTxnReceiptNo ? ` · ref ${res.query.relatedTxnReceiptNo}` : ''} — respond on the fee requests timeline.`,
      color: 'amber',
      navKey: 'fees',
      isNew: true,
      time: 'just now',
    })
    onFormOpenChange(false)
    toast.success(`Request ${res.query.id} submitted`, {
      description: 'The school office will respond here — follow the timeline below.',
    })
  }

  return (
    <>
      <GlassCard className="p-4 sm:p-5" data-testid="fee-requests">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400" aria-hidden>
                <LifeBuoy className="h-3.5 w-3.5" />
              </span>
              Fee requests
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Something doesn't look right? Raise it — the office responds here.</p>
          </div>
          {openCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
              {openCount} open
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground">No open requests</span>
          )}
        </div>

        {/* My requests — timelines (§21: the user must never wonder
            whether the school received their complaint). */}
        {queries.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
            No open requests.
          </p>
        ) : (
          <ul className="mt-4 space-y-3" aria-label="My fee requests">
            {queries.map((q) => {
              const resolved = !isQueryOpen(q)
              return (
                <li key={q.id} className="rounded-xl border border-border/80 bg-card/60 p-3.5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] font-semibold text-foreground">{q.id}</p>
                      <p className="mt-0.5 text-xs font-medium text-foreground">
                        {q.issueType}
                        {q.relatedTxnReceiptNo && (
                          <span className="ml-1.5 font-mono text-[10px] font-normal text-muted-foreground">· {q.relatedTxnReceiptNo}</span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">Submitted {formatDate(q.submittedOn)}</p>
                    </div>
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold',
                        resolved
                          ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400',
                      )}
                      role="status"
                    >
                      {resolved && <CheckCircle2 className="h-3 w-3" aria-hidden />}
                      {resolved ? 'Resolved' : 'Open'}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{q.message}</p>
                  <ol className="mt-2.5 border-t border-border/70 pt-2.5" aria-label={`Timeline for ${q.id}`}>
                    {q.timeline.map((p) => {
                      const tone = STEP_TONE[p.status] ?? STEP_TONE.Submitted
                      return (
                        <li key={`${q.id}-${p.status}-${p.at}`} className="flex items-start gap-2.5 py-1">
                          <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', tone.dot)} aria-hidden />
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-foreground">
                              {p.status}
                              <span className="ml-2 font-normal text-[10px] text-muted-foreground">{formatDate(p.at)}</span>
                            </p>
                            {p.note && <p className="text-[10px] leading-relaxed text-muted-foreground">{p.note}</p>}
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </li>
              )
            })}
          </ul>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onFormOpenChange(true)}
          className="mt-4 h-11 w-full gap-1.5 sm:w-auto"
        >
          <FileQuestion className="h-4 w-4" aria-hidden /> Raise a request
        </Button>
      </GlassCard>

      {/* ── The minimal request form (§21) ────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={onFormOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400" aria-hidden>
                <FileQuestion className="h-4 w-4" />
              </span>
              Raise a fee request
            </DialogTitle>
            <DialogDescription>
              The school office reviews every request and responds on its timeline — you'll see it under Fee requests.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Issue type — chips, single choice */}
            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-foreground">What is it about?</legend>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Issue type">
                {FEE_QUERY_ISSUE_TYPES.map((type) => {
                  const active = issueType === type
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setIssueType(type)}
                      aria-pressed={active}
                      className={cn(
                        'min-h-11 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                        active
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          : 'border-border bg-card/60 text-muted-foreground hover:border-amber-500/30 hover:text-foreground',
                      )}
                    >
                      {type}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            {/* Related transaction — auto-selected from MY transactions */}
            {sortedTxns.length > 0 && (
              <fieldset>
                <legend className="mb-2 text-xs font-semibold text-foreground">Related payment</legend>
                <div className="max-h-36 space-y-1.5 overflow-y-auto pr-1" role="radiogroup" aria-label="Related payment">
                  {sortedTxns.map((t) => {
                    const active = relatedReceipt === t.receiptNo
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setRelatedReceipt(t.receiptNo)}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                          active ? 'border-amber-500/40 bg-amber-500/[0.06]' : 'border-border bg-card/60 hover:border-amber-500/25',
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-foreground">{t.purpose}</span>
                          <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                            {t.receiptNo} · {formatDate(t.date)}
                          </span>
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums text-foreground">{formatINR(t.amount)}</span>
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={relatedReceipt === null}
                    onClick={() => setRelatedReceipt(null)}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                      relatedReceipt === null ? 'border-amber-500/40 bg-amber-500/[0.06] font-medium text-foreground' : 'border-border bg-card/60 text-muted-foreground hover:border-amber-500/25',
                    )}
                  >
                    Not about a specific payment
                  </button>
                </div>
              </fieldset>
            )}

            {/* Short message */}
            <div>
              <label htmlFor="fee-query-message" className="mb-2 block text-xs font-semibold text-foreground">
                Tell us briefly what's wrong
              </label>
              <Textarea
                id="fee-query-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. The receipt amount doesn't match what I paid…"
                className="min-h-[88px] text-xs"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onFormOpenChange(false)} className="h-11">Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={messageTooShort}
              className="h-11 gap-1.5 bg-amber-600 text-white hover:bg-amber-700"
            >
              <Send className="h-3.5 w-3.5" aria-hidden /> Submit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
