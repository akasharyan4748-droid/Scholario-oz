'use client'

/**
 * FeesSettingsSection — Fee Management administrative settings.
 *
 * Tabs (5 main):
 *   1. Fee Heads           — create / archive (wired to addFeeHead / archiveFeeHead)
 *   2. Payment Collection  — Payment Methods, Bank & Settlement, UPI/QR,
 *                            Payment Gateway, Reconciliation (Phase 4 infra)
 *   3. Late Fee Rules      — per-month amount, grace period, max
 *   4. Concession Rules    — sibling / staff ward / scholarship discount %
 *   5. Receipt Settings    — prefix, start number, footer message, signature
 *
 * Phase 4 — the legacy "Payment Modes" tab is now the first sub-section of
 * Payment Collection ("Accepted Payment Methods"). It uses the same
 * paymentModes[] state + togglePaymentMode mutation as before; it just lives
 * alongside the new gateway / bank / UPI / reconciliation configuration so
 * the Principal sees the whole "School Finance Configuration" in one place.
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  IndianRupee, Landmark, AlertTriangle, Gift,
  Receipt, ShieldCheck, Check, Plus, Archive,
  ChevronDown, ChevronUp, RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  useFeeStore,
  type FeeHead,
} from '@/lib/store/fee-store'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { FeePanel } from './fees-shared'
import { FeesPaymentCollectionSettings } from './fees-settings-payment'
import { toast } from 'sonner'

type SettingsTab = 'fee-heads' | 'payment-collection' | 'late-fee' | 'concession' | 'receipt'

export function FeesSettingsSection() {
  const [tab, setTab] = useState<SettingsTab>('fee-heads')

  const TABS: Array<{ value: SettingsTab; label: string; icon: React.ReactNode }> = [
    { value: 'fee-heads', label: 'Fee Heads', icon: <IndianRupee className="h-3.5 w-3.5" /> },
    { value: 'payment-collection', label: 'Payment Collection', icon: <Landmark className="h-3.5 w-3.5" /> },
    { value: 'late-fee', label: 'Late Fee Rules', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    { value: 'concession', label: 'Concession Rules', icon: <Gift className="h-3.5 w-3.5" /> },
    { value: 'receipt', label: 'Receipt Settings', icon: <Receipt className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Version safety banner */}
      <div className="rounded-lg bg-sky-500/5 border border-sky-500/20 p-2.5 flex items-start gap-2">
        <ShieldCheck className="h-3.5 w-3.5 text-sky-600 shrink-0 mt-0.5" />
        <div className="text-[11px] text-muted-foreground">
          <p className="font-semibold text-sky-700 dark:text-sky-300">Fee Structure History</p>
          <p className="mt-0.5">New fee plans will use the updated settings. Previous payments remain unchanged.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 rounded-lg bg-muted/40 p-0.5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
              tab === t.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'fee-heads' && <FeeHeadsSettings />}
      {tab === 'payment-collection' && <FeesPaymentCollectionSettings />}
      {tab === 'late-fee' && <LateFeeSettings />}
      {tab === 'concession' && <ConcessionSettings />}
      {tab === 'receipt' && <ReceiptSettings />}
    </div>
  )
}

// ─── Fee Heads ──────────────────────────────────────────────────────
//
// FIX 2 (FEE-ARCH): the previous implementation built `allHeads` by
// `feeStructures.flatMap(s => s.components)`, which produced a per-structure
// duplicate row for every shared head name (e.g. "Tuition" appeared 5
// times — once per class level, suffixed "(Nursery–UKG)", "(Class 1–5)",
// etc.). That mixed the master fee head catalogue with structure-specific
// pricing.
//
// This new implementation shows a MASTER FEE HEAD CATALOGUE: unique fee
// head names extracted from all structures, with a per-row breakdown of
// which structures use the head, the frequencies observed, and an
// "Active / Archived / Mixed" status. The Add Head + Archive All /
// Restore All actions still call the same store mutations (addFeeHead,
// archiveFeeHead, updateFeeHead) — no store changes were needed.

function FeeHeadsSettings() {
  const feeStructures = useFeeStore((s) => s.feeStructures)
  const addFeeHead = useFeeStore((s) => s.addFeeHead)
  const archiveFeeHead = useFeeStore((s) => s.archiveFeeHead)
  // updateFeeHead is used by "Restore All" — the existing mutation already
  // accepts a `Partial<FeeHead>` patch, so restoring = `{ active: true }`.
  // No store change required.
  const updateFeeHead = useFeeStore((s) => s.updateFeeHead)

  // ─── Master fee head catalogue (Fix 2 — FEE-ARCH) ──────────────────
  // Unique fee head names across all structures, deduplicated by name,
  // tracking which structures use the name + whether each instance is
  // active + the set of frequencies observed.
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

  // Look up the per-structure head instances for a given name so the
  // expanded "View Details" panel can show class name + amount + frequency
  // + mandatory + status. This is computed lazily (only for expanded rows).
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

  // Archive All: archive every active instance of this head name across
  // all structures. Calls the existing archiveFeeHead mutation in a loop.
  const handleArchiveAll = (name: string) => {
    const instances = getInstances(name).filter((i) => i.active)
    if (instances.length === 0) return
    instances.forEach((i) => archiveFeeHead(i.structureId, i.headId))
    toast.success(`"${name}" archived`, {
      description: `Archived across ${instances.length} structure(s). Past payments remain on record.`,
    })
  }

  // Restore All: restore every archived instance of this head name across
  // all structures. Calls the existing updateFeeHead mutation with the
  // patch `{ active: true }` in a loop.
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
    <FeePanel
      title="Fee Heads"
      subtitle={`${activeCount} active · ${archivedCount} archived · ${masterHeads.length} unique head names`}
      action={<Button size="sm" className="h-7 text-xs gap-1" onClick={() => setShowAdd(true)}><Plus className="h-3 w-3" /> Add Head</Button>}
    >
      {/* Tab filter — [All] [Active] [Archived]. A "Mixed" head (active in
          some structures, archived in others) appears in BOTH the Active
          and Archived tabs. */}
      <div className="flex items-center gap-1 mb-3">
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
              filter === t.value ? 'bg-card text-foreground border border-border shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            <span className="text-[9px] text-muted-foreground tabular-nums">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
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
              <div key={h.name} className="rounded-md border border-border/60 bg-card overflow-hidden">
                {/* Row */}
                <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/30">
                  <span className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md shrink-0',
                    h.anyActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground',
                  )}>
                    <IndianRupee className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-medium truncate">{h.name}</p>
                      <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold ring-1 whitespace-nowrap', statusClass)}>
                        {status}
                      </span>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5 truncate">
                      Used in <span className="font-medium text-foreground">{uniqueStructureNames.length}</span> structure(s) · Frequencies: {frequenciesStr}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {h.anyActive && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[9px] gap-1 text-amber-600 hover:text-amber-700"
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
                        className="h-6 text-[9px] gap-1 text-emerald-600 hover:text-emerald-700"
                        onClick={() => handleRestoreAll(h.name)}
                        title={`Restore "${h.name}" across all structures where it is currently archived`}
                      >
                        <RotateCcw className="h-3 w-3" /> Restore All
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleExpand(h.name)}
                      aria-label={isExpanded ? 'Hide details' : 'View details'}
                      title={isExpanded ? 'Hide details' : 'View details'}
                    >
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
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
                        <div key={i.headId} className="flex items-center gap-2 text-[10px] px-1 py-0.5 rounded hover:bg-muted/40">
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
    </FeePanel>
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
          <label className="col-span-2 flex items-center justify-between rounded-md border border-border px-2.5 py-2">
            <div>
              <p className="text-xs font-semibold">Mandatory Head</p>
              <p className="text-[10px] text-muted-foreground">Mandatory heads apply to every student in this structure</p>
            </div>
            <button
              onClick={() => setMandatory((v) => !v)}
              className={cn('relative h-5 w-9 rounded-full transition-colors shrink-0', mandatory ? 'bg-emerald-600' : 'bg-muted-foreground/30')}
            >
              <span
                className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all"
                style={{ left: mandatory ? '1.125rem' : '0.125rem' }}
              />
            </button>
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            className="gap-1 bg-emerald-600 hover:bg-emerald-700"
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
    <FeePanel
      title="Late Fee Rules"
      subtitle="automatic late fee calculation policy"
      action={
        dirty && (
          <Button size="sm" className="h-7 text-xs gap-1" onClick={() => { updateLateFeeRule(local); toast.success('Late fee rules updated') }}>
            <Check className="h-3 w-3" /> Save
          </Button>
        )
      }
    >
      <div className="space-y-3">
        <label className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold">Enable Late Fee</p>
            <p className="text-[10px] text-muted-foreground">Automatically apply late fee to overdue accounts</p>
          </div>
          <button
            onClick={() => setLocal({ ...local, enabled: !local.enabled })}
            className={cn('relative h-5 w-9 rounded-full transition-colors', local.enabled ? 'bg-emerald-600' : 'bg-muted-foreground/30')}
          >
            <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', local.enabled ? 'left-4.5' : 'left-0.5')} style={{ left: local.enabled ? '1.125rem' : '0.125rem' }} />
          </button>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[11px]">Amount per Month (₹)</Label>
            <Input type="number" value={local.amountPerMonth} onChange={(e) => setLocal({ ...local, amountPerMonth: Number(e.target.value) })} className="h-8 text-xs tabular-nums" />
          </div>
          <div>
            <Label className="text-[11px]">Grace Period (days)</Label>
            <Input type="number" value={local.gracePeriodDays} onChange={(e) => setLocal({ ...local, gracePeriodDays: Number(e.target.value) })} className="h-8 text-xs tabular-nums" />
          </div>
          <div>
            <Label className="text-[11px]">Max Late Fee (₹)</Label>
            <Input type="number" value={local.maxLateFee} onChange={(e) => setLocal({ ...local, maxLateFee: Number(e.target.value) })} className="h-8 text-xs tabular-nums" />
          </div>
          <div>
            <Label className="text-[11px]">Applies To</Label>
            <select value={local.appliesTo} onChange={(e) => setLocal({ ...local, appliesTo: e.target.value as any })} className="w-full h-8 text-xs rounded-md border border-border bg-background px-2">
              <option value="mandatory_only">Mandatory Heads Only</option>
              <option value="all">All Heads</option>
            </select>
          </div>
        </div>
        <div className="rounded-lg bg-muted/30 border border-border p-2.5 text-[10px] text-muted-foreground">
          <p>Preview: A student 3 months overdue will be charged <span className="font-bold tabular-nums">{formatINR(local.amountPerMonth * 3, true)}</span> late fee (capped at {formatINR(local.maxLateFee, true)}).</p>
        </div>
      </div>
    </FeePanel>
  )
}

// ─── Concession Rules ──────────────────────────────────────────────

function ConcessionSettings() {
  const rule = useFeeStore((s) => s.concessionRule)
  const updateConcessionRule = useFeeStore((s) => s.updateConcessionRule)
  const [local, setLocal] = useState(rule)
  const dirty = JSON.stringify(local) !== JSON.stringify(rule)

  return (
    <FeePanel
      title="Concession Rules"
      subtitle="approved concession categories & discounts"
      action={
        dirty && (
          <Button size="sm" className="h-7 text-xs gap-1" onClick={() => { updateConcessionRule(local); toast.success('Concession rules updated') }}>
            <Check className="h-3 w-3" /> Save
          </Button>
        )
      }
    >
      <div className="space-y-3">
        <label className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold">Enable Concessions</p>
            <p className="text-[10px] text-muted-foreground">Allow fee concessions on student accounts</p>
          </div>
          <button
            onClick={() => setLocal({ ...local, enabled: !local.enabled })}
            className={cn('relative h-5 w-9 rounded-full transition-colors', local.enabled ? 'bg-emerald-600' : 'bg-muted-foreground/30')}
          >
            <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', local.enabled ? 'left-4.5' : 'left-0.5')} style={{ left: local.enabled ? '1.125rem' : '0.125rem' }} />
          </button>
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-[11px]">Sibling Discount (%)</Label>
            <Input type="number" value={local.siblingDiscountPct} onChange={(e) => setLocal({ ...local, siblingDiscountPct: Number(e.target.value) })} className="h-8 text-xs tabular-nums" />
          </div>
          <div>
            <Label className="text-[11px]">Staff Ward (%)</Label>
            <Input type="number" value={local.staffWardDiscountPct} onChange={(e) => setLocal({ ...local, staffWardDiscountPct: Number(e.target.value) })} className="h-8 text-xs tabular-nums" />
          </div>
          <div>
            <Label className="text-[11px]">Scholarship (%)</Label>
            <Input type="number" value={local.scholarshipDiscountPct} onChange={(e) => setLocal({ ...local, scholarshipDiscountPct: Number(e.target.value) })} className="h-8 text-xs tabular-nums" />
          </div>
        </div>
        <label className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold">Require Principal Approval</p>
            <p className="text-[10px] text-muted-foreground">Concessions must be approved by Principal before applying</p>
          </div>
          <button
            onClick={() => setLocal({ ...local, requiresApproval: !local.requiresApproval })}
            className={cn('relative h-5 w-9 rounded-full transition-colors', local.requiresApproval ? 'bg-emerald-600' : 'bg-muted-foreground/30')}
          >
            <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', local.requiresApproval ? 'left-4.5' : 'left-0.5')} style={{ left: local.requiresApproval ? '1.125rem' : '0.125rem' }} />
          </button>
        </label>
      </div>
    </FeePanel>
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
    <FeePanel
      title="Receipt Settings"
      subtitle="receipt numbering, footer, signature"
      action={
        dirty && (
          <Button size="sm" className="h-7 text-xs gap-1" onClick={() => { updateReceiptSettings(local); toast.success('Receipt settings updated') }}>
            <Check className="h-3 w-3" /> Save
          </Button>
        )
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[11px]">Receipt Number Prefix</Label>
            <Input value={local.prefix} onChange={(e) => setLocal({ ...local, prefix: e.target.value })} className="h-8 text-xs font-mono" />
          </div>
          <div>
            <Label className="text-[11px]">Paper Size</Label>
            <select value={local.paperSize} onChange={(e) => setLocal({ ...local, paperSize: e.target.value as any })} className="w-full h-8 text-xs rounded-md border border-border bg-background px-2">
              <option value="80mm">80mm Thermal</option>
              <option value="A5">A5 Half-Page</option>
            </select>
          </div>
        </div>
        <div className="rounded-md bg-muted/30 border border-border p-2.5">
          <p className="text-[10px] text-muted-foreground">Next receipt number will be:</p>
          <p className="font-mono text-base font-bold tabular-nums">{local.prefix}{receiptCounter + 1}</p>
        </div>
        <div>
          <Label className="text-[11px]">Footer Message</Label>
          <Input value={local.footerMessage} onChange={(e) => setLocal({ ...local, footerMessage: e.target.value })} className="h-8 text-xs" />
        </div>
        <label className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold">Show Authorized Signature</p>
            <p className="text-[10px] text-muted-foreground">Print Principal signature line on receipts</p>
          </div>
          <button
            onClick={() => setLocal({ ...local, showAuthorizedSignature: !local.showAuthorizedSignature })}
            className={cn('relative h-5 w-9 rounded-full transition-colors', local.showAuthorizedSignature ? 'bg-emerald-600' : 'bg-muted-foreground/30')}
          >
            <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', local.showAuthorizedSignature ? 'left-4.5' : 'left-0.5')} style={{ left: local.showAuthorizedSignature ? '1.125rem' : '0.125rem' }} />
          </button>
        </label>
      </div>
    </FeePanel>
  )
}
