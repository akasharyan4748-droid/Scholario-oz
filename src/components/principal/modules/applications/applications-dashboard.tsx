'use client'

/**
 * ApplicationsDashboard (TOUR-1 §1) — the Applications & Forms home.
 *
 * ONE permanent built-in form lives here:
 *
 *   Educational Tour — Parent Consent Form
 *
 * There is NO "New Form" / "Create Form" action — the template is
 * ready-made and fixed. The Principal (or an authorized Teacher) reuses it
 * for a session, and each use appears below as a tour instance with its
 * own submissions, payments and history. Actions on the template card:
 * View · Use / Configure for Session · Preview · Download Blank.
 * Actions on each instance: open management, publish (draft), take down.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bus, CheckCircle2, ChevronRight, Eye, FileDown, Lock, PencilLine,
  Search, Send, ShieldCheck, Users, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useApplicationsStore, effectiveAppStatus, combinedSubmissionStatus,
  type SchoolApplication, type ApplicationSubmission,
} from '@/lib/store/applications-store'
import { APPLICATION_TEMPLATES } from '@/lib/store/applications-store'
import { formatINR, formatDate } from '@/lib/format'
import { useFeeStore } from '@/lib/store/fee-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { TourFormDocument, useFitA4Zoom, printTourDocument, downloadTourDocument, tourDocFileName } from './tour-form-document'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Printer, Download } from 'lucide-react'

const ACTOR = 'Dr. Ananya Iyer'

interface Props {
  onOpenApplication: (id: string) => void
  onUseTemplate: () => void
  onEditSession: (id: string) => void
}

type StatusFilter = 'all' | 'active' | 'draft' | 'down' | 'approval'

export function ApplicationsDashboard({ onOpenApplication, onUseTemplate, onEditSession }: Props) {
  const applications = useApplicationsStore((s) => s.applications)
  const submissions = useApplicationsStore((s) => s.submissions)
  const publishApplication = useApplicationsStore((s) => s.publishApplication)
  // Payment status on every row is derived from the canonical fee ledger —
  // subscribe so counter collections instantly refresh the per-tour paid
  // counts rendered below.
  useFeeStore((s) => s.transactions)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [previewOpen, setPreviewOpen] = useState(false)

  // ONLY tour instances of the built-in template live in this module.
  const tourInstances = useMemo(
    () => applications.filter(
      (a) => a.templateKey === 'educational_tour' || a.category === 'Tour' || a.category === 'Trip',
    ),
    [applications],
  )

  const subsByApp = useMemo(() => {
    const m = new Map<string, ApplicationSubmission[]>()
    for (const s of submissions) {
      const arr = m.get(s.applicationId) ?? []
      arr.push(s)
      m.set(s.applicationId, arr)
    }
    return m
  }, [submissions])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tourInstances
      .filter((a) => {
        const eff = effectiveAppStatus(a)
        if (statusFilter === 'active' && !['Open', 'Closing Soon'].includes(eff)) return false
        if (statusFilter === 'draft' && !['Draft', 'Pending Approval', 'Approved', 'Changes Requested', 'Rejected', 'Scheduled'].includes(eff)) return false
        if (statusFilter === 'down' && !['Closed', 'Locked', 'Archived'].includes(eff)) return false
        if (statusFilter === 'approval' && a.status !== 'Pending Approval') return false
        if (q && !`${a.title} ${a.destination ?? ''} ${a.academicYear}`.toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) => {
        const rank = (app: SchoolApplication) => {
          switch (effectiveAppStatus(app)) {
            case 'Pending Approval': return -1
            case 'Open': case 'Closing Soon': return 0
            case 'Draft': case 'Changes Requested': case 'Rejected': case 'Approved': case 'Scheduled': return 1
            default: return 2
          }
        }
        return rank(a) - rank(b) || b.createdAt.localeCompare(a.createdAt)
      })
  }, [tourInstances, search, statusFilter])

  const activeCount = tourInstances.filter((a) => ['Open', 'Closing Soon'].includes(effectiveAppStatus(a))).length
  const approvalCount = tourInstances.filter((a) => a.status === 'Pending Approval').length

  const publishDraft = (id: string) => {
    const res = publishApplication(id, ACTOR)
    if (res.success) {
      toast.success('Tour published — eligible students notified.')
    } else {
      toast.error('Could not publish', { description: res.error })
    }
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto" data-testid="applications-dashboard">
      {/* ── The ONE built-in form (§1) ── */}
      <motion.section
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
        aria-label="Built-in form"
      >
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <Bus className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold tracking-tight">Educational Tour — Parent Consent Form</h2>
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                <ShieldCheck className="h-2.5 w-2.5" /> Built-in school form
              </Badge>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              The school&apos;s official A4 consent form — destination, dates, fee and circular details are filled in per session.
              The printed layout stays fixed. Reuse it whenever the school runs a tour.
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-3 w-3" /> Preview
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => { setPreviewOpen(true) }}>
              <FileDown className="h-3 w-3" /> Blank form
            </Button>
            <Button size="sm" className="h-7 text-[11px] gap-1" onClick={onUseTemplate}>
              <PencilLine className="h-3 w-3" /> Use for a session
            </Button>
          </div>
        </div>
      </motion.section>

      {/* ── Session instances toolbar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-xs font-semibold tracking-tight shrink-0">Tour sessions</h3>
          <span className="text-[10px] text-muted-foreground">
            {activeCount} open · {tourInstances.length} total
            {approvalCount > 0 && <span className="text-amber-600 dark:text-amber-400"> · {approvalCount} awaiting approval</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-40 sm:w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tours…"
              className="h-8 pl-8 text-xs"
              aria-label="Search tour sessions"
            />
          </div>
          <StatusFilterSelect value={statusFilter} onChange={setStatusFilter} />
        </div>
      </div>

      {/* ── Instance list ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="mx-auto max-w-md text-xs text-muted-foreground">
              {tourInstances.length === 0
                ? 'No tour sessions yet — press "Use for a session" on the consent form above to configure one.'
                : 'No tour sessions match.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((a) => {
              const eff = effectiveAppStatus(a)
              const subs = (subsByApp.get(a.id) ?? []).filter((s) => s.status !== 'Withdrawn')
              let paid = 0
              for (const s of subs) {
                const cs = combinedSubmissionStatus(a, s)
                if (cs === 'Paid · Under Review' || cs === 'Approved' || cs === 'Awaiting Verification') paid++
              }
              return (
                <InstanceRow
                  key={a.id}
                  app={a}
                  eff={eff}
                  total={subs.length}
                  paid={paid}
                  onOpen={() => onOpenApplication(a.id)}
                  onConfigure={() => onEditSession(a.id)}
                  onPublish={() => publishDraft(a.id)}
                />
              )
            })}
          </div>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Taking a tour down stops new submissions only — submissions, payments, serials and history always stay on record.
      </p>

      {/* Template preview dialog */}
      <TemplatePreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  )
}

function StatusFilterSelect({ value, onChange }: { value: StatusFilter; onChange: (v: StatusFilter) => void }) {
  const options: Array<{ value: StatusFilter; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Open now' },
    { value: 'approval', label: 'Awaiting approval' },
    { value: 'draft', label: 'Drafts' },
    { value: 'down', label: 'Taken down' },
  ]
  const current = options.find((o) => o.value === value)?.label ?? 'All'
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1" aria-label="Filter tour sessions">
          {current} <ChevronRight className="h-3 w-3 -rotate-90" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((o) => (
          <DropdownMenuItem key={o.value} onClick={() => onChange(o.value)}>{o.label}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function InstanceRow({ app, eff, total, paid, onOpen, onConfigure, onPublish }: {
  app: SchoolApplication
  eff: string
  total: number
  paid: number
  onOpen: () => void
  onConfigure: () => void
  onPublish: () => void
}) {
  const badgeTone =
    eff === 'Open' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
      : eff === 'Closing Soon' ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'
        : eff === 'Pending Approval' ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-400'
          : eff === 'Draft' ? 'border-border bg-muted/60 text-muted-foreground'
            : 'border-border bg-muted/60 text-muted-foreground'
  const canPublish = ['Draft', 'Approved', 'Changes Requested', 'Rejected'].includes(app.status)

  return (
    <div className="flex items-center gap-3 px-3 sm:px-4 py-3 hover:bg-muted/30 transition-colors group">
      <span className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1',
        ['Open', 'Closing Soon'].includes(eff) ? 'bg-primary/10 text-primary ring-primary/15' : 'bg-muted/60 text-muted-foreground ring-border',
      )}>
        <Bus className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-xs font-semibold truncate">{app.title}</p>
          <Badge variant="outline" className={cn('text-[9px] h-4 px-1.5 shrink-0', badgeTone)}>{eff}</Badge>
          {(eff === 'Closed' || eff === 'Locked' || eff === 'Archived') && (
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 shrink-0 gap-1">
              <Lock className="h-2.5 w-2.5" /> records kept
            </Badge>
          )}
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10px] text-muted-foreground">
          <span>{app.destination ?? '—'}</span>
          {app.eventDate && <span>· {formatDate(app.eventDate)}{app.tourEndDate ? ` – ${formatDate(app.tourEndDate)}` : ''}</span>}
          <span>· {app.academicYear}</span>
          <span>· {app.payment.mode === 'None' ? 'No fee' : `${formatINR(app.payment.amount)} per student`}</span>
          <span>· {total} submitted{total > 0 ? `, ${paid} paid` : ''}</span>
          {app.inChargeName && <span>· in-charge {app.inChargeName}</span>}
        </p>
      </div>

      <div className="shrink-0 flex items-center gap-1.5">
        {canPublish && (
          <Button size="sm" className="h-7 text-[11px] px-2.5 gap-1" onClick={onPublish}>
            <Send className="h-3 w-3" /> Publish
          </Button>
        )}
        {['Draft', 'Open', 'Closing Soon', 'Scheduled'].includes(eff) && (
          <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5 gap-1 hidden sm:inline-flex" onClick={onConfigure}>
            <PencilLine className="h-3 w-3" /> Configure
          </Button>
        )}
        <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5 gap-1" onClick={onOpen}>
          <Users className="h-3 w-3" /> Manage
        </Button>
      </div>
    </div>
  )
}

// ─── Template preview (the fixed official blank form) ──────────────────

function TemplatePreviewDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [ref, zoom] = useFitA4Zoom<HTMLDivElement>()
  // A representative blank template — destination placeholders resolve to
  // fill-in rules exactly like the real blank copy.
  const app: SchoolApplication = useMemo(() => ({
    id: 'TEMPLATE',
    title: 'Educational Tour',
    category: 'Tour',
    templateKey: 'educational_tour',
    source: 'Event',
    academicYear: '—',
    targetClassIds: [],
    deadline: '—',
    participation: 'Optional',
    guardianConsent: { required: true, method: 'Digital', statement: APPLICATION_TEMPLATES.educational_tour.consentStatement },
    teacherApprovalRequired: false,
    physicalSignatureRequired: false,
    payment: { mode: 'None', amount: 0, feeHeadLabel: 'Educational Tour' },
    formFields: [],
    status: 'Draft',
    createdBy: ACTOR,
    createdByRole: 'Principal',
    approvalNotes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }), [])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-2 border-b border-border shrink-0">
          <DialogTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" /> Educational Tour — Parent Consent Form
          </DialogTitle>
          <DialogDescription className="text-xs">
            The fixed official A4 template. Session details (destination, dates, fee, circular number…) fill in when you use it.
          </DialogDescription>
        </DialogHeader>
        <div ref={ref} className="flex-1 min-h-0 overflow-auto bg-muted/40 p-2 rounded-md">
          <div style={{ zoom, width: 'fit-content', margin: '0 auto' }}>
            <TourFormDocument app={app} />
          </div>
        </div>
        <DialogFooter className="border-t border-border pt-3 shrink-0">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => downloadTourDocument('BLANK-Educational-Tour-Consent-Form')}>
            <Download className="h-3.5 w-3.5" /> Download blank
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1" onClick={() => printTourDocument()}>
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => onOpenChange(false)}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
