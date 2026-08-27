'use client'

/**
 * fees-additional-charges — Additional Charges management (Payments page).
 *
 * ADDITIONAL CHARGES are event-based / special financial obligations that
 * exist INDEPENDENTLY of the standard annual class fee structures:
 *   Educational Tour · Workshop · Competition · Camp · special material…
 *
 * The workflow (spec Part 9):
 *   Create Additional Charge → Select class/students → Set amount/due date
 *   → Collect payment (bound to the charge) → Track separately.
 * The annual fee structure is NEVER modified.
 *
 * This panel lives on the Payments page (operations). Presentation follows
 * the Salary & Payroll benchmark: ONE Panel ("Additional Charges", action =
 * the "+ New Charge" toggler) with a full-bleed divide-y row list — each row
 * = category icon chip + name (+ mandatory/optional mini-chip) | applies-to
 * classes + due date | per-student amount + live collection progress bar +
 * collected/expected mono readout + Manage expansion + Cancel ghost.
 * Cancelled charges collapse into a compact <details> history below the rows.
 *
 * Each charge shows live collected progress computed from transactions bound
 * to it; the Principal can soft-cancel a charge (historical payments
 * preserved). The creation form stays functionally identical, with its
 * paddings/labels aligned to the benchmark (h-9 inputs, text-xs labels).
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Bus, FlaskConical, Trophy, Tent, CalendarDays, Package, Tag,
  X, Check, Ban, Settings2, type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  useFeeStore, useFeeData, CURRENT_ACADEMIC_YEAR, type AdditionalChargeCategory,
} from '@/lib/store/fee-store'
import { useStudentsStore } from '@/lib/store/students-store'
import { deriveFeeHeadKind, useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { ACADEMIC_CLASSES } from '@/lib/mock/academic/classes'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { MoneyInput } from './money-input'
import { FeeEmptyState } from './fees-shared'
import { Panel } from '../shared/panel'

/** Class chips for the creation form — stream variants (Class 11 PCM/PCB)
 *  collapse into one chip so the Principal never sees duplicates. Picking a
 *  collapsed name selects the FIRST canonical class with that name; stream
 *  scoping is rarely needed for event-based charges. */
const UNIQUE_CLASSES = (() => {
  const seen = new Set<string>()
  return ACADEMIC_CLASSES.filter((c) => {
    if (seen.has(c.name)) return false
    seen.add(c.name)
    return true
  })
})()

// ─── Charge category meta ──────────────────────────────────────────────

const CHARGE_CATEGORIES: Array<{ value: AdditionalChargeCategory; label: string; icon: LucideIcon }> = [
  { value: 'Tour', label: 'Tour / Trip', icon: Bus },
  { value: 'Workshop', label: 'Workshop', icon: FlaskConical },
  { value: 'Competition', label: 'Competition', icon: Trophy },
  { value: 'Camp', label: 'Camp', icon: Tent },
  { value: 'Event', label: 'Event', icon: CalendarDays },
  { value: 'Material', label: 'Material', icon: Package },
  { value: 'Other', label: 'Other', icon: Tag },
]

function categoryIcon(category: string): LucideIcon {
  return CHARGE_CATEGORIES.find((c) => c.value === category)?.icon ?? Tag
}

// ─── Section ────────────────────────────────────────────────────────────

export function FeesAdditionalCharges({ data }: { data: ReturnType<typeof useFeeData> }) {
  const { additionalCharges, transactions } = data
  const students = useStudentsStore((s) => s.students)
  const createAdditionalCharge = useFeeStore((s) => s.createAdditionalCharge)
  const cancelAdditionalCharge = useFeeStore((s) => s.cancelAdditionalCharge)
  const [creating, setCreating] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const activeStudents = useMemo(() => students.filter((s) => s.status === 'Active'), [students])

  // Per-charge roll-up: how many students it applies to + how much money
  // has been collected against it (transactions bound via additionalChargeId).
  const chargeStats = useMemo(() => {
    const stats = new Map<string, { students: number; collected: number; expected: number }>()
    for (const c of additionalCharges) {
      const appliesTo = c.studentIds && c.studentIds.length > 0
        ? activeStudents.filter((s) => c.studentIds!.includes(s.id)).length
        : activeStudents.filter((s) => {
            const sid = s.classId
            return sid != null && c.applicableClassIds.includes(sid)
          }).length
      const collected = transactions
        .filter((t) => t.additionalChargeId === c.id && (t.status === 'Success' || t.status === 'Under Verification'))
        .reduce((sum, t) => sum + t.amount, 0)
      stats.set(c.id, { students: appliesTo, collected, expected: appliesTo * c.amount })
    }
    return stats
  }, [additionalCharges, transactions, activeStudents])

  const activeCharges = additionalCharges.filter((c) => c.status === 'Active')
  const cancelledCharges = additionalCharges.filter((c) => c.status === 'Cancelled')

  // Existing handler — window.prompt cancel flow REUSED verbatim (soft
  // cancel; already-collected payments stay on record).
  const handleCancel = (chargeId: string, name: string) => {
    const reason = window.prompt(`Cancel "${name}"?\n\nStudents stop owing this charge. Already-collected payments stay on record.`)
    if (reason === null) return
    const result = cancelAdditionalCharge(chargeId, 'Principal', reason.trim() || undefined)
    if (result.success) {
      toast.info('Charge cancelled', { description: `"${name}" removed from student balances. Payments on record are preserved.` })
    } else {
      toast.error('Could not cancel', { description: result.error })
    }
  }

  return (
    <Panel
      title={
        <span className="inline-flex items-center gap-2">
          Additional Charges
          <Badge variant="outline" className="text-[9px] h-4 px-1.5">{activeCharges.length}</Badge>
        </span>
      }
      subtitle="Event-based collections (tours, workshops) — separate from the annual fee structure."
      action={
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs gap-1.5 shrink-0"
          onClick={() => setCreating((v) => !v)}
          aria-expanded={creating}
        >
          <Plus className="h-3.5 w-3.5" /> New Charge
        </Button>
      }
      bodyClassName="p-0"
    >
      {/* Creation form — unchanged logic, benchmark paddings */}
      <AnimatePresence>
        {creating && (
          <NewAdditionalChargeForm
            onCancel={() => setCreating(false)}
            onCreated={() => setCreating(false)}
            createAdditionalCharge={createAdditionalCharge}
          />
        )}
      </AnimatePresence>

      {/* Active charge rows — full-bleed divide-y list */}
      {activeCharges.length > 0 ? (
        <div className={cn('divide-y divide-border', creating && 'border-t border-border/50')}>
          {activeCharges.map((c) => {
            const stats = chargeStats.get(c.id) ?? { students: 0, collected: 0, expected: 0 }
            const pct = stats.expected > 0 ? Math.min(100, Math.round((stats.collected / stats.expected) * 100)) : 0
            const Icon = categoryIcon(c.category)
            const expanded = expandedId === c.id
            const outstanding = Math.max(0, stats.expected - stats.collected)
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-start justify-between gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                  {/* Left — category icon chip + name + mandatory mini-chip */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-xs font-semibold truncate">{c.name}</p>
                        <span
                          className={cn(
                            'inline-flex shrink-0 items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap',
                            c.mandatory
                              ? 'bg-slate-500/10 text-slate-600 dark:text-slate-300'
                              : 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
                          )}
                        >
                          {c.mandatory ? 'Mandatory' : 'Optional'}
                        </span>
                      </div>
                      {/* Middle line — scope + due date */}
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        <span className="font-medium">{c.category}</span>
                        {' · '}{classLabels(c.applicableClassIds)}
                        {' · '}due {formatDate(c.dueDate)}
                        {' · '}{stats.students} student{stats.students === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>

                  {/* Right — amount, progress, actions */}
                  <div className="shrink-0 w-32 sm:w-40 text-right">
                    <p className="text-sm font-bold tabular-nums leading-tight">
                      {formatINR(c.amount)}
                      <span className="ml-1 hidden sm:inline text-[9px] font-normal text-muted-foreground">/student</span>
                    </p>
                    {/* Collection progress */}
                    <div aria-hidden className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full rounded-full bg-emerald-500"
                      />
                    </div>
                    <p className="mt-1 font-mono text-[9px] text-muted-foreground tabular-nums truncate">
                      {formatINR(stats.collected, true)} / {formatINR(stats.expected, true)} · {pct}%
                    </p>
                    <div className="mt-1 flex items-center justify-end gap-1">
                      {/* Manage — expands the charge detail block below the row */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded-md text-muted-foreground hover:bg-muted"
                        aria-label={`Manage "${c.name}"`}
                        aria-expanded={expanded}
                        title="Details"
                        onClick={() => setExpandedId(expanded ? null : c.id)}
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                      </Button>
                      {/* Cancel — danger ghost; window.prompt flow reused */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[10px] gap-1 text-rose-600 hover:bg-rose-500/10 hover:text-rose-600"
                        aria-label={`Cancel "${c.name}" charge`}
                        onClick={() => handleCancel(c.id, c.name)}
                      >
                        <Ban className="h-3 w-3" /> Cancel
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded manage detail — reference/description/roll-up */}
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <dl className="mx-4 mb-2.5 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 rounded-lg border border-violet-500/25 bg-violet-500/[0.04] px-3 py-2.5 text-[10px]">
                        <div className="min-w-0">
                          <dt className="text-muted-foreground inline">Category · </dt>
                          <dd className="font-medium inline">{c.category}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-muted-foreground inline">Scope · </dt>
                          <dd className="font-medium inline truncate">
                            {c.studentIds && c.studentIds.length > 0 ? `${c.studentIds.length} named student${c.studentIds.length === 1 ? '' : 's'}` : `${classLabels(c.applicableClassIds)} (all)`}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-muted-foreground inline">Expected · </dt>
                          <dd className="font-medium tabular-nums inline">{formatINR(stats.expected, true)}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-muted-foreground inline">Outstanding · </dt>
                          <dd className="font-medium tabular-nums inline">{formatINR(outstanding, true)}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-muted-foreground inline">Reference · </dt>
                          <dd className="font-medium font-mono inline truncate">{c.reference ?? '—'}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-muted-foreground inline">Created · </dt>
                          <dd className="font-medium inline truncate">{c.createdBy}{c.createdAt ? ` · ${formatDate(c.createdAt)}` : ''}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-muted-foreground inline">Session · </dt>
                          <dd className="font-medium inline">{c.academicYear}</dd>
                        </div>
                        {c.description && (
                          <div className="col-span-2 sm:col-span-4 min-w-0">
                            <dt className="text-muted-foreground inline">Description · </dt>
                            <dd className="font-medium inline">{c.description}</dd>
                          </div>
                        )}
                      </dl>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      ) : (
        !creating && (
          <FeeEmptyState
            icon={<CalendarDays className="h-6 w-6" />}
            title="No additional charges"
            description="Create one when the school organizes a tour, workshop, or special collection — the annual fee structure stays untouched."
          />
        )
      )}

      {/* Cancelled charges — compact collapsible history (no delete action;
          soft-cancelled records and their payments are permanent audit) */}
      {cancelledCharges.length > 0 && (
        <div className="px-4 pb-3">
          <details className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
            <summary className="cursor-pointer select-none text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors [&::-webkit-details-marker]:hidden list-none">
              Cancelled ({cancelledCharges.length})
              <span className="font-normal"> · payments preserved</span>
            </summary>
            <div className="mt-2 divide-y divide-border/60">
              {cancelledCharges.map((c) => {
                const stats = chargeStats.get(c.id) ?? { students: 0, collected: 0, expected: 0 }
                return (
                  <div key={c.id} className="flex items-center justify-between gap-2 py-1.5 text-[11px] first:pt-0 last:pb-0">
                    <span className="truncate line-through text-muted-foreground">{c.name}</span>
                    <span className="text-[9px] text-muted-foreground shrink-0 tabular-nums">
                      {formatINR(stats.collected, true)} collected · {formatDate(c.dueDate)}
                    </span>
                  </div>
                )
              })}
            </div>
          </details>
        </div>
      )}
    </Panel>
  )
}

function classLabels(classIds: string[]): string {
  const names = classIds.map((id) => ACADEMIC_CLASSES.find((c) => c.id === id)?.name ?? id)
  if (names.length === 0) return 'No classes'
  if (names.length <= 3) return names.join(', ')
  return `${names.slice(0, 3).join(', ')} +${names.length - 3}`
}

// ─── Creation form (logic identical; paddings aligned to benchmark) ─────

function NewAdditionalChargeForm({
  onCancel,
  onCreated,
  createAdditionalCharge,
}: {
  onCancel: () => void
  onCreated: () => void
  createAdditionalCharge: ReturnType<typeof useFeeStore.getState>['createAdditionalCharge']
}) {
  const catalogue = useSchoolSettingsStore((s) => s.fees.feeHeads)
  const templates = catalogue.filter((h) => deriveFeeHeadKind(h) === 'ADDITIONAL' && !h.archived)

  const [name, setName] = useState('')
  const [category, setCategory] = useState<AdditionalChargeCategory>('Tour')
  const [amount, setAmount] = useState<number | null>(null)
  const [classIds, setClassIds] = useState<string[]>([])
  const [dueDate, setDueDate] = useState('')
  const [mandatory, setMandatory] = useState(false)
  const [reference, setReference] = useState('')
  const [description, setDescription] = useState('')

  // All class ids sharing a chip name — stream variants (Class 11 PCM/PCB)
  // collapse into a single chip, so picking it must toggle BOTH ids.
  const idsForClassName = (name: string) => ACADEMIC_CLASSES.filter((c) => c.name === name).map((c) => c.id)

  const trimmedName = name.trim()
  const valid = trimmedName.length > 0 && amount != null && amount > 0 && classIds.length > 0 && dueDate !== ''

  const pickTemplate = (templateId: string) => {
    const t = templates.find((x) => x.id === templateId)
    if (!t) return
    setName(t.name)
    setAmount(t.defaultAmount)
    const byCategory = CHARGE_CATEGORIES.find((c) => t.name.toLowerCase().includes(c.value.toLowerCase()))
    if (byCategory) setCategory(byCategory.value)
  }

  const submit = () => {
    if (!valid) return
    const result = createAdditionalCharge({
      name: trimmedName,
      category,
      amount: amount ?? 0,
      academicYear: CURRENT_ACADEMIC_YEAR,
      applicableClassIds: classIds,
      dueDate,
      mandatory,
      ...(reference.trim() ? { reference: reference.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
    })
    if (result.success) {
      toast.success('Additional charge created', {
        description: `"${trimmedName}" (${formatINR(amount ?? 0)} per student) now applies to the selected classes. The annual fee structures are unchanged.`,
      })
      onCreated()
    } else {
      toast.error('Could not create charge', { description: result.error })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-violet-500/30 bg-violet-500/[0.04] mx-4 mt-4 mb-3 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New Additional Charge
          </p>
          <p className="text-[10px] text-muted-foreground hidden sm:block">
            Something extra the school is collecting — never part of the annual fee structure
          </p>
        </div>

        {/* Templates */}
        {templates.length > 0 && !trimmedName && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground">Start from a template:</span>
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => pickTemplate(t.id)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors"
              >
                {t.name} · {formatINR(t.defaultAmount, true)}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="sm:col-span-2">
            <Label className="text-xs font-semibold mb-1 block">Charge Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Educational Tour — Jaipur"
              className="h-9 text-xs"
              autoFocus
            />
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1 block">Category</Label>
            <div className="flex items-center gap-1 flex-wrap">
              {CHARGE_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md border px-1.5 py-1 text-[10px] transition-colors',
                    category === c.value
                      ? 'border-violet-500/50 bg-violet-500/10 text-violet-700 dark:text-violet-300'
                      : 'border-border bg-card text-muted-foreground hover:border-violet-500/30',
                  )}
                  aria-pressed={category === c.value}
                >
                  <c.icon className="h-3 w-3" /> {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1 block">Amount per Student (₹)</Label>
            <MoneyInput value={amount} onChange={setAmount} className="h-9 text-xs" ariaLabel="Amount per student" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs font-semibold mb-1 block">
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
                      const ids = idsForClassName(c.name)
                      const selected = ids.every((id) => prev.includes(id))
                      return selected ? prev.filter((id) => !ids.includes(id)) : Array.from(new Set([...prev, ...ids]))
                    })}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] transition-colors',
                      selected
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'border-border bg-card text-muted-foreground hover:border-emerald-500/30',
                    )}
                    aria-pressed={selected}
                  >
                    {selected && <Check className="h-2.5 w-2.5" />}
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1 block" htmlFor="additional-charge-due-date">
              Due Date <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="additional-charge-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="flex items-end pb-1.5">
            <label className="inline-flex items-center gap-2 text-[11px] cursor-pointer select-none">
              <Switch checked={mandatory} onCheckedChange={setMandatory} />
              {mandatory ? 'Mandatory for all' : 'Optional (student may opt out)'}
            </label>
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1 block" htmlFor="additional-charge-reference">
              Event / Reference <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="additional-charge-reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. Jaipur Educational Tour 2025"
              className="h-9 text-xs"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs font-semibold mb-1 block" htmlFor="additional-charge-description">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="additional-charge-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this collection for? Shown to parents."
              className="text-xs min-h-[44px] resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5">
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onCancel}>
            <X className="h-3 w-3" /> Cancel
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={!valid}
            onClick={submit}
          >
            <Check className="h-3 w-3" /> Create Charge
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
