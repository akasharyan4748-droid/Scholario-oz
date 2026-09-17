'use client'

/**
 * FeeQueriesSection — the school-facing half of the fee query workflow
 * (Principal Fee Management → Fee Queries tab).
 *
 * Students raise fee queries / disputes / escalations from their Fees
 * module (student-fee-issues-store — ONE store, ONE lifecycle). This
 * queue is where the school acts on them:
 *
 *   Open        → Assign (Accounts Office / Principal's Office / Fee Desk)
 *                 · Under Review · Close
 *   Assigned    → Waiting for Information (back to the student) · Resolve · Close
 *   Under Review→ Waiting for Information · Resolve · Close
 *   Waiting     → Under Review (student replied) · Resolve · Close
 *   Resolved/Closed → read-only history
 *
 * UI language: the SAME compact table workflow as the verification queue
 * (sticky muted header, 11px uppercase columns, py-2.5 rows, hover,
 * responsive column hiding) — a queue, not oversized cards. Row expansion
 * reveals the full case timeline + the student's original message, so the
 * Principal can never wonder what was already communicated. The store
 * validates every transition; every action lands on the immutable
 * timeline the student sees under Need Help · My Fee Queries.
 */

import { Fragment, useMemo, useState } from 'react'
import {
  ArrowUpRight, Check, ChevronDown, ClipboardList, LifeBuoy, MessageSquare,
  Send, UserCheck, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import { Panel } from '../shared/panel'
import { FeeEmptyState } from './fees-shared'
import {
  useStudentFeeIssuesStore,
  isActiveIssue,
  type FeeIssue,
  type FeeIssueStatus,
} from '@/lib/store/student-fee-issues-store'

const ACTOR = 'Principal'
const ASSIGN_TARGETS = ['Accounts Office', "Principal's Office", 'Fee Desk', 'Class Teacher Desk']

/** Status chip — the queue vocabulary (never colour-alone: dot + label). */
function statusChip(status: FeeIssueStatus): { label: string; tone: string } {
  switch (status) {
    case 'Open': return { label: 'Open', tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' }
    case 'Assigned': return { label: 'Assigned', tone: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' }
    case 'Under Review': return { label: 'In review', tone: 'bg-violet-500/10 text-violet-700 dark:text-violet-300' }
    case 'Waiting for Information': return { label: 'Waiting on student', tone: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300' }
    case 'Resolved': return { label: 'Resolved', tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' }
    case 'Closed': return { label: 'Closed', tone: 'bg-muted text-muted-foreground' }
  }
}

function IssueStatusChip({ status }: { status: FeeIssueStatus }) {
  const { label, tone } = statusChip(status)
  return (
    <span
      title={status}
      className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap', tone)}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden />
      {label}
    </span>
  )
}

function typeTone(type: FeeIssue['type']): string {
  if (type === 'Escalation') return 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
  return 'bg-muted text-muted-foreground'
}

export function FeeQueriesSection() {
  const issues = useStudentFeeIssuesStore((s) => s.issues)
  const assignIssue = useStudentFeeIssuesStore((s) => s.assignIssue)
  const updateIssueStatus = useStudentFeeIssuesStore((s) => s.updateIssueStatus)
  const resolveIssue = useStudentFeeIssuesStore((s) => s.resolveIssue)
  const closeIssue = useStudentFeeIssuesStore((s) => s.closeIssue)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [assigning, setAssigning] = useState<FeeIssue | null>(null)
  const [assignTo, setAssignTo] = useState(ASSIGN_TARGETS[0])
  const [resolving, setResolving] = useState<FeeIssue | null>(null)
  const [resolutionNote, setResolutionNote] = useState('')
  const [closing, setClosing] = useState<FeeIssue | null>(null)
  const [closeNote, setCloseNote] = useState('')
  const [noteError, setNoteError] = useState<string | null>(null)

  const active = useMemo(() => issues.filter(isActiveIssue), [issues])
  // Active queue first (newest update first), resolved history after.
  const sorted = useMemo(() => {
    const act = issues
      .filter(isActiveIssue)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    const done = issues
      .filter((i) => !isActiveIssue(i))
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    return [...act, ...done]
  }, [issues])

  const counts = {
    open: issues.filter((i) => i.status === 'Open').length,
    assigned: issues.filter((i) => i.status === 'Assigned' || i.status === 'Under Review').length,
    waiting: issues.filter((i) => i.status === 'Waiting for Information').length,
    resolved: issues.filter((i) => i.status === 'Resolved').length,
  }

  const act = (fn: () => { ok: boolean; error?: string }, success: { title: string; description: string }) => {
    const result = fn()
    if (result.ok) toast.success(success.title, { description: success.description })
    else toast.error('Action failed', { description: result.error ?? 'Please try again.' })
    return result.ok
  }

  const handleAssign = () => {
    if (!assigning) return
    const ok = act(
      () => assignIssue(assigning.id, assignTo, ACTOR),
      { title: 'Query assigned', description: `${assigning.id} → ${assignTo}.` },
    )
    if (ok) {
      setAssigning(null)
      setExpandedId(assigning.id)
    }
  }

  const handleResolve = () => {
    if (!resolving) return
    const note = resolutionNote.trim()
    if (note.length < 10) {
      setNoteError('Give the family at least a sentence of explanation.')
      return
    }
    const ok = act(
      () => resolveIssue(resolving.id, note, ACTOR),
      { title: 'Query resolved', description: `${resolving.id} — the student sees your resolution note.` },
    )
    if (ok) {
      setResolving(null)
      setResolutionNote('')
      setNoteError(null)
      setExpandedId(resolving.id)
    }
  }

  const handleClose = () => {
    if (!closing) return
    const note = closeNote.trim()
    const ok = act(
      () => closeIssue(closing.id, note, ACTOR),
      { title: 'Query closed', description: `${closing.id} closed${note ? ' with a note' : ''}.` },
    )
    if (ok) {
      setClosing(null)
      setCloseNote('')
    }
  }

  return (
    <div className="space-y-4" data-testid="fee-queries-section">
      {/* ── The queue panel ── */}
      <Panel
        title="Fee Queries"
        subtitle={
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            {counts.open > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300">
                {counts.open} open
              </span>
            )}
            {counts.assigned > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300">
                {counts.assigned} in progress
              </span>
            )}
            {counts.waiting > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                {counts.waiting} waiting on student
              </span>
            )}
            {counts.resolved > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                {counts.resolved} resolved
              </span>
            )}
            {issues.length === 0 && (
              <span className="text-[10px] text-muted-foreground">Students raise queries from their Fees module — they land here</span>
            )}
          </span>
        }
        bodyClassName="p-0"
      >
        {issues.length === 0 ? (
          <div className="px-4 pb-4">
            <FeeEmptyState
              icon={<LifeBuoy className="h-6 w-6" />}
              title="No fee queries right now"
              description="When a student raises a fee query, dispute or escalation from their Fees module, it appears here with a full case timeline."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-separate border-spacing-0">
              <thead className="sticky top-0 z-10">
                <tr className="h-10 bg-muted shadow-[inset_0_-1px_0_0_hsl(var(--border))]">
                  <th className="text-left pl-4 pr-3 text-[11px] uppercase tracking-wider font-medium text-muted-foreground whitespace-nowrap bg-muted">Query</th>
                  <th className="text-left px-3 text-[11px] uppercase tracking-wider font-medium text-muted-foreground whitespace-nowrap bg-muted">Student</th>
                  <th className="text-left px-3 text-[11px] uppercase tracking-wider font-medium text-muted-foreground whitespace-nowrap bg-muted hidden md:table-cell">Type</th>
                  <th className="text-center px-3 text-[11px] uppercase tracking-wider font-medium text-muted-foreground whitespace-nowrap bg-muted">Status</th>
                  <th className="text-left px-3 text-[11px] uppercase tracking-wider font-medium text-muted-foreground whitespace-nowrap bg-muted hidden lg:table-cell">Updated</th>
                  <th className="text-right pl-3 pr-4 text-[11px] uppercase tracking-wider font-medium text-muted-foreground whitespace-nowrap bg-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((issue) => {
                  const expanded = expandedId === issue.id
                  const canAssign = issue.status === 'Open'
                  const canReview = issue.status !== 'Resolved' && issue.status !== 'Closed' && !canAssign
                  return (
                    <Fragment key={issue.id}>
                      <tr
                        className={cn('border-t border-border/30 hover:bg-muted/30 transition-colors', expanded && 'bg-muted/20')}
                      >
                        <td className="pl-4 pr-3 py-2.5">
                          <button
                            onClick={() => setExpandedId(expanded ? null : issue.id)}
                            aria-expanded={expanded}
                            aria-label={`Toggle case timeline for ${issue.id}`}
                            className="flex items-center gap-1.5 text-left"
                          >
                            <ChevronDown className={cn('h-3 w-3 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')} aria-hidden />
                            <span>
                              <span className="block font-medium leading-tight">{issue.subject}</span>
                              <span className="block text-[10px] text-muted-foreground font-mono mt-0.5">
                                {issue.id}{issue.relatedReceiptNo ? ` · receipt ${issue.relatedReceiptNo}` : ''}
                              </span>
                            </span>
                          </button>
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-medium leading-tight">{issue.studentName}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{issue.admissionNo} · {issue.className}</p>
                        </td>
                        <td className="px-3 py-2.5 hidden md:table-cell">
                          <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium whitespace-nowrap', typeTone(issue.type))}>
                            {issue.type === 'Escalation' && <ArrowUpRight className="h-2.5 w-2.5" aria-hidden />}
                            {issue.type}
                          </span>
                          {issue.assignedTo && (
                            <p className="text-[9px] text-muted-foreground mt-1">→ {issue.assignedTo}</p>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center"><IssueStatusChip status={issue.status} /></td>
                        <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap hidden lg:table-cell">{formatDate(issue.updatedAt.slice(0, 10))}</td>
                        <td className="pl-3 pr-4 py-2.5 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {canAssign && (
                              <Button
                                size="sm" variant="outline"
                                className="h-7 text-[10px] gap-1 border-sky-500/30 text-sky-700 dark:text-sky-400 hover:bg-sky-500/10"
                                aria-label={`Assign ${issue.id}`}
                                onClick={() => { setAssigning(issue); setAssignTo(issue.assignedTo ?? ASSIGN_TARGETS[0]) }}
                              >
                                <UserCheck className="h-3 w-3" /> <span className="hidden 2xl:inline">Assign</span>
                              </Button>
                            )}
                            {canReview && (
                              <Button
                                size="sm" variant="outline"
                                className="h-7 text-[10px] gap-1"
                                aria-label={`Request more information on ${issue.id}`}
                                title="Waiting for information — asks the student for details"
                                onClick={() => act(
                                  () => updateIssueStatus(issue.id, 'Waiting for Information', ACTOR, 'Please share the requested details so we can finish the review.'),
                                  { title: 'Information requested', description: `${issue.id} — the student sees what to send next.` },
                                )}
                              >
                                <MessageSquare className="h-3 w-3" /> <span className="hidden 2xl:inline">Ask student</span>
                              </Button>
                            )}
                            {canReview && (
                              <Button
                                size="sm" variant="outline"
                                className="h-7 text-[10px] gap-1"
                                aria-label={`Mark ${issue.id} under review`}
                                onClick={() => act(
                                  () => updateIssueStatus(issue.id, 'Under Review', ACTOR),
                                  { title: 'Under review', description: `${issue.id} moved to review.` },
                                )}
                              >
                                <ClipboardList className="h-3 w-3" /> <span className="hidden 2xl:inline">Review</span>
                              </Button>
                            )}
                            {canReview || canAssign ? (
                              <Button
                                size="sm"
                                className="h-7 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                aria-label={`Resolve ${issue.id}`}
                                onClick={() => { setResolving(issue); setResolutionNote(''); setNoteError(null) }}
                              >
                                <Check className="h-3 w-3" /> <span className="hidden 2xl:inline">Resolve</span>
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground pr-1.5">—</span>
                            )}
                            {canReview || canAssign ? (
                              <Button
                                size="sm" variant="ghost"
                                className="h-7 w-7 p-0 rounded-md text-muted-foreground hover:bg-muted"
                                aria-label={`Close ${issue.id} without resolution`}
                                title="Close without resolution"
                                onClick={() => { setClosing(issue); setCloseNote('') }}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-muted/20">
                          <td colSpan={6} className="px-4 py-4 border-t border-border/30">
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                              {/* The case timeline — everything that was communicated */}
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Case timeline</p>
                                <ol className="relative ml-1.5 space-y-2.5 border-l border-border pl-4">
                                  {issue.timeline.map((ev, i) => (
                                    <li key={`${ev.at}-${i}`} className="relative">
                                      <span
                                        className={cn(
                                          'absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-card',
                                          ev.role === 'student' ? 'bg-violet-500' : ev.kind === 'resolved' ? 'bg-emerald-500' : ev.kind === 'closed' ? 'bg-muted-foreground/50' : 'bg-amber-500',
                                        )}
                                        aria-hidden
                                      />
                                      <p className="text-[11px] font-semibold text-foreground">
                                        {ev.by}
                                        <span className="ml-1.5 font-normal text-muted-foreground">· {formatDate(ev.at.slice(0, 10))} · {ev.kind.replace('-', ' ')}</span>
                                      </p>
                                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{ev.note}</p>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                              {/* The student's original message */}
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                  Student's message · {issue.studentName}
                                </p>
                                <p className="rounded-lg border border-border/70 bg-card px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
                                  “{issue.message}”
                                </p>
                                <p className="mt-2 text-[10px] text-muted-foreground">
                                  Raised {formatDate(issue.createdAt.slice(0, 10))}{issue.relatedReceiptNo ? <> · receipt <span className="font-mono">{issue.relatedReceiptNo}</span></> : null}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* ── Assign dialog ── */}
      <Dialog open={!!assigning} onOpenChange={(o) => !o && setAssigning(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <UserCheck className="h-4 w-4" aria-hidden />
              </div>
              Assign query
            </DialogTitle>
            <DialogDescription>
              {assigning ? `${assigning.id} · ${assigning.studentName}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="py-1">
            <label className="mb-1.5 block text-xs font-semibold">Route to</label>
            <Select value={assignTo} onValueChange={setAssignTo}>
              <SelectTrigger className="h-9 text-xs" aria-label="Assign to">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGN_TARGETS.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssigning(null)}>Cancel</Button>
            <Button onClick={handleAssign} data-testid="assign-confirm">Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Resolve dialog (note mandatory) ── */}
      <Dialog open={!!resolving} onOpenChange={(o) => !o && setResolving(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4" aria-hidden />
              </div>
              Resolve query
            </DialogTitle>
            <DialogDescription>
              {resolving ? `${resolving.id} · ${resolving.studentName} — the student reads your note.` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="py-1">
            <label htmlFor="resolve-note" className="mb-1.5 block text-xs font-semibold">Resolution note</label>
            <Textarea
              id="resolve-note"
              value={resolutionNote}
              onChange={(e) => { setResolutionNote(e.target.value); setNoteError(null) }}
              placeholder="What was wrong, what you corrected, and what the student should expect now…"
              className="min-h-[100px] text-xs"
              maxLength={600}
            />
            {noteError && <p className="mt-1.5 text-[11px] font-medium text-rose-600 dark:text-rose-400" role="alert">{noteError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolving(null)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleResolve} data-testid="resolve-confirm">
              Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Close dialog (note optional) ── */}
      <Dialog open={!!closing} onOpenChange={(o) => !o && setClosing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <X className="h-4 w-4" aria-hidden />
              </div>
              Close without resolution
            </DialogTitle>
            <DialogDescription>
              {closing ? `${closing.id} · ${closing.studentName} — the timeline stays visible.` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="py-1">
            <label htmlFor="close-note" className="mb-1.5 block text-xs font-semibold">Closing note (optional)</label>
            <Input
              id="close-note"
              value={closeNote}
              onChange={(e) => setCloseNote(e.target.value)}
              placeholder="e.g. duplicate of an earlier query"
              className="h-9 text-xs"
              maxLength={120}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClosing(null)}>Keep open</Button>
            <Button variant="outline" className="border-rose-500/30 text-rose-600 hover:bg-rose-500/10 hover:text-rose-600" onClick={handleClose}>
              Close query
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiet routing note — the other half of the workflow */}
      <p className="flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
        <Send className="h-3 w-3 shrink-0" aria-hidden />
        Students see every status change and note on their side, tracked to resolution — one workflow, both roles.
        {active.length > 0 && <span className="tabular-nums">· {active.length} active</span>}
      </p>
    </div>
  )
}
