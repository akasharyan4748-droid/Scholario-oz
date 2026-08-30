'use client'

/**
 * fees-additional-charges — Additional Collections (Payments page).
 *
 * FINAL SPEC (§2): Additional Collections is NOT a payment-collection
 * management area. It is a READ-ONLY status surface:
 *
 *   • NO "New Collection", NO "Record File", NO Collect Cash / Collect
 *     UPI / Close / Cancel controls — ALL creation, application, forms,
 *     registration and related workflow belongs to Applications & Forms
 *     (application-linked charges are generated when a paid form is
 *     published there). This module never duplicates that workflow.
 *   • The panel ONLY shows the payment status/update for each existing
 *     additional collection: name · expected amount · amount collected ·
 *     number of students/payments received · progress/status.
 *   • Opening a collection simply shows the STUDENTS and their payment
 *     details/status, plus the bound payments.
 *
 * Every collection is either:
 *   • APPLICATION-LINKED — generated when an Applications & Forms form with
 *     a payment config was published (reverse-lookup: the SchoolApplication
 *     whose payment.chargeId === charge.id → "via Application · title"); or
 *   • STANDALONE — created from Applications & Forms / earlier workflow
 *     (donations, relief funds…).
 *
 * Money flow (read-only here): payments against a charge are recorded by
 * the ONE canonical flow (fee-store recordPayment with additionalChargeId)
 * — they appear in Transactions, the student account and the application
 * record automatically. This surface only READS those transactions.
 */

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  Bus, FlaskConical, Trophy, Tent, CalendarDays, Package, Tag, HandHeart,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  useFeeStore, useFeeData,
  type AdditionalCharge, type AdditionalChargeCategory, type FeeTransaction,
} from '@/lib/store/fee-store'
import { useApplicationsStore, type SchoolApplication } from '@/lib/store/applications-store'
import { useStudentsStore, type StudentRecord } from '@/lib/store/students-store'
import { ACADEMIC_CLASSES } from '@/lib/mock/academic/classes'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { FeeEmptyState, FeeStatusBadge } from './fees-shared'
import { Panel } from '../shared/panel'

// ─── Category meta ─────────────────────────────────────────────────────

const CHARGE_CATEGORIES: Array<{ value: AdditionalChargeCategory; icon: LucideIcon }> = [
  { value: 'Tour', icon: Bus },
  { value: 'Workshop', icon: FlaskConical },
  { value: 'Competition', icon: Trophy },
  { value: 'Camp', icon: Tent },
  { value: 'Event', icon: CalendarDays },
  { value: 'Material', icon: Package },
  { value: 'Donation', icon: HandHeart },
  { value: 'Other', icon: Tag },
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

/** Per-charge roll-up used by rows and the detail drawer. */
interface ChargeFacts {
  /** Scoped (eligible) student count. */
  students: number
  /** Success + Under Verification money bound to the charge. */
  collected: number
  /** students × amount — or targetAmount for custom-amount drives (0 = open). */
  expected: number
  /** null when there is no denominator (open-amount drive). */
  pct: number | null
  /** ALL bound transactions (Payments tab). */
  txns: FeeTransaction[]
}

const EMPTY_FACTS: ChargeFacts = { students: 0, collected: 0, expected: 0, pct: null, txns: [] }

// ─── Section ───────────────────────────────────────────────────────────

export function FeesAdditionalCharges({ data }: { data: ReturnType<typeof useFeeData> }) {
  const { additionalCharges, transactions } = data
  const students = useStudentsStore((s) => s.students)
  const applications = useApplicationsStore((s) => s.applications)

  const [detailId, setDetailId] = useState<string | null>(null)

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

  // Status-only list — open collections first (the actionable surface),
  // then closed/cancelled ones with their status chip (permanent record).
  const orderedCharges = useMemo(() => {
    const rank = (c: AdditionalCharge) => (c.status === 'Active' ? 0 : 1)
    return [...additionalCharges].sort(
      (a, b) => rank(a) - rank(b) || a.dueDate.localeCompare(b.dueDate),
    )
  }, [additionalCharges])

  const detailCharge = detailId ? additionalCharges.find((c) => c.id === detailId) ?? null : null

  return (
    <>
      <Panel
        title={
          <span className="inline-flex items-center gap-2">
            Additional Collections
            <Badge variant="outline" className="text-[9px] h-4 px-1.5">
              {additionalCharges.filter((c) => c.status === 'Active').length}
            </Badge>
          </span>
        }
        subtitle="Event and other non-annual collections · created from Applications & Forms."
        bodyClassName="p-0"
      >
        {orderedCharges.length > 0 ? (
          <div className="divide-y divide-border">
            {orderedCharges.map((c) => {
              const f = facts.get(c.id) ?? EMPTY_FACTS
              const app = appByChargeId.get(c.id)
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                  <button
                    type="button"
                    onClick={() => setDetailId(c.id)}
                    className="w-full flex items-start justify-between gap-3 px-4 py-2.5 text-left hover:bg-muted/30 transition-colors"
                    aria-label={`Open ${c.name} payment status`}
                  >
                    {/* Left — category icon chip + name + chips + meta line */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', categoryTone(c.category))}>
                        <CategoryIcon category={c.category} className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className={cn('text-xs font-semibold truncate', c.status !== 'Active' && 'text-muted-foreground')}>{c.name}</p>
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

                    {/* Right — labelled figures, progress, status */}
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
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {f.txns.length} payment{f.txns.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  </button>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <FeeEmptyState
            icon={<CalendarDays className="h-6 w-6" />}
            title="No additional collections"
            description="Collections are generated from Applications & Forms when a paid form is published — they appear here with their live payment status."
          />
        )}
      </Panel>

      {/* Collection status drawer (read-only — spec §2) */}
      {detailCharge && (
        <CollectionStatusSheet
          charge={detailCharge}
          facts={facts.get(detailCharge.id) ?? EMPTY_FACTS}
          app={appByChargeId.get(detailCharge.id)}
          activeStudents={activeStudents}
          onClose={() => setDetailId(null)}
        />
      )}
    </>
  )
}

// ─── Collection status drawer (read-only) ──────────────────────────────

type DetailTab = 'students' | 'payments'

const DETAIL_TABS: Array<{ value: DetailTab; label: string }> = [
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

function CollectionStatusSheet({
  charge,
  facts,
  app,
  activeStudents,
  onClose,
}: {
  charge: AdditionalCharge
  facts: ChargeFacts
  app?: SchoolApplication
  activeStudents: StudentRecord[]
  onClose: () => void
}) {
  const [tab, setTab] = useState<DetailTab>('students')

  const isCustom = charge.allowCustomAmount === true
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

  // Compact meta rows — record context without a separate management tab.
  const metaRows: Array<{ label: string; value: string }> = []
  if (charge.description) metaRows.push({ label: 'Description', value: charge.description })
  if (charge.reference) metaRows.push({ label: 'Reference', value: charge.reference })
  metaRows.push({
    label: 'Created by',
    value: `${charge.createdBy}${charge.createdAt ? ` · ${formatDate(charge.createdAt)}` : ''}`,
  })
  metaRows.push({ label: 'Session', value: charge.academicYear })
  metaRows.push({ label: 'Due date', value: formatDate(charge.dueDate) })
  if (charge.status === 'Closed') {
    metaRows.push({
      label: 'Closed',
      value: `${charge.closedAt ? formatDate(charge.closedAt) : '—'}${charge.closeNote ? ` — ${charge.closeNote}` : ''}`,
    })
  }
  if (charge.status === 'Cancelled') {
    metaRows.push({ label: 'Cancelled', value: charge.cancelReason ?? 'No reason recorded' })
  }

  const expectedDisplay = isCustom
    ? charge.targetAmount && charge.targetAmount > 0 ? formatINR(charge.targetAmount) : 'Open'
    : formatINR(facts.expected)
  const pendingDisplay = facts.expected > 0
    ? formatINR(Math.max(0, facts.expected - facts.collected))
    : isCustom ? '—' : formatINR(0)

  return (
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

        {/* Summary strip — 4 labelled mini tiles + progress */}
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
                        <p className="text-[9px] text-muted-foreground">{s.className}{paid > 0 ? ` · paid ${formatINR(paid)}` : ''}</p>
                      </div>
                      {isPaid ? (
                        <MiniChip className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">Paid</MiniChip>
                      ) : st?.verifying ? (
                        <MiniChip className="bg-amber-500/10 text-amber-700 dark:text-amber-300">Verifying</MiniChip>
                      ) : (
                        <MiniChip className="bg-muted text-muted-foreground">Not paid</MiniChip>
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

          {/* Record context — quiet meta block below the tab content */}
          {metaRows.length > 0 && (
            <div className="mt-4 rounded-lg bg-muted/30 px-3 py-2.5">
              <div className="divide-y divide-border/40">
                {metaRows.map((r) => (
                  <div key={r.label} className="py-1.5 first:pt-0 last:pb-0">
                    <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">{r.label}</p>
                    <p className="mt-0.5 break-words text-[11px] font-medium">{r.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
