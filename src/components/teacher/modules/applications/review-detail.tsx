'use client'

/**
 * ApplicationReviewDetail — one ASSIGNED application from the teacher's chair.
 *
 * Teacher-visible slice of the Principal's application detail (§2E): the
 * workflow, consent, documents and derived payment chips are identical, but
 * every money-management control is absent — payments render as READ-ONLY
 * chips straight from deriveSubmissionPayment (canonical fee ledger).
 *
 * Sections: header (back · title · status · deadline · in-charge chip) →
 * micro-stats → filter row → compact submissions table → collapsible blank
 * printable form → collapsible recent activity.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Download, FileSignature, FileText, Printer, Search, ThumbsUp, Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  useApplicationsStore,
  effectiveAppStatus, combinedSubmissionStatus, deriveSubmissionPayment, isConsentSatisfied,
} from '@/lib/store/applications-store'
import type {
  SchoolApplication, ApplicationSubmission, CombinedSubmissionStatus, EffectiveAppStatus,
} from '@/lib/store/applications-store'
import { formatDate, initials } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  ApplicationPrintDocument, printApplicationDocument, downloadApplicationDocument, applicationDocFileName,
} from '@/components/principal/modules/applications/application-print'
import { ReviewDialog } from './review-dialog'

// ─── Status badge recipes (same tones as the Principal module) ─────────

export function AppStatusBadge({ status }: { status: EffectiveAppStatus }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap',
      status === 'Open' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      status === 'Closing Soon' && 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
      status === 'Scheduled' && 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
      status === 'Draft' && 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
      (status === 'Closed' || status === 'Locked') && 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
      status === 'Archived' && 'bg-muted text-muted-foreground',
    )}>{status}</span>
  )
}

const STATUS_TONE: Record<CombinedSubmissionStatus, string> = {
  Submitted: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  'Awaiting Payment': 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  'Awaiting Verification': 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  'Paid · Under Review': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  'Under Review': 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  Approved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Rejected: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  'Correction Required': 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Withdrawn: 'bg-muted text-muted-foreground',
  'Physical Doc Pending': 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
  'Physical Doc Verification': 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
}

export function SubmissionStatusChip({ status }: { status: CombinedSubmissionStatus }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap', STATUS_TONE[status])}>
      {status}
    </span>
  )
}

type StatusFilter = 'all' | 'Submitted' | 'Awaiting Payment' | 'Approved' | 'Correction Required' | 'Rejected'

const STATUS_FILTERS: StatusFilter[] = ['Submitted', 'Awaiting Payment', 'Approved', 'Correction Required', 'Rejected']

// ─── Component ─────────────────────────────────────────────────────────

export function ApplicationReviewDetail({ app: liveAppRef, onBack }: {
  app: SchoolApplication
  onBack: () => void
}) {
  // Subscribe by id so approvals/consent flips re-render instantly.
  // (zustand v5: filter in useMemo — unstable selector refs loop forever.)
  const app = useApplicationsStore((s) => s.applications.find((a) => a.id === liveAppRef.id)) ?? liveAppRef
  const allSubmissions = useApplicationsStore((s) => s.submissions)
  const submissions = useMemo(
    () => allSubmissions.filter((x) => x.applicationId === liveAppRef.id),
    [allSubmissions, liveAppRef.id],
  )
  const audit = useApplicationsStore((s) => s.audit)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  const status = effectiveAppStatus(app)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...submissions]
      .filter((s) => {
        if (statusFilter !== 'all' && combinedSubmissionStatus(app, s) !== statusFilter) return false
        if (q && !(s.studentName.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q))) return false
        return true
      })
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  }, [submissions, app, search, statusFilter])

  // Micro-stats
  const pendingReview = submissions.filter((s) => ['Submitted', 'Under Review', 'Awaiting Payment'].includes(combinedSubmissionStatus(app, s))).length
  const approvedCount = submissions.filter((s) => s.status === 'Approved').length
  const consentPending = app.guardianConsent.required
    ? submissions.filter((s) => !isConsentSatisfied(app, s)).length
    : 0

  const activity = useMemo(
    () => audit.filter((e) => e.applicationId === app.id).sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 12),
    [audit, app.id],
  )

  const reviewingSub = reviewingId ? submissions.find((s) => s.id === reviewingId) : undefined

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-start gap-3 flex-wrap">
        <Button variant="outline" size="icon" className="h-7 w-7 shrink-0" onClick={onBack} aria-label="Back to Application Reviews">
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold tracking-tight text-foreground truncate">{app.title}</h2>
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 shrink-0">{app.category}</Badge>
            <AppStatusBadge status={status} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            Deadline {formatDate(app.deadline)}{app.eventDate ? ` · Event ${formatDate(app.eventDate)}` : ''}
            {` · ${app.academicYear}`}
          </p>
        </div>
        {app.inChargeName && (
          <Badge variant="outline" className="shrink-0 text-[10px] h-5 px-2 gap-1.5 font-medium">
            <FileSignature className="h-3 w-3 text-violet-500" />
            In-charge · {app.inChargeName}
          </Badge>
        )}
      </div>

      {/* ── Micro-stat tiles ── */}
      <div className="grid grid-cols-4 gap-3">
        <StatTile label="Submissions" value={String(submissions.length)} icon={<Users className="h-3 w-3" />} />
        <StatTile label="Pending review" value={String(pendingReview)} tone="amber" icon={<Search className="h-3 w-3" />} />
        <StatTile label="Approved" value={String(approvedCount)} tone="emerald" icon={<ThumbsUp className="h-3 w-3" />} />
        <StatTile label="Consent pending" value={String(consentPending)} tone={consentPending > 0 ? 'amber' : undefined} icon={<FileSignature className="h-3 w-3" />} />
      </div>

      {/* ── Submissions table ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap px-4 py-2.5 border-b border-border/60">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input className="pl-8 h-8 text-xs" placeholder="Search student / admission no." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search submissions" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="h-8 w-[170px] text-xs" aria-label="Status filter"><SelectValue /></SelectTrigger>
            <SelectContent className="z-[70]">
              <SelectItem value="all" className="text-xs">All statuses</SelectItem>
              {STATUS_FILTERS.map((k) => (
                <SelectItem key={k} value={k} className="text-xs">{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="ml-auto text-[10px] text-muted-foreground shrink-0">{filtered.length} of {submissions.length} shown</p>
        </div>

        {/* Column header */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-2 border-b border-border/60 bg-muted/30 text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">
          <span className="flex-1">Student</span>
          <span className="w-20 shrink-0">Class</span>
          <span className="w-24 shrink-0">Submitted</span>
          <span className="w-36 shrink-0">Payment</span>
          <span className="w-20 shrink-0">Consent</span>
          <span className="w-24 shrink-0">Doc</span>
          <span className="w-[150px] shrink-0 text-right">Status</span>
          <span className="w-[72px] shrink-0" />
        </div>

        {filtered.length === 0 ? (
          <div className="py-10 text-center">
            <Users className="h-6 w-6 mx-auto text-muted-foreground/40" />
            <p className="mt-2 text-xs text-muted-foreground">
              {submissions.length === 0
                ? app.status === 'Published'
                  ? 'No submissions yet — eligible students see this form in their Applications page.'
                  : 'No submissions on this application.'
                : 'No submissions match the current filters.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border max-h-[440px] overflow-y-auto custom-scrollbar">
            {filtered.map((s) => (
              <SubmissionRow key={s.id} app={app} sub={s} onReview={() => setReviewingId(s.id)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Blank printable form (hidden while the review dialog owns the
            shared .app-print-doc node) ── */}
      {!reviewingId && (
        <details className="group rounded-xl border border-border bg-card">
          <summary className="flex cursor-pointer select-none items-center gap-2 px-4 py-2.5 text-xs font-semibold">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            Blank printable form
            <span className="text-[10px] font-normal text-muted-foreground">print for offline paper distribution</span>
          </summary>
          <div className="border-t border-border/60 bg-muted/30 p-4">
            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
              <ApplicationPrintDocument app={app} />
            </div>
            <div className="flex items-center justify-end gap-1.5 mt-2.5">
              <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => printApplicationDocument()}>
                <Printer className="h-3 w-3" /> Print / Save PDF
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => downloadApplicationDocument(applicationDocFileName({ app }))}>
                <Download className="h-3 w-3" /> Download
              </Button>
            </div>
          </div>
        </details>
      )}

      {/* ── Recent activity ── */}
      <details className="rounded-xl border border-border bg-card">
        <summary className="flex cursor-pointer select-none items-center gap-2 px-4 py-2.5 text-xs font-semibold">
          Recent activity
          <span className="text-[10px] font-normal text-muted-foreground">{activity.length} event{activity.length === 1 ? '' : 's'} · latest first</span>
        </summary>
        <div className="border-t border-border/60 px-4 py-2">
          {activity.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">Nothing logged for this application yet.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {activity.map((ev) => (
                <div key={ev.id} className="py-2 flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] leading-snug">{ev.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(ev.ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {' · '}{ev.actor} ({ev.actorRole})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </details>

      {/* ── Review dialog (keyed by submission so internal state resets) ── */}
      {reviewingSub && (
        <ReviewDialog
          key={reviewingSub.id}
          app={app}
          sub={reviewingSub}
          onClose={() => setReviewingId(null)}
        />
      )}
    </div>
  )
}

// ─── One submission row ────────────────────────────────────────────────

function SubmissionRow({ app, sub, onReview }: {
  app: SchoolApplication
  sub: ApplicationSubmission
  onReview: () => void
}) {
  const cs = combinedSubmissionStatus(app, sub)
  const pay = deriveSubmissionPayment(app, sub)
  const consentOk = isConsentSatisfied(app, sub)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-2.5 hover:bg-muted/25 transition-colors">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-500/10 ring-1 ring-slate-500/20 text-[9px] font-semibold text-slate-600 dark:text-slate-300">
          {initials(sub.studentName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate">{sub.studentName}</p>
          <p className="text-[10px] text-muted-foreground truncate font-mono">{sub.admissionNo}</p>
        </div>
        <div className="w-20 shrink-0 hidden lg:block text-[10px] font-medium">
          {sub.className}-{sub.section}
        </div>
        <div className="w-24 shrink-0 hidden lg:block">
          <p className="text-[10px] font-medium tabular-nums">{formatDate(sub.submittedAt)}</p>
          <p className="text-[9px] text-muted-foreground">{sub.mode}{sub.resubmissionCount > 0 ? ` · ×${sub.resubmissionCount}` : ''}</p>
        </div>
        {/* Payment — READ-ONLY chip derived from the canonical fee ledger */}
        <div className="w-36 shrink-0 hidden md:block">
          {app.payment.mode === 'None' ? (
            <p className="text-[10px] text-muted-foreground">no fee</p>
          ) : (
            <>
              <PaymentChip status={pay.status} />
              <p className="text-[9px] text-muted-foreground font-mono truncate">
                {pay.receiptNos.length ? pay.receiptNos.join(', ') : pay.pendingReceiptNo ?? '—'}
              </p>
            </>
          )}
        </div>
        <div className="w-20 shrink-0 hidden md:block">
          {!app.guardianConsent.required ? (
            <p className="text-[10px] text-muted-foreground">—</p>
          ) : (
            <span className={cn(
              'inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold',
              consentOk ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
            )}>
              {consentOk ? 'Given' : 'Pending'}
            </span>
          )}
        </div>
        <div className="w-24 shrink-0 hidden md:block">
          <DocChip status={sub.physicalDoc.status} />
        </div>
        <div className="w-[150px] shrink-0 flex justify-end">
          <SubmissionStatusChip status={cs} />
        </div>
        <div className="w-[72px] shrink-0 flex justify-end">
          <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={onReview}>
            Review
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

function PaymentChip({ status }: { status: ReturnType<typeof deriveSubmissionPayment>['status'] }) {
  return (
    <span className={cn(
      'inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold',
      status === 'Paid' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      (status === 'Awaiting Verification' || status === 'Not Paid') && 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
      status === 'Not Applicable' && 'bg-muted text-muted-foreground',
    )}>{status}</span>
  )
}

function DocChip({ status }: { status: ApplicationSubmission['physicalDoc']['status'] }) {
  return (
    <span className={cn(
      'inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap',
      status === 'Verified' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      status === 'Received' && 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
      status === 'Pending' && 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
      status === 'Not Required' && 'bg-muted text-muted-foreground',
    )}>{status === 'Not Required' ? '—' : status}</span>
  )
}

function StatTile({ label, value, tone, icon }: {
  label: string
  value: string
  tone?: 'emerald' | 'amber'
  icon?: React.ReactNode
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg bg-muted/40 px-2.5 py-1.5">
      <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground flex items-center gap-1">
        {icon}{label}
      </p>
      <p className={cn(
        'text-sm font-bold tabular-nums leading-tight mt-0.5',
        tone === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
        tone === 'amber' && 'text-amber-600 dark:text-amber-400',
        !tone && 'text-foreground',
      )}>{value}</p>
    </motion.div>
  )
}
