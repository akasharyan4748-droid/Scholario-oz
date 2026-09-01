'use client'

/**
 * ApplicationDetail — one school application seen end-to-end.
 *
 * Layout (Salary & Payroll benchmark — compact, flat, unhurried):
 *   • Header strip  — back, title, category chip, LIVE status badge,
 *                     deadline countdown, in-charge, contextual actions
 *   • Micro-stats   — Submissions · Approved · Awaiting money · Collected
 *   • Tabs          — Overview · Submissions · Payments · Documents ·
 *                     Activity (workflow-driven badges on each)
 *
 * Submissions tab carries the operational core: filters, per-student
 * statuses derived from THE canonical fee ledger (no shadow amounts),
 * review actions within permissions, offline recording, and CSV export.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, CalendarClock, CheckCircle2, ChevronDown, ClipboardList, Copy,
  Download, FileText, Landmark, Lock, PencilLine, Printer, Search, Send, ThumbsUp, Undo2,
  UserCheck, Users, Wallet, XCircle, StickyNote, FileSignature, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { SegmentedTabs } from '../shared/segmented-tabs'
import { Panel } from '../shared/panel'
import {
  useApplicationsStore,
  effectiveAppStatus, combinedSubmissionStatus, deriveSubmissionPayment,
  applicationPayments,
  isConsentSatisfied, type SchoolApplication, type ApplicationSubmission, type CombinedSubmissionStatus,
} from '@/lib/store/applications-store'
import { useFeeStore } from '@/lib/store/fee-store'
import { useStudentsStore } from '@/lib/store/students-store'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ApplicationPrintDocument, printApplicationDocument, downloadApplicationDocument, applicationDocFileName } from './application-print'

type DetailTab = 'overview' | 'form' | 'submissions' | 'payments' | 'documents' | 'activity'

interface Props {
  app: SchoolApplication
  onBack: () => void
  /** Opens the builder for this application (targets/dates stay editable
   *  while the form is open; money config stays frozen at publish). */
  onEdit?: () => void
}

// ─── Status badge recipes (spec chips: slate/emerald/amber/rose tints) ──

export function AppStatusBadge({ status }: { status: ReturnType<typeof effectiveAppStatus> }) {
  const tone = cn(
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap',
    status === 'Open' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    status === 'Closing Soon' && 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    status === 'Scheduled' && 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
    status === 'Draft' && 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
    status === 'Pending Approval' && 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    status === 'Changes Requested' && 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    status === 'Approved' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    status === 'Rejected' && 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
    (status === 'Closed' || status === 'Locked') && 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
    status === 'Archived' && 'bg-muted text-muted-foreground',
  )
  return <span className={tone}>{status}</span>
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

// ─── Component ─────────────────────────────────────────────────────────

export function ApplicationDetail({ app: liveAppRef, onBack, onEdit }: Props) {
  // Subscribe by id so status flips re-render instantly. NOTE (zustand v5):
  // selectors must return STABLE references — filter in useMemo, never in
  // the selector (a fresh array each getSnapshot() triggers the infinite
  // "result of getSnapshot should be cached" loop).
  const app = useApplicationsStore((s) => s.applications.find((a) => a.id === liveAppRef.id)) ?? liveAppRef
  const allSubmissions = useApplicationsStore((s) => s.submissions)
  const submissions = useMemo(
    () => allSubmissions.filter((x) => x.applicationId === liveAppRef.id),
    [allSubmissions, liveAppRef.id],
  )
  const auditAll = useApplicationsStore((s) => s.audit)
  const closeApplication = useApplicationsStore((s) => s.closeApplication)
  const reopenApplication = useApplicationsStore((s) => s.reopenApplication)
  const lockApplication = useApplicationsStore((s) => s.lockApplication)
  const archiveApplication = useApplicationsStore((s) => s.archiveApplication)
  const duplicateApplication = useApplicationsStore((s) => s.duplicateApplication)

  const [tab, setTab] = useState<DetailTab>('overview')
  const [viewingSub, setViewingSub] = useState<string | null>(null)
  const [offlineOpen, setOfflineOpen] = useState(false)

  const status = effectiveAppStatus(app)
  const editingAllowed = status === 'Draft' || status === 'Open' || status === 'Closing Soon' || status === 'Scheduled' || status === 'Changes Requested' || status === 'Rejected'

  // Micro-stats (live).
  const approvedCount = submissions.filter((s) => s.status === 'Approved').length
  const awaitingMoney = submissions.filter((s) => ['Awaiting Payment', 'Awaiting Verification'].includes(combinedSubmissionStatus(app, s))).length
  const charge = useFeeStore((st) => st.additionalCharges.find((c) => c.id === app.payment.chargeId))
  const transactions = useFeeStore((st) => st.transactions)
  // Payments belonging to THIS application only (applicationId-bound rows;
  // office-recorded rows fall back to the application's own charge).
  const colForApp = useMemo(
    () => transactions.filter((t) =>
      t.applicationId === app.id
      || (!t.applicationId && !!app.payment.chargeId && t.additionalChargeId === app.payment.chargeId),
    ),
    [transactions, app.id, app.payment.chargeId],
  )
  const collectedApp = colForApp.filter((t) => t.status === 'Success').reduce((sum, t) => sum + t.amount, 0)
  const pendingVerifyApp = colForApp.filter((t) => t.status === 'Under Verification').reduce((sum, t) => sum + t.amount, 0)

  const handleDuplicate = () => {
    const res = duplicateApplication(app.id, 'Dr. Ananya Iyer')
    if (res.success) toast.success('Duplicated', { description: 'A fresh draft was created — edit dates there, then publish.' })
  }

  const handleReopen = () => {
    const res = reopenApplication(app.id, 'Dr. Ananya Iyer')
    if (!res.success) toast.error('Cannot reopen', { description: res.error })
    else toast.success('Reopened')
  }

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <Button variant="outline" size="icon" className="h-7 w-7 shrink-0" onClick={onBack} aria-label="Back to applications">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold tracking-tight text-foreground truncate">{app.title}</h2>
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 shrink-0">{app.category}</Badge>
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 shrink-0 bg-slate-500/5 text-muted-foreground border-border">Source: {app.source}</Badge>
              <AppStatusBadge status={status} />
              {app.participation === 'Mandatory' && (
                <Badge variant="outline" className="text-[9px] h-4 px-1.5">Mandatory</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              Deadline {formatDate(app.deadline)}{app.eventDate ? ` · Event ${formatDate(app.eventDate)}` : ''}
              {app.inChargeName ? ` · In-charge ${app.inChargeName}` : ''} · {app.academicYear}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {app.status === 'Draft' && (
            <PublishButton appId={app.id} />
          )}
          {app.status === 'Approved' && (
            <PublishButton appId={app.id} />
          )}
          {app.status === 'Pending Approval' && (
            <ApprovalDecision appId={app.id} />
          )}
          {app.status === 'Published' && (status === 'Open' || status === 'Closing Soon') && (
            <>
              <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => { lockApplication(app.id, 'Dr. Ananya Iyer'); toast.info('Locked — no new submissions.') }}>
                <Lock className="h-3 w-3" /> Lock now
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => { closeApplication(app.id, 'Dr. Ananya Iyer'); toast.success('Closed — records preserved.') }}>
                <XCircle className="h-3 w-3" /> Close
              </Button>
            </>
          )}
          {(status === 'Locked' || status === 'Closed') && (
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={handleReopen}>
              <Undo2 className="h-3 w-3" /> Reopen
            </Button>
          )}
          {editingAllowed && onEdit && (
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={onEdit}>
              <PencilLine className="h-3 w-3" /> Edit
            </Button>
          )}
          <BlankFormMenu />
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={handleDuplicate}>
            <Copy className="h-3 w-3" /> Duplicate
          </Button>
          {app.status !== 'Archived' && app.status !== 'Published' && (
            <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => { archiveApplication(app.id, 'Dr. Ananya Iyer'); toast.info('Archived — history stays accessible.', { description: 'Find it under Archived in the dashboard filter.' }) }}>
              Archive
            </Button>
          )}
        </div>
      </div>

      {/* ── Micro-stat tiles ── */}
      <div className="grid grid-cols-4 gap-3">
        <StatTile label="Submissions" value={String(submissions.length)} icon={<Users className="h-3 w-3" />} />
        <StatTile label="Approved" value={String(approvedCount)} tone="emerald" icon={<ThumbsUp className="h-3 w-3" />} />
        <StatTile label="Money in flight" value={String(awaitingMoney)} tone="amber" hint="awaiting pay / verify" icon={<Wallet className="h-3 w-3" />} />
        <StatTile
          label="Collected"
          value={formatINR(collectedApp, true)}
          tone="emerald"
          hint={pendingVerifyApp > 0 ? `+${formatINR(pendingVerifyApp, true)} verifying` : undefined}
          icon={<Landmark className="h-3 w-3" />}
        />
      </div>

      {/* ── Tabs ── */}
      <SegmentedTabs<DetailTab>
        value={tab}
        onValueChange={setTab}
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'form', label: 'Form', badge: app.formFields.length || undefined },
          { value: 'submissions', label: 'Submissions', badge: submissions.length || undefined },
          { value: 'payments', label: 'Payments', badge: pendingVerifyApp > 0 ? pendingVerifyApp : undefined },
          { value: 'documents', label: 'Documents', badge: submissions.filter((s) => s.physicalDoc.status === 'Received').length || undefined },
          { value: 'activity', label: 'Activity' },
        ]}
      />

      {tab === 'overview' && (
        <OverviewPanel app={app} submissions={submissions} charge={charge} collectedApp={collectedApp} />
      )}
      {tab === 'form' && <FormPanel appId={app.id} />}
      {tab === 'submissions' && (
        <SubmissionsPanel
          app={app}
          submissions={submissions}
          onView={(id) => setViewingSub(id)}
          onRecordOffline={() => setOfflineOpen(true)}
        />
      )}
      {tab === 'payments' && (
        <PaymentsPanel app={app} submissions={submissions} charge={charge} />
      )}
      {tab === 'documents' && (
        <DocumentsPanel app={app} submissions={submissions} onView={(id) => setViewingSub(id)} />
      )}
      {tab === 'activity' && (
        <ActivityPanel events={auditAll.filter((e) => e.applicationId === app.id)} />
      )}

      {/* Submission viewer */}
      {viewingSub && (() => {
        const sub = submissions.find((s) => s.id === viewingSub)
        return sub ? (
          <SubmissionDialog
            open
            app={app}
            sub={sub}
            onClose={() => setViewingSub(null)}
          />
        ) : null
      })()}

      {/* Offline recorder */}
      {offlineOpen && (
        <OfflineRecorderDialog app={app} onClose={() => setOfflineOpen(false)} />
      )}
    </div>
  )
}

// ─── Publish button (with honest guard feedback) ───────────────────────

function PublishButton({ appId }: { appId: string }) {
  const publish = useApplicationsStore((s) => s.publishApplication)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const app = useApplicationsStore((s) => s.applications.find((a) => a.id === appId))
  if (!app) return null

  const doPublish = () => {
    const res = publish(appId, 'Dr. Ananya Iyer')
    if (!res.success) {
      toast.error('Publish failed', { description: res.error })
      return
    }
    toast.success('Published', {
      description: res.chargeCreated
        ? `Live for eligible students. A linked Additional Charge (${formatINR(app.payment.amount)}) was created.`
        : 'Live for eligible students.',
    })
    setConfirmOpen(false)
  }

  return (
    <>
      <Button size="sm" className="h-7 text-[11px] gap-1" onClick={() => setConfirmOpen(true)}>
        <Send className="h-3 w-3" /> Publish
      </Button>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md z-[70]">
          <DialogHeader>
            <DialogTitle className="text-sm">Publish "{app.title}"?</DialogTitle>
            <DialogDescription className="text-xs">
              Eligible students will see it immediately{app.payment.mode !== 'None' ? ` with a ${formatINR(app.payment.amount)} charge` : ''}.
              {app.payment.mode !== 'None' && ' The linked additional charge follows normal Fee Management flows.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setConfirmOpen(false)}>Not yet</Button>
            <Button size="sm" className="h-8 text-xs" onClick={doPublish}>Confirm Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Principal approval decision (PART 14) ─────────────────────────────
// The review screen actions for a teacher-created form: Request Changes /
// Reject / Approve. Every action takes a mandatory note except approve.

function ApprovalDecision({ appId }: { appId: string }) {
  const requestChanges = useApplicationsStore((s) => s.requestApprovalChanges)
  const approveApplication = useApplicationsStore((s) => s.approveApplication)
  const rejectApplication = useApplicationsStore((s) => s.rejectApplication)
  const [dialog, setDialog] = useState<null | 'approve' | 'changes' | 'reject'>(null)
  const [note, setNote] = useState('')
  const app = useApplicationsStore((s) => s.applications.find((a) => a.id === appId))
  if (!app) return null

  const submit = (kind: 'approve' | 'changes' | 'reject') => {
    const res = kind === 'approve'
      ? approveApplication(appId, note, 'Dr. Ananya Iyer')
      : kind === 'changes'
        ? requestChanges(appId, note, 'Dr. Ananya Iyer')
        : rejectApplication(appId, note, 'Dr. Ananya Iyer')
    if (!res.success) {
      toast.error(kind === 'approve' ? 'Cannot approve' : kind === 'changes' ? 'Cannot send back' : 'Cannot reject', { description: res.error })
      return
    }
    toast.success(
      kind === 'approve' ? 'Form APPROVED' : kind === 'changes' ? 'Sent back for changes' : 'Form rejected',
      {
        description: kind === 'approve'
          ? 'The in-charge can now publish and operate it.'
          : kind === 'changes'
            ? `${app.inChargeName ?? 'The in-charge'} can edit and resubmit.`
            : 'The in-charge is notified via the form record.',
      },
    )
    setDialog(null)
    setNote('')
  }

  return (
    <>
      <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => { setDialog('changes'); setNote('') }}>
        <Undo2 className="h-3 w-3" /> Request changes
      </Button>
      <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1 text-rose-600 border-rose-500/30 hover:bg-rose-500/10" onClick={() => { setDialog('reject'); setNote('') }}>
        <XCircle className="h-3 w-3" /> Reject
      </Button>
      <Button size="sm" className="h-7 text-[11px] gap-1" onClick={() => { setDialog('approve'); setNote('') }}>
        <CheckCircle2 className="h-3 w-3" /> Approve
      </Button>
      <Dialog open={dialog !== null} onOpenChange={(o) => { if (!o) setDialog(null) }}>
        <DialogContent className="max-w-md z-[70]">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {dialog === 'approve' ? `Approve "${app.title}"?` : dialog === 'changes' ? 'Request changes' : `Reject "${app.title}"?`}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {dialog === 'approve'
                ? 'The form is frozen as reviewed and can be published by you or the in-charge.'
                : dialog === 'changes'
                  ? 'The form returns to the in-charge with your note. They edit and resubmit.'
                  : 'The form returns to the in-charge as rejected. Your reason is recorded permanently.'}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label className="text-[10px] text-muted-foreground">
              Note to {app.inChargeName ?? 'in-charge'} {dialog !== 'approve' && <span className="text-rose-500">*</span>}
            </Label>
            <textarea
              className="mt-1 w-full min-h-[64px] rounded-md border border-border bg-transparent px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder={dialog === 'approve' ? 'Optional — e.g. approved as submitted.' : 'Be specific — e.g. add a medical section, move the deadline after the unit tests…'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setDialog(null)}>Cancel</Button>
            <Button
              size="sm"
              className={cn('h-8 text-xs', dialog === 'reject' && 'bg-rose-600 hover:bg-rose-700 text-white')}
              onClick={() => dialog && submit(dialog)}
            >
              {dialog === 'approve' ? 'Confirm approval' : dialog === 'changes' ? 'Send for changes' : 'Confirm rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Form tab (PART 16) — the official form definition ─────────────────

function FormPanel({ appId }: { appId: string }) {
  const app = useApplicationsStore((s) => s.applications.find((a) => a.id === appId))
  if (!app) return null
  const sections = new Map<string, typeof app.formFields>()
  for (const f of app.formFields) {
    const key = f.section ?? 'Application Details'
    const arr = sections.get(key) ?? []
    arr.push(f)
    sections.set(key, arr)
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
      <Panel title="Form structure" subtitle={`${app.formFields.length} questions across ${sections.size} section${sections.size === 1 ? '' : 's'}`} className="lg:col-span-2" bodyClassName="pt-1 pb-3">
        {app.formFields.length === 0 ? (
          <p className="text-xs text-muted-foreground px-1">No questions configured yet.</p>
        ) : (
          <div className="space-y-4 px-1">
            {Array.from(sections.entries()).map(([section, fields]) => (
              <div key={section}>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">{section}</p>
                <div className="space-y-1.5">
                  {fields.map((f, i) => (
                    <div key={f.id} className="flex items-start gap-2 text-xs rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                      <span className="text-[10px] tabular-nums text-muted-foreground mt-0.5 w-4 shrink-0">{i + 1}.</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{f.label}{f.required && <span className="text-rose-500"> *</span>}</p>
                        {f.helpText && <p className="text-[10px] text-muted-foreground mt-0.5">{f.helpText}</p>}
                      </div>
                      <Badge variant="outline" className="text-[8px] h-4 px-1.5 shrink-0 uppercase">{f.type}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <div className="space-y-4">
        <Panel title="Blank official form" subtitle="for offline distribution" bodyClassName="pt-2">
          <BlankFormMenu />
        </Panel>
        <Panel title="Student identity sections" subtitle="auto-filled at submission" bodyClassName="pt-2 pb-3">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Every generated form opens with <span className="font-medium text-foreground">Student Particulars</span> (name, admission no., class, section)
            and <span className="font-medium text-foreground">Parent / Guardian Details</span> pulled straight from the school record —
            applicants never re-type what the ERP already knows.
          </p>
        </Panel>
      </div>
    </div>
  )
}

/** Blank-form quick menu (print / download) used in header. */
function BlankFormMenu() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => setOpen(!open)} aria-expanded={open}>
        <FileText className="h-3 w-3" /> Blank form <ChevronDown className="h-3 w-3" />
      </Button>
      {open && (
        <>
          <button type="button" aria-hidden className="fixed inset-0 z-[60] cursor-default" onClick={() => setOpen(false)} tabIndex={-1} />
          <div className="absolute right-0 top-8 z-[61] w-44 rounded-lg border border-border bg-popover p-1 shadow-md">
            <MenuItem icon={<Printer className="h-3.5 w-3.5" />} label="Print blank form"
              onClick={() => { setTimeout(printApplicationDocument, 80); setOpen(false) }} />
            <MenuItem icon={<Download className="h-3.5 w-3.5" />} label="Download (.html)"
              onClick={() => { downloadApplicationDocument(`BLANK-${Date.now()}`); setOpen(false) }} />
          </div>
        </>
      )}
    </div>
  )
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-left hover:bg-muted/60 transition-colors"
    >
      {icon} {label}
    </button>
  )
}

function StatTile({ label, value, hint, tone, icon }: {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'emerald' | 'amber'
  icon?: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg bg-muted/40 px-2.5 py-1.5"
    >
      <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground flex items-center gap-1">
        {icon}{label}
      </p>
      <p className={cn(
        'text-sm font-bold tabular-nums leading-tight mt-0.5',
        tone === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
        tone === 'amber' && 'text-amber-600 dark:text-amber-400',
        !tone && 'text-foreground',
      )}>{value}</p>
      {hint && <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{hint}</p>}
    </motion.div>
  )
}

// ─── Overview tab ──────────────────────────────────────────────────────

function OverviewPanel({ app, submissions, charge, collectedApp }: {
  app: SchoolApplication
  submissions: ApplicationSubmission[]
  charge: ReturnType<typeof useFeeStore.getState>['additionalCharges'][number] | undefined
  collectedApp: number
}) {
  const consentSummary = submissions.reduce((acc, s) => {
    if (!app.guardianConsent.required) return acc
    if (isConsentSatisfied(app, s)) acc.done++
    else acc.pending++
    return acc
  }, { done: 0, pending: 0 })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
      <div className="lg:col-span-2 space-y-4">
        <Panel title="About" bodyClassName="pt-1">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {app.description ?? 'No description provided.'}
          </p>
        </Panel>

        {/* Linked source record (PART 16) — exam-generated forms stay
            connected to their examination permanently. */}
        {app.sourceRef && (
          <Panel title={`Linked ${app.sourceRef.module}`} bodyClassName="pt-2 pb-3">
            <div className="flex items-center gap-2.5 px-1">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate">{app.sourceRef.label ?? app.sourceRef.module}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  Generated automatically from the {app.sourceRef.module} module{app.sourceRef.id ? ` · record ${app.sourceRef.id}` : ''}
                </p>
              </div>
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 shrink-0">Source: {app.source}</Badge>
            </div>
          </Panel>
        )}

        {/* Approval workflow trail (PART 14) — the immutable teacher ⇄
            Principal conversation that governs this form. */}
        {app.approvalNotes.length > 0 && (
          <Panel title="Approval trail" subtitle={`${app.createdByRole === 'Teacher' ? 'Teacher-created' : 'Principal-created'} · ${app.approvalNotes.length} entr${app.approvalNotes.length === 1 ? 'y' : 'ies'}`} bodyClassName="p-0">
            <div className="divide-y divide-border max-h-52 overflow-y-auto custom-scrollbar">
              {app.approvalNotes.map((n) => (
                <div key={n.id} className="px-4 py-2 flex items-start gap-2.5">
                  <span className={cn(
                    'mt-0.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-semibold uppercase shrink-0',
                    n.kind === 'approval' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                    n.kind === 'changes' && 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
                    n.kind === 'rejection' && 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
                    n.kind === 'submitted' && 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
                    n.kind === 'note' && 'bg-muted text-muted-foreground',
                  )}>
                    {n.kind}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-relaxed">{n.note}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{n.by} · {n.role} · {formatDate(n.at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}

        <Panel title="Workflow configuration" bodyClassName="pt-2 pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 px-1">
            <FactRow label="Participation" value={app.participation} />
            <FactRow label="Teacher approval" value={app.teacherApprovalRequired ? `Required${app.inChargeName ? ` — ${app.inChargeName}` : ''}` : 'Not required'} />
            <FactRow label="Guardian consent" value={!app.guardianConsent.required
              ? 'Not required'
              : `${app.guardianConsent.method}${consentSummary.done + consentSummary.pending > 0 ? ` · ${consentSummary.done}/${consentSummary.done + consentSummary.pending} given` : ''}`} />
            <FactRow label="Physical signature flow" value={app.physicalSignatureRequired ? 'Print → sign → office verifies' : 'Not required'} />
            <FactRow label="Start date" value={app.startDate ? formatDate(app.startDate) : '—'} />
            <FactRow label="Lock date" value={app.lockDate ? formatDate(app.lockDate) : 'Auto at deadline'} />
            <FactRow label="Eligible classes" value={
              app.targetStudentIds?.length
                ? `${app.targetStudentIds.length} specific students`
                : `${app.targetClassIds.length} class(es)${app.targetSectionNames?.length ? ` · sections ${app.targetSectionNames.join(', ')}` : ''}`
            } />
            <FactRow label="Questions on form" value={`${app.formFields.length}`} />
          </div>
        </Panel>
      </div>

      <div className="space-y-4">
        <Panel title="Payment link" subtitle={app.payment.mode === 'None' ? 'No charge on this form' : 'Connected to Fee Management'} bodyClassName="pt-1">
          {app.payment.mode === 'None' ? (
            <p className="text-xs text-muted-foreground">This application collects no money.</p>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{app.payment.feeHeadLabel || app.title}</span>
                <span className="font-bold tabular-nums">{formatINR(app.payment.amount)}</span>
              </div>
              {charge && (
                <>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500/80 transition-all"
                      style={{ width: `${charge.amount * Math.max(1, submissions.length) > 0 ? Math.min(100, Math.round((collectedApp / (app.payment.amount * Math.max(1, submissions.length))) * 100)) : 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center justify-between">
                    <span>{formatINR(collectedApp, true)} collected · charge <span className="font-mono">{charge.id}</span></span>
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    One Additional Charge in Fee Management serves every rupee of this application — no duplicate obligations, no parallel ledgers.
                  </p>
                </>
              )}
            </div>
          )}
        </Panel>

        <Panel title="Deadlines" bodyClassName="pt-1">
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Publish</span><span>{app.publishDate ? formatDate(app.publishDate) : '—'}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Deadline</span><span className="font-medium">{formatDate(app.deadline)}</span></div>
            {app.eventDate && (
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Event</span><span>{formatDate(app.eventDate)}</span></div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs border-b border-dashed border-border/40 pb-1.5 last:border-b-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right truncate">{value}</span>
    </div>
  )
}

// ─── Submissions tab ───────────────────────────────────────────────────

function SubmissionsPanel({ app, submissions, onView, onRecordOffline }: {
  app: SchoolApplication
  submissions: ApplicationSubmission[]
  onView: (id: string) => void
  onRecordOffline: () => void
}) {
  const [search, setSearch] = useState('')
  const [payFilter, setPayFilter] = useState<'all' | CombinedSubmissionStatus>('all')
  const [className, setClassName] = useState<string>('all')

  const classOptions = useMemo(() => Array.from(new Set(submissions.map((s) => `${s.className}-${s.section}`))), [submissions])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...submissions]
      .filter((s) => {
        const cs = combinedSubmissionStatus(app, s)
        if (payFilter !== 'all' && cs !== payFilter) return false
        if (className !== 'all' && `${s.className}-${s.section}` !== className) return false
        if (q && !(s.studentName.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q))) return false
        return true
      })
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  }, [submissions, app, search, payFilter, className])

  const exportCsv = () => {
    const headers = ['Submission ID', 'Student', 'Admission No', 'Class', 'Section', 'Guardian', 'Guardian Phone', 'Submitted At', 'Mode', 'Consent', 'Document', 'Approval', 'Payment', 'Receipts']
    const fieldCols = app.formFields.map((f) => f.label)
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = filtered.map((s) => {
      const pay = deriveSubmissionPayment(app, s)
      const base = [s.id, s.studentName, s.admissionNo, s.className, s.section, s.guardianName, s.guardianPhone, s.submittedAt, s.mode,
        isConsentSatisfied(app, s) ? 'Given' : 'Pending', s.physicalDoc.status, s.status, pay.status, pay.receiptNos.join('; ')]
      const answers = app.formFields.map((f) => {
        const v = s.answers[f.id]
        if (Array.isArray(v)) return v.join('; ')
        return typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v ?? ''
      })
      return [...base, ...answers].map(esc).join(',')
    })
    const csv = [headers.concat(fieldCols).map(esc).join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${app.title.replace(/\W+/g, '-')}-submissions-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success(`${filtered.length} submission${filtered.length === 1 ? '' : 's'} exported`)
  }

  return (
    <Panel
      title="Submissions"
      subtitle={`${filtered.length} of ${submissions.length} shown`}
      action={
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="h-3 w-3" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={onRecordOffline}>
            <ClipboardList className="h-3 w-3" /> Record paper form
          </Button>
        </div>
      }
      bodyClassName="p-0"
    >
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap px-4 py-2.5 border-b border-border/60">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-8 h-8 text-xs" placeholder="Search student / admission no." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={className} onValueChange={setClassName}>
          <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="z-[70]">
            <SelectItem value="all" className="text-xs">All classes</SelectItem>
            {classOptions.map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={payFilter} onValueChange={(v) => setPayFilter(v as 'all' | CombinedSubmissionStatus)}>
          <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="z-[70]">
            <SelectItem value="all" className="text-xs">All statuses</SelectItem>
            {(Object.keys(STATUS_TONE) as CombinedSubmissionStatus[]).map((k) => (
              <SelectItem key={k} value={k} className="text-xs">{k}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="py-10 text-center">
          <Users className="h-6 w-6 mx-auto text-muted-foreground/40" />
          <p className="mt-2 text-xs text-muted-foreground">
            {submissions.length === 0
              ? app.status === 'Published' ? 'Waiting for submissions — students see this in their Applications page.'
                : 'Publish the application to start receiving submissions.'
              : 'No submissions match the current filters.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border max-h-[480px] overflow-y-auto custom-scrollbar">
          {filtered.map((s) => {
            const cs = combinedSubmissionStatus(app, s)
            const pay = deriveSubmissionPayment(app, s)
            const consentOk = isConsentSatisfied(app, s)
            return (
              <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-2.5 hover:bg-muted/25 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-500/10 ring-1 ring-slate-500/20 text-[9px] font-semibold text-slate-600 dark:text-slate-300">
                    {s.studentName.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{s.studentName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {s.className}-{s.section} · {s.admissionNo} · {new Date(s.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {!consentOk && app.guardianConsent.required && ' · consent pending'}
                      {s.resubmissionCount > 0 && ` · resubmitted ×${s.resubmissionCount}`}
                    </p>
                  </div>
                  {/* Money mini-chip */}
                  <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0">
                    {app.payment.mode !== 'None' ? (
                      <>
                        <span className={cn('text-[10px] font-semibold tabular-nums', pay.status === 'Paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
                          {pay.status === 'Paid' ? formatINR(pay.paidAmount, true) : formatINR(pay.expectedAmount, true)}
                        </span>
                        <span className="text-[9px] text-muted-foreground">{pay.status}{pay.pendingReceiptNo ? ` · ${pay.pendingReceiptNo}` : ''}</span>
                      </>
                    ) : (
                      <span className="text-[9px] text-muted-foreground">no fee</span>
                    )}
                  </div>
                  <SubmissionStatusChip status={cs} />
                  <Button variant="outline" size="sm" className="h-7 text-[11px] shrink-0" onClick={() => onView(s.id)}>
                    Review
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </Panel>
  )
}

// ─── Payments tab ──────────────────────────────────────────────────────

function PaymentsPanel({ app, submissions, charge }: {
  app: SchoolApplication
  submissions: ApplicationSubmission[]
  charge: ReturnType<typeof useFeeStore.getState>['additionalCharges'][number] | undefined
}) {
  if (app.payment.mode === 'None') {
    return (
      <Panel title="Payments">
        <div className="py-8 text-center">
          <Wallet className="h-6 w-6 mx-auto text-muted-foreground/40" />
          <p className="mt-2 text-xs text-muted-foreground">This form collects no money.</p>
        </div>
      </Panel>
    )
  }
  const expectedApp = app.payment.amount * Math.max(1, submissions.length)
  const roll = submissions.reduce(
    (acc, s) => {
      const pay = deriveSubmissionPayment(app, s)
      acc.paid += pay.paidAmount
      if (pay.status === 'Awaiting Verification') acc.pendingCash += pay.expectedAmount
      return acc
    },
    { paid: 0, pendingCash: 0 },
  )
  const paid = roll.paid
  const pendingCash = roll.pendingCash
  const rows = submissions.map((s) => ({ sub: s, pay: deriveSubmissionPayment(app, s) }))
  // The application's own payment history — ONLY transactions bound to this
  // application (applicationId stamp, or its charge for office-recorded rows).
  const history = applicationPayments(app).sort((a, b) => (b.recordedAt ?? b.date).localeCompare(a.recordedAt ?? a.date))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Expected (from submissions)" value={formatINR(expectedApp, true)} />
        <StatTile label="Collected" value={formatINR(paid, true)} tone="emerald" />
        <StatTile label="Cash verifying" value={formatINR(pendingCash, true)} tone="amber" hint="approve in Fee Management → Payments" />
      </div>
      <Panel
        title="Payment history — this application"
        subtitle={`${history.length} payment${history.length === 1 ? '' : 's'} bound to this application${charge ? ` · charge ${charge.id}` : ''}`}
        bodyClassName="p-0"
      >
        {history.length === 0 ? (
          <div className="py-8 text-center"><p className="text-xs text-muted-foreground">No payments recorded yet — payments appear here the moment students pay.</p></div>
        ) : (
          <div className="divide-y divide-border max-h-[360px] overflow-y-auto custom-scrollbar">
            {history.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-2 hover:bg-muted/25 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{t.studentName} <span className="font-normal text-muted-foreground">· {t.admissionNo}</span></p>
                  <p className="text-[10px] text-muted-foreground font-mono">{t.receiptNo} · {formatDate(t.date)} · {t.mode}{t.referenceNo ? ` · ref ${t.referenceNo}` : ''}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold tabular-nums">{formatINR(t.amount, true)}</p>
                  <p className={cn(
                    'text-[9px] font-semibold',
                    t.status === 'Success' ? 'text-emerald-600 dark:text-emerald-400' : t.status === 'Under Verification' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400',
                  )}>{t.status === 'Success' ? 'Paid' : t.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Panel
        title="Per-student money trail"
        subtitle={`Transactions carry ${charge ? `charge id ${charge.id}` : 'the application charge'} — identical rows appear in Fee Management`}
        bodyClassName="p-0"
      >
        {rows.length === 0 ? (
          <div className="py-8 text-center"><p className="text-xs text-muted-foreground">No submissions yet — no financial activity can exist.</p></div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map(({ sub, pay }) => (
              <div key={sub.id} className="flex items-center gap-3 px-4 py-2 hover:bg-muted/25 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{sub.studentName}</p>
                  <p className="text-[10px] text-muted-foreground">{sub.className}-{sub.section} · {sub.admissionNo}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn('text-xs font-bold tabular-nums', pay.status === 'Paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
                    {formatINR(pay.status === 'Paid' ? pay.paidAmount : pay.expectedAmount, true)}
                  </p>
                  <p className="text-[9px] text-muted-foreground font-mono">
                    {pay.receiptNos.length ? pay.receiptNos.join(', ') : pay.pendingReceiptNo ?? 'no receipt yet'}
                  </p>
                </div>
                <span className={cn(
                  'w-[110px] text-right text-[10px] font-semibold shrink-0',
                  pay.status === 'Paid' ? 'text-emerald-600 dark:text-emerald-400'
                    : pay.status === 'Awaiting Verification' ? 'text-amber-600 dark:text-amber-400'
                      : 'text-muted-foreground',
                )}>{pay.status}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
      {pendingCash > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-500/5 dark:border-amber-500/20 px-4 py-2.5 flex items-start gap-2.5">
          <CalendarClock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
            Cash collections stay &quot;Under Verification&quot; until approved in Fee Management → Payments. This view never marks cash as paid by itself.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Documents tab ─────────────────────────────────────────────────────

function DocumentsPanel({ app, submissions, onView }: {
  app: SchoolApplication
  submissions: ApplicationSubmission[]
  onView: (id: string) => void
}) {
  const verifyDoc = useApplicationsStore((s) => s.verifyPhysicalDocument)
  const markDocumentReceived = useApplicationsStore((s) => s.markDocumentReceived)
  const [fileName, setFileName] = useState<Record<string, string>>({})
  const needsPhysical = app.physicalSignatureRequired || app.guardianConsent.method === 'Physical Signature'

  return (
    <div className="space-y-4">
      <Panel title="Printable document" subtitle="Official A4 layout — signatures, stamp area, permanent record quality" bodyClassName="p-0">
        <div className="max-h-[420px] overflow-y-auto custom-scrollbar bg-muted/30 p-4">
          <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
            <ApplicationPrintDocument app={app} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-1.5 px-4 py-2.5 border-t border-border/60">
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => printApplicationDocument()}>
            <Printer className="h-3 w-3" /> Print / Save PDF
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => downloadApplicationDocument(applicationDocFileName({ app }))}>
            <Download className="h-3 w-3" /> Download
          </Button>
        </div>
      </Panel>

      <Panel title="Signed documents" subtitle={needsPhysical ? 'Physical round-trip tracking' : 'No paper round-trip configured'} bodyClassName="p-0">
        {!needsPhysical ? (
          <div className="py-8 text-center">
            <FileSignature className="h-6 w-6 mx-auto text-muted-foreground/40" />
            <p className="mt-2 text-xs text-muted-foreground">This form runs fully digital.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {(() => {
              const tracked = submissions.filter((s) => s.physicalDoc.status !== 'Not Required')
              if (tracked.length === 0) {
                return <p className="py-6 text-center text-xs text-muted-foreground">No signed documents awaited or received yet.</p>
              }
              return tracked.map((s) => (
                <div key={s.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-muted/25 transition-colors">
                  <FileSignature className="h-4 w-4 text-violet-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{s.studentName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {s.physicalDoc.fileName ?? 'not received'}
                      {s.physicalDoc.receivedBy ? ` · received by ${s.physicalDoc.receivedBy}` : ''}
                    </p>
                  </div>
                  <SubmissionStatusChip status={combinedSubmissionStatus(app, s)} />
                  {s.physicalDoc.status !== 'Verified' && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Input
                        className="h-7 w-36 text-[10px]"
                        placeholder="scan file name…"
                        value={fileName[s.id] ?? ''}
                        onChange={(e) => setFileName((m) => ({ ...m, [s.id]: e.target.value }))}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px]"
                        disabled={!fileName[s.id]}
                        onClick={() => markDocumentReceived(s.id, fileName[s.id], 'Dr. Ananya Iyer', 'Principal')}
                      >
                        Received
                      </Button>
                    </div>
                  )}
                  {s.physicalDoc.status === 'Received' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px]"
                      onClick={() => verifyDoc(s.id, 'Dr. Ananya Iyer')}
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Verify
                    </Button>
                  )}
                  {s.physicalDoc.status === 'Verified' && (
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300 shrink-0">Verified</Badge>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 text-[11px] shrink-0" onClick={() => onView(s.id)}>
                    Open
                  </Button>
                </div>
              ))
            })()}
          </div>
        )}
      </Panel>
    </div>
  )
}

// ─── Activity tab (immutable audit) ────────────────────────────────────

function ActivityPanel({ events }: { events: ReturnType<typeof useApplicationsStore.getState>['audit'] }) {
  const sorted = [...events].sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 60)
  return (
    <Panel title="History" subtitle="Immutable audit trail — latest first" bodyClassName="p-0">
      {sorted.length === 0 ? (
        <div className="py-8 text-center"><p className="text-xs text-muted-foreground">Nothing logged yet.</p></div>
      ) : (
        <div className="divide-y divide-border max-h-[480px] overflow-y-auto custom-scrollbar">
          {sorted.map((ev, i) => (
            <div key={ev.id} className="px-4 py-2 flex items-start gap-3">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" style={{ opacity: 1 - i * 0.03 }} />
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-snug">{ev.message}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(ev.ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · {ev.actor} ({ev.actorRole})
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

// ─── Submission viewer dialog ──────────────────────────────────────────

function answerText(v: string | string[] | boolean | undefined): string {
  if (v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (Array.isArray(v)) return v.join(', ')
  return v
}

function SubmissionDialog({ open, app, sub, onClose }: {
  open: boolean
  app: SchoolApplication
  sub: ApplicationSubmission
  onClose: () => void
}) {
  const reviewSubmission = useApplicationsStore((s) => s.reviewSubmission)
  const addReviewNote = useApplicationsStore((s) => s.addReviewNote)
  const withdrawSubmission = useApplicationsStore((s) => s.withdrawSubmission)
  const pay = deriveSubmissionPayment(app, sub)
  const consentOk = isConsentSatisfied(app, sub)
  const cs = combinedSubmissionStatus(app, sub)
  const [note, setNote] = useState('')
  const [decisionNote, setDecisionNote] = useState('')
  const alreadyDecided = ['Approved', 'Rejected'].includes(sub.status)
  const payBlocker = app.payment.mode === 'Required' && pay.status !== 'Paid'

  const act = (decision: 'approve' | 'reject' | 'request_correction') => {
    const res = reviewSubmission(sub.id, decision, decisionNote, 'Dr. Ananya Iyer', 'Principal')
    if (!res.success) {
      toast.error(res.error ?? 'Action failed')
      return
    }
    toast.success(decision === 'approve' ? 'Approved' : decision === 'reject' ? 'Rejected' : 'Correction requested')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[86vh] overflow-y-auto custom-scrollbar z-[70]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm pr-8">
            {sub.studentName} · {sub.className}-{sub.section}
            <SubmissionStatusChip status={cs} />
          </DialogTitle>
          <DialogDescription className="text-xs">
            {sub.admissionNo} · submitted {new Date(sub.submittedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · {sub.mode} · guardian {sub.guardianName} ({sub.guardianPhone})
            {sub.id.startsWith('SUB-SEED') && ' · seeded record'}
          </DialogDescription>
        </DialogHeader>

        {/* Filled official document preview */}
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="rounded-md bg-card shadow-sm overflow-hidden">
            <ApplicationPrintDocument
              app={app}
              sub={sub}
              notes={sub.reviewNotes}
              paymentLines={app.payment.mode !== 'None' ? [
                { label: 'Payment status', value: pay.status },
                ...applicationPayments(app)
                  .filter((t) => t.studentId === sub.studentId)
                  .map((t) => ({
                    label: `Receipt ${t.receiptNo}`,
                    value: `${formatINR(t.amount)} · ${t.mode} · ${formatDate(t.date)} · ${t.status === 'Success' ? 'Paid' : t.status}`,
                  })),
              ] : []}
            />
          </div>
          <div className="flex items-center justify-end gap-1.5 mt-2.5">
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => printApplicationDocument()}>
              <Printer className="h-3 w-3" /> Print
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => downloadApplicationDocument(applicationDocFileName({ app, sub }))}>
              <Download className="h-3 w-3" /> Download
            </Button>
          </div>
        </div>

        {/* Answers not covered by the print doc */}
        {Object.keys(sub.answers).length > 0 && (
          <div className="rounded-lg border border-border p-3 space-y-1.5">
            <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Responses</p>
            {app.formFields.map((f) => (
              <div key={f.id} className="flex items-start justify-between gap-3 text-xs">
                <span className="text-muted-foreground shrink-0">{f.label}</span>
                <span className="font-medium text-right">{answerText(sub.answers[f.id])}</span>
              </div>
            ))}
          </div>
        )}

        {/* Payment line */}
        {app.payment.mode !== 'None' && (
          <div className="rounded-lg border border-border p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold">{app.payment.feeHeadLabel}</p>
              <p className="text-[10px] text-muted-foreground">
                {pay.status === 'Paid' ? `Paid ${formatINR(pay.paidAmount)} · receipts ${pay.receiptNos.join(', ')}` : pay.status === 'Awaiting Verification' ? `Receipt ${pay.pendingReceiptNo} awaits Principal verification` : `Owes ${formatINR(pay.expectedAmount)}`}
              </p>
            </div>
            <span className={cn('text-[10px] font-semibold', pay.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600')}>{pay.status}</span>
          </div>
        )}

        {/* Notes + decisions */}
        {!alreadyDecided && sub.status !== 'Withdrawn' && (
          <div className="rounded-lg border border-border p-3 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <DecisionBtn label="Approve" tone="emerald" disabled={!!payBlocker || (!consentOk && app.guardianConsent.required)}
                reason={payBlocker ? 'payment must complete first' : (!consentOk && app.guardianConsent.required) ? 'guardian consent required' : undefined}
                onClick={() => act('approve')}>
                <UserCheck className="h-3.5 w-3.5" />
              </DecisionBtn>
              <DecisionBtn label="Request correction" tone="amber" onClick={() => act('request_correction')}>
                <StickyNote className="h-3.5 w-3.5" />
              </DecisionBtn>
              <DecisionBtn label="Reject" tone="rose" onClick={() => act('reject')}>
                <XCircle className="h-3.5 w-3.5" />
              </DecisionBtn>
            </div>
            <Textarea className="min-h-[48px] text-xs" placeholder="Reason / instruction shown to student and teacher…" value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} />
            <div className="flex items-center gap-2 pt-1 border-t border-dashed border-border">
              <Input className="h-8 flex-1 text-xs" placeholder="Add a non-blocking note…" value={note} onChange={(e) => setNote(e.target.value)} />
              <Button variant="outline" size="sm" className="h-8 text-[11px]"
                onClick={() => { addReviewNote(sub.id, note, 'Dr. Ananya Iyer', 'Principal'); setNote(''); toast.success('Note added') }}>
                <StickyNote className="h-3 w-3" /> Note
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-[11px] text-rose-600"
                onClick={() => { const r = withdrawSubmission(sub.id, 'Dr. Ananya Iyer'); toast[r.success ? 'success' : 'error'](r.success ? 'Withdrawn' : r.error!) }}>
                Withdraw
              </Button>
            </div>
          </div>
        )}

        {/* Existing notes */}
        {sub.reviewNotes.length > 0 && (
          <div className="rounded-lg border border-border p-3 space-y-2">
            <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Review trail</p>
            {sub.reviewNotes.map((n) => (
              <div key={n.id} className="text-[11px] border-l-2 border-border pl-2.5 py-0.5">
                <span className="font-semibold">{n.role === 'Principal' ? 'Principal' : n.role}:</span> {n.note}
                <span className="ml-1.5 text-muted-foreground">· {new Date(n.at).toLocaleDateString('en-IN')}</span>
              </div>
            ))}
          </div>
        )}

        {/* Config links */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
          <span>Record {sub.id} · permanently filed with {app.academicYear}</span>
          <ExternalLink className="h-3 w-3" />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DecisionBtn({ children, label, tone, onClick, disabled, reason }: {
  children: React.ReactNode
  label: string
  tone: 'emerald' | 'amber' | 'rose'
  onClick: () => void
  disabled?: boolean
  reason?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? reason : undefined}
      className={cn(
        'flex items-center justify-center gap-1.5 h-8 rounded-md border text-[11px] font-semibold transition-colors',
        tone === 'emerald' && 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10',
        tone === 'amber' && 'border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-500/30 dark:text-amber-300 dark:hover:bg-amber-500/10',
        tone === 'rose' && 'border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10',
        disabled && 'opacity-45 cursor-not-allowed hover:bg-transparent',
      )}
    >
      {children} {label}
    </button>
  )
}

// ─── Offline recorder dialog ───────────────────────────────────────────

function OfflineRecorderDialog({ app, onClose }: { app: SchoolApplication; onClose: () => void }) {
  const recordOffline = useApplicationsStore((s) => s.recordOfflineSubmission)
  const students = useActiveStudents()
  const [studentId, setStudentId] = useState('')
  const [attachment, setAttachment] = useState('')

  const eligible = students.filter((s) =>
    app.targetClassIds.includes(s.classId)
    && (!app.targetSectionNames?.length || app.targetSectionNames.includes(s.section)),
  )

  const submit = () => {
    const stu = eligible.find((s) => s.id === studentId)
    if (!stu) {
      toast.error('Pick the student whose paper you recorded.')
      return
    }
    const res = recordOffline({
      applicationId: app.id,
      student: stu,
      attachmentName: attachment.trim() || undefined,
      recordedBy: 'Dr. Ananya Iyer',
      recorderRole: 'Principal',
    })
    if (!res.success) {
      toast.error('Could not record', { description: res.error })
      return
    }
    toast.success('Paper submission recorded', { description: 'Signed scan kept against the permanent record.' })
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm z-[70]">
        <DialogHeader>
          <DialogTitle className="text-sm">Record paper submission</DialogTitle>
          <DialogDescription className="text-xs">
            Use after collecting a physically signed blank form. Printed copies are downloadable from Documents.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Choose student" /></SelectTrigger>
              <SelectContent className="z-[70] max-h-56">
                {eligible.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.name} · {s.className}-{s.section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Scanned document reference</Label>
            <Input className="h-9 text-xs" placeholder="e.g. jaipur-signed-rahul.pdf" value={attachment} onChange={(e) => setAttachment(e.target.value)} />
            <p className="text-[10px] text-muted-foreground">File name kept on record; attach scans per your document policy.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="h-8 text-xs" onClick={submit} disabled={!studentId}>Record</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Live active roster read straight from the canonical registry (hooks-safe). */
type RosterEntry = {
  id: string; name: string; admissionNo: string; className: string; classId: string; section: string; guardianName: string; guardianPhone: string;
}

function useActiveStudents(): RosterEntry[] {
  // zustand v5: raw array from the selector; project via useMemo (stable refs).
  const students = useStudentsStore((s) => s.students)
  return useMemo(
    () => students
      .filter((st) => st.status === 'Active')
      .map((st) => ({
        id: st.id, name: st.name, admissionNo: st.admissionNo, className: st.className, classId: st.classId, section: st.section, guardianName: st.guardianName, guardianPhone: st.guardianPhone,
      })),
    [students],
  )
}
