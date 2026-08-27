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
 * This panel lives on the Payments page (operations). Each charge shows
 * live collected progress computed from transactions bound to it; the
 * Principal can soft-cancel a charge (historical payments preserved).
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Bus, FlaskConical, Trophy, Tent, CalendarDays, Package, Tag,
  X, Check, Ban, Users, type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  useFeeStore, useFeeData, type AdditionalChargeCategory,
} from '@/lib/store/fee-store'
import { useStudentsStore } from '@/lib/store/students-store'
import { deriveFeeHeadKind, useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { ACADEMIC_CLASSES } from '@/lib/mock/academic/classes'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { MoneyInput } from './money-input'
import { FeeEmptyState } from './fees-shared'

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
    <div>
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div>
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            Additional Charges
            <Badge variant="outline" className="text-[9px] h-4 px-1.5">{activeCharges.length}</Badge>
          </h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Event-based collections (tours, workshops) — separate from the annual fee structure.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs gap-1.5 shrink-0"
          onClick={() => setCreating((v) => !v)}
        >
          <Plus className="h-3.5 w-3.5" /> New Charge
        </Button>
      </div>

      {/* Creation form */}
      <AnimatePresence>
        {creating && (
          <NewAdditionalChargeForm
            onCancel={() => setCreating(false)}
            onCreated={() => setCreating(false)}
            createAdditionalCharge={createAdditionalCharge}
          />
        )}
      </AnimatePresence>

      {/* Charge list */}
      {activeCharges.length === 0 && !creating ? (
        <div className="rounded-xl border border-dashed border-border">
          <FeeEmptyState
            icon={<CalendarDays className="h-6 w-6" />}
            title="No additional charges"
            description="Create one when the school organizes a tour, workshop, or special collection — the annual fee structure stays untouched."
          />
        </div>
      ) : (
        <div className="space-y-2">
          {activeCharges.map((c) => {
            const stats = chargeStats.get(c.id) ?? { students: 0, collected: 0, expected: 0 }
            const pct = stats.expected > 0 ? Math.min(100, Math.round((stats.collected / stats.expected) * 100)) : 0
            const Icon = categoryIcon(c.category)
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-semibold truncate">{c.name}</p>
                        <Badge variant="outline" className="text-[8px] h-3.5 py-0 px-1 bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30">
                          {c.category}
                        </Badge>
                        <Badge variant="outline" className="text-[8px] h-3.5 py-0 px-1">
                          {c.mandatory ? 'Mandatory' : 'Optional'}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        <span className="font-semibold text-foreground tabular-nums">{formatINR(c.amount, true)}</span> per student
                        {' · '}due {formatDate(c.dueDate)}
                        {c.reference ? ` · ${c.reference}` : ''}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                        <Users className="h-2.5 w-2.5" />
                        {classLabels(c.applicableClassIds)}
                        {' · '}{stats.students} student{stats.students === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[10px] gap-1 text-rose-600 hover:bg-rose-500/10 hover:text-rose-600 shrink-0"
                    onClick={() => handleCancel(c.id, c.name)}
                  >
                    <Ban className="h-3 w-3" /> Cancel
                  </Button>
                </div>
                {/* Collection progress */}
                <div className="mt-2.5">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-muted-foreground">
                      Collected <span className="font-semibold text-emerald-600 tabular-nums">{formatINR(stats.collected, true)}</span>
                      {' '}of <span className="font-semibold tabular-nums">{formatINR(stats.expected, true)}</span>
                    </span>
                    <span className="tabular-nums text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="h-full rounded-full bg-emerald-500"
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}

          {/* Cancelled charges — collapsed summary for history */}
          {cancelledCharges.length > 0 && (
            <details className="rounded-xl border border-border/60 bg-muted/20 px-4 py-2">
              <summary className="text-[11px] text-muted-foreground cursor-pointer select-none">
                {cancelledCharges.length} cancelled charge{cancelledCharges.length === 1 ? '' : 's'} (payments preserved)
              </summary>
              <div className="mt-2 space-y-1.5">
                {cancelledCharges.map((c) => {
                  const stats = chargeStats.get(c.id) ?? { students: 0, collected: 0, expected: 0 }
                  return (
                    <div key={c.id} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="truncate line-through text-muted-foreground">{c.name}</span>
                      <span className="text-[9px] text-muted-foreground shrink-0">
                        {formatINR(stats.collected, true)} collected · {formatDate(c.dueDate)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

function classLabels(classIds: string[]): string {
  const names = classIds.map((id) => ACADEMIC_CLASSES.find((c) => c.id === id)?.name ?? id)
  if (names.length === 0) return 'No classes'
  if (names.length <= 3) return names.join(', ')
  return `${names.slice(0, 3).join(', ')} +${names.length - 3}`
}

// ─── Creation form ──────────────────────────────────────────────────────

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
      academicYear: '2025-2026',
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
      <div className="rounded-xl border border-violet-500/30 bg-violet-500/[0.04] p-4 mb-3 space-y-3">
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
            <Label className="text-[10px] font-semibold mb-1 block">Charge Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Educational Tour — Jaipur"
              className="h-8 text-xs"
              autoFocus
            />
          </div>
          <div>
            <Label className="text-[10px] font-semibold mb-1 block">Category</Label>
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
            <Label className="text-[10px] font-semibold mb-1 block">Amount per Student (₹)</Label>
            <MoneyInput value={amount} onChange={setAmount} className="h-8 text-xs" ariaLabel="Amount per student" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-[10px] font-semibold mb-1 block">
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
            <Label className="text-[10px] font-semibold mb-1 block">Due Date <span className="text-rose-500">*</span></Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex items-end pb-1.5">
            <label className="inline-flex items-center gap-2 text-[11px] cursor-pointer select-none">
              <Switch checked={mandatory} onCheckedChange={setMandatory} />
              {mandatory ? 'Mandatory for all' : 'Optional (student may opt out)'}
            </label>
          </div>
          <div>
            <Label className="text-[10px] font-semibold mb-1 block">Event / Reference <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. Jaipur Educational Tour 2025"
              className="h-8 text-xs"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-[10px] font-semibold mb-1 block">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this collection for? Shown to parents."
              className="text-xs min-h-[44px] resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5">
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}>
            <X className="h-3 w-3" /> Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
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
