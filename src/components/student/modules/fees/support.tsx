'use client'

/**
 * Support — the FEES support centre (§18/§19/§20/§21/§45).
 *
 * ONE progressive-disclosure entry ("Get help") with contextual routing
 * instead of four giant buttons:
 *
 *   Payment / receipt / ledger question  →  Raise a fee query
 *   (the §21 dispute workflow — immutable request id + case timeline;
 *    routed to the Accounts Office by the school's workflow)
 *
 *   Class-related concern                →  Ask my Class Teacher
 *   (the CENTRAL messaging system with context attached — §19: Fees
 *    creates the entry point, never a second messaging system)
 *
 *   Need escalation                      →  Request school review
 *   (the same query workflow, type 'Escalation', routed to the Principal)
 *
 * My Queries below tracks every request to resolution — the user never
 * wonders whether the school received their complaint (§21).
 */

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUpRight, BookOpenCheck, ChevronDown, CircleHelp, HelpCircle, LifeBuoy, MessageCircle,
  Send, ShieldQuestion, Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { SectionLabel } from '../../shell/page-header'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import { teachers } from '@/lib/mock/teachers'
import { useStudentsStore, type StudentRecord } from '@/lib/store/students-store'
import {
  useStudentFeeIssuesStore,
  isActiveIssue,
  type FeeIssue,
  type FeeIssueType,
} from '@/lib/store/student-fee-issues-store'
import { issueStatusToken } from './fee-status'
import { useStudentComposeBridge } from '@/lib/store/student-compose-bridge'

const ISSUE_TYPES: FeeIssueType[] = [
  'Incorrect amount', 'Payment missing', 'Receipt issue', 'Concession issue', 'Duplicate charge', 'General question',
]

interface SupportProps {
  student: StudentRecord
  onNavigate: (key: string) => void
}

export function Support({ student, onNavigate }: SupportProps) {
  const issues = useStudentFeeIssuesStore((s) => s.issues)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [queryOpen, setQueryOpen] = useState(false)
  const [escalate, setEscalate] = useState(false)
  const [relatedReceiptNo, setRelatedReceiptNo] = useState<string | undefined>(undefined)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replyFor, setReplyFor] = useState<FeeIssue | null>(null)
  const setComposeDraft = useStudentComposeBridge((s) => s.setDraft)

  // The class teacher of THIS student's section — the one person the
  // central messaging system already routes class concerns to (§19).
  const classTeacher = useMemo(() => {
    const cls = useStudentsStore.getState().classes.find((c) => c.id === student.classId)
    const section = cls?.sections.find((s) => s.name === student.section)
    const tid = section?.classTeacherId ?? cls?.classTeacherId
    return teachers.find((t) => t.id === tid) ?? null
  }, [student.classId, student.section])

  const askClassTeacher = () => {
    if (!classTeacher) {
      toast.info('No class teacher is assigned to your section right now.')
      return
    }
    setComposeDraft({
      teacherId: classTeacher.id,
      teacherName: classTeacher.name,
      teacherSubject: classTeacher.department,
      subject: 'Fee question',
      body: 'Hello sir/ma\'am, I have a question about my school fees — could you please guide me?',
    })
    setSheetOpen(false)
    onNavigate('messages')
  }

  const sorted = [...issues].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
  const activeCount = issues.filter(isActiveIssue).length

  return (
    <section className="space-y-3" aria-labelledby="fees-support-label">
      <SectionLabel hint={activeCount > 0 ? `${activeCount} open` : 'we reply on the record'}>
        Need Help?
      </SectionLabel>

      {/* ── Primary entry — one button, contextual routes behind it (§45) ── */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/70 bg-gradient-to-r from-violet-500/[0.05] to-transparent p-4 sm:p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/[0.08] text-violet-600 dark:text-violet-400" aria-hidden>
          <LifeBuoy className="h-5 w-5" />
        </div>
        <div className="min-w-[200px] flex-1">
          <p className="text-sm font-bold text-foreground">Questions about a fee or payment?</p>
          <p className="text-[11px] text-muted-foreground">
            Route it to the right person — every query is tracked to resolution
          </p>
        </div>
        <Button size="sm" onClick={() => setSheetOpen(true)} className="h-8 gap-1.5 text-xs" data-testid="fees-get-help">
          <CircleHelp className="h-3.5 w-3.5" aria-hidden /> Get help
        </Button>
      </div>

      {/* ── My queries — the case tracker (§21) ── */}
      {sorted.length > 0 && (
        <GlassCard hover={false} className="on-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/60 bg-muted/25 px-4 py-2.5 sm:px-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-foreground/75">My Fee Queries</p>
            <p className="text-[11px] text-muted-foreground tabular-nums">{sorted.length} request{sorted.length === 1 ? '' : 's'}</p>
          </div>
          <div className="divide-y divide-border/60">
            {sorted.map((issue) => {
              const token = issueStatusToken(issue.status)
              const expanded = expandedId === issue.id
              return (
                <div key={issue.id}>
                  <button
                    onClick={() => setExpandedId(expanded ? null : issue.id)}
                    aria-expanded={expanded}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30 sm:px-5"
                  >
                    <span className={cn('h-2 w-2 shrink-0 rounded-full', token.dot)} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-foreground">
                        <span className="font-mono text-[11px] text-muted-foreground">{issue.id}</span>
                        {' · '}{issue.subject}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {issue.type}{issue.assignedTo ? ` · ${issue.assignedTo}` : ''} · updated {formatDate(issue.updatedAt.slice(0, 10))}
                      </p>
                    </div>
                    <span className={cn('hidden shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold sm:inline-flex', token.chip)}>
                      {token.label}
                    </span>
                    <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')} aria-hidden />
                  </button>

                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border/50 bg-muted/15 px-4 py-4 sm:px-5">
                          {/* The case timeline — who did what, when (§21) */}
                          <ol className="relative ml-1.5 space-y-3 border-l border-border pl-4">
                            {issue.timeline.map((ev, i) => (
                              <li key={`${ev.at}-${i}`} className="relative">
                                <span
                                  className={cn(
                                    'absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-card',
                                    ev.role === 'student' ? 'bg-violet-500' : ev.kind === 'resolved' ? 'bg-emerald-500' : 'bg-amber-500',
                                  )}
                                  aria-hidden
                                />
                                <p className="text-[11px] font-semibold text-foreground">
                                  {ev.by}
                                  <span className="ml-1.5 font-normal text-muted-foreground">· {formatDate(ev.at.slice(0, 10))}</span>
                                </p>
                                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{ev.note}</p>
                              </li>
                            ))}
                          </ol>
                          {issue.message && (
                            <p className="mt-3 rounded-lg border border-border/60 bg-card px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                              “{issue.message}”
                            </p>
                          )}
                          {issue.status === 'Waiting for Information' && (
                            <Button size="sm" variant="outline" className="mt-3 h-7 gap-1.5 text-[11px]" onClick={() => setReplyFor(issue)}>
                              <Send className="h-3 w-3" aria-hidden /> Provide information
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </GlassCard>
      )}

      {/* ── The routing sheet (§45 progressive disclosure) ── */}
      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <ShieldQuestion className="h-4 w-4" aria-hidden />
              </div>
              Get help with fees
            </DialogTitle>
            <DialogDescription>Where should your question go?</DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5 py-1">
            <RouteCard
              icon={<BookOpenCheck className="h-4 w-4" aria-hidden />}
              cls="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              title="Payment, ledger or receipt question"
              sub="Goes to the Accounts Office · tracked with a request id"
              onClick={() => {
                setEscalate(false)
                setRelatedReceiptNo(undefined)
                setQueryOpen(true)
                setSheetOpen(false)
              }}
              testId="route-accounts"
            />
            {classTeacher && (
              <RouteCard
                icon={<MessageCircle className="h-4 w-4" aria-hidden />}
                cls="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                title={`Ask ${classTeacher.name} (Class Teacher)`}
                sub="For class-related concerns · opens Messages with context"
                onClick={askClassTeacher}
                testId="route-teacher"
              />
            )}
            <RouteCard
              icon={<ArrowUpRight className="h-4 w-4" aria-hidden />}
              cls="bg-violet-500/10 text-violet-600 dark:text-violet-400"
              title="Need escalation — request a school review"
              sub="Reviewed by the Principal's office · same tracked workflow"
              onClick={() => {
                setEscalate(true)
                setRelatedReceiptNo(undefined)
                setQueryOpen(true)
                setSheetOpen(false)
              }}
              testId="route-escalation"
            />
          </div>
          <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
            Teachers never see your full fee ledger — only the context you send.
          </p>
        </DialogContent>
      </Dialog>

      {/* ── The raise-query dialog (§21 — minimal form) ── */}
      <RaiseQueryDialog
        open={queryOpen}
        onOpenChange={setQueryOpen}
        student={student}
        escalate={escalate}
        relatedReceiptNo={relatedReceiptNo}
        onRaised={(id) => {
          setExpandedId(id)
        }}
      />

      {/* ── Provide-information reply (Waiting for Information) ── */}
      <ReplyDialog issue={replyFor} studentName={student.name} onClose={() => setReplyFor(null)} />
    </section>
  )
}

// ─── Route card ──────────────────────────────────────────────────────

function RouteCard({ icon, cls, title, sub, onClick, testId }: {
  icon: React.ReactNode
  cls: string
  title: string
  sub: string
  onClick: () => void
  testId?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-card/60 p-3.5 text-left transition-all hover:border-foreground/25 hover:bg-muted/40"
    >
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', cls)} aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="block text-[11px] text-muted-foreground">{sub}</span>
      </span>
    </button>
  )
}

// ─── Raise query dialog ──────────────────────────────────────────────

function RaiseQueryDialog({ open, onOpenChange, student, escalate, relatedReceiptNo, onRaised }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: StudentRecord
  escalate: boolean
  relatedReceiptNo?: string
  onRaised: (issueId: string) => void
}) {
  const raiseIssue = useStudentFeeIssuesStore((s) => s.raiseIssue)
  const [type, setType] = useState<FeeIssueType>(escalate ? 'Escalation' : 'Incorrect amount')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setSubject('')
    setMessage('')
    setError(null)
  }

  const submit = () => {
    const result = raiseIssue({
      studentId: student.id,
      studentName: student.name,
      admissionNo: student.admissionNo,
      className: `${student.className}-${student.section}`,
      type: escalate ? 'Escalation' : type,
      subject,
      message,
      relatedReceiptNo,
    })
    if (result.ok) {
      toast.success(escalate ? 'School review requested' : 'Fee query submitted', {
        description: `${result.issue.id} — track it under Need Help · My Fee Queries.`,
      })
      onRaised(result.issue.id)
      onOpenChange(false)
      reset()
    } else {
      setError(result.error)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {escalate ? <ArrowUpRight className="h-4 w-4" aria-hidden /> : <HelpCircle className="h-4 w-4" aria-hidden />}
            </div>
            {escalate ? 'Request a school review' : 'Raise a fee query'}
          </DialogTitle>
          <DialogDescription>
            {escalate
              ? 'Escalations go to the Principal\'s office after the accounts team reviews your case.'
              : 'The Accounts Office sees your query, the ledger and the receipts — nothing else is shared.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-1">
          {!escalate && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold">What is it about?</label>
              <Select value={type} onValueChange={(v) => setType(v as FeeIssueType)}>
                <SelectTrigger className="h-9 text-xs" aria-label="Issue type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label htmlFor="fq-subject" className="mb-1.5 block text-xs font-semibold">In one line</label>
            <Input
              id="fq-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={escalate ? 'e.g. Fee query not resolved' : 'e.g. September transport charge looks wrong'}
              className="h-9 text-xs"
              maxLength={80}
            />
          </div>
          <div>
            <label htmlFor="fq-message" className="mb-1.5 block text-xs font-semibold">Details</label>
            <Textarea
              id="fq-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What happened, and what were you expecting instead?"
              className="min-h-[88px] text-xs"
              maxLength={500}
            />
            {relatedReceiptNo && (
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                Linked to receipt <span className="font-mono">{relatedReceiptNo}</span> automatically.
              </p>
            )}
          </div>
          {error && <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400" role="alert">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} className="min-w-[120px]" data-testid="query-submit">
            <Send className="h-3.5 w-3.5" aria-hidden /> Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Reply dialog (provide requested information) ────────────────────

function ReplyDialog({ issue, studentName, onClose }: {
  issue: FeeIssue | null
  studentName: string
  onClose: () => void
}) {
  const provideInfo = useStudentFeeIssuesStore((s) => s.provideInfo)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    if (!issue) return
    const result = provideInfo(issue.id, note, studentName)
    if (result.ok) {
      toast.success('Information sent', { description: `${issue.id} is back under review.` })
      setNote('')
      onClose()
    } else {
      setError(result.error ?? 'Could not send.')
    }
  }

  return (
    <Dialog open={!!issue} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Send className="h-4 w-4" aria-hidden />
            </div>
            Provide information
          </DialogTitle>
          <DialogDescription>
            {issue ? `${issue.id} · the office asked for more details` : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="py-1">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add the details the office asked for…"
            className="min-h-[90px] text-xs"
            aria-label="Information to provide"
            maxLength={500}
          />
          {error && <p className="mt-1.5 text-[11px] font-medium text-rose-600 dark:text-rose-400" role="alert">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!note.trim()}>Send</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
