'use client'

/**
 * ApplicationsDashboard — compact command centre for Applications & Forms.
 *
 * Follows Salary & Payroll proportions: one toolbar (title + primary white-
 * outline action), a small metric strip, one filter row, then a full-bleed
 * divide-y table where EVERY row expands into contextual actions. No giant
 * cards, no marketing energy — enterprise calm.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bus, CalendarDays, CheckCircle2, ChevronDown, ClipboardList, Copy, FlaskConical, FileText,
  Landmark, Lock, Archive, PencilLine, Plus, Search, Send, Sparkles,
  Tag, Trophy, Tent, XCircle, Undo2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  useApplicationsStore, effectiveAppStatus, combinedSubmissionStatus,
  deriveSubmissionPayment,
  type SchoolApplication, type ApplicationCategory,
} from '@/lib/store/applications-store'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { AppStatusBadge } from './application-detail'

export const CATEGORY_ICON: Record<ApplicationCategory, LucideIcon> = {
  Tour: Bus,
  Trip: Bus,
  Workshop: FlaskConical,
  Competition: Trophy,
  Camp: Tent,
  Event: CalendarDays,
  'Exam Application': FileText,
  'Board Form': Landmark,
  Transport: Sparkles,
  Activity: CalendarDays,
  Custom: Tag,
}

/** Source chip tone — where the form came from (PART 17). */
export const SOURCE_TONE: Record<string, string> = {
  Examination: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
  Event: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  Activity: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  Custom: 'bg-muted text-muted-foreground',
}

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
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [inChargeFilter, setInChargeFilter] = useState<string>('all')
  const [sessionFilter, setSessionFilter] = useState<string>('all')

  const subsByApp = useMemo(() => {
    const m = new Map<string, typeof submissions>()
    for (const s of submissions) {
      const arr = m.get(s.applicationId) ?? []
      arr.push(s)
      m.set(s.applicationId, arr)
    }
    return m
  }, [submissions])

  const metrics = useMemo(() => {
    let active = 0
    let closing = 0
    let pendingReview = 0
    let awaitingMoney = 0
    let awaitingApproval = 0
    for (const a of applications) {
      const st = effectiveAppStatus(a)
      if (st === 'Open') active++
      if (st === 'Closing Soon') { active++; closing++ }
      if (st === 'Pending Approval') awaitingApproval++
      if (st === 'Closed' || st === 'Locked') continue
      const subs = subsByApp.get(a.id) ?? []
      for (const s of subs) {
        const cs = combinedSubmissionStatus(a, s)
        if (['Submitted', 'Under Review'].includes(cs)) pendingReview++
      }
      // money-in-flight only meaningful when the form charges applicants
      for (const s of subs) {
        const cs = combinedSubmissionStatus(a, s)
        if (cs === 'Awaiting Payment' || cs === 'Awaiting Verification') awaitingMoney++
      }
    }
    return { active, closing, pendingReview, awaitingMoney, awaitingApproval }
  }, [applications, subsByApp])

  // Filter option pools — derived from real data, never hardcoded.
  const inChargeOptions = useMemo(
    () => Array.from(new Set(applications.map((a) => a.inChargeName).filter(Boolean) as string[])).sort(),
    [applications],
  )
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
        if (categoryFilter !== 'all' && a.category !== categoryFilter) return false
        if (sourceFilter !== 'all' && a.source !== sourceFilter) return false
        if (inChargeFilter !== 'all' && a.inChargeName !== inChargeFilter) return false
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
  }, [applications, search, statusFilter, categoryFilter, sourceFilter, inChargeFilter, sessionFilter])

  return (
    <div className="space-y-4">
      {/* Toolbar — ONE page title lives in the app shell header; this row
          is context + action only (PART 3: no duplicate giant heading). */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground min-w-0 truncate">
          Examination · Event · Activity · Custom — application → approval → payment → official record
        </p>
        <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1 shrink-0" onClick={onStartCreate}>
          <Plus className="h-3 w-3" /> New Application
        </Button>
      </div>

      {/* Metric strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <MetricTile label="Active forms" value={metrics.active} hint={metrics.closing ? `${metrics.closing} closing soon` : undefined} />
        <MetricTile label="Awaiting approval" value={metrics.awaitingApproval} tone="amber" hint="teacher-created drafts" />
        <MetricTile label="Pending review" value={metrics.pendingReview} tone="amber" hint="student submissions" />
        <MetricTile label="Awaiting money" value={metrics.awaitingMoney} tone="amber" hint="pay or cash verify" />
        <MetricTile label="Total forms" value={applications.length} />
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-8 h-8 text-xs" placeholder="Search applications…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search applications" />
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
            <SelectItem value="Closed" className="text-xs">Closed</SelectItem>
            <SelectItem value="Archived" className="text-xs">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-8 w-[150px] text-xs" aria-label="Category filter"><SelectValue /></SelectTrigger>
          <SelectContent className="z-[70]">
            <SelectItem value="all" className="text-xs">All categories</SelectItem>
            {(Object.keys(CATEGORY_ICON)).map((c) => (
              <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="h-8 w-[120px] text-xs" aria-label="Source filter"><SelectValue /></SelectTrigger>
          <SelectContent className="z-[70]">
            <SelectItem value="all" className="text-xs">All sources</SelectItem>
            {['Examination', 'Event', 'Activity', 'Custom'].map((s) => (
              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={inChargeFilter} onValueChange={setInChargeFilter}>
          <SelectTrigger className="h-8 w-[150px] text-xs" aria-label="In-charge filter"><SelectValue /></SelectTrigger>
          <SelectContent className="z-[70]">
            <SelectItem value="all" className="text-xs">All in-charge</SelectItem>
            {inChargeOptions.map((n) => (
              <SelectItem key={n} value={n} className="text-xs">{n}</SelectItem>
            ))}
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
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="hidden sm:flex items-center gap-3 px-4 py-2 border-b border-border/60 bg-muted/30 text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">
          <span className="flex-1">Application</span>
          <span className="w-20 shrink-0">Source</span>
          <span className="w-32 shrink-0 hidden lg:block">In-charge</span>
          <span className="w-24 shrink-0">Deadline</span>
          <span className="w-20 shrink-0 text-right">Responses</span>
          <span className="w-36 shrink-0 text-right">Money</span>
          <span className="w-24 shrink-0 text-right">Status</span>
          <span className="w-[72px] shrink-0" />
        </div>
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <ClipboardList className="h-6 w-6 mx-auto text-muted-foreground/40" />
            <p className="mt-2 text-xs text-muted-foreground">No applications match this view.</p>
            <Button variant="outline" size="sm" className="h-7 mt-3 text-[11px]" onClick={onStartCreate}>
              Create the first one
            </Button>
          </div>
        ) : (
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
    </div>
  )
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

// ─── One application row ───────────────────────────────────────────────

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
  const [menuOpen, setMenuOpen] = useState(false)

  const status = effectiveAppStatus(app)
  const Icon = CATEGORY_ICON[app.category]
  const approved = submissions.filter((s) => s.status === 'Approved').length

  // Money roll-up straight off the canonical ledger via derived payments.
  const collected = submissions.reduce((sum, s) => sum + deriveSubmissionPayment(app, s).paidAmount, 0)
  const anyPendingCash = submissions.some((s) => deriveSubmissionPayment(app, s).status === 'Awaiting Verification')

  const actionItems: Array<{ label: string; icon: React.ReactNode; onSelect?: () => void; danger?: boolean }> = []
  if (app.status === 'Pending Approval') {
    actionItems.push({ label: 'Review & approve', icon: <CheckCircle2 className="h-3.5 w-3.5" />, onSelect: onOpen })
  }
  if (app.status === 'Approved') {
    actionItems.push({ label: 'Publish now', icon: <Send className="h-3.5 w-3.5" />, onSelect: () => {
      const r = publishApplication(app.id, 'Dr. Ananya Iyer')
      toast[r.success ? 'success' : 'error'](r.success ? 'Published' : 'Publish failed', r.success ? { description: 'Live for eligible students.' } : { description: r.error })
    } })
  }
  if (app.status === 'Changes Requested' || app.status === 'Rejected') {
    actionItems.push({ label: 'Edit & review note', icon: <PencilLine className="h-3.5 w-3.5" />, onSelect: onEdit })
  }
  if (app.status === 'Published' && (status === 'Open' || status === 'Closing Soon')) {
    // Editable while open (pre-deadline): targets, dates, in-charge, form
    // fields. Money config stays frozen — the linked charge owns it.
    actionItems.push({ label: 'Edit details', icon: <PencilLine className="h-3.5 w-3.5" />, onSelect: onEdit })
    actionItems.push({ label: 'Close now', icon: <XCircle className="h-3.5 w-3.5" />, onSelect: () => { closeApplication(app.id, 'Dr. Ananya Iyer'); toast.success('Closed — records preserved.') } })
    actionItems.push({ label: 'Lock immediately', icon: <Lock className="h-3.5 w-3.5" />, onSelect: () => { lockApplication(app.id, 'Dr. Ananya Iyer'); toast.info('Locked.') } })
  }
  if (status === 'Closed' || status === 'Locked') {
    actionItems.push({ label: 'Reopen (before deadline)', icon: <Undo2 className="h-3.5 w-3.5" />, onSelect: () => {
      const r = reopenApplication(app.id, 'Dr. Ananya Iyer')
      toast[r.success ? 'success' : 'error'](r.success ? 'Reopened' : 'Cannot reopen', r.success ? undefined : { description: r.error })
    } })
  }
  actionItems.push({ label: app.status === 'Draft' ? 'Edit draft' : 'View details', icon: app.status === 'Draft' ? <PencilLine className="h-3.5 w-3.5" /> : <ClipboardList className="h-3.5 w-3.5" />, onSelect: app.status === 'Draft' ? onEdit : onOpen })
  actionItems.push({ label: 'Duplicate as new draft', icon: <Copy className="h-3.5 w-3.5" />, onSelect: () => {
    const r = duplicateApplication(app.id, 'Dr. Ananya Iyer')
    if (r.success) toast.success('Duplicated')
  } })
  if (status !== 'Open' && status !== 'Closing Soon' && status !== 'Archived') {
    actionItems.push({ label: 'Archive', icon: <Archive className="h-3.5 w-3.5" />, onSelect: () => { archiveApplication(app.id, 'Dr. Ananya Iyer'); toast.info('Archived — history stays readable.') } })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.03, 0.2) }}>
      <div className="relative flex items-center gap-3 px-4 py-2.5 hover:bg-muted/25 transition-colors">
        <button type="button" onClick={onOpen} className="absolute inset-0 z-0 cursor-pointer" aria-label={`Open ${app.title}`} />
        {/* Identity */}
        <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20">
          <Icon className="h-4 w-4" />
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
            {app.category} · {formatINR(app.payment.amount)}{app.payment.mode === 'None' ? ' · free' : ''}
            {' · '}{approved}/{submissions.length || 0} approved
          </p>
        </button>

        {/* Source — where this form came from (PART 17) */}
        <div className="w-20 shrink-0 hidden sm:block relative z-10">
          <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold', SOURCE_TONE[app.source])}>
            {app.source}
          </span>
        </div>

        {/* In-charge — operational owner (PART 17) */}
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
            <p className="text-[9px] text-muted-foreground">{status}</p>
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
              <p className="text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatINR(collected, true)}</p>
              <p className="text-[9px] text-muted-foreground">{anyPendingCash ? 'cash verifying…' : `of ${formatINR(app.payment.amount * Math.max(1, submissions.length), true)}`}</p>
            </>
          )}
        </div>

        {/* Status */}
        <div className="w-24 shrink-0 flex justify-end relative z-10">
          <AppStatusBadge status={status} />
        </div>

        {/* Actions */}
        <div className="relative z-10 shrink-0 w-[72px] flex justify-end">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] hover:bg-muted/60 transition-colors"
            aria-label={`Actions for ${app.title}`}
            aria-expanded={menuOpen}
          >
            Actions <ChevronDown className="h-3 w-3" />
          </button>
          {menuOpen && (
            <>
              <button type="button" tabIndex={-1} aria-hidden className="fixed inset-0 z-[66] cursor-default" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-2 top-9 z-[67] w-52 rounded-lg border border-border bg-popover p-1 shadow-md">
                {actionItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => { item.onSelect?.(); setMenuOpen(false) }}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-left hover:bg-muted/60 transition-colors',
                    )}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
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
