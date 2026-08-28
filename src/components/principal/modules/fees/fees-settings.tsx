'use client'

/**
 * FeesSettingsSection — Fee Management administrative settings.
 *
 * UX-SAL-1 (presentation-only rebuild): the settings page now follows the
 * Salary & Payroll Settings benchmark — ONE flat stack of compact cards,
 * no inner tab bar, no nested sub-navigation, no dev banners. The previous
 * 6-tab layout (with Payment Collection nesting 5 more sub-tabs) forced
 * two navigation levels for what is a preferences surface; every section
 * is now visible in one scroll, in practical order:
 *
 *   1. Fee Heads            — master catalogue + Add Head (addFeeHead /
 *                             archiveFeeHead / updateFeeHead)
 *   2. Payment Collection   — methods · bank accounts · UPI/QR · gateway ·
 *                             reconciliation (see fees-settings-payment.tsx)
 *   3. Late Fee Rules       — per-month amount, grace period, max
 *   4. Concession Rules     — sibling / staff ward / scholarship %
 *   5. One-Time Entry Fees  — admission policy snapshot (read-only values)
 *   6. Receipt Settings     — prefix, paper, next number, footer, signature
 *   7. Controlled-Edit Policy + Notifications
 *
 * Card anatomy mirrors Salary Settings: rounded-xl border bg-card p-4,
 * [10px] uppercase muted label + small muted icon, right-aligned action,
 * shadcn Switch toggles, label-left/control-right rows. All store
 * mutations, dirty-state Save flows and dialogs are behaviour-identical.
 */

import { useState, useMemo } from 'react'
import {
  IndianRupee, Landmark, AlertTriangle, Gift,
  Receipt, Check, Plus, Archive,
  ChevronDown, ChevronUp, RotateCcw,
  Lock, UserPlus, ShieldCheck, Bell,
} from 'lucide-react'
import { useLiveAlerts } from '@/lib/store/live-alerts-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  useFeeStore,
  type FeeHead,
} from '@/lib/store/fee-store'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SettingsCard } from './fees-shared'
import { FeesPaymentCollectionSettings } from './fees-settings-payment'
import { toast } from 'sonner'

// RuleChip — tiny mono value chip summarising the live rule values.
function RuleChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border/50 bg-muted/60 px-2 py-0.5 text-[10px] font-medium tabular-nums whitespace-nowrap">
      {children}
    </span>
  )
}

export function FeesSettingsSection() {
  return (
    // No page heading / banner — the "Settings" tab establishes context and
    // content starts immediately (Salary Settings benchmark).
    <div className="space-y-4">
      <FeeHeadsSettings />
      <FeesPaymentCollectionSettings />
      <LateFeeSettings />
      <ConcessionSettings />
      <AdmissionFeesCard />
      <ReceiptSettings />
      <PoliciesSettings />
      <NotificationsSettings />
    </div>
  )
}

// ─── Fee Heads ──────────────────────────────────────────────────────
//
// Master fee head catalogue: unique fee head names extracted from all
// structures, with a per-row breakdown of which structures use the head,
// the frequencies observed, and an "Active / Archived / Mixed" status.
// Add Head + Archive All / Restore All call the same store mutations
// (addFeeHead, archiveFeeHead, updateFeeHead) as before.

function FeeHeadsSettings() {
  const feeStructures = useFeeStore((s) => s.feeStructures)
  const addFeeHead = useFeeStore((s) => s.addFeeHead)
  const archiveFeeHead = useFeeStore((s) => s.archiveFeeHead)
  // updateFeeHead is used by "Restore All" — the existing mutation already
  // accepts a `Partial<FeeHead>` patch, so restoring = `{ active: true }`.
  const updateFeeHead = useFeeStore((s) => s.updateFeeHead)

  // Unique fee head names across all structures, deduplicated by name.
  const masterHeads = useMemo(() => {
    const nameMap = new Map<string, {
      name: string
      structures: string[]
      anyActive: boolean
      anyArchived: boolean
      frequencies: Set<string>
    }>()
    feeStructures.forEach((s) => {
      s.components.forEach((c) => {
        const existing = nameMap.get(c.name)
        if (existing) {
          existing.structures.push(s.className)
          if (c.active) existing.anyActive = true
          if (!c.active) existing.anyArchived = true
          existing.frequencies.add(c.frequency)
        } else {
          nameMap.set(c.name, {
            name: c.name,
            structures: [s.className],
            anyActive: c.active,
            anyArchived: !c.active,
            frequencies: new Set([c.frequency]),
          })
        }
      })
    })
    return Array.from(nameMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [feeStructures])

  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showAdd, setShowAdd] = useState(false)

  // Per-structure head instances for a given name (expanded breakdown).
  const getInstances = (name: string) => {
    const out: Array<{
      structureId: string
      structureName: string
      classLevel: string
      headId: string
      amount: number
      frequency: FeeHead['frequency']
      mandatory: boolean
      active: boolean
    }> = []
    feeStructures.forEach((s) => {
      s.components.forEach((c) => {
        if (c.name === name) {
          out.push({
            structureId: s.id,
            structureName: s.className,
            classLevel: s.classLevel,
            headId: c.id,
            amount: c.amount,
            frequency: c.frequency,
            mandatory: c.mandatory,
            active: c.active,
          })
        }
      })
    })
    return out
  }

  const filteredHeads = useMemo(() => {
    return masterHeads.filter((h) => {
      if (filter === 'active') return h.anyActive
      if (filter === 'archived') return h.anyArchived
      return true
    })
  }, [masterHeads, filter])

  const activeCount = masterHeads.filter((h) => h.anyActive).length
  const archivedCount = masterHeads.filter((h) => h.anyArchived).length

  const toggleExpand = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  // Archive All: archive every active instance across all structures.
  const handleArchiveAll = (name: string) => {
    const instances = getInstances(name).filter((i) => i.active)
    if (instances.length === 0) return
    instances.forEach((i) => archiveFeeHead(i.structureId, i.headId))
    toast.success(`"${name}" archived`, {
      description: `Archived across ${instances.length} structure(s). Past payments remain on record.`,
    })
  }

  // Restore All: restore every archived instance across all structures.
  const handleRestoreAll = (name: string) => {
    const instances = getInstances(name).filter((i) => !i.active)
    if (instances.length === 0) return
    let restored = 0
    instances.forEach((i) => {
      const r = updateFeeHead(i.structureId, i.headId, { active: true })
      if (r.success) restored++
    })
    toast.success(`"${name}" restored`, {
      description: `Restored across ${restored} structure(s).`,
    })
  }

  return (
    <SettingsCard
      label="Fee Heads"
      icon={<IndianRupee />}
      summary={`${activeCount} active · ${archivedCount} archived`}
      action={
        <Button size="sm" className="h-8 text-xs gap-1" onClick={() => setShowAdd(true)}>
          <Plus className="h-3 w-3" /> Add Head
        </Button>
      }
    >
      {/* Filter — [All] [Active] [Archived]. A "Mixed" head appears in BOTH
          the Active and Archived views. */}
      <div className="flex items-center gap-1">
        {[
          { value: 'all' as const, label: 'All', count: masterHeads.length },
          { value: 'active' as const, label: 'Active', count: activeCount },
          { value: 'archived' as const, label: 'Archived', count: archivedCount },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors',
              filter === t.value
                ? 'bg-muted/60 text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            <span className="text-[9px] text-muted-foreground tabular-nums">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border divide-y divide-border/70 max-h-96 overflow-y-auto custom-scrollbar">
        {filteredHeads.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No fee heads match this filter.
          </div>
        ) : (
          filteredHeads.map((h) => {
            const instances = getInstances(h.name)
            const isExpanded = expanded.has(h.name)
            const status: 'Active' | 'Archived' | 'Mixed' =
              h.anyActive && h.anyArchived ? 'Mixed' : h.anyActive ? 'Active' : 'Archived'
            const statusClass =
              status === 'Active'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20'
                : status === 'Archived'
                  ? 'bg-muted text-muted-foreground ring-border/40'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/20'
            const frequenciesStr = Array.from(h.frequencies).sort().join(', ')
            const uniqueStructureNames = Array.from(new Set(h.structures))
            return (
              <div key={h.name}>
                <div className="flex items-center gap-2.5 px-2.5 py-2.5 hover:bg-muted/30">
                  <span className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md shrink-0',
                    h.anyActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground',
                  )}>
                    <IndianRupee className="h-3 w-3" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-medium truncate">{h.name}</p>
                      <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold ring-1 whitespace-nowrap', statusClass)}>
                        {status}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      Used in <span className="font-medium text-foreground">{uniqueStructureNames.length}</span> structure(s) · {frequenciesStr}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {h.anyActive && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[10px] gap-1 text-amber-600 hover:text-amber-700"
                        onClick={() => handleArchiveAll(h.name)}
                        title={`Archive "${h.name}" across all structures where it is currently active`}
                      >
                        <Archive className="h-3 w-3" /> Archive All
                      </Button>
                    )}
                    {h.anyArchived && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[10px] gap-1 text-emerald-600 hover:text-emerald-700"
                        onClick={() => handleRestoreAll(h.name)}
                        title={`Restore "${h.name}" across all structures where it is currently archived`}
                      >
                        <RotateCcw className="h-3 w-3" /> Restore All
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground"
                      onClick={() => toggleExpand(h.name)}
                      aria-label={isExpanded ? 'Hide details' : 'View details'}
                      title={isExpanded ? 'Hide details' : 'View details'}
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
                {/* Expanded per-structure breakdown */}
                {isExpanded && (
                  <div className="border-t border-border/60 bg-muted/20 px-2 py-1.5">
                    <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider mb-1 px-1">
                      Per-structure breakdown ({instances.length})
                    </p>
                    <div className="space-y-0.5">
                      {instances.map((i) => (
                        <div key={i.headId} className="flex items-center gap-2 text-[10px] px-1 py-1 rounded hover:bg-muted/40">
                          <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', i.active ? 'bg-emerald-500' : 'bg-muted-foreground/40')} />
                          <span className="font-medium min-w-0 flex-1 truncate">{i.structureName}</span>
                          <span className="text-muted-foreground whitespace-nowrap">{i.frequency} · {i.mandatory ? 'Mandatory' : 'Optional'}</span>
                          <span className="font-mono font-semibold tabular-nums whitespace-nowrap">{formatINR(i.amount, true)}</span>
                          <span className={cn(
                            'text-[9px] font-semibold px-1 py-0.5 rounded whitespace-nowrap',
                            i.active
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                              : 'bg-muted text-muted-foreground',
                          )}>
                            {i.active ? 'Active' : 'Archived'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {showAdd && (
        <AddFeeHeadDialog
          structureIds={feeStructures.map((s) => ({ id: s.id, label: s.className }))}
          onClose={() => setShowAdd(false)}
          onSave={(structureId, head) => {
            const result = addFeeHead(structureId, head)
            if (!result.success) {
              toast.error('Could not add fee head', { description: result.error })
              return
            }
            const struct = feeStructures.find((s) => s.id === structureId)
            toast.success('Fee head created', {
              description: `${head.name} added to ${struct?.className ?? structureId}.`,
            })
            setShowAdd(false)
          }}
        />
      )}
    </SettingsCard>
  )
}

interface AddFeeHeadDialogProps {
  structureIds: Array<{ id: string; label: string }>
  onClose: () => void
  onSave: (structureId: string, head: Omit<FeeHead, 'id'>) => void
}

function AddFeeHeadDialog({ structureIds, onClose, onSave }: AddFeeHeadDialogProps) {
  const [structureId, setStructureId] = useState(structureIds[0]?.id ?? '')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState(0)
  const [frequency, setFrequency] = useState<FeeHead['frequency']>('Annual')
  const [mandatory, setMandatory] = useState(false)

  const valid = structureId && name.trim() && amount > 0

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Fee Head</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-[11px]">Apply to Fee Structure</Label>
            <select
              value={structureId}
              onChange={(e) => setStructureId(e.target.value)}
              className="w-full h-8 text-xs rounded-md border border-border bg-background px-2 mt-1"
            >
              {structureIds.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <Label className="text-[11px]">Head Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sports Fee" className="h-8 text-xs mt-1" />
          </div>
          <div>
            <Label className="text-[11px]">Amount (₹)</Label>
            <Input
              type="number"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="0"
              className="h-8 text-xs tabular-nums mt-1"
            />
          </div>
          <div>
            <Label className="text-[11px]">Frequency</Label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as FeeHead['frequency'])}
              className="w-full h-8 text-xs rounded-md border border-border bg-background px-2 mt-1"
            >
              <option value="Annual">Annual</option>
              <option value="Half-Yearly">Half-Yearly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Monthly">Monthly</option>
              <option value="Per Term">Per Term</option>
              <option value="One-Time">One-Time</option>
            </select>
          </div>
          <div className="col-span-2 flex items-center justify-between rounded-md border border-border px-2.5 py-2">
            <div>
              <p className="text-xs font-semibold">Mandatory Head</p>
              <p className="text-[10px] text-muted-foreground">Mandatory heads apply to every student in this structure</p>
            </div>
            <Switch checked={mandatory} onCheckedChange={setMandatory} aria-label="Mandatory head" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            className="gap-1"
            disabled={!valid}
            onClick={() => onSave(structureId, { name: name.trim(), amount, frequency, mandatory, active: true })}
          >
            <Check className="h-3.5 w-3.5" /> Add Head
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Late Fee Rules ────────────────────────────────────────────────

function LateFeeSettings() {
  const rule = useFeeStore((s) => s.lateFeeRule)
  const updateLateFeeRule = useFeeStore((s) => s.updateLateFeeRule)
  const [local, setLocal] = useState(rule)
  const dirty = JSON.stringify(local) !== JSON.stringify(rule)

  return (
    <SettingsCard
      label="Late Fee Rules"
      icon={<AlertTriangle />}
      summary={local.enabled ? 'on' : 'off'}
      action={
        dirty ? (
          <Button size="sm" className="h-8 text-xs gap-1" onClick={() => { updateLateFeeRule(local); toast.success('Late fee rules updated') }}>
            <Check className="h-3 w-3" /> Save
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-3">
        {/* Live rule summary — current values at a glance (updates as fields change) */}
        <div className="flex items-center flex-wrap gap-1.5">
          <RuleChip>{formatINR(local.amountPerMonth, true)} / month</RuleChip>
          <RuleChip>max {formatINR(local.maxLateFee, true)}</RuleChip>
          <RuleChip>grace {local.gracePeriodDays}d</RuleChip>
          <RuleChip>{local.appliesTo === 'mandatory_only' ? 'mandatory heads' : 'all heads'}</RuleChip>
        </div>
        {/* Rule inputs — 2-col grid of labeled fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[11px]">Amount per Month (₹)</Label>
            <Input type="number" value={local.amountPerMonth} onChange={(e) => setLocal({ ...local, amountPerMonth: Number(e.target.value) })} className="h-8 text-xs tabular-nums mt-1" />
          </div>
          <div>
            <Label className="text-[11px]">Grace Period (days)</Label>
            <Input type="number" value={local.gracePeriodDays} onChange={(e) => setLocal({ ...local, gracePeriodDays: Number(e.target.value) })} className="h-8 text-xs tabular-nums mt-1" />
          </div>
          <div>
            <Label className="text-[11px]">Max Late Fee (₹)</Label>
            <Input type="number" value={local.maxLateFee} onChange={(e) => setLocal({ ...local, maxLateFee: Number(e.target.value) })} className="h-8 text-xs tabular-nums mt-1" />
          </div>
          <div>
            <Label className="text-[11px]">Applies To</Label>
            <select value={local.appliesTo} onChange={(e) => setLocal({ ...local, appliesTo: e.target.value as 'mandatory_only' | 'all' })} className="w-full h-8 text-xs rounded-md border border-border bg-background px-2 mt-1">
              <option value="mandatory_only">Mandatory Heads Only</option>
              <option value="all">All Heads</option>
            </select>
          </div>
        </div>
        {/* Master switch */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium">Automatically apply to overdue accounts</p>
          <Switch checked={local.enabled} onCheckedChange={(c) => setLocal({ ...local, enabled: c })} aria-label="Enable late fee" />
        </div>
        <p className="text-[10px] text-muted-foreground border-t border-border/60 pt-2.5">
          A student 3 months overdue is charged <span className="font-bold tabular-nums text-foreground">{formatINR(local.amountPerMonth * 3, true)}</span> late fee, capped at {formatINR(local.maxLateFee, true)}.
        </p>
      </div>
    </SettingsCard>
  )
}

// ─── Concession Rules ──────────────────────────────────────────────

function ConcessionSettings() {
  const rule = useFeeStore((s) => s.concessionRule)
  const updateConcessionRule = useFeeStore((s) => s.updateConcessionRule)
  const [local, setLocal] = useState(rule)
  const dirty = JSON.stringify(local) !== JSON.stringify(rule)

  return (
    <SettingsCard
      label="Concession Rules"
      icon={<Gift />}
      summary={local.enabled ? 'on' : 'off'}
      action={
        dirty ? (
          <Button size="sm" className="h-8 text-xs gap-1" onClick={() => { updateConcessionRule(local); toast.success('Concession rules updated') }}>
            <Check className="h-3 w-3" /> Save
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-3">
        {/* Live rule summary — discounts at a glance (updates as fields change) */}
        <div className="flex items-center flex-wrap gap-1.5">
          <RuleChip>sibling {local.siblingDiscountPct}%</RuleChip>
          <RuleChip>staff ward {local.staffWardDiscountPct}%</RuleChip>
          <RuleChip>scholarship {local.scholarshipDiscountPct}%</RuleChip>
          {local.requiresApproval && <RuleChip><span className="text-amber-600 font-semibold">principal approval</span></RuleChip>}
        </div>
        {/* Rule inputs — discount %s */}
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-[11px]">Sibling Discount (%)</Label>
            <Input type="number" value={local.siblingDiscountPct} onChange={(e) => setLocal({ ...local, siblingDiscountPct: Number(e.target.value) })} className="h-8 text-xs tabular-nums mt-1" />
          </div>
          <div>
            <Label className="text-[11px]">Staff Ward (%)</Label>
            <Input type="number" value={local.staffWardDiscountPct} onChange={(e) => setLocal({ ...local, staffWardDiscountPct: Number(e.target.value) })} className="h-8 text-xs tabular-nums mt-1" />
          </div>
          <div>
            <Label className="text-[11px]">Scholarship (%)</Label>
            <Input type="number" value={local.scholarshipDiscountPct} onChange={(e) => setLocal({ ...local, scholarshipDiscountPct: Number(e.target.value) })} className="h-8 text-xs tabular-nums mt-1" />
          </div>
        </div>
        {/* Toggles */}
        <div className="divide-y divide-border/60 rounded-lg border border-border/60">
          <div className="flex items-center justify-between gap-3 px-2.5 py-2">
            <p className="text-xs font-medium">Require Principal approval</p>
            <Switch checked={local.requiresApproval} onCheckedChange={(c) => setLocal({ ...local, requiresApproval: c })} aria-label="Require principal approval" />
          </div>
          <div className="flex items-center justify-between gap-3 px-2.5 py-2">
            <p className="text-xs font-medium">Enable concessions on student accounts</p>
            <Switch checked={local.enabled} onCheckedChange={(c) => setLocal({ ...local, enabled: c })} aria-label="Enable concessions" />
          </div>
        </div>
      </div>
    </SettingsCard>
  )
}

// ─── One-Time Entry Fees (admission policy snapshot) ──────────────
// Reads admissionPolicy ({enabled, boysAmount, girlsFreeAboveGrade}) from
// useFeeStore; the only editable control is the master Switch which calls
// updateAdmissionPolicy({ enabled }) (store action — no local draft state).
function AdmissionFeesCard() {
  const admissionPolicy = useFeeStore((s) => s.admissionPolicy)
  const updateAdmissionPolicy = useFeeStore((s) => s.updateAdmissionPolicy)

  const handleToggle = () => {
    const next = !admissionPolicy.enabled
    updateAdmissionPolicy({ enabled: next })
    toast.success(next ? 'One-time entry fees enabled' : 'One-time entry fees disabled')
  }

  return (
    <SettingsCard
      label="One-Time Entry Fees"
      icon={<UserPlus />}
      summary={admissionPolicy.enabled ? 'on' : 'off'}
      action={
        <Switch
          checked={admissionPolicy.enabled}
          onCheckedChange={handleToggle}
          aria-label="Enable one-time entry fees"
        />
      }
      className={cn(!admissionPolicy.enabled && 'opacity-70')}
    >
      <div className="divide-y divide-border/60 rounded-lg border border-border/60">
        <div className="flex items-center justify-between gap-3 px-2.5 py-2.5 text-xs">
          <p className="font-medium shrink-0">Admission Fee</p>
          <p className="text-[11px] text-muted-foreground text-right min-w-0">
            boys <span className="font-semibold tabular-nums text-foreground">{formatINR(admissionPolicy.boysAmount)}</span> one-time · girls free above Class{' '}
            <span className="font-semibold tabular-nums text-foreground">{admissionPolicy.girlsFreeAboveGrade}</span>
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 px-2.5 py-2.5 text-xs">
          <p className="font-medium shrink-0">Registration Fee</p>
          <p className="text-[11px] text-muted-foreground text-right min-w-0">
            <span className="font-semibold tabular-nums text-foreground">₹300</span> at Class 9 &amp; 11 entry points
          </p>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Charged only during admission events — never billed with monthly dues.
      </p>
    </SettingsCard>
  )
}

// ─── Receipt Settings ──────────────────────────────────────────────

function ReceiptSettings() {
  const settings = useFeeStore((s) => s.receiptSettings)
  const updateReceiptSettings = useFeeStore((s) => s.updateReceiptSettings)
  const receiptCounter = useFeeStore((s) => s.receiptCounter)
  const [local, setLocal] = useState(settings)
  const dirty = JSON.stringify(local) !== JSON.stringify(settings)

  return (
    <SettingsCard
      label="Receipt Settings"
      icon={<Receipt />}
      summary={`next ${local.prefix}${receiptCounter + 1}`}
      action={
        dirty ? (
          <Button size="sm" className="h-8 text-xs gap-1" onClick={() => { updateReceiptSettings(local); toast.success('Receipt settings updated') }}>
            <Check className="h-3 w-3" /> Save
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-[11px]">Receipt Number Prefix</Label>
            <Input value={local.prefix} onChange={(e) => setLocal({ ...local, prefix: e.target.value })} className="h-8 text-xs font-mono mt-1" />
          </div>
          <div>
            <Label className="text-[11px]">Paper Size</Label>
            <select value={local.paperSize} onChange={(e) => setLocal({ ...local, paperSize: e.target.value as '80mm' | 'A5' })} className="w-full h-8 text-xs rounded-md border border-border bg-background px-2 mt-1">
              <option value="80mm">80mm Thermal</option>
              <option value="A5">A5 Half-Page</option>
            </select>
          </div>
        </div>
        <div>
          <Label className="text-[11px]">Footer Message</Label>
          <Input value={local.footerMessage} onChange={(e) => setLocal({ ...local, footerMessage: e.target.value })} className="h-8 text-xs mt-1" />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-2.5">
          <p className="text-xs font-medium">Show authorized signature on receipts</p>
          <Switch checked={local.showAuthorizedSignature} onCheckedChange={(c) => setLocal({ ...local, showAuthorizedSignature: c })} aria-label="Show authorized signature" />
        </div>
      </div>
    </SettingsCard>
  )
}

// ─── Controlled-Edit Policy — documents the ACTUAL version mechanics
// implemented across Fee Structures (publish → lock → window).

const POLICY_ROWS = [
  {
    icon: <Lock className="h-3.5 w-3.5 shrink-0 text-sky-600 mt-0.5" />,
    lead: 'Publish locks.',
    text: 'A fee structure is immutable once published for the current session — later changes open a controlled revision and create a new version, never overwriting the old one.',
  },
  {
    icon: <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />,
    lead: '60% guardian approval.',
    text: 'A revision affecting existing charges applies only after at least 60% of affected families approve, or when the window deadline passes.',
  },
  {
    icon: <Archive className="h-3.5 w-3.5 shrink-0 text-amber-600 mt-0.5" />,
    lead: 'Archive, never delete.',
    text: 'Published structures, recorded payments and issued receipts are part of the permanent financial record — archived, not removed.',
  },
]

function PoliciesSettings() {
  return (
    <SettingsCard label="Controlled-Edit Policy" icon={<ShieldCheck />}>
      <div className="space-y-2.5">
        {POLICY_ROWS.map((row) => (
          <div key={row.lead} className="flex items-start gap-2.5">
            {row.icon}
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">{row.lead}</span> {row.text}
            </p>
          </div>
        ))}
      </div>
    </SettingsCard>
  )
}

// ─── Notification Preferences — wired to the real alerts centre feed ───

function NotificationsSettings() {
  const autoAlertsEnabled = useLiveAlerts((s) => s.autoAlertsEnabled)
  const toggleAutoAlerts = useLiveAlerts((s) => s.toggleAutoAlerts)

  return (
    <SettingsCard label="Notifications" icon={<Bell />}>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium">Live finance alerts</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Approvals, collections, structure revisions and gateway events reach the alerts centre as they happen.
            </p>
          </div>
          <Switch checked={autoAlertsEnabled} onCheckedChange={toggleAutoAlerts} aria-label="Live finance alerts" />
        </div>
        <p className="text-[10px] text-muted-foreground border-t border-border/60 pt-2.5">
          Critical financial confirmations (payments, receipts) always notify via toast regardless of this setting.
        </p>
      </div>
    </SettingsCard>
  )
}
