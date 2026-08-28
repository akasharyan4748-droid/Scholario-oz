'use client'

/**
 * fees-additional-charges — Additional Collections (Payments page).
 *
 * FIN spec PART 2/3/4/6/7/28/29/30/31 redesign. Additional Collections are
 * event-based / non-annual financial collections that exist INDEPENDENTLY of
 * the standard annual class fee structures. Every collection is either:
 *   • APPLICATION-LINKED — generated when an Applications & Forms form with
 *     a payment config was published (reverse-lookup: the SchoolApplication
 *     whose payment.chargeId === charge.id → "via Application · title"); or
 *   • STANDALONE — created directly here (donations, relief funds…).
 *
 * Presentation follows the Salary & Payroll benchmark (minimal, compact,
 * enterprise — the giant violet inline creation form is REMOVED):
 *
 *   Panel "Additional Collections"
 *     ├─ Collection rows (divide-y) — icon chip + name + chips, labelled
 *     │  figures ({collected} collected / of {expected} expected — PART 28),
 *     │  progress bar, status chip, [Open] → detail drawer.
 *     ├─ Record File (Archive) — Closed + Cancelled collections (audit).
 *     ├─ + New Collection — compact side drawer (replaces the inline form).
 *     └─ Collection Detail drawer (Sheet right) — summary tiles + segmented
 *        tabs (Overview | Students | Payments) + contextual actions:
 *        Active → Collect Cash / Close / Cancel; terminal → Export CSV.
 *
 * Money flow: Collect Cash calls fee-store recordPayment({ mode:'Cash',
 * additionalChargeId, applicationId? }) — ONE transaction that appears in
 * Transactions, the student account and the application record (never
 * disconnected duplicates). Closed charges stop being student obligations
 * (computeAccount filters status==='Active').
 */

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Archive, Bus, FlaskConical, Trophy, Tent, CalendarDays, Package, Tag,
  HandHeart, Banknote, Download, Check, Lock, QrCode, type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  useFeeStore, useFeeData, CURRENT_ACADEMIC_YEAR,
  type AdditionalCharge, type AdditionalChargeCategory, type FeeTransaction,
} from '@/lib/store/fee-store'
import { useApplicationsStore, type SchoolApplication } from '@/lib/store/applications-store'
import { useStudentsStore, type StudentRecord } from '@/lib/store/students-store'
import { deriveFeeHeadKind, useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { ACADEMIC_CLASSES } from '@/lib/mock/academic/classes'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { MoneyInput } from './money-input'
import { FeeEmptyState, FeeStatusBadge } from './fees-shared'
import { Panel } from '../shared/panel'

/** Class chips for the creation form — stream variants (Class 11 PCM/PCB)
 *  collapse into one chip so the Principal never sees duplicates. Picking a
 *  collapsed name selects the FIRST canonical class with that name; stream
 *  scoping is rarely needed for event-based collections. */
const UNIQUE_CLASSES = (() => {
  const seen = new Set<string>()
  return ACADEMIC_CLASSES.filter((c) => {
    if (seen.has(c.name)) return false
    seen.add(c.name)
    return true
  })
})()

// ─── Category meta ─────────────────────────────────────────────────────

const CHARGE_CATEGORIES: Array<{ value: AdditionalChargeCategory; label: string; icon: LucideIcon }> = [
  { value: 'Tour', label: 'Tour / Trip', icon: Bus },
  { value: 'Workshop', label: 'Workshop', icon: FlaskConical },
  { value: 'Competition', label: 'Competition', icon: Trophy },
  { value: 'Camp', label: 'Camp', icon: Tent },
  { value: 'Event', label: 'Event', icon: CalendarDays },
  { value: 'Material', label: 'Material', icon: Package },
  { value: 'Donation', label: 'Donation', icon: HandHeart },
  { value: 'Other', label: 'Other', icon: Tag },
]

/** Module-level icon lookup — keeps dynamic icon resolution OUT of render
 *  scopes (react-hooks/static-components). */
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  CHARGE_CATEGORIES.map((c) => [c.value, c.icon]),
)

function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = CATEGORY_ICON_MAP[category] ?? Tag
  return <Icon className={className} />
}

/** Icon chip tone — violet module accent; emerald for Donation drives. */
function categoryTone(category: string): string {
  return category === 'Donation'
    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20'
    : 'bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20'
}

// ─── Status chips ──────────────────────────────────────────────────────

const STATUS_CHIP: Record<AdditionalCharge['status'], string> = {
  Active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Closed: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  Cancelled: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

const STATUS_LABEL: Record<AdditionalCharge['status'], string> = {
  Active: 'Open',
  Closed: 'Closed',
  Cancelled: 'Cancelled',
}

function StatusChip({ status }: { status: AdditionalCharge['status'] }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap',
        STATUS_CHIP[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

// ─── Small helpers ─────────────────────────────────────────────────────

function MiniChip({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap',
        className,
      )}
    >
      {children}
    </span>
  )
}

function FieldError({ show, children }: { show: boolean; children: ReactNode }) {
  if (!show) return null
  return <p className="mt-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400">{children}</p>
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function classLabels(classIds: string[]): string {
  const names = classIds.map((id) => ACADEMIC_CLASSES.find((c) => c.id === id)?.name ?? id)
  if (names.length === 0) return 'No classes'
  if (names.length <= 3) return names.join(', ')
  return `${names.slice(0, 3).join(', ')} +${names.length - 3}`
}

/** Students scoped by a charge — explicit studentIds win, else the roster of
 *  the applicable classes (Active students only). */
function scopedStudentsFor(charge: AdditionalCharge, activeStudents: StudentRecord[]): StudentRecord[] {
  const ids = charge.studentIds
  if (ids && ids.length > 0) return activeStudents.filter((s) => ids.includes(s.id))
  return activeStudents.filter((s) => charge.applicableClassIds.includes(s.classId))
}

/** Per-charge roll-up used by rows, the Record File and the detail drawer. */
interface ChargeFacts {
  /** Scoped (eligible) student count. */
  students: number
  /** Success + Under Verification money bound to the charge. */
  collected: number
  /** students × amount — or targetAmount for custom-amount drives (0 = open). */
  expected: number
  /** null when there is no denominator (open-amount drive). */
  pct: number | null
  /** ALL bound transactions (Payments tab + Record File count). */
  txns: FeeTransaction[]
}

const EMPTY_FACTS: ChargeFacts = { students: 0, collected: 0, expected: 0, pct: null, txns: [] }

/** Export a collection's bound payments as CSV (permanent-record handout). */
function exportChargePaymentsCsv(charge: AdditionalCharge, txns: FeeTransaction[]) {
  const esc = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [
    ['Receipt', 'Student', 'Amount', 'Mode', 'Status', 'Date'].join(','),
    ...txns.map((t) => [t.receiptNo, t.studentName, t.amount, t.mode, t.status, t.date].map(esc).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${charge.name}-payments.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// ─── Section ───────────────────────────────────────────────────────────

export function FeesAdditionalCharges({ data }: { data: ReturnType<typeof useFeeData> }) {
  const { additionalCharges, transactions } = data
  const students = useStudentsStore((s) => s.students)
  const applications = useApplicationsStore((s) => s.applications)

  const [creating, setCreating] = useState(false)
  const [recordFileOpen, setRecordFileOpen] = useState(false)
  const [detail, setDetail] = useState<{ id: string; readOnly: boolean } | null>(null)

  const activeStudents = useMemo(() => students.filter((s) => s.status === 'Active'), [students])

  // Reverse lookup — application-linked source (no drift-prone field):
  // the SchoolApplication whose payment.chargeId === charge.id.
  const appByChargeId = useMemo(() => {
    const map = new Map<string, SchoolApplication>()
    for (const app of applications) {
      const cid = app.payment.chargeId
      if (cid && !map.has(cid)) map.set(cid, app)
    }
    return map
  }, [applications])

  // Live roll-up per charge from bound transactions.
  const facts = useMemo(() => {
    const map = new Map<string, ChargeFacts>()
    for (const c of additionalCharges) {
      const scoped = scopedStudentsFor(c, activeStudents)
      const txns = transactions.filter((t) => t.additionalChargeId === c.id)
      const collected = txns
        .filter((t) => t.status === 'Success' || t.status === 'Under Verification')
        .reduce((sum, t) => sum + t.amount, 0)
      const custom = c.allowCustomAmount === true
      const expected = custom ? (c.targetAmount ?? 0) : scoped.length * c.amount
      const pct = expected > 0 ? Math.min(100, Math.round((collected / expected) * 100)) : null
      map.set(c.id, { students: scoped.length, collected, expected, pct, txns })
    }
    return map
  }, [additionalCharges, transactions, activeStudents])

  const openCharges = additionalCharges.filter((c) => c.status === 'Active')
  const recordCharges = additionalCharges
    .filter((c) => c.status === 'Closed' || c.status === 'Cancelled')
    .sort((a, b) => (b.closedAt ?? b.createdAt).localeCompare(a.closedAt ?? a.createdAt))

  const detailCharge = detail ? additionalCharges.find((c) => c.id === detail.id) ?? null : null

  return (
    <>
      <Panel
        title={
          <span className="inline-flex items-center gap-2">
            Additional Collections
            <Badge variant="outline" className="text-[9px] h-4 px-1.5">{openCharges.length}</Badge>
          </span>
        }
        subtitle="Event and other non-annual collections."
        action={
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs gap-1.5"
              onClick={() => setRecordFileOpen(true)}
              aria-label={`Record File — ${recordCharges.length} closed or cancelled collection${recordCharges.length === 1 ? '' : 's'}`}
            >
              <Archive className="h-3.5 w-3.5" /> Record File
              {recordCharges.length > 0 && (
                <span className="inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-muted px-1 text-[9px] font-bold text-muted-foreground tabular-nums">
                  {recordCharges.length}
                </span>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              onClick={() => setCreating(true)}
            >
              <Plus className="h-3.5 w-3.5" /> New Collection
            </Button>
          </div>
        }
        bodyClassName="p-0"
      >
        {openCharges.length > 0 ? (
          <div className="divide-y divide-border">
            {openCharges.map((c) => {
              const f = facts.get(c.id) ?? EMPTY_FACTS
              const app = appByChargeId.get(c.id)
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-start justify-between gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                    {/* Left — category icon chip + name + chips + meta line */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', categoryTone(c.category))}>
                        <CategoryIcon category={c.category} className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-xs font-semibold truncate">{c.name}</p>
                          <MiniChip className={c.mandatory ? 'bg-slate-500/10 text-slate-600 dark:text-slate-300' : 'bg-muted text-muted-foreground'}>
                            {c.mandatory ? 'Mandatory' : 'Optional'}
                          </MiniChip>
                          {c.allowCustomAmount && (
                            <MiniChip className="bg-violet-500/10 text-violet-700 dark:text-violet-300">Custom amount</MiniChip>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          <span className="font-medium">{c.category}</span>
                          {' · '}{app ? `via Application · ${app.title}` : 'Standalone'}
                          {' · '}{classLabels(c.applicableClassIds)}
                          {' · '}due {formatDate(c.dueDate)}
                          {' · '}{f.students} student{f.students === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>

                    {/* Right — labelled figures (PART 28), progress, status, Open */}
                    <div className="shrink-0 w-32 sm:w-40 text-right">
                      <p className={cn('text-sm font-bold tabular-nums leading-tight truncate', f.collected > 0 && 'text-emerald-600 dark:text-emerald-400')}>
                        {formatINR(f.collected)}{' '}
                        <span className="text-[9px] font-semibold text-muted-foreground">collected</span>
                      </p>
                      <p className="text-[9px] text-muted-foreground truncate">
                        {c.allowCustomAmount
                          ? c.targetAmount
                            ? <>open amount · target {formatINR(c.targetAmount)}</>
                            : 'open amount'
                          : <>of {formatINR(f.expected)} expected</>}
                      </p>
                      {f.pct != null && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <div aria-hidden className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${f.pct}%` }}
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                              className="h-full rounded-full bg-emerald-500"
                            />
                          </div>
                          <span className="w-7 text-right text-[9px] font-semibold text-muted-foreground tabular-nums">{f.pct}%</span>
                        </div>
                      )}
                      <div className="mt-1.5 flex items-center justify-end gap-1.5">
                        <StatusChip status={c.status} />
                        <Button
                          size="sm"
                          className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => setDetail({ id: c.id, readOnly: false })}
                        >
                          Open
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <FeeEmptyState
            icon={<CalendarDays className="h-6 w-6" />}
            title="No open collections"
            description="Create one with New Collection — tours, workshops, donation drives and other non-annual collections. The annual fee structures stay untouched."
          />
        )}
      </Panel>

      {/* New Collection — compact side drawer (PART 4: no inline form) */}
      <NewCollectionSheet open={creating} onClose={() => setCreating(false)} activeStudents={activeStudents} />

      {/* Record File — Closed + Cancelled collections (PART 29) */}
      <RecordFileSheet
        open={recordFileOpen}
        onClose={() => setRecordFileOpen(false)}
        charges={recordCharges}
        facts={facts}
        onOpen={(id) => {
          setRecordFileOpen(false)
          setDetail({ id, readOnly: true })
        }}
      />

      {/* Collection Detail drawer (PART 6/30) */}
      {detailCharge && (
        <CollectionDetailSheet
          charge={detailCharge}
          facts={facts.get(detailCharge.id) ?? EMPTY_FACTS}
          app={appByChargeId.get(detailCharge.id)}
          activeStudents={activeStudents}
          readOnly={detail?.readOnly ?? false}
          onClose={() => setDetail(null)}
        />
      )}
    </>
  )
}

// ─── Collection Detail drawer ──────────────────────────────────────────

type DetailTab = 'overview' | 'students' | 'payments'

const DETAIL_TABS: Array<{ value: DetailTab; label: string }> = [
  { value: 'overview', label: 'Overview' },
  { value: 'students', label: 'Students' },
  { value: 'payments', label: 'Payments' },
]

function MiniTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="min-w-0 rounded-lg bg-muted/30 px-2 py-1.5">
      <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground truncate">{label}</p>
      <p className={cn('mt-0.5 truncate text-xs font-bold tabular-nums', accent && 'text-emerald-600 dark:text-emerald-400')}>{value}</p>
    </div>
  )
}

function CollectionDetailSheet({
  charge,
  facts,
  app,
  activeStudents,
  readOnly,
  onClose,
}: {
  charge: AdditionalCharge
  facts: ChargeFacts
  app?: SchoolApplication
  activeStudents: StudentRecord[]
  readOnly: boolean
  onClose: () => void
}) {
  const cancelAdditionalCharge = useFeeStore((s) => s.cancelAdditionalCharge)
  const [tab, setTab] = useState<DetailTab>('overview')
  const [collectFor, setCollectFor] = useState<string | null>(null)
  const [collectUpiFor, setCollectUpiFor] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)

  const isCustom = charge.allowCustomAmount === true
  const canManage = charge.status === 'Active' && !readOnly
  const scoped = useMemo(() => scopedStudentsFor(charge, activeStudents), [charge, activeStudents])

  // Per-student payment state derived from the bound transactions.
  const studentStates = useMemo(() => {
    const map = new Map<string, { paid: number; verifying: boolean }>()
    for (const t of facts.txns) {
      const cur = map.get(t.studentId) ?? { paid: 0, verifying: false }
      if (t.status === 'Success' || t.status === 'Under Verification') cur.paid += t.amount
      if (t.status === 'Under Verification') cur.verifying = true
      map.set(t.studentId, cur)
    }
    return map
  }, [facts.txns])

  const paidCount = scoped.filter((s) => {
    const st = studentStates.get(s.id)
    const paid = st?.paid ?? 0
    return isCustom ? paid > 0 : paid >= charge.amount
  }).length

  // Bound payments, newest first (Payments tab).
  const payments = useMemo(
    () => [...facts.txns].sort((a, b) => b.date.localeCompare(a.date) || b.receiptNo.localeCompare(a.receiptNo)),
    [facts.txns],
  )

  // Overview rows — plain label/value pairs (contextual extras appended).
  const overviewRows: Array<{ label: string; value: string }> = []
  if (charge.description) overviewRows.push({ label: 'Description', value: charge.description })
  if (charge.reference) overviewRows.push({ label: 'Reference', value: charge.reference })
  overviewRows.push({
    label: 'Created by',
    value: `${charge.createdBy}${charge.createdAt ? ` · ${formatDate(charge.createdAt)}` : ''}`,
  })
  overviewRows.push({ label: 'Session', value: charge.academicYear })
  overviewRows.push({ label: 'Due date', value: formatDate(charge.dueDate) })
  if (charge.status === 'Closed') {
    overviewRows.push({
      label: 'Closed',
      value: `${charge.closedAt ? formatDate(charge.closedAt) : '—'}${charge.closeNote ? ` — ${charge.closeNote}` : ''}`,
    })
  }
  if (charge.status === 'Cancelled') {
    overviewRows.push({ label: 'Cancelled', value: charge.cancelReason ?? 'No reason recorded' })
  }

  // window.prompt cancel flow — reused verbatim from the previous file
  // (soft cancel; already-collected payments stay on record).
  const handleCancel = () => {
    const reason = window.prompt(`Cancel "${charge.name}"?\n\nStudents stop owing this charge. Already-collected payments stay on record.`)
    if (reason === null) return
    const result = cancelAdditionalCharge(charge.id, 'Principal', reason.trim() || undefined)
    if (result.success) {
      toast.info('Charge cancelled', { description: `"${charge.name}" removed from student balances. Payments on record are preserved.` })
    } else {
      toast.error('Could not cancel', { description: result.error })
    }
  }

  const expectedDisplay = isCustom
    ? charge.targetAmount && charge.targetAmount > 0 ? formatINR(charge.targetAmount) : 'Open'
    : formatINR(facts.expected)
  const pendingDisplay = facts.expected > 0
    ? formatINR(Math.max(0, facts.expected - facts.collected))
    : isCustom ? '—' : formatINR(0)

  return (
    <>
      <Sheet open onOpenChange={(o) => { if (!o) onClose() }}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 gap-0 flex flex-col">
          {/* Header — icon chip + name + status + source line */}
          <SheetHeader className="space-y-0 border-b border-border/60 px-4 pb-3 pt-4 text-left">
            <div className="flex items-start gap-3 pr-8">
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', categoryTone(charge.category))}>
                <CategoryIcon category={charge.category} className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <SheetTitle className="truncate text-sm font-bold leading-tight">{charge.name}</SheetTitle>
                  <StatusChip status={charge.status} />
                </div>
                <SheetDescription className="mt-0.5 truncate text-[10px] text-muted-foreground">
                  {app ? `via Application · ${app.title}` : 'Standalone'} · {charge.category}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Summary strip — 4 labelled mini tiles + progress (PART 28) */}
          <div className="border-b border-border/60 px-4 pb-2.5 pt-3">
            <div className="grid grid-cols-4 gap-1.5">
              <MiniTile label="Expected" value={expectedDisplay} />
              <MiniTile label="Collected" value={formatINR(facts.collected)} accent={facts.collected > 0} />
              <MiniTile label="Pending" value={pendingDisplay} />
              <MiniTile label="Students" value={String(facts.students)} />
            </div>
            {facts.pct != null && (
              <div className="mt-2 flex items-center gap-1.5">
                <div aria-hidden className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${facts.pct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-full bg-emerald-500"
                  />
                </div>
                <span className="w-7 text-right text-[9px] font-semibold text-muted-foreground tabular-nums">{facts.pct}%</span>
              </div>
            )}
          </div>

          {/* Compact segmented tab row */}
          <div className="flex items-center gap-1 border-b border-border/60 px-4 py-2">
            {DETAIL_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                aria-pressed={tab === t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors',
                  tab === t.value ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {tab === 'overview' && (
              <div>
                <div className="divide-y divide-border/60">
                  {overviewRows.map((r) => (
                    <div key={r.label} className="py-1.5 first:pt-0 last:pb-0">
                      <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">{r.label}</p>
                      <p className="mt-0.5 break-words text-[11px] font-medium">{r.value}</p>
                    </div>
                  ))}
                </div>

                {/* Contextual action row — Active: manage; terminal: permanent record */}
                {canManage ? (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Button
                      size="sm"
                      className="h-8 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                      onClick={() => setCollectFor('')}
                    >
                      <Banknote className="h-3.5 w-3.5" /> Collect Cash
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 text-xs"
                      onClick={() => setCollectUpiFor('')}
                    >
                      <QrCode className="h-3.5 w-3.5" /> Collect UPI / QR
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setClosing(true)}>
                      Close Collection
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-rose-600 hover:bg-rose-500/10 hover:text-rose-600"
                      onClick={handleCancel}
                    >
                      Cancel Collection
                    </Button>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-2.5 py-2">
                    <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Lock className="h-3 w-3" /> Part of the permanent record
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 text-[11px]"
                      onClick={() => exportChargePaymentsCsv(charge, facts.txns)}
                    >
                      <Download className="h-3 w-3" /> Export CSV
                    </Button>
                  </div>
                )}
              </div>
            )}

            {tab === 'students' && (
              <div>
                <p className="pb-1.5 text-[10px] text-muted-foreground">
                  {paidCount} of {scoped.length} paid{isCustom ? ' · any contribution counts' : ''}
                </p>
                <div className="divide-y divide-border/60">
                  {scoped.map((s) => {
                    const st = studentStates.get(s.id)
                    const paid = st?.paid ?? 0
                    const isPaid = isCustom ? paid > 0 : paid >= charge.amount
                    return (
                      <div key={s.id} className="flex items-center gap-2.5 py-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground">
                          {initialsOf(s.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">{s.name}</p>
                          <p className="text-[9px] text-muted-foreground">{s.className}</p>
                        </div>
                        {isPaid ? (
                          <MiniChip className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">Paid</MiniChip>
                        ) : st?.verifying ? (
                          <MiniChip className="bg-amber-500/10 text-amber-700 dark:text-amber-300">Verifying</MiniChip>
                        ) : (
                          <>
                            <MiniChip className="bg-muted text-muted-foreground">Not paid</MiniChip>
                            {canManage && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-1.5 text-[10px]"
                                  aria-label={`Record cash for ${s.name}`}
                                  onClick={() => setCollectFor(s.id)}
                                >
                                  Cash
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-1.5 text-[10px]"
                                  aria-label={`Record UPI payment for ${s.name}`}
                                  onClick={() => setCollectUpiFor(s.id)}
                                >
                                  UPI
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                  {scoped.length === 0 && (
                    <p className="py-6 text-center text-xs text-muted-foreground">No students match this collection&apos;s scope.</p>
                  )}
                </div>
              </div>
            )}

            {tab === 'payments' && (
              <div>
                {payments.length > 0 ? (
                  <div className="divide-y divide-border/60">
                    {payments.map((t) => (
                      <div key={t.id} className="flex items-center gap-2.5 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">{t.studentName}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{t.receiptNo}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-bold tabular-nums">{formatINR(t.amount)}</p>
                          <p className="mt-0.5 text-[9px] text-muted-foreground">{t.mode} · {formatDate(t.date)}</p>
                        </div>
                        <FeeStatusBadge status={t.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-6 text-center text-xs text-muted-foreground">No payments recorded against this collection yet.</p>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Collect Cash (PART 7) — preselected from the Students tab or generic */}
      {collectFor !== null && (
        <CollectCashDialog
          charge={charge}
          app={app}
          txns={facts.txns}
          students={scoped}
          preselectedId={collectFor || undefined}
          onClose={() => setCollectFor(null)}
        />
      )}

      {/* Collect UPI / QR — parent pays at the desk via UPI; reference no.
          reconciles the payment into this SAME collection automatically. */}
      {collectUpiFor !== null && (
        <CollectUpiDialog
          charge={charge}
          app={app}
          txns={facts.txns}
          students={scoped}
          preselectedId={collectUpiFor || undefined}
          onClose={() => setCollectUpiFor(null)}
        />
      )}

      {/* Close Collection — small confirm dialog with an optional note */}
      {closing && <CloseCollectionDialog charge={charge} collected={facts.collected} onClose={() => setClosing(false)} />}
    </>
  )
}

// ─── Collect Cash dialog ───────────────────────────────────────────────

function CollectCashDialog({
  charge,
  app,
  txns,
  students,
  preselectedId,
  onClose,
}: {
  charge: AdditionalCharge
  app?: SchoolApplication
  txns: FeeTransaction[]
  students: StudentRecord[]
  preselectedId?: string
  onClose: () => void
}) {
  const recordPayment = useFeeStore((s) => s.recordPayment)
  const isCustom = charge.allowCustomAmount === true
  const [studentId, setStudentId] = useState(preselectedId ?? '')
  const [amount, setAmount] = useState<number | null>(isCustom ? null : charge.amount)
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const selected = students.find((s) => s.id === studentId) ?? null
  const paidSoFar = txns
    .filter((t) => t.studentId === studentId && (t.status === 'Success' || t.status === 'Under Verification'))
    .reduce((sum, t) => sum + t.amount, 0)
  const outstanding = Math.max(0, charge.amount - paidSoFar)

  const studentMissing = !selected
  const amountMissing = amount == null
  const amountInvalid = amount != null && amount <= 0
  const overOutstanding = !isCustom && amount != null && amount > outstanding && paidSoFar > 0
  const valid = !studentMissing && amount != null && amount > 0

  const submit = () => {
    setSubmitted(true)
    if (!valid || !selected) return
    const result = recordPayment({
      studentId: selected.id,
      amount,
      mode: 'Cash',
      purpose: note.trim() ? `${charge.name} — ${note.trim()}` : charge.name,
      feeHead: app?.payment.feeHeadLabel ?? charge.name,
      collectedBy: 'Principal',
      additionalChargeId: charge.id,
      ...(app ? { applicationId: app.id } : {}),
    })
    if (result.success && result.transaction) {
      toast.success('Cash recorded', {
        description: `${result.transaction.receiptNo} · ${formatINR(result.transaction.amount)} · ${selected.name}`,
      })
      onClose()
    } else {
      toast.error('Could not record cash', { description: result.error })
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Collect Cash — {charge.name}</DialogTitle>
          <DialogDescription className="text-xs">
            Records a cash payment against this collection and issues a receipt. It appears in Transactions and the student&apos;s account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5">
          {/* Student block — selector or the preselected student */}
          {preselectedId && selected ? (
            <div className="flex items-center gap-2.5 rounded-lg bg-muted/40 px-2.5 py-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground">
                {initialsOf(selected.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{selected.name}</p>
                <p className="text-[9px] text-muted-foreground">{selected.className}</p>
              </div>
            </div>
          ) : (
            <div>
              <Label className="mb-1 block text-xs font-semibold" htmlFor="collect-cash-student">Student</Label>
              <select
                id="collect-cash-student"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                aria-label="Select student"
                className="h-9 w-full rounded-md border border-border bg-card px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="">Select student…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} · {s.className}</option>
                ))}
              </select>
              <FieldError show={submitted && studentMissing}>Select a student</FieldError>
            </div>
          )}

          {/* Amount */}
          <div>
            <Label className="mb-1 block text-xs font-semibold" htmlFor="collect-cash-amount">
              Amount {isCustom && <span className="text-muted-foreground font-normal">(suggested {formatINR(charge.amount)})</span>}
            </Label>
            <MoneyInput
              id="collect-cash-amount"
              value={amount}
              onChange={setAmount}
              className="h-9 text-xs"
              ariaLabel="Cash amount"
              placeholder={isCustom ? `e.g. ${charge.amount}` : undefined}
            />
            <FieldError show={submitted && amountMissing}>Required</FieldError>
            <FieldError show={submitted && amountInvalid}>Must be greater than ₹0</FieldError>
            {/* Soft warn — over-collecting beyond the student's outstanding */}
            {overOutstanding && (
              <p className="mt-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                {outstanding === 0
                  ? `This student has already paid ${formatINR(paidSoFar)} — confirm before recording more.`
                  : `More than the ${formatINR(outstanding)} outstanding for this student.`}
              </p>
            )}
          </div>

          {/* Fixed method row */}
          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-2">
            <Banknote className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-xs font-semibold">Cash</p>
              <p className="text-[10px] text-muted-foreground">verified by school office</p>
            </div>
          </div>

          {/* Optional note */}
          <div>
            <Label className="mb-1 block text-xs font-semibold" htmlFor="collect-cash-note">
              Note <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="collect-cash-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. receipt book no. / collected by class teacher"
              className="h-9 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5">
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            className="h-8 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
            disabled={submitted && !valid}
            onClick={submit}
          >
            <Banknote className="h-3 w-3" /> Record Cash
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Collect UPI / QR dialog (online rails → same collection) ──────────

function CollectUpiDialog({
  charge,
  app,
  txns,
  students,
  preselectedId,
  onClose,
}: {
  charge: AdditionalCharge
  app?: SchoolApplication
  txns: FeeTransaction[]
  students: StudentRecord[]
  preselectedId?: string
  onClose: () => void
}) {
  const recordPayment = useFeeStore((s) => s.recordPayment)
  const upiConfigs = useFeeStore((s) => s.upiQrConfigs)
  const activeUpi = upiConfigs.find((c) => c.status === 'active')
  const isCustom = charge.allowCustomAmount === true
  const [studentId, setStudentId] = useState(preselectedId ?? '')
  const [amount, setAmount] = useState<number | null>(isCustom ? null : charge.amount)
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const selected = students.find((s) => s.id === studentId) ?? null
  const paidSoFar = txns
    .filter((t) => t.studentId === studentId && (t.status === 'Success' || t.status === 'Under Verification'))
    .reduce((sum, t) => sum + t.amount, 0)
  const outstanding = Math.max(0, charge.amount - paidSoFar)

  const studentMissing = !selected
  const amountMissing = amount == null
  const amountInvalid = amount != null && amount <= 0
  const refMissing = reference.trim().length < 4
  const overOutstanding = !isCustom && amount != null && amount > outstanding && paidSoFar > 0
  const valid = !studentMissing && amount != null && amount > 0 && !refMissing

  const submit = () => {
    setSubmitted(true)
    if (!valid || !selected) return
    // ONE recordPayment call — mode UPI + additionalChargeId reconciles the
    // online payment into THIS collection automatically (Transactions,
    // student account and the linked application all read the same txn).
    const result = recordPayment({
      studentId: selected.id,
      amount,
      mode: 'UPI',
      referenceNo: reference.trim(),
      purpose: note.trim() ? `${charge.name} — ${note.trim()}` : charge.name,
      feeHead: app?.payment.feeHeadLabel ?? charge.name,
      collectedBy: 'Principal',
      additionalChargeId: charge.id,
      ...(app ? { applicationId: app.id } : {}),
    })
    if (result.success && result.transaction) {
      toast.success('UPI payment recorded', {
        description: `${result.transaction.receiptNo} · ${formatINR(result.transaction.amount)} · ${selected.name}`,
      })
      onClose()
    } else {
      toast.error('Could not record UPI payment', { description: result.error })
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Collect UPI / QR — {charge.name}</DialogTitle>
          <DialogDescription className="text-xs">
            Parent pays at the desk via UPI / QR; the reference number reconciles the payment into this same collection with a receipt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5">
          {/* Student block — selector or the preselected student */}
          {preselectedId && selected ? (
            <div className="flex items-center gap-2.5 rounded-lg bg-muted/40 px-2.5 py-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground">
                {initialsOf(selected.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{selected.name}</p>
                <p className="text-[9px] text-muted-foreground">{selected.className}</p>
              </div>
            </div>
          ) : (
            <div>
              <Label className="mb-1 block text-xs font-semibold" htmlFor="collect-upi-student">Student</Label>
              <select
                id="collect-upi-student"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                aria-label="Select student"
                className="h-9 w-full rounded-md border border-border bg-card px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="">Select student…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} · {s.className}</option>
                ))}
              </select>
              <FieldError show={submitted && studentMissing}>Select a student</FieldError>
            </div>
          )}

          {/* Amount */}
          <div>
            <Label className="mb-1 block text-xs font-semibold" htmlFor="collect-upi-amount">
              Amount {isCustom && <span className="text-muted-foreground font-normal">(suggested {formatINR(charge.amount)})</span>}
            </Label>
            <MoneyInput
              id="collect-upi-amount"
              value={amount}
              onChange={setAmount}
              className="h-9 text-xs"
              ariaLabel="UPI amount"
              placeholder={isCustom ? `e.g. ${charge.amount}` : undefined}
            />
            <FieldError show={submitted && amountMissing}>Required</FieldError>
            <FieldError show={submitted && amountInvalid}>Must be greater than ₹0</FieldError>
            {overOutstanding && (
              <p className="mt-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                {outstanding === 0
                  ? `This student has already paid ${formatINR(paidSoFar)} — confirm before recording more.`
                  : `More than the ${formatINR(outstanding)} outstanding for this student.`}
              </p>
            )}
          </div>

          {/* Active UPI / QR the parent scanned */}
          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-2">
            <QrCode className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            <div className="min-w-0">
              {activeUpi ? (
                <>
                  <p className="truncate text-xs font-semibold">{activeUpi.payeeName} · {activeUpi.upiId}</p>
                  <p className="text-[10px] text-muted-foreground">{activeUpi.name} — auto-reconciles on record</p>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold">No active UPI / QR configuration</p>
                  <p className="text-[10px] text-muted-foreground">Fee Management → Settings → Payment Collection</p>
                </>
              )}
            </div>
          </div>

          {/* UPI reference — required, unique per store idempotency rules */}
          <div>
            <Label className="mb-1 block text-xs font-semibold" htmlFor="collect-upi-ref">
              UPI Reference <span className="text-muted-foreground font-normal">(txn ID / VPA ref)</span>
            </Label>
            <Input
              id="collect-upi-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. 412345678901"
              className="h-9 font-mono text-xs"
              autoComplete="off"
            />
            <FieldError show={submitted && refMissing}>Reference required (min 4 chars)</FieldError>
          </div>

          {/* Optional note */}
          <div>
            <Label className="mb-1 block text-xs font-semibold" htmlFor="collect-upi-note">
              Note <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="collect-upi-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. paid by father via GPay"
              className="h-9 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5">
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            className="h-8 gap-1 bg-violet-600 text-xs text-white hover:bg-violet-700"
            disabled={submitted && !valid}
            onClick={submit}
          >
            <QrCode className="h-3 w-3" /> Record UPI Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Close Collection dialog ───────────────────────────────────────────

function CloseCollectionDialog({
  charge,
  collected,
  onClose,
}: {
  charge: AdditionalCharge
  collected: number
  onClose: () => void
}) {
  const closeAdditionalCharge = useFeeStore((s) => s.closeAdditionalCharge)
  const [note, setNote] = useState('')

  const submit = () => {
    const result = closeAdditionalCharge(charge.id, 'Principal', note.trim() || undefined)
    if (result.success) {
      toast.success('Collection closed', {
        description: `"${charge.name}" is complete — ${formatINR(collected)} collected stays on the permanent record.`,
      })
      onClose()
    } else {
      toast.error('Could not close collection', { description: result.error })
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Close “{charge.name}”</DialogTitle>
          <DialogDescription className="text-xs">
            Closing ends the collection window — students stop owing it and every recorded payment stays on the permanent record. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label className="mb-1 block text-xs font-semibold" htmlFor="close-collection-note">
            Closing note <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="close-collection-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. tour completed — all kits distributed"
            className="h-9 text-xs"
          />
        </div>
        <div className="flex items-center justify-end gap-1.5">
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onClose}>Keep Open</Button>
          <Button size="sm" className="h-8 text-xs" onClick={submit}>Close Collection</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── New Collection drawer (standalone collections — PART 3/4/31) ──────

function NewCollectionSheet({
  open,
  onClose,
  activeStudents,
}: {
  open: boolean
  onClose: () => void
  activeStudents: StudentRecord[]
}) {
  // Rendered as Sheet children → unmounted on close → fresh form state.
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 gap-0 flex flex-col">
        <NewCollectionForm onClose={onClose} activeStudents={activeStudents} />
      </SheetContent>
    </Sheet>
  )
}

function NewCollectionForm({
  onClose,
  activeStudents,
}: {
  onClose: () => void
  activeStudents: StudentRecord[]
}) {
  const createAdditionalCharge = useFeeStore((s) => s.createAdditionalCharge)
  const catalogue = useSchoolSettingsStore((s) => s.fees.feeHeads)
  const templates = catalogue.filter((h) => deriveFeeHeadKind(h) === 'ADDITIONAL' && !h.archived)

  const [name, setName] = useState('')
  const [category, setCategory] = useState<AdditionalChargeCategory>('Tour')
  const [amount, setAmount] = useState<number | null>(null)
  const [allowCustomAmount, setAllowCustomAmount] = useState(false)
  const [targetAmount, setTargetAmount] = useState<number | null>(null)
  const [classIds, setClassIds] = useState<string[]>([])
  const [dueDate, setDueDate] = useState('')
  const [mandatory, setMandatory] = useState(false)
  const [reference, setReference] = useState('')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const isCustom = category === 'Donation' && allowCustomAmount

  // All class ids sharing a chip name — stream variants (Class 11 PCM/PCB)
  // collapse into a single chip, so picking it must toggle BOTH ids.
  const idsForClassName = (chipName: string) => ACADEMIC_CLASSES.filter((c) => c.name === chipName).map((c) => c.id)

  const trimmedName = name.trim()

  const pickCategory = (value: AdditionalChargeCategory) => {
    setCategory(value)
    if (value !== 'Donation') {
      setAllowCustomAmount(false)
      setTargetAmount(null)
    }
  }

  const pickTemplate = (templateId: string) => {
    const t = templates.find((x) => x.id === templateId)
    if (!t) return
    setName(t.name)
    setAmount(t.defaultAmount)
    const byCategory = CHARGE_CATEGORIES.find((c) => t.name.toLowerCase().includes(c.value.toLowerCase()))
    if (byCategory) pickCategory(byCategory.value)
  }

  // Validation (spec §4): on submit, inline red hints under missing fields.
  const nameMissing = trimmedName.length === 0
  const classesMissing = classIds.length === 0
  const dueMissing = dueDate === ''
  const amountMissing = !isCustom && amount == null
  const amountInvalid = !isCustom && amount != null && amount <= 0
  const valid = !nameMissing && !classesMissing && !dueMissing && !amountMissing && !amountInvalid

  // Live expected preview.
  const previewStudents = activeStudents.filter((s) => classIds.includes(s.classId)).length

  const submit = () => {
    setSubmitted(true)
    if (!valid) return
    const result = createAdditionalCharge({
      name: trimmedName,
      category,
      amount: amount ?? 0,
      academicYear: CURRENT_ACADEMIC_YEAR,
      applicableClassIds: classIds,
      dueDate,
      mandatory,
      ...(isCustom ? { allowCustomAmount: true, ...(targetAmount ? { targetAmount } : {}) } : {}),
      ...(reference.trim() ? { reference: reference.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
    })
    if (result.success) {
      toast.success('Collection created', {
        description: isCustom
          ? `"${trimmedName}" is open for contributions${targetAmount ? ` (target ${formatINR(targetAmount)})` : ''} — every contribution is receipted.`
          : `"${trimmedName}" (${formatINR(amount ?? 0)} per student) now applies to the selected classes. The annual fee structures are unchanged.`,
      })
      onClose()
    } else {
      toast.error('Could not create collection', { description: result.error })
    }
  }

  return (
    <>
      <SheetHeader className="space-y-0 border-b border-border/60 px-4 pb-3 pt-4 text-left">
        <SheetTitle className="text-sm font-bold">New Collection</SheetTitle>
        <SheetDescription className="mt-0.5 text-[10px] text-muted-foreground">
          A standalone collection — tours, workshops, donations — tracked separately from the annual fee structures. Application-linked collections are created from Applications &amp; Forms.
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-3">
          {/* Templates (settings ADDITIONAL fee-head catalogue) */}
          {templates.length > 0 && !trimmedName && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-muted-foreground">Start from a template:</span>
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => pickTemplate(t.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] transition-colors hover:border-violet-500/40 hover:bg-violet-500/5"
                >
                  {t.name} · {formatINR(t.defaultAmount, true)}
                </button>
              ))}
            </div>
          )}

          {/* Name */}
          <div>
            <Label className="mb-1 block text-xs font-semibold" htmlFor="new-collection-name">Collection Name</Label>
            <Input
              id="new-collection-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Educational Tour — Jaipur"
              className="h-9 text-xs"
              autoFocus
            />
            <FieldError show={submitted && nameMissing}>Required</FieldError>
          </div>

          {/* Category chips */}
          <div>
            <Label className="mb-1 block text-xs font-semibold">Category</Label>
            <div className="flex items-center gap-1 flex-wrap">
              {CHARGE_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => pickCategory(c.value)}
                  aria-pressed={category === c.value}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md border px-1.5 py-1 text-[10px] transition-colors',
                    category === c.value
                      ? 'border-violet-500/50 bg-violet-500/10 text-violet-700 dark:text-violet-300'
                      : 'border-border bg-card text-muted-foreground hover:border-violet-500/30',
                  )}
                >
                  <c.icon className="h-3 w-3" /> {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount per student (+ custom-amount option for donations) */}
          <div>
            <Label className="mb-1 block text-xs font-semibold" htmlFor="new-collection-amount">
              {isCustom ? 'Suggested Amount (₹)' : <>Amount per Student (₹) <span className="text-rose-500">*</span></>}
            </Label>
            <MoneyInput
              id="new-collection-amount"
              value={amount}
              onChange={setAmount}
              className="h-9 text-xs"
              ariaLabel="Amount per student"
              placeholder={isCustom ? 'Optional suggested amount' : undefined}
            />
            <FieldError show={submitted && amountMissing}>Required</FieldError>
            <FieldError show={submitted && amountInvalid}>Must be greater than ₹0</FieldError>
          </div>

          {category === 'Donation' && (
            <div>
              <label className="flex cursor-pointer select-none items-center justify-between gap-2 rounded-lg border border-border/60 px-2.5 py-2">
                <span className="min-w-0">
                  <span className="block text-xs font-semibold">Payers choose their own amount</span>
                  <span className="block text-[10px] text-muted-foreground">Donation-style — any contribution is receipted individually</span>
                </span>
                <Switch
                  checked={allowCustomAmount}
                  onCheckedChange={setAllowCustomAmount}
                  aria-label="Allow payers to choose their own amount"
                />
              </label>
              {allowCustomAmount && (
                <div className="mt-2">
                  <Label className="mb-1 block text-xs font-semibold" htmlFor="new-collection-target">
                    Overall Target (₹) <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <MoneyInput
                    id="new-collection-target"
                    value={targetAmount}
                    onChange={setTargetAmount}
                    className="h-9 text-xs"
                    ariaLabel="Overall collection target"
                    placeholder="No target"
                  />
                </div>
              )}
            </div>
          )}

          {/* Applicable classes */}
          <div>
            <Label className="mb-1 block text-xs font-semibold">
              Applicable Classes <span className="text-rose-500">*</span>
            </Label>
            <div className="flex items-center gap-1 flex-wrap">
              {UNIQUE_CLASSES.map((c) => {
                const ids = idsForClassName(c.name)
                const selected = ids.length > 0 && ids.every((id) => classIds.includes(id))
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setClassIds((prev) => {
                      const all = idsForClassName(c.name)
                      const allSelected = all.every((id) => prev.includes(id))
                      return allSelected ? prev.filter((id) => !all.includes(id)) : Array.from(new Set([...prev, ...all]))
                    })}
                    aria-pressed={selected}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] transition-colors',
                      selected
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'border-border bg-card text-muted-foreground hover:border-emerald-500/30',
                    )}
                  >
                    {selected && <Check className="h-2.5 w-2.5" />}
                    {c.name}
                  </button>
                )
              })}
            </div>
            <FieldError show={submitted && classesMissing}>Select at least one class</FieldError>
          </div>

          {/* Due date + mandatory */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block text-xs font-semibold" htmlFor="new-collection-due-date">
                Due Date <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="new-collection-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 text-xs"
              />
              <FieldError show={submitted && dueMissing}>Required</FieldError>
            </div>
            <div className="flex items-end pb-1.5">
              <label className="inline-flex cursor-pointer select-none items-center gap-2 text-[11px]">
                <Switch checked={mandatory} onCheckedChange={setMandatory} aria-label="Mandatory for all students" />
                {mandatory ? 'Mandatory for all' : 'Optional (student may opt out)'}
              </label>
            </div>
          </div>

          {/* Reference */}
          <div>
            <Label className="mb-1 block text-xs font-semibold" htmlFor="new-collection-reference">
              Event / Reference <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="new-collection-reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. Jaipur Educational Tour 2026"
              className="h-9 text-xs"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="mb-1 block text-xs font-semibold" htmlFor="new-collection-description">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="new-collection-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this collection for? Shown to parents."
              className="min-h-[44px] resize-none text-xs"
            />
          </div>

          {/* Live expected preview */}
          <div className="rounded-lg bg-muted/40 px-2.5 py-2 text-[10px] text-muted-foreground">
            {isCustom
              ? targetAmount
                ? <>Custom amounts · target {formatINR(targetAmount)}</>
                : 'Custom amounts · no fixed target'
              : (
                  <>
                    {previewStudents} student{previewStudents === 1 ? '' : 's'} × {formatINR(amount ?? 0)} ={' '}
                    <span className="font-semibold text-foreground tabular-nums">{formatINR((amount ?? 0) * previewStudents)}</span> expected
                  </>
                )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-1.5 border-t border-border/60 px-4 py-3">
        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onClose}>Cancel</Button>
        <Button
          size="sm"
          className="h-8 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
          disabled={!valid}
          onClick={submit}
        >
          <Check className="h-3 w-3" /> Create Collection
        </Button>
      </div>
    </>
  )
}

// ─── Record File drawer (Closed + Cancelled — PART 29) ─────────────────

function RecordFileSheet({
  open,
  onClose,
  charges,
  facts,
  onOpen,
}: {
  open: boolean
  onClose: () => void
  charges: AdditionalCharge[]
  facts: Map<string, ChargeFacts>
  onOpen: (id: string) => void
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 gap-0 flex flex-col">
        <SheetHeader className="space-y-0 border-b border-border/60 px-4 pb-3 pt-4 text-left">
          <SheetTitle className="text-sm font-bold">Record File</SheetTitle>
          <SheetDescription className="mt-0.5 text-[10px] text-muted-foreground">
            Closed and cancelled collections — the permanent financial record.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          {charges.length > 0 ? (
            <div className="divide-y divide-border">
              {charges.map((c) => {
                const f = facts.get(c.id)
                const txnCount = f?.txns.length ?? 0
                const noteLine = c.status === 'Closed' ? c.closeNote : c.cancelReason
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onOpen(c.id)}
                    className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/30"
                  >
                    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', categoryTone(c.category))}>
                      <CategoryIcon category={c.category} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className={cn('truncate text-xs font-semibold', c.status === 'Cancelled' && 'text-muted-foreground line-through')}>{c.name}</p>
                        <StatusChip status={c.status} />
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                        {formatINR(f?.collected ?? 0)} collected · {txnCount} payment{txnCount === 1 ? '' : 's'}
                        {c.status === 'Closed' && c.closedAt ? ` · Closed ${formatDate(c.closedAt)}` : ''}
                        {c.status === 'Cancelled' ? ` · due ${formatDate(c.dueDate)}` : ''}
                      </p>
                      {noteLine && <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{noteLine}</p>}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <FeeEmptyState
              icon={<Archive className="h-6 w-6" />}
              title="No past collections yet"
              description="Closed and cancelled collections are archived here with their complete payment history."
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
