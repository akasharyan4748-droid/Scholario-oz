'use client'

/**
 * TourSubmissions — the Principal/Teacher management screen for ONE
 * published tour instance (TOUR-1 §14/§15/§16/§17/§10/§11).
 *
 * Everything staff need on one calm surface:
 *   • summary: total submitted · paid · unpaid · payment pending · verified
 *   • search + focused filters (class, section, gender, payment, state)
 *   • every submission row: unique tour serial, student snapshot, guardian
 *     contact, payment + submission states, contextual actions
 *   • record a payment later → the SAME submission moves Unpaid → Paid
 *     (no duplicates — money only flows through fee-store.recordPayment)
 *   • view/print/download a student's completed OFFICIAL A4 form
 *   • bulk download (selected / all / class-wise / gender-wise) as one
 *     print-ready file
 *   • attendance / master list export for the trip itself
 *   • human-readable history (publish, take-down, submissions, payments…)
 *   • take down / reopen — never destroys submissions, payments or history
 *
 * Permission boundary: Teacher gets the same read/review surface (their
 * existing role system already gates money at the STORE level — teacher
 * role payments enter as Under Verification). Nothing here bypasses it.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Banknote, CheckCircle2, ChevronRight, ClipboardList, Download,
  Eye, FileDown, History, IndianRupee, ListChecks, Lock, PencilLine, Printer,
  RotateCcw, Search, ShieldCheck, Users, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useApplicationsStore } from '@/lib/store/applications-store'
import {
  applicationPayments, deriveSubmissionPayment, effectiveAppStatus,
  type ApplicationSubmission, type SchoolApplication,
} from '@/lib/store/applications-store'
import { useFeeStore } from '@/lib/store/fee-store'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useDismissOnEscape } from '@/hooks/use-dismiss-on-escape'
import {
  TourFormDocument, useFitA4Zoom, printTourDocument,
} from './tour-form-document'
import {
  downloadTourFormPDF, downloadTourFormsBundlePDF, downloadTourAttendancePDF,
  type TourAttendanceRow,
} from './tour-form-pdf'
import { tourSubmissionState, tourStateChipClass, paymentChipClass, genderLabel } from './tour-state'

const ACTOR = 'Dr. Ananya Iyer'

interface Props {
  app: SchoolApplication
  onBack: () => void
  onEdit: () => void
}

type Tab = 'submissions' | 'payments' | 'history'
type PayFilter = 'all' | 'paid' | 'unpaid' | 'pending' | 'verified'
type StateFilter = 'all' | 'unpaid' | 'pending' | 'paid' | 'verified' | 'correction' | 'withdrawn'

export function TourSubmissions({ app: appProp, onBack, onEdit }: Props) {
  const applications = useApplicationsStore((s) => s.applications)
  const submissions = useApplicationsStore((s) => s.submissions)
  const audit = useApplicationsStore((s) => s.audit)
  const closeApplication = useApplicationsStore((s) => s.closeApplication)
  const reopenApplication = useApplicationsStore((s) => s.reopenApplication)
  const reviewSubmission = useApplicationsStore((s) => s.reviewSubmission)
  const markDocumentReceived = useApplicationsStore((s) => s.markDocumentReceived)
  const verifyPhysicalDocument = useApplicationsStore((s) => s.verifyPhysicalDocument)

  // Keep reading the LIVE record (take-down / payment updates re-render).
  const app = applications.find((a) => a.id === appProp.id) ?? appProp
  const eff = effectiveAppStatus(app)
  const isDown = eff === 'Closed' || eff === 'Locked' || eff === 'Archived'

  const [tab, setTab] = useState<Tab>('submissions')
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [sectionFilter, setSectionFilter] = useState('all')
  const [genderFilter, setGenderFilter] = useState('all')
  const [payFilter, setPayFilter] = useState<PayFilter>('all')
  const [stateFilter, setStateFilter] = useState<StateFilter>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [viewSub, setViewSub] = useState<ApplicationSubmission | null>(null)
  const [paySub, setPaySub] = useState<ApplicationSubmission | null>(null)
  const [takeDownOpen, setTakeDownOpen] = useState(false)
  const [blankOpen, setBlankOpen] = useState(false)
  const [attendanceOpen, setAttendanceOpen] = useState(false)
  const [attendanceScope, setAttendanceScope] = useState('all')
  const [bundle, setBundle] = useState<{ subs: ApplicationSubmission[]; label?: string } | null>(null)

  // ── Derived data ──
  // FEE-STORE SUBSCRIPTION — payments for this tour live in the canonical
  // fee ledger, NOT in this store. Subscribing to the transaction list makes
  // every payment-derived memo (summary, filters, tab counts, payment rows)
  // recompute the moment money lands — without it the metrics would silently
  // go stale after a counter collection.
  const feeTransactions = useFeeStore((s) => s.transactions)

  const mySubs = useMemo(
    () => submissions.filter((s) => s.applicationId === app.id),
    [submissions, app.id],
  )
  const myAudit = useMemo(
    () => audit.filter((e) => e.applicationId === app.id).slice(0, 60),
    [audit, app.id],
  )
  const txns = useMemo(() => applicationPayments(app), [app, feeTransactions])

  const classOptions = useMemo(() => {
    const m = new Map<string, string>()
    for (const s of mySubs) m.set(s.classId, s.className)
    return Array.from(m.entries()).map(([id, name]) => ({ id, name }))
  }, [mySubs])
  const sectionOptions = useMemo(() => {
    const m = new Map<string, string>()
    for (const s of mySubs) if (classFilter === 'all' || s.classId === classFilter) m.set(s.section, s.section)
    return Array.from(m.keys()).sort()
  }, [mySubs, classFilter])

  // Class × section groups for section-wise downloads.
  const sectionGroups = useMemo(() => {
    const m = new Map<string, { key: string; classId: string; className: string; section: string; subs: ApplicationSubmission[] }>()
    for (const s of mySubs) {
      if (s.status === 'Withdrawn') continue
      const key = `${s.classId}|${s.section}`
      const g = m.get(key) ?? { key, classId: s.classId, className: s.className, section: s.section, subs: [] }
      g.subs.push(s)
      m.set(key, g)
    }
    return Array.from(m.values()).sort((a, b) => a.className.localeCompare(b.className) || a.section.localeCompare(b.section))
  }, [mySubs])

  const stateOf = useCallback(
    (s: ApplicationSubmission) => tourSubmissionState(app, s),
    [app],
  )

  const summary = useMemo(() => {
    let paid = 0, unpaid = 0, pending = 0, verified = 0
    for (const s of mySubs) {
      if (s.status === 'Withdrawn') continue
      const st = tourSubmissionState(app, s)
      if (st === 'Verified / Received') { verified++; paid++ }
      else if (st === 'Submitted — Paid') paid++
      else if (st === 'Submitted — Payment Pending') pending++
      else if (st === 'Submitted — Unpaid') unpaid++
    }
    return { total: mySubs.filter((s) => s.status !== 'Withdrawn').length, paid, unpaid, pending, verified }
  }, [mySubs, app, feeTransactions])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return mySubs.filter((s) => {
      if (q && !`${s.studentName} ${s.admissionNo} ${s.serialNo ?? ''} ${s.guardianName} ${s.guardianPhone}`.toLowerCase().includes(q)) return false
      if (classFilter !== 'all' && s.classId !== classFilter) return false
      if (sectionFilter !== 'all' && s.section !== sectionFilter) return false
      if (genderFilter !== 'all' && genderLabel(s.gender) !== genderFilter) return false
      const st = tourSubmissionState(app, s)
      if (payFilter === 'paid' && !(st === 'Submitted — Paid' || st === 'Verified / Received')) return false
      if (payFilter === 'unpaid' && st !== 'Submitted — Unpaid') return false
      if (payFilter === 'pending' && st !== 'Submitted — Payment Pending') return false
      if (payFilter === 'verified' && st !== 'Verified / Received') return false
      if (stateFilter === 'unpaid' && st !== 'Submitted — Unpaid') return false
      if (stateFilter === 'pending' && st !== 'Submitted — Payment Pending') return false
      if (stateFilter === 'paid' && !(st === 'Submitted — Paid' || st === 'Verified / Received')) return false
      if (stateFilter === 'verified' && st !== 'Verified / Received') return false
      if (stateFilter === 'correction' && st !== 'Correction Required') return false
      if (stateFilter === 'withdrawn' && st !== 'Withdrawn') return false
      return true
    }).sort((a, b) => (a.serialNo ?? a.id).localeCompare(b.serialNo ?? b.id))
  }, [mySubs, search, classFilter, sectionFilter, genderFilter, payFilter, stateFilter, app, feeTransactions])

  const activeFilters =
    (classFilter !== 'all' ? 1 : 0) + (sectionFilter !== 'all' ? 1 : 0) +
    (genderFilter !== 'all' ? 1 : 0) + (payFilter !== 'all' ? 1 : 0) + (stateFilter !== 'all' ? 1 : 0)

  // ── Actions ──
  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const doTakeDown = () => {
    setTakeDownOpen(false)
    closeApplication(app.id, ACTOR, 'Taken down by the Principal')
    toast.success('Tour taken down', {
      description: 'New submissions are stopped. Every submission, payment and the full history stay on record.',
    })
  }

  const doReopen = () => {
    const res = reopenApplication(app.id, ACTOR)
    if (res.success) toast.success('Tour reopened for applications')
    else toast.error('Could not reopen', { description: res.error })
  }

  /** Staff-recorded payment — principal counter collections verify instantly. */
  const recordStaffPayment = (sub: ApplicationSubmission, mode: 'UPI' | 'Cash', referenceNo: string) => {
    if (!app.payment.chargeId) {
      toast.error('No linked collection — payment cannot be recorded here.')
      return
    }
    const res = useFeeStore.getState().recordPayment({
      studentId: sub.studentId,
      amount: app.payment.amount,
      mode,
      purpose: `Application: ${app.title}`,
      feeHead: app.payment.feeHeadLabel || app.title,
      collectedBy: ACTOR,
      additionalChargeId: app.payment.chargeId,
      applicationId: app.id,
      collectorRole: 'principal',
      ...(mode !== 'Cash' && referenceNo.trim() ? { referenceNo: referenceNo.trim() } : {}),
    })
    if (!res.success || !res.transaction) {
      toast.error('Could not record the payment', { description: res.error })
      return
    }
    useApplicationsStore.setState((state) => ({
      audit: [{
        id: `AEV-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
        applicationId: app.id,
        submissionId: sub.id,
        ts: new Date().toISOString(),
        actor: ACTOR,
        actorRole: 'Principal' as const,
        action: 'payment.completed' as const,
        message: mode === 'Cash'
          ? `Cash ${formatINR(app.payment.amount)} received at the counter for ${sub.studentName} — receipt ${res.transaction!.receiptNo}.`
          : `Online ${formatINR(app.payment.amount)} confirmed for ${sub.studentName} (ref ${res.transaction!.referenceNo ?? '—'}) — receipt ${res.transaction!.receiptNo}.`,
      }, ...state.audit],
    }))
    toast.success(`Payment recorded — receipt ${res.transaction.receiptNo}`, {
      description: `${sub.studentName} · ${formatINR(app.payment.amount)} · the submission is now marked Paid.`,
    })
    setPaySub(null)
  }

  const doMarkReceived = (sub: ApplicationSubmission) => {
    const res = markDocumentReceived(sub.id, 'Signed consent form (printed copy)', ACTOR, 'Principal')
    if (res.success) toast.success('Marked received', { description: `${sub.studentName} — the signed printed form is on file.` })
    else toast.error(res.error ?? 'Could not mark received')
  }

  const doVerify = (sub: ApplicationSubmission) => {
    if (sub.physicalDoc.status === 'Received') {
      const res = verifyPhysicalDocument(sub.id, ACTOR)
      if (res.success) {
        toast.success('Verified', { description: `${sub.studentName}'s signed document verified.` })
        return
      }
      toast.error(res.error ?? 'Could not verify')
      return
    }
    const res = reviewSubmission(sub.id, 'approve', 'Verified by the school office.', ACTOR, 'Principal')
    if (res.success) toast.success('Submission verified', { description: `${sub.studentName} — ${sub.serialNo ?? ''}` })
    else toast.error('Could not verify', { description: res.error })
  }

  // Bulk bundle → ONE multi-page A4 PDF (one completed form per student).
  useEffect(() => {
    if (!bundle) return
    const run = async () => {
      const { subs, label } = bundle
      setBundle(null)
      if (subs.length === 0) {
        toast.error('Nothing to download')
        return
      }
      const n = await downloadTourFormsBundlePDF(app, subs, label)
      if (n > 0) {
        toast.success(`${n} completed form${n === 1 ? '' : 's'} downloaded`, {
          description: 'One A4 page per student, serial order — ready to print.',
        })
      } else {
        toast.error('Could not generate the bundle')
      }
    }
    void run()
  }, [bundle, app])

  const downloadSelected = () => {
    const subs = filtered.filter((s) => selected.has(s.id))
    if (subs.length === 0) return
    setBundle({ subs, label: 'selected' })
  }

  // Attendance rows for the current scope selection.
  const attendanceRows = useMemo((): TourAttendanceRow[] => {
    let rows = mySubs.filter((s) => s.status !== 'Withdrawn')
    if (attendanceScope.startsWith('class:')) {
      const cid = attendanceScope.slice(6)
      rows = rows.filter((s) => s.classId === cid)
    }
    if (attendanceScope === 'male') rows = rows.filter((s) => genderLabel(s.gender) === 'Male')
    if (attendanceScope === 'female') rows = rows.filter((s) => genderLabel(s.gender) === 'Female')
    if (attendanceScope === 'paid') rows = rows.filter((s) => ['Submitted — Paid', 'Verified / Received'].includes(tourSubmissionState(app, s)))
    if (attendanceScope === 'unpaid') rows = rows.filter((s) => tourSubmissionState(app, s) === 'Submitted — Unpaid')
    if (attendanceScope === 'pending') rows = rows.filter((s) => tourSubmissionState(app, s) === 'Submitted — Payment Pending')
    if (attendanceScope === 'verified') rows = rows.filter((s) => tourSubmissionState(app, s) === 'Verified / Received')
    return rows
      .sort((a, b) => (a.serialNo ?? a.id).localeCompare(b.serialNo ?? b.id))
      .map((s) => ({
        serialNo: s.serialNo ?? '—',
        studentName: s.studentName,
        className: s.className,
        section: s.section,
        gender: genderLabel(s.gender),
        rollNo: s.rollNo,
        admissionNo: s.admissionNo,
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
        paymentStatus: (() => {
          const st = tourSubmissionState(app, s)
          if (app.payment.mode === 'None') return 'No fee'
          if (st === 'Verified / Received' || st === 'Submitted — Paid') return 'Paid'
          if (st === 'Submitted — Payment Pending') return 'Pending'
          return 'Unpaid'
        })(),
        verificationStatus: s.physicalDoc.status === 'Verified' ? 'Verified'
          : s.physicalDoc.status === 'Received' ? 'Received'
            : s.status === 'Approved' ? 'Approved' : 'Pending',
      }))
  }, [mySubs, attendanceScope, app, feeTransactions])

  const attendanceScopeLabel = useMemo(() => {
    switch (attendanceScope) {
      case 'all': return 'All students'
      case 'male': return 'Boys'
      case 'female': return 'Girls'
      case 'paid': return 'Paid students'
      case 'unpaid': return 'Unpaid submissions'
      case 'pending': return 'Payment pending'
      case 'verified': return 'Verified / received'
      default: {
        const cid = attendanceScope.slice(6)
        return classOptions.find((c) => c.id === cid)?.name ?? 'Class'
      }
    }
  }, [attendanceScope, classOptions])

  return (
    <div className="space-y-4 max-w-7xl mx-auto" data-testid="tour-submissions">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={onBack} aria-label="Back to Applications and Forms">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold tracking-tight truncate">{app.title}</h2>
              <StatusBadge eff={eff} />
              {isDown && (
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-1 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30">
                  <Lock className="h-2.5 w-2.5" /> Records preserved
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-1.5">
              <span>{app.destination ?? '—'}</span>
              {app.eventDate && <span>· {formatDate(app.eventDate)}{app.tourEndDate ? ` – ${formatDate(app.tourEndDate)}` : ''}</span>}
              {app.durationDays && <span>· {app.durationDays}</span>}
              <span>· Session {app.academicYear}</span>
              <span>· Fee {app.payment.mode === 'None' ? 'nil' : formatINR(app.payment.amount)}</span>
              {app.circularNo && <span className="font-mono">· {app.circularNo}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => setBlankOpen(true)}>
            <Eye className="h-3 w-3" /> Blank form
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" aria-label="Download options">
                <Download className="h-3 w-3" /> Downloads
                <ChevronRight className="h-3 w-3 -rotate-90" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setBlankOpen(true)}>
                <FileDown className="h-3.5 w-3.5" /> Blank form (A4)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px]">Completed forms</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setBundle({ subs: filtered.filter((s) => s.status !== 'Withdrawn'), label: activeFilters > 0 ? 'current-filter' : undefined })} disabled={summary.total === 0}>
                <FileDown className="h-3.5 w-3.5" /> All submitted ({summary.total}){activeFilters > 0 ? ' · current filter' : ''}
              </DropdownMenuItem>
              {classOptions.map((c) => (
                <DropdownMenuItem key={c.id} onClick={() => setBundle({ subs: mySubs.filter((s) => s.classId === c.id && s.status !== 'Withdrawn'), label: c.name.replace(/\s+/g, '-') })}>
                  <FileDown className="h-3.5 w-3.5" /> {c.name} only
                </DropdownMenuItem>
              ))}
              {sectionGroups.map((g) => (
                <DropdownMenuItem key={g.key} onClick={() => setBundle({ subs: g.subs, label: `${g.className}-${g.section}` })}>
                  <FileDown className="h-3.5 w-3.5" /> {g.className} — {g.section} only
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => setBundle({ subs: mySubs.filter((s) => genderLabel(s.gender) === 'Male' && s.status !== 'Withdrawn'), label: 'boys' })} disabled={summary.total === 0}>
                <FileDown className="h-3.5 w-3.5" /> Boys only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBundle({ subs: mySubs.filter((s) => genderLabel(s.gender) === 'Female' && s.status !== 'Withdrawn'), label: 'girls' })} disabled={summary.total === 0}>
                <FileDown className="h-3.5 w-3.5" /> Girls only
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px]">Payment lists</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setBundle({ subs: mySubs.filter((s) => ['Submitted — Paid', 'Verified / Received'].includes(tourSubmissionState(app, s))), label: 'paid' })} disabled={summary.paid === 0}>
                <FileDown className="h-3.5 w-3.5" /> Paid students ({summary.paid})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBundle({ subs: mySubs.filter((s) => tourSubmissionState(app, s) === 'Submitted — Unpaid'), label: 'unpaid' })} disabled={summary.unpaid === 0}>
                <FileDown className="h-3.5 w-3.5" /> Unpaid submissions ({summary.unpaid})
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px]">Trip list</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setAttendanceOpen(true)} disabled={summary.total === 0}>
                <ListChecks className="h-3.5 w-3.5" /> Attendance / master list
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {(eff === 'Open' || eff === 'Closing Soon') && (
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-500/10" onClick={() => setTakeDownOpen(true)}>
              <X className="h-3 w-3" /> Take down
            </Button>
          )}
          {eff === 'Closed' && (
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={doReopen}>
              <RotateCcw className="h-3 w-3" /> Reopen
            </Button>
          )}
          {['Draft', 'Open', 'Closing Soon', 'Scheduled'].includes(eff) && (
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={onEdit}>
              <PencilLine className="h-3 w-3" /> Session details
            </Button>
          )}
        </div>
      </div>

      {/* ── Summary strip (§14) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Metric label="Total submitted" value={summary.total} icon={<ClipboardList className="h-3.5 w-3.5" />} />
        <Metric label="Paid" value={summary.paid} tone="emerald" icon={<CheckCircle2 className="h-3.5 w-3.5" />} />
        <Metric label="Unpaid" value={summary.unpaid} tone="amber" icon={<Banknote className="h-3.5 w-3.5" />} hint="still on record" />
        <Metric label="Payment pending" value={summary.pending} tone="amber" icon={<IndianRupee className="h-3.5 w-3.5" />} hint="cash verifying" />
        <Metric label="Verified" value={summary.verified} tone="emerald" icon={<ShieldCheck className="h-3.5 w-3.5" />} />
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5 w-fit" role="tablist" aria-label="Tour records">
        {([
          { k: 'submissions', label: `Submissions (${summary.total})`, icon: <Users className="h-3.5 w-3.5" /> },
          { k: 'payments', label: `Payments (${txns.length})`, icon: <IndianRupee className="h-3.5 w-3.5" /> },
          { k: 'history', label: 'History', icon: <History className="h-3.5 w-3.5" /> },
        ] as Array<{ k: Tab; label: string; icon: React.ReactNode }>).map(({ k, label, icon }) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors',
              tab === k ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setTab(k)}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === 'submissions' && (
        <>
          {/* ── Search + filters ── */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student, serial, guardian…"
                className="h-8 pl-8 text-xs"
                aria-label="Search submissions"
              />
            </div>
            <div className="hidden md:flex items-center gap-2">
              <FilterSelect value={classFilter} onChange={setClassFilter} placeholder="Class" options={classOptions.map((c) => ({ value: c.id, label: c.name }))} ariaLabel="Filter by class" />
              <FilterSelect value={sectionFilter} onChange={setSectionFilter} placeholder="Section" options={sectionOptions.map((s) => ({ value: s, label: `Section ${s}` }))} ariaLabel="Filter by section" />
              <FilterSelect value={genderFilter} onChange={setGenderFilter} placeholder="Gender" options={[{ value: 'Male', label: 'Boys' }, { value: 'Female', label: 'Girls' }]} ariaLabel="Filter by gender" />
              <FilterSelect value={payFilter} onChange={setPayFilter} placeholder="Payment" options={[
                { value: 'paid', label: 'Paid' }, { value: 'unpaid', label: 'Unpaid' },
                { value: 'pending', label: 'Pending' }, { value: 'verified', label: 'Verified' },
              ]} ariaLabel="Filter by payment status" />
              <FilterSelect value={stateFilter} onChange={setStateFilter} placeholder="State" options={[
                { value: 'unpaid', label: 'Submitted — Unpaid' }, { value: 'pending', label: 'Payment Pending' },
                { value: 'paid', label: 'Paid' }, { value: 'verified', label: 'Verified' },
                { value: 'correction', label: 'Correction' }, { value: 'withdrawn', label: 'Withdrawn' },
              ]} ariaLabel="Filter by submission state" />
              {activeFilters > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => { setClassFilter('all'); setSectionFilter('all'); setGenderFilter('all'); setPayFilter('all'); setStateFilter('all') }}>
                  Clear ({activeFilters})
                </Button>
              )}
            </div>
            <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1 md:hidden" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}>
              Filters{activeFilters > 0 ? ` · ${activeFilters}` : ''}
            </Button>
          </div>
          {filtersOpen && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="md:hidden grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-3">
              <FilterSelect value={classFilter} onChange={setClassFilter} placeholder="Class" options={classOptions.map((c) => ({ value: c.id, label: c.name }))} ariaLabel="Filter by class" />
              <FilterSelect value={sectionFilter} onChange={setSectionFilter} placeholder="Section" options={sectionOptions.map((s) => ({ value: s, label: `Section ${s}` }))} ariaLabel="Filter by section" />
              <FilterSelect value={genderFilter} onChange={setGenderFilter} placeholder="Gender" options={[{ value: 'Male', label: 'Boys' }, { value: 'Female', label: 'Girls' }]} ariaLabel="Filter by gender" />
              <FilterSelect value={payFilter} onChange={setPayFilter} placeholder="Payment" options={[{ value: 'paid', label: 'Paid' }, { value: 'unpaid', label: 'Unpaid' }, { value: 'pending', label: 'Pending' }, { value: 'verified', label: 'Verified' }]} ariaLabel="Filter by payment" />
              <FilterSelect value={stateFilter} onChange={setStateFilter} placeholder="State" options={[{ value: 'unpaid', label: 'Unpaid' }, { value: 'pending', label: 'Pending' }, { value: 'paid', label: 'Paid' }, { value: 'verified', label: 'Verified' }]} ariaLabel="Filter by state" />
              <Button variant="ghost" size="sm" className="h-8 text-[11px] col-span-2" onClick={() => { setClassFilter('all'); setSectionFilter('all'); setGenderFilter('all'); setPayFilter('all'); setStateFilter('all') }}>
                Clear all filters
              </Button>
            </motion.div>
          )}

          {/* Bulk bar */}
          <AnimatePresence>
            {selected.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2"
              >
                <p className="text-[11px] font-medium">{selected.size} selected</p>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="h-7 text-[11px] gap-1" onClick={downloadSelected}>
                    <Download className="h-3 w-3" /> Download forms
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => setSelected(new Set())}>
                    Clear
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Table (desktop) / cards (mobile) ── */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyPanel text={mySubs.length === 0
                ? 'No submissions yet — students of the eligible classes will appear here the moment they apply.'
                : 'No submissions match these filters.'} />
            ) : (
              <>
                {/* desktop header */}
                <div className="hidden md:grid grid-cols-[28px_130px_1.3fr_110px_70px_1.1fr_150px_64px] gap-2 px-3 py-2 border-b border-border bg-muted/40 text-[10px] font-medium text-muted-foreground">
                  <span />
                  <span>Tour serial</span>
                  <span>Student</span>
                  <span>Class · Sec</span>
                  <span>Gender</span>
                  <span>Guardian</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>
                <div className="divide-y divide-border">
                  {filtered.map((s) => {
                    const st = stateOf(s)
                    const pay = deriveSubmissionPayment(app, s)
                    return (
                      <div key={s.id} className="md:grid md:grid-cols-[28px_130px_1.3fr_110px_70px_1.1fr_150px_64px] md:gap-2 md:items-center px-3 py-2.5 hover:bg-muted/30 transition-colors">
                        <Checkbox
                          checked={selected.has(s.id)}
                          onCheckedChange={() => toggleSelected(s.id)}
                          aria-label={`Select ${s.studentName}`}
                          className="md:mt-0"
                        />
                        <span className="hidden md:block font-mono text-[10.5px] font-medium">{s.serialNo ?? '—'}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{s.studentName}</p>
                          <p className="text-[10px] text-muted-foreground md:hidden">{s.serialNo ?? '—'} · {s.className}-{s.section} · {s.admissionNo}</p>
                          <p className="hidden md:block text-[10px] text-muted-foreground font-mono">{s.admissionNo}</p>
                        </div>
                        <span className="hidden md:block text-[11px] text-muted-foreground">{s.className} · {s.section}</span>
                        <span className="hidden md:block text-[11px] text-muted-foreground">{genderLabel(s.gender)}</span>
                        <div className="min-w-0 hidden md:block">
                          <p className="text-[11px] truncate">{s.guardianName}</p>
                          <p className="text-[10px] text-muted-foreground">{s.guardianPhone}</p>
                        </div>
                        <div className="flex md:flex-col items-center md:items-start gap-1.5 mt-1.5 md:mt-0">
                          <span className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9.5px] font-medium', tourStateChipClass(st))}>
                            {st}
                          </span>
                          {app.payment.mode !== 'None' && (
                            <span className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9.5px] font-medium', paymentChipClass(pay.status))}>
                              {pay.status === 'Paid' ? `${formatINR(pay.paidAmount)}` : pay.status}
                            </span>
                          )}
                        </div>
                        <RowActions
                          onPay={(pay.status === 'Not Paid' && app.payment.mode !== 'None' && s.status !== 'Withdrawn') ? () => setPaySub(s) : undefined}
                          onView={() => setViewSub(s)}
                          onVerify={(st === 'Verified / Received' || s.status === 'Withdrawn' || s.status === 'Rejected') ? undefined : () => doVerify(s)}
                          onReceived={(s.physicalDoc.status === 'Not Required' || s.physicalDoc.status === 'Received' || s.physicalDoc.status === 'Verified') ? undefined : () => doMarkReceived(s)}
                        />
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Unpaid submissions stay on record and are never auto-rejected. Payment can be recorded anytime — the serial, form and history update, nothing is duplicated.
          </p>
        </>
      )}

      {tab === 'payments' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {txns.length === 0 ? (
            <EmptyPanel text="No payments recorded for this tour yet. Payments appear here the moment they are received — online or at the counter." />
          ) : (
            <>
              <div className="hidden md:grid grid-cols-[1.2fr_110px_90px_1fr_90px_120px_100px_1fr] gap-2 px-3 py-2 border-b border-border bg-muted/40 text-[10px] font-medium text-muted-foreground">
                <span>Student</span>
                <span>Application no.</span>
                <span>Tour</span>
                <span>Amount</span>
                <span>Method</span>
                <span>Status</span>
                <span>Date / receipt</span>
                <span>Collected by</span>
              </div>
              <div className="divide-y divide-border">
                {txns
                  .slice()
                  .sort((a, b) => (b.recordedAt ?? b.id).localeCompare(a.recordedAt ?? a.id))
                  .map((t) => {
                    const sub = mySubs.find((s) => s.studentId === t.studentId)
                    return (
                      <div key={t.id} className="md:grid md:grid-cols-[1.2fr_110px_90px_1fr_90px_120px_100px_1fr] md:gap-2 md:items-center px-3 py-2.5">
                        <p className="text-xs font-semibold truncate">{t.studentName}</p>
                        <span className="hidden md:block font-mono text-[10.5px]">{sub?.serialNo ?? '—'}</span>
                        <span className="hidden md:block text-[11px] text-muted-foreground truncate">{app.title.replace('Educational Tour — ', '')}</span>
                        <span className="text-xs font-bold tabular-nums">{formatINR(t.amount)}</span>
                        <span className="hidden md:block text-[11px] text-muted-foreground">{t.mode}</span>
                        <span className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9.5px] font-medium w-fit', paymentChipClass(t.status === 'Success' ? 'Paid' : 'Awaiting Verification'))}>
                          {t.status === 'Success' ? 'Paid' : t.status}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px]">{formatDate(t.date)}</p>
                          <p className="text-[10px] text-muted-foreground font-mono truncate">{t.receiptNo}{t.referenceNo ? ` · ${t.referenceNo}` : ''}</p>
                        </div>
                        <span className="hidden md:block text-[11px] text-muted-foreground truncate">{t.collectedBy}</span>
                      </div>
                    )
                  })}
              </div>
            </>
          )}
          <p className="px-3 py-2 border-t border-border text-[10px] text-muted-foreground">
            Application charges only — these payments never mix with tuition, transport or annual fees. Cash entries verify through the existing cash-verification workflow.
          </p>
        </div>
      )}

      {tab === 'history' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {myAudit.length === 0 ? (
            <EmptyPanel text="No events yet." />
          ) : (
            <ol className="divide-y divide-border">
              {myAudit.map((ev) => (
                <li key={ev.id} className="flex items-start gap-3 px-3 py-2.5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <History className="h-3 w-3" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] leading-snug">{ev.message}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {new Date(ev.ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · {ev.actor}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* ── Blank form preview dialog ── */}
      <BlankFormDialog open={blankOpen} onOpenChange={setBlankOpen} app={app} />

      {/* ── Submission document drawer ── */}
      <SubmissionDrawer
        sub={viewSub}
        app={app}
        onClose={() => setViewSub(null)}
        onPay={(s) => { setViewSub(null); setPaySub(s) }}
        onVerify={doVerify}
        onReceived={doMarkReceived}
      />

      {/* ── Record payment dialog ── */}
      {paySub && (
        <RecordPaymentDialog
          sub={paySub}
          app={app}
          onClose={() => setPaySub(null)}
          onRecord={recordStaffPayment}
        />
      )}

      {/* ── Attendance list dialog ── */}
      <Dialog open={attendanceOpen} onOpenChange={setAttendanceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" /> Attendance / master list
            </DialogTitle>
            <DialogDescription className="text-xs">
              An official print-ready list of the tour group — serial numbers, guardian contacts, payment and verification status, plus a signature column for the trip.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-muted-foreground">List scope</Label>
              <Select value={attendanceScope} onValueChange={setAttendanceScope}>
                <SelectTrigger className="h-8 text-xs" aria-label="Attendance list scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All students ({mySubs.filter((s) => s.status !== 'Withdrawn').length})</SelectItem>
                  {classOptions.map((c) => (
                    <SelectItem key={c.id} value={`class:${c.id}`}>{c.name} — class-wise</SelectItem>
                  ))}
                  <SelectItem value="male">Boys only</SelectItem>
                  <SelectItem value="female">Girls only</SelectItem>
                  <SelectItem value="paid">Paid students</SelectItem>
                  <SelectItem value="unpaid">Unpaid submissions</SelectItem>
                  <SelectItem value="pending">Payment pending</SelectItem>
                  <SelectItem value="verified">Verified / received</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {attendanceRows.length} student{attendanceRows.length === 1 ? '' : 's'} · {attendanceScopeLabel} · A4 landscape, one row each.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setAttendanceOpen(false)}>Close</Button>
            <Button size="sm" className="h-8 text-xs gap-1" disabled={attendanceRows.length === 0} onClick={() => {
              downloadTourAttendancePDF(app, attendanceRows, attendanceScopeLabel)
              setAttendanceOpen(false)
              toast.success('Attendance list downloaded', { description: `${attendanceRows.length} rows · ${attendanceScopeLabel}` })
            }}>
              <Download className="h-3.5 w-3.5" /> Download list
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Take down confirm ── */}
      <AlertDialog open={takeDownOpen} onOpenChange={setTakeDownOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Take down this tour?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              Students can no longer apply and the tour disappears from their open list. Every existing submission, payment, serial number and the full history remain intact and accessible here. You can reopen it before the deadline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Keep it open</AlertDialogCancel>
            <AlertDialogAction className="h-8 text-xs bg-amber-600 text-white hover:bg-amber-700" onClick={(e) => { e.preventDefault(); doTakeDown() }}>
              <X className="h-3.5 w-3.5" /> Take down
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Row actions cluster ───────────────────────────────────────────────

function RowActions({ onPay, onView, onVerify, onReceived }: {
  onPay?: () => void
  onView: () => void
  onVerify?: () => void
  onReceived?: () => void
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      {onPay && (
        <Button size="sm" className="h-7 text-[11px] px-2" onClick={onPay}>
          <Banknote className="h-3 w-3" /> Pay
        </Button>
      )}
      <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 gap-1" onClick={onView}>
        <Eye className="h-3 w-3" /> <span className="hidden lg:inline">Form</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label="More actions">
            <ChevronRight className="h-3.5 w-3.5 -rotate-90" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {onVerify && <DropdownMenuItem onClick={onVerify}><ShieldCheck className="h-3.5 w-3.5" /> Verify / approve</DropdownMenuItem>}
          {onReceived && <DropdownMenuItem onClick={onReceived}><ClipboardList className="h-3.5 w-3.5" /> Mark form received</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ─── Metric tile ───────────────────────────────────────────────────────

function Metric({ label, value, hint, tone, icon }: {
  label: string
  value: number
  hint?: string
  tone?: 'emerald' | 'amber'
  icon?: React.ReactNode
}) {
  return (
    <div className={cn(
      'rounded-xl border bg-card px-3 py-2.5',
      tone === 'emerald' && 'border-emerald-200/70 dark:border-emerald-500/20',
      tone === 'amber' && 'border-amber-200/70 dark:border-amber-500/20',
    )}>
      <p className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
        {icon}{label}
      </p>
      <p className={cn(
        'mt-0.5 text-lg font-bold tabular-nums leading-tight',
        tone === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
        tone === 'amber' && 'text-amber-600 dark:text-amber-400',
      )}>
        {value}
      </p>
      {hint && <p className="text-[9px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function StatusBadge({ eff }: { eff: string }) {
  const tone =
    eff === 'Open' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
      : eff === 'Closing Soon' ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'
        : eff === 'Draft' ? 'border-border bg-muted/60 text-muted-foreground'
          : 'border-border bg-muted/60 text-muted-foreground'
  return <Badge variant="outline" className={cn('text-[9px] h-4 px-1.5', tone)}>{eff}</Badge>
}

function FilterSelect<T extends string>({ value, onChange, placeholder, options, ariaLabel }: {
  value: T
  onChange: (v: T) => void
  placeholder: string
  options: Array<{ value: string; label: string }>
  ariaLabel: string
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange((v === value && v !== 'all' ? 'all' : v) as T)}>
      <SelectTrigger className="h-8 w-[110px] text-[11px]" aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="mx-auto max-w-md text-xs text-muted-foreground">{text}</p>
    </div>
  )
}

// ─── Blank form dialog (official A4, scaled + scrollable) ──────────────

function BlankFormDialog({ app, open, onOpenChange }: {
  app: SchoolApplication
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const [ref, zoom] = useFitA4Zoom<HTMLDivElement>()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-2 border-b border-border shrink-0">
          <DialogTitle className="text-base flex items-center justify-between gap-2 pr-6">
            <span className="flex items-center gap-2"><FileDown className="h-4 w-4 text-primary" /> Official blank form</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            The printed A4 form exactly as students and parents receive it — blank copies can be filled by hand.
          </DialogDescription>
        </DialogHeader>
        <div ref={ref} className="flex-1 min-h-0 overflow-auto bg-muted/40 p-2 rounded-md">
          <div style={{ zoom, width: 'fit-content', margin: '0 auto' }}>
            <TourFormDocument app={app} />
          </div>
        </div>
        <DialogFooter className="border-t border-border pt-3 shrink-0">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => { void downloadTourFormPDF(app).then((ok) => { if (!ok) toast.error('Could not generate the form') }) }}>
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1" onClick={() => printTourDocument()}>
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Submission document drawer ────────────────────────────────────────

function SubmissionDrawer({ sub, app, onClose, onPay, onVerify, onReceived }: {
  sub: ApplicationSubmission | null
  app: SchoolApplication
  onClose: () => void
  onPay: (s: ApplicationSubmission) => void
  onVerify: (s: ApplicationSubmission) => void
  onReceived: (s: ApplicationSubmission) => void
}) {
  // Escape closes the drawer (backdrop click already does).
  useDismissOnEscape(onClose, !!sub)
  const [ref, zoom] = useFitA4Zoom<HTMLDivElement>()
  const pay = sub ? deriveSubmissionPayment(app, sub) : null
  return (
    <AnimatePresence>
      {sub && (
        <motion.div
          key="drawer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`Completed form — ${sub.studentName}`}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 bottom-0 w-full sm:max-w-2xl bg-background border-l border-border flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border shrink-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold flex items-center gap-2 truncate">
                  {sub.studentName}
                  <span className="font-mono text-[10px] font-medium text-muted-foreground">{sub.serialNo}</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {sub.className} · {sub.section} · Roll {sub.rollNo ?? '—'} · Guardian {sub.guardianName} ({sub.guardianPhone})
                </p>
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9.5px] font-medium', tourStateChipClass(tourSubmissionState(app, sub)))}>
                    {tourSubmissionState(app, sub)}
                  </span>
                  {pay && app.payment.mode !== 'None' && (
                    <span className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9.5px] font-medium', paymentChipClass(pay.status))}>
                      {pay.status}{pay.receiptNos.length > 0 ? ` · ${pay.receiptNos.join(', ')}` : ''}
                    </span>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={onClose} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div ref={ref} className="flex-1 min-h-0 overflow-auto bg-muted/40 p-2">
              <div style={{ zoom, width: 'fit-content', margin: '0 auto' }}>
                <TourFormDocument app={app} sub={sub} payment={pay ?? undefined} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-1.5 flex-wrap px-4 py-3 border-t border-border shrink-0">
              {pay?.status === 'Not Paid' && app.payment.mode !== 'None' && (
                <Button size="sm" className="h-8 text-xs gap-1" onClick={() => onPay(sub)}>
                  <Banknote className="h-3.5 w-3.5" /> Record payment
                </Button>
              )}
              {sub.status !== 'Withdrawn' && sub.status !== 'Rejected' && tourSubmissionState(app, sub) !== 'Verified / Received' && (
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => onVerify(sub)}>
                  <ShieldCheck className="h-3.5 w-3.5" /> {sub.physicalDoc.status === 'Received' ? 'Verify document' : 'Verify / approve'}
                </Button>
              )}
              {sub.physicalDoc.status === 'Pending' && (
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => onReceived(sub)}>
                  <ClipboardList className="h-3.5 w-3.5" /> Mark form received
                </Button>
              )}
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => { void downloadTourFormPDF(app, sub, { payment: pay ?? undefined }).then((ok) => { if (!ok) toast.error('Could not generate the form') }) }}>
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => printTourDocument()}>
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Record payment dialog ─────────────────────────────────────────────

function RecordPaymentDialog({ sub, app, onClose, onRecord }: {
  sub: ApplicationSubmission
  app: SchoolApplication
  onClose: () => void
  onRecord: (sub: ApplicationSubmission, mode: 'UPI' | 'Cash', referenceNo: string) => void
}) {
  const [mode, setMode] = useState<'UPI' | 'Cash'>('UPI')
  const [reference, setReference] = useState('')
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Banknote className="h-4 w-4 text-primary" /> Record tour payment
          </DialogTitle>
          <DialogDescription className="text-xs">
            {sub.studentName} · {sub.serialNo} · {formatINR(app.payment.amount)} for {app.title}. The submission moves to Submitted — Paid without creating a duplicate.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-[10px] font-medium text-muted-foreground">Method</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as 'UPI' | 'Cash')}>
              <SelectTrigger className="h-8 text-xs" aria-label="Payment method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UPI">Online / UPI — confirmed instantly</SelectItem>
                <SelectItem value="Cash">Cash received at counter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mode === 'UPI' && (
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-muted-foreground">Gateway / UPI reference</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="UPI ref / transaction id"
                className="h-8 text-xs"
                aria-label="Payment reference number"
              />
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">
            Recorded against the tour&apos;s linked collection — it never touches tuition or annual fees. Receipt number is issued automatically.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="h-8 text-xs" onClick={() => onRecord(sub, mode, reference)}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Record {formatINR(app.payment.amount)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
