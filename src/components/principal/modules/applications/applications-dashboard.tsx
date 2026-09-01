'use client'

/**
 * ApplicationsDashboard — the template-first command centre (TOUR-CONSENT-1).
 *
 * Applications & Forms contains exactly ONE built-in form:
 *   "Educational Tour — Parent Consent Form"
 * a permanent ready-made school template. There is deliberately NO
 * "New Form" / "Create Form" button and no form builder — the Principal
 * (or authorised teacher) reuses this template per session:
 * configure → preview → publish → take down → (guarded) delete.
 *
 * Below the template card: one row per tour SESSION instance with its
 * responses, money and status. Enterprise-calm proportions per the
 * Salary & Payroll / Fee Management baseline.
 */

import { Fragment, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Archive, Bus, CheckCircle2, ChevronDown, ClipboardList, Copy, FileDown, Layers,
  Lock, PencilLine, Search, Send, ShieldAlert, Trash2, Undo2, XCircle, Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  useApplicationsStore, effectiveAppStatus, combinedSubmissionStatus,
  deriveSubmissionPayment, APPLICATION_TEMPLATES,
  type SchoolApplication,
} from '@/lib/store/applications-store'
import { CURRENT_ACADEMIC_YEAR } from '@/lib/store/fee-store-data'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { AppStatusBadge } from './application-detail'
import {
  ApplicationPrintDocument, withOffscreenDocument, downloadApplicationStackHtml,
  printApplicationDocument,
} from './application-print'

interface Props {
  onOpenApplication: (id: string) => void
  onStartCreate: () => void
  onStartEdit: (id: string) => void
}

type StatusFilter = 'all' | 'active' | 'Pending Approval' | 'Draft' | 'Approved' | 'Locked' | 'Closed' | 'Archived'

export function ApplicationsDashboard({ onOpenApplication, onStartCreate, onStartEdit }: Props) {
  const applications = useApplicationsStore((s) => s.applications)
  const submissions = useApplicationsStore((s) => s.submissions)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sessionFilter, setSessionFilter] = useState<string>('all')
  const [recordOpen, setRecordOpen] = useState(false)
  const [blankPreview, setBlankPreview] = useState(false)
  const [blankApp, setBlankApp] = useState<SchoolApplication | null>(null)

  const openBlankPreview = () => {
    setBlankApp(blankTemplateApp())
    setBlankPreview(true)
  }

  const subsByApp = useMemo(() => {
    const m = new Map<string, typeof submissions>()
    for (const s of submissions) {
      const arr = m.get(s.applicationId) ?? []
      arr.push(s)
      m.set(s.applicationId, arr)
    }
    return m
  }, [submissions])

  // Permanent-record pool: closed/locked/archived.
  const recordApps = useMemo(
    () => applications.filter((a) => {
      const st = effectiveAppStatus(a)
      return st === 'Closed' || st === 'Locked' || st === 'Archived'
    }),
    [applications],
  )

  /** The current live session (Open / Closing Soon) — drives card actions. */
  const liveApp = useMemo(
    () => applications.find((a) => ['Open', 'Closing Soon'].includes(effectiveAppStatus(a))),
    [applications],
  )
  /** Latest draft, if any — "Publish draft" shortcut target. */
  const draftApp = useMemo(
    () => applications
      .filter((a) => a.status === 'Draft' || a.status === 'Changes Requested')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0],
    [applications],
  )

  const metrics = useMemo(() => {
    let active = 0
    let closing = 0
    let awaitingReview = 0
    let awaitingMoney = 0
    for (const a of applications) {
      const st = effectiveAppStatus(a)
      if (st === 'Open') active++
      if (st === 'Closing Soon') { active++; closing++ }
      if (st === 'Pending Approval') awaitingReview++
      if (st === 'Closed' || st === 'Locked') continue
      const subs = subsByApp.get(a.id) ?? []
      for (const s of subs) {
        const cs = combinedSubmissionStatus(a, s)
        if (['Submitted', 'Under Review'].includes(cs)) awaitingReview++
        if (cs === 'Awaiting Payment' || cs === 'Awaiting Verification') awaitingMoney++
      }
    }
    return { active, closing, awaitingReview, awaitingMoney }
  }, [applications, subsByApp])

  const sessionOptions = useMemo(
    () => Array.from(new Set(applications.map((a) => a.academicYear))).sort().reverse(),
    [applications],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...applications]
      .filter((a) => {
        const eff = effectiveAppStatus(a)
        if (statusFilter === 'active' && !(['Open', 'Closing Soon'] as string[]).includes(eff as string)) return false
        if (['Draft', 'Archived', 'Pending Approval', 'Approved'].includes(statusFilter) && a.status !== statusFilter) return false
        if ((statusFilter === 'Locked' || statusFilter === 'Closed') && eff !== statusFilter) return false
        if (sessionFilter !== 'all' && a.academicYear !== sessionFilter) return false
        if (q && !(a.title.toLowerCase().includes(q))) return false
        return true
      })
      .sort((a, b) => {
        const rank = (app: SchoolApplication) => {
          switch (effectiveAppStatus(app)) {
            case 'Pending Approval': return -1 // approval queue on top
            case 'Open': case 'Closing Soon': return 0
            case 'Draft': case 'Changes Requested': case 'Rejected': case 'Approved': case 'Scheduled': return 1
            case 'Locked': case 'Closed': return 2
            default: return 3
          }
        }
        return rank(a) - rank(b) || b.createdAt.localeCompare(a.createdAt)
      })
  }, [applications, search, statusFilter, sessionFilter])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground min-w-0 truncate">
          One official form — Educational Tour consent, submissions &amp; payments
        </p>
        <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => setRecordOpen(true)} aria-label="Open record file of past applications">
          <Archive className="h-3 w-3" /> Record File
        </Button>
      </div>

      {/* ── THE built-in template card (no "New Form" button anywhere) ── */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
            <Bus className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold truncate">Educational Tour — Parent Consent Form</p>
              <Badge variant="outline" className="h-4 shrink-0 px-1 text-[8px] uppercase tracking-wider text-muted-foreground">Built-in template</Badge>
              {liveApp && <AppStatusBadge status={effectiveAppStatus(liveApp)} />}
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
              Ready-made official A4 document (सहमति पत्र) · fixed layout · reuse it for every tour session
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {liveApp && (
              <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px]" onClick={() => onOpenApplication(liveApp.id)}>
                <Eye className="h-3 w-3" /> View
              </Button>
            )}
            {draftApp ? (
              <Button size="sm" className="h-7 gap-1 bg-emerald-600 text-[11px] text-white hover:bg-emerald-700" onClick={() => onStartEdit(draftApp.id)}>
                <PencilLine className="h-3 w-3" /> Publish draft
              </Button>
            ) : null}
            <Button variant={liveApp ? 'outline' : 'default'} size="sm" className={cn('h-7 gap-1 text-[11px]', !liveApp && 'bg-emerald-600 text-white hover:bg-emerald-700')} onClick={onStartCreate}>
              <Layers className="h-3 w-3" /> Use / Configure for Session
            </Button>
            <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px]" onClick={openBlankPreview}>
              <Eye className="h-3 w-3" /> Preview
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px]">
                  <FileDown className="h-3 w-3" /> Download Blank <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 z-[70]">
                <DropdownMenuItem className="text-[11px]" onSelect={() => blankDownload('print')}>
                  Print blank form
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[11px]" onSelect={() => blankDownload('file')}>
                  Download (.html) — print-ready
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Metric strip — all counts derived from live records. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricTile label="Active tours" value={metrics.active} hint={metrics.closing ? `${metrics.closing} closing soon` : undefined} />
        <MetricTile label="Awaiting review" value={metrics.awaitingReview} tone="amber" hint="approvals + submissions" />
        <MetricTile label="Awaiting payment" value={metrics.awaitingMoney} tone="amber" hint="pay or cash verify" />
        <MetricTile label="Tour sessions" value={applications.length} />
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-8 h-8 text-xs" placeholder="Search tour sessions…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search applications" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="h-8 w-[140px] text-xs" aria-label="Status filter"><SelectValue /></SelectTrigger>
          <SelectContent className="z-[70]">
            <SelectItem value="all" className="text-xs">All statuses</SelectItem>
            <SelectItem value="active" className="text-xs">Active now</SelectItem>
            <SelectItem value="Pending Approval" className="text-xs">Pending approval</SelectItem>
            <SelectItem value="Draft" className="text-xs">Drafts</SelectItem>
            <SelectItem value="Approved" className="text-xs">Approved</SelectItem>
            <SelectItem value="Locked" className="text-xs">Locked</SelectItem>
            <SelectItem value="Closed" className="text-xs">Taken down</SelectItem>
            <SelectItem value="Archived" className="text-xs">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sessionFilter} onValueChange={setSessionFilter}>
          <SelectTrigger className="h-8 w-[140px] text-xs" aria-label="Session filter"><SelectValue /></SelectTrigger>
          <SelectContent className="z-[70]">
            <SelectItem value="all" className="text-xs">All sessions</SelectItem>
            {sessionOptions.map((y) => (
              <SelectItem key={y} value={y} className="text-xs">{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* overflow-x-auto + min-width wrapper: narrow viewports scroll
          horizontally INSIDE the card instead of clipping columns. */}
      <div className="rounded-xl border border-border bg-card overflow-hidden overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 border-b border-border/60 bg-muted/30 text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">
            <span className="flex-1">Tour session</span>
            <span className="w-32 shrink-0 hidden lg:block">In-charge</span>
            <span className="w-28 shrink-0">Deadline</span>
            <span className="w-20 shrink-0 text-right">Responses</span>
            <span className="w-36 shrink-0 text-right">Money</span>
            <span className="w-24 shrink-0 text-right">Status</span>
            <span className="w-[72px] shrink-0" />
          </div>
          {filtered.length > 0 && (
            <div className="divide-y divide-border">
              {filtered.map((a, i) => (
                <Row
                  key={a.id}
                  app={a}
                  index={i}
                  submissions={subsByApp.get(a.id) ?? []}
                  onOpen={() => onOpenApplication(a.id)}
                  onEdit={() => onStartEdit(a.id)}
                />
              ))}
            </div>
          )}
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <ClipboardList className="h-6 w-6 mx-auto text-muted-foreground/40" />
            <p className="mt-2 text-xs text-muted-foreground">No tour sessions match this view.</p>
            <Button variant="outline" size="sm" className="h-7 mt-3 text-[11px]" onClick={onStartCreate}>
              Use the template for a session
            </Button>
          </div>
        )}
      </div>

      {/* Blank-form preview dialog */}
      <Dialog open={blankPreview} onOpenChange={setBlankPreview}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] flex flex-col">
          <DialogHeader className="text-left shrink-0">
            <DialogTitle className="text-sm">Educational Tour — Parent Consent Form</DialogTitle>
            <DialogDescription className="text-[11px]">
              Blank official A4 document — the fixed template schools print and distribute
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-white p-3">
            {blankApp && <ApplicationPrintDocument app={blankApp} />}
          </div>
          <div className="flex shrink-0 justify-end gap-2 border-t border-border pt-3">
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => blankDownload('print')}>
              Print blank
            </Button>
            <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => blankDownload('file')}>
              <FileDown className="h-3.5 w-3.5" /> Download blank
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record File: permanent institutional record of finished forms */}
      <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record File</DialogTitle>
            <DialogDescription>
              Taken-down, locked and archived tours — permanent institutional record
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
            {recordApps.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">Nothing archived yet.</p>
            ) : (
              recordApps.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => { setRecordOpen(false); onOpenApplication(a.id) }}
                  className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-muted/40"
                  aria-label={`Open ${a.title}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20 dark:text-violet-400">
                    <Bus className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">{a.title}</span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {(subsByApp.get(a.id) ?? []).length} responses · deadline {a.deadline ? formatDate(a.deadline) : '—'}
                    </span>
                  </span>
                  <AppStatusBadge status={effectiveAppStatus(a)} />
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Blank template helpers ────────────────────────────────────────────

/** A blank session-less instance of the fixed template (preview/download). */
function blankTemplateApp(): SchoolApplication {
  const t = APPLICATION_TEMPLATES.educational_tour
  return {
    id: 'BLANK-TEMPLATE',
    title: t.label,
    category: t.category,
    source: 'Custom',
    templateKey: t.key,
    academicYear: CURRENT_ACADEMIC_YEAR,
    targetClassIds: [],
    deadline: '',
    participation: 'Optional',
    guardianConsent: { required: true, method: 'Physical Signature', statement: t.consentStatement },
    teacherApprovalRequired: true,
    physicalSignatureRequired: true,
    payment: { mode: 'Required', amount: 0, feeHeadLabel: t.defaultLedgerLabel },
    formFields: t.fields.map((f) => ({ ...f })),
    status: 'Draft',
    createdBy: '—',
    createdByRole: 'Principal',
    approvalNotes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Blank download/print that ALWAYS works: render the document off-screen and
 * either open the browser print dialog on the clone or save print-ready HTML.
 */
function blankDownload(mode: 'print' | 'file'): void {
  const app = blankTemplateApp()
  withOffscreenDocument((holder) => {
    const doc = holder.querySelector('.app-print-doc')
    if (!doc) return
    if (mode === 'file') {
      downloadApplicationStackHtml(doc.parentElement ?? doc, `BLANK-Educational-Tour-Parent-Consent-Form`)
    } else {
      // printApplicationDocument picks up the off-screen .app-print-doc and
      // runs the standard clone-into-#print-root print recipe.
      printApplicationDocument()
    }
  }, <div><ApplicationPrintDocument app={app} /></div>)
}

function MetricTile({ label, value, hint, tone }: { label: string; value: number; hint?: string; tone?: 'amber' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg bg-muted/40 px-3 py-2">
      <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('text-lg font-bold tabular-nums leading-tight mt-0.5', tone === 'amber' && 'text-amber-600 dark:text-amber-400')}>
        {value}
      </p>
      {hint && <p className="text-[9px] text-muted-foreground truncate">{hint}</p>}
    </motion.div>
  )
}

// ─── One tour-session row ──────────────────────────────────────────────

function Row({ app, index, submissions, onOpen, onEdit }: {
  app: SchoolApplication
  index: number
  submissions: import('@/lib/store/applications-store').ApplicationSubmission[]
  onOpen: () => void
  onEdit: () => void
}) {
  const publishApplication = useApplicationsStore((s) => s.publishApplication)
  const closeApplication = useApplicationsStore((s) => s.closeApplication)
  const reopenApplication = useApplicationsStore((s) => s.reopenApplication)
  const lockApplication = useApplicationsStore((s) => s.lockApplication)
  const duplicateApplication = useApplicationsStore((s) => s.duplicateApplication)
  const archiveApplication = useApplicationsStore((s) => s.archiveApplication)
  const deleteApplication = useApplicationsStore((s) => s.deleteApplication)

  const status = effectiveAppStatus(app)
  const approved = submissions.filter((s) => s.status === 'Approved').length

  // Money roll-up straight off the canonical ledger via derived payments.
  const collected = submissions.reduce((sum, s) => sum + deriveSubmissionPayment(app, s).paidAmount, 0)
  const anyPendingCash = submissions.some((s) => combinedSubmissionStatus(app, s) === 'Awaiting Verification')

  const confirmDelete = () => {
    const res = deleteApplication(app.id, 'Dr. Ananya Iyer')
    if (!res.success) {
      toast.error('Cannot delete yet', {
        description: res.error,
        icon: <ShieldAlert className="h-4 w-4" />,
        duration: 6000,
      })
      return
    }
    toast.success('Tour record deleted', { description: 'Submissions cleared; financial history stays in Fee Management.' })
  }

  const actionItems: Array<{ label: string; icon: React.ReactNode; onSelect?: () => void; danger?: boolean }> = []
  if (app.status === 'Pending Approval') {
    actionItems.push({ label: 'Review & approve', icon: <CheckCircle2 className="h-3.5 w-3.5" />, onSelect: onOpen })
  }
  if (app.status === 'Approved') {
    actionItems.push({ label: 'Publish now', icon: <Send className="h-3.5 w-3.5" />, onSelect: () => {
      const r = publishApplication(app.id, 'Dr. Ananya Iyer')
      toast[r.success ? 'success' : 'error'](r.success ? 'Published' : 'Publish failed', r.success ? { description: 'Eligible students have been notified.' } : { description: r.error })
    } })
  }
  if (app.status === 'Changes Requested' || app.status === 'Rejected') {
    actionItems.push({ label: 'Edit & review note', icon: <PencilLine className="h-3.5 w-3.5" />, onSelect: onEdit })
  }
  if (app.status === 'Published' && (status === 'Open' || status === 'Closing Soon')) {
    actionItems.push({ label: 'Edit session details', icon: <PencilLine className="h-3.5 w-3.5" />, onSelect: onEdit })
    actionItems.push({ label: 'Take down (stop new submissions)', icon: <XCircle className="h-3.5 w-3.5" />, onSelect: () => { closeApplication(app.id, 'Dr. Ananya Iyer'); toast.success('Taken down — submissions stop, all records preserved.') } })
    actionItems.push({ label: 'Lock immediately', icon: <Lock className="h-3.5 w-3.5" />, onSelect: () => { lockApplication(app.id, 'Dr. Ananya Iyer'); toast.info('Locked.') } })
  }
  if (status === 'Closed' || status === 'Locked') {
    actionItems.push({ label: 'Reopen (before deadline)', icon: <Undo2 className="h-3.5 w-3.5" />, onSelect: () => {
      const r = reopenApplication(app.id, 'Dr. Ananya Iyer')
      toast[r.success ? 'success' : 'error'](r.success ? 'Reopened' : 'Cannot reopen', r.success ? undefined : { description: r.error })
    } })
  }
  const coreActionsStart = actionItems.length
  actionItems.push({ label: app.status === 'Draft' ? 'Edit session setup' : 'View details', icon: app.status === 'Draft' ? <PencilLine className="h-3.5 w-3.5" /> : <ClipboardList className="h-3.5 w-3.5" />, onSelect: app.status === 'Draft' ? onEdit : onOpen })
  actionItems.push({ label: 'Reuse for a new session', icon: <Copy className="h-3.5 w-3.5" />, onSelect: () => {
    const r = duplicateApplication(app.id, 'Dr. Ananya Iyer')
    if (r.success) toast.success('Draft created from this tour', { description: 'Configure the new session details, then publish.' })
  } })
  if (status !== 'Open' && status !== 'Closing Soon' && status !== 'Archived') {
    actionItems.push({ label: 'Archive', icon: <Archive className="h-3.5 w-3.5" />, onSelect: () => { archiveApplication(app.id, 'Dr. Ananya Iyer'); toast.info('Archived — history stays readable.') } })
  }
  // Deletion is ALWAYS available but GUARDED — paid money blocks it with a
  // clear refund instruction (TOUR-CONSENT-1 §12).
  if (app.status !== 'Published') {
    actionItems.push({ label: 'Delete permanently…', icon: <Trash2 className="h-3.5 w-3.5" />, danger: true, onSelect: confirmDelete })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.03, 0.2) }}>
      <div className="relative flex items-center gap-3 px-4 py-2.5 hover:bg-muted/25 transition-colors">
        <button type="button" onClick={onOpen} className="absolute inset-0 z-0 cursor-pointer" aria-label={`Open ${app.title}`} />
        <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
          <Bus className="h-4 w-4" />
        </span>
        <button type="button" onClick={onOpen} className="relative z-10 min-w-0 flex-1 text-left">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-xs font-semibold truncate">{app.title}</p>
            {app.participation === 'Mandatory' && (
              <Badge variant="outline" className="text-[8px] h-3.5 px-1 shrink-0">Mandatory</Badge>
            )}
            {app.status === 'Draft' && (
              <Badge variant="outline" className="text-[8px] h-3.5 px-1 shrink-0">Draft</Badge>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground truncate">
            {app.destination ?? 'Destination not set'}
            {' · '}{app.payment.mode === 'None' ? 'Free' : `${formatINR(app.payment.amount)} / student`}
            {' · '}{approved}/{submissions.length || 0} approved
          </p>
        </button>

        {/* In-charge */}
        <div className="w-32 shrink-0 hidden lg:block relative z-10">
          <p className="text-[11px] font-medium truncate">{app.inChargeName ?? '—'}</p>
          <p className="text-[9px] text-muted-foreground">{app.createdByRole === 'Teacher' ? 'teacher-created' : 'principal'}</p>
        </div>

        {/* Deadline */}
        <div className="w-28 shrink-0 hidden sm:block relative z-10">
          <p className="text-[11px] font-medium tabular-nums">{app.deadline ? formatDate(app.deadline) : '—'}</p>
          {status === 'Open' || status === 'Closing Soon' ? (
            <DeadlineCountdown deadline={app.deadline} />
          ) : (
            <p className="text-[9px] text-muted-foreground">{status === 'Closed' ? 'Taken down' : status}</p>
          )}
        </div>

        {/* Responses */}
        <div className="w-20 shrink-0 text-right hidden md:block relative z-10">
          <p className="text-xs font-bold tabular-nums">{submissions.length}</p>
          <p className="text-[9px] text-muted-foreground">{approved} approved</p>
        </div>

        {/* Money */}
        <div className="w-36 shrink-0 text-right hidden lg:block relative z-10">
          {app.payment.mode === 'None' ? (
            <p className="text-[10px] text-muted-foreground">no fee</p>
          ) : (
            <>
              <p className="text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatINR(collected, true)} collected
              </p>
              <p className="text-[9px] text-muted-foreground">
                {anyPendingCash
                  ? 'cash verifying…'
                  : submissions.length > 0
                    ? `of ${formatINR(app.payment.amount * submissions.length, true)} expected`
                    : `${formatINR(app.payment.amount, true)} / student`}
              </p>
            </>
          )}
        </div>

        {/* Status */}
        <div className="w-24 shrink-0 flex justify-end relative z-10">
          <AppStatusBadge status={status} />
        </div>

        {/* Actions — Radix dropdown portals to <body> so the menu stays on-screen. */}
        <div className="relative z-10 shrink-0 w-[72px] flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[11px] hover:bg-muted/60 transition-colors"
                aria-label={`Actions for ${app.title}`}
              >
                Actions <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-[70]">
              {actionItems.map((item, i) => (
                <Fragment key={item.label}>
                  {i === coreActionsStart && i > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onSelect={() => item.onSelect?.()}
                    className={cn('text-[11px]', item.danger && 'text-rose-600 focus:text-rose-700 dark:text-rose-400')}
                  >
                    {item.icon} {item.label}
                  </DropdownMenuItem>
                </Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  )
}

function DeadlineCountdown({ deadline }: { deadline: string }) {
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000)
  if (!Number.isFinite(days)) return null
  return days >= 0 ? (
    <p className="text-[9px] text-muted-foreground">{days} day{days === 1 ? '' : 's'} left</p>
  ) : (
    <p className="text-[9px] text-rose-500">passed {Math.abs(days)}d ago</p>
  )
}
