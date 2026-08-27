'use client'

/**
 * FeesMasterCatalogue — the school-wide fee head library, rendered as a
 * DEEP PAGE INSIDE the Fee Management module.
 *
 * The Principal opens this from Fee Structures → "Master Catalogue" and it
 * takes over the Fee Management CONTENT AREA only — the normal Scholario
 * application shell stays exactly where it is:
 *   • left sidebar visible
 *   • top header visible
 *   • Fee Management tab bar visible (module context never lost)
 *   • normal application navigation intact
 *
 * It is NOT a fixed full-screen overlay and NOT a standalone route — the
 * catalogue is an ordinary in-flow section of the workspace. "← Back to
 * Fee Structures" returns to the structures grid.
 *
 * DESIGN GOALS (Principal-first):
 *   • A scannable LIBRARY, not a technical database — compact list rows
 *     (icon · name · category·frequency · kind · default amount · usage ·
 *     actions). One fee head ≈ one slim row.
 *   • Descriptions live in a popover + the edit form — never dominating
 *     the list.
 *   • Simple creation: Name / Kind / Category / Default Amount /
 *     Frequency / Optional description / Active. No internal IDs shown.
 *   • Financial kinds are explicit: Core Fee / Exam Fee / Additional
 *     (event-based template).
 *
 * Mutations write through school-settings-store (addFeeHead /
 * updateFeeHead / archiveFeeHead / restoreFeeHead) — same behaviour as
 * the previous overlay, unchanged business logic.
 */

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, Check, Archive, RotateCcw, Search, Layers,
  Box, Info, ArrowLeft, IndianRupee,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  useSchoolSettingsStore, type FeeHeadConfig, type FeeHeadKind,
} from '@/lib/store/school-settings-store'
import { deriveFeeHeadKind } from '@/lib/store/school-settings-store'
import { useFeeStore } from '@/lib/store/fee-store'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  CATEGORY_ICONS, CATEGORY_CHIPS, CATEGORY_ORDER, KindBadge, kindMeta,
} from './fees-catalogue-shared'
import { MoneyInput } from './money-input'

const TYPE_OPTIONS: FeeHeadConfig['type'][] = [
  'Tuition', 'Admission', 'Annual', 'Transport', 'Lab', 'Library',
  'Exam', 'Activity', 'Board', 'Other',
]

const FREQ_OPTIONS: FeeHeadConfig['frequency'][] = [
  'Monthly', 'Quarterly', 'Half-Yearly', 'Per Term', 'Annual', 'One-Time',
]

const KIND_OPTIONS: FeeHeadKind[] = ['CORE', 'EXAMINATION', 'ADDITIONAL']

export function FeesMasterCatalogue({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const store = useSchoolSettingsStore()
  const feeStructures = useFeeStore((s) => s.feeStructures)

  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftPatch, setDraftPatch] = useState<Partial<FeeHeadConfig>>({})
  const [addingNew, setAddingNew] = useState(false)

  // [open] prop remains so fees-structures can swap this deep page into its
  // content area without touching the parent's layout logic.

  // Escape returns to Fee Structures — same affordance as the Back button.
  // Inputs/textareas are excluded so deleting typed text never bails out
  // of the whole catalogue.
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Usage counts per catalogue id across all class fee structures.
  const usageCounts = useMemo(() => {
    const counts: Record<string, { structures: number; instances: number }> = {}
    for (const fs of feeStructures) {
      const seen = new Set<string>()
      for (const h of fs.components) {
        if (!h.catalogueId) continue
        if (!counts[h.catalogueId]) counts[h.catalogueId] = { structures: 0, instances: 0 }
        counts[h.catalogueId].instances += 1
        seen.add(h.catalogueId)
      }
      for (const id of seen) counts[id].structures += 1
    }
    return counts
  }, [feeStructures])

  const filtered = useMemo(() => {
    return store.fees.feeHeads.filter((h) => {
      if (!showArchived && h.archived) return false
      if (filterCategory !== 'all' && h.type !== filterCategory) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!h.name.toLowerCase().includes(q) && !(h.description ?? '').toLowerCase().includes(q)) {
          return false
        }
      }
      return true
    })
  }, [store.fees.feeHeads, showArchived, filterCategory, search])

  if (!open) return null

  const startEdit = (h: FeeHeadConfig) => {
    setEditingId(h.id)
    setDraftPatch({
      name: h.name,
      type: h.type,
      kind: deriveFeeHeadKind(h),
      defaultAmount: h.defaultAmount,
      frequency: h.frequency,
      description: h.description ?? '',
      isTaxable: h.isTaxable ?? false,
      taxRate: h.taxRate ?? 18,
      gstHsnCode: h.gstHsnCode ?? '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraftPatch({})
  }

  const saveEdit = (id: string) => {
    const patch: Partial<FeeHeadConfig> = { ...draftPatch }
    if (patch.description === '') delete patch.description
    if (patch.gstHsnCode === '') delete patch.gstHsnCode
    store.updateFeeHead(id, patch)
    setEditingId(null)
    setDraftPatch({})
    toast.success('Fee head updated', {
      description: 'Defaults apply to NEW structures only. Existing structures keep their snapshot.',
    })
  }

  const handleArchive = (h: FeeHeadConfig) => {
    if (h.archived) {
      store.restoreFeeHead(h.id)
      toast.success('Restored', { description: `${h.name} is back in the picker.` })
    } else {
      store.archiveFeeHead(h.id)
      toast.info('Archived', {
        description: `${h.name} hidden from the picker. Existing structures keep their snapshot.`,
      })
    }
  }

  const activeCount = store.fees.feeHeads.filter((h) => !h.archived).length
  const archivedCount = store.fees.feeHeads.length - activeCount

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      aria-label="Master Fee Head Catalogue"
      className="space-y-4"
    >

      {/* Benchmark header pair - same recipe as the Fee Structures page:
          back affordance + icon-title + counts LEFT, primary "+ New Fee
          Head" action RIGHT. Ordinary document flow: no fixed chrome and no
          takeover of the application shell (sidebar/header/tabs stay put). */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs gap-1.5 shrink-0"
            onClick={onClose}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Fee Structures
          </Button>
          <div className="min-w-0 hidden sm:block">
            <h2 className="text-base font-bold flex items-center gap-2 truncate">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
                <Layers className="h-4 w-4" />
              </span>
              Master Fee Head Catalogue
            </h2>
            <p className="text-[10px] text-muted-foreground">
              {activeCount} active · {archivedCount} archived · school-wide fee head library
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
          onClick={() => { setAddingNew(true); setEditingId(null) }}
        >
          <Plus className="h-3.5 w-3.5" /> New Fee Head
        </Button>
      </div>

      {/* Compact toolbar: [Search] [Category] [Show archived] */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fee heads…"
            className="h-8 text-xs pl-8"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-8 text-xs w-[130px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORY_ORDER.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="inline-flex items-center gap-1.5 text-[11px] cursor-pointer select-none">
          <Switch checked={showArchived} onCheckedChange={setShowArchived} />
          <span className="text-muted-foreground">Show archived</span>
        </label>
      </div>

      {/* List body - ordinary page flow; the AppShell scrolls naturally.
          Uses the full Fee Management content area (no inner column). */}
      <div className="space-y-3">
        {/* New Fee Head - simple creation experience */}
        <AnimatePresence>
          {addingNew && (
            <NewFeeHeadForm
              onCancel={() => setAddingNew(false)}
              onCreated={() => setAddingNew(false)}
            />
          )}
        </AnimatePresence>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <p className="text-sm font-medium text-muted-foreground">No fee heads match your filters.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Try a different search, or create a new fee head.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Column header (desktop) */}
            <div className="hidden md:grid grid-cols-[minmax(0,2.2fr)_1fr_0.9fr_0.9fr_auto] gap-3 px-4 py-2 bg-muted/40 text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">
              <span>Fee Head</span>
              <span>Category · Frequency</span>
              <span className="text-right">Default Amount</span>
              <span className="text-right">Usage</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-border/60">
              {filtered.map((h) => (
                <CatalogueRow
                  key={h.id}
                  head={h}
                  usage={usageCounts[h.id] ?? { structures: 0, instances: 0 }}
                  editing={editingId === h.id}
                  draftPatch={draftPatch}
                  setDraftPatch={setDraftPatch}
                  onStartEdit={() => { startEdit(h); setAddingNew(false) }}
                  onCancelEdit={cancelEdit}
                  onSaveEdit={() => saveEdit(h.id)}
                  onArchive={() => handleArchive(h)}
                />
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center pt-1 pb-2">
          Editing a fee head updates defaults for new structures only — existing class structures keep their snapshot.
        </p>
      </div>
    </motion.section>
  )
}

// ─── Catalogue row (compact, scannable) ─────────────────────────────────

interface CatalogueRowProps {
  head: FeeHeadConfig
  usage: { structures: number; instances: number }
  editing: boolean
  draftPatch: Partial<FeeHeadConfig>
  setDraftPatch: (patch: Partial<FeeHeadConfig>) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onArchive: () => void
}

function CatalogueRow({
  head, usage, editing, draftPatch, setDraftPatch, onStartEdit, onCancelEdit, onSaveEdit, onArchive,
}: CatalogueRowProps) {
  const kind = deriveFeeHeadKind(head)
  const Icon = CATEGORY_ICONS[head.type] ?? Box
  const chip = CATEGORY_CHIPS[head.type] ?? CATEGORY_CHIPS.Other
  const meta = kindMeta(kind)

  if (editing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 py-3 bg-muted/20"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <Label className="text-[10px] font-semibold mb-1 block">Fee Head Name</Label>
            <Input
              value={draftPatch.name ?? ''}
              onChange={(e) => setDraftPatch({ ...draftPatch, name: e.target.value })}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-[10px] font-semibold mb-1 block">Type</Label>
            <Select
              value={draftPatch.type ?? head.type}
              onValueChange={(v) => setDraftPatch({ ...draftPatch, type: v as FeeHeadConfig['type'] })}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] font-semibold mb-1 block">Financial Kind</Label>
            <Select
              value={draftPatch.kind ?? kind}
              onValueChange={(v) => setDraftPatch({ ...draftPatch, kind: v as FeeHeadKind })}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {KIND_OPTIONS.map((k) => (
                  <SelectItem key={k} value={k}>{kindMeta(k).label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] font-semibold mb-1 block">Frequency</Label>
            <Select
              value={draftPatch.frequency ?? head.frequency}
              onValueChange={(v) => setDraftPatch({ ...draftPatch, frequency: v as FeeHeadConfig['frequency'] })}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FREQ_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] font-semibold mb-1 block">Default Amount (₹)</Label>
            <MoneyInput
              value={draftPatch.defaultAmount ?? 0}
              onChange={(v) => setDraftPatch({ ...draftPatch, defaultAmount: v ?? 0 })}
              className="h-8 text-xs"
              ariaLabel="Default amount"
            />
          </div>
          <div className="flex items-end gap-4 pb-1">
            <label className="inline-flex items-center gap-2 text-[11px] cursor-pointer select-none">
              <Switch
                checked={draftPatch.isTaxable ?? false}
                onCheckedChange={(v) => setDraftPatch({ ...draftPatch, isTaxable: v })}
              />
              GST applies
            </label>
            {draftPatch.isTaxable && (
              <div className="flex-1">
                <Label className="text-[10px] font-semibold mb-1 block">GST %</Label>
                <MoneyInput
                  value={draftPatch.taxRate ?? 18}
                  onChange={(v) => setDraftPatch({ ...draftPatch, taxRate: v ?? 18 })}
                  showPrefix={false}
                  className="h-8 text-xs"
                  ariaLabel="GST rate"
                />
              </div>
            )}
          </div>
          <div className="sm:col-span-2">
            <Label className="text-[10px] font-semibold mb-1 block">Description (optional)</Label>
            <Textarea
              value={draftPatch.description ?? ''}
              onChange={(e) => setDraftPatch({ ...draftPatch, description: e.target.value })}
              placeholder="What does this fee cover?"
              className="text-xs min-h-[48px] resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-1.5 mt-2.5">
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancelEdit}>Cancel</Button>
          <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onSaveEdit}>
            <Check className="h-3 w-3" /> Save Changes
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-[minmax(0,2.2fr)_1fr_0.9fr_0.9fr_auto] gap-x-3 gap-y-1.5 px-4 py-2.5 items-center transition-colors',
        head.archived ? 'opacity-60' : 'hover:bg-muted/30',
      )}
    >
      {/* Name + kind */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md ring-1', chip)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className={cn('text-xs font-semibold truncate', head.archived && 'line-through text-muted-foreground')}>
              {head.name}
            </p>
            <KindBadge kind={kind} />
            {head.archived && (
              <Badge variant="outline" className="text-[8px] h-3.5 py-0 px-1 bg-muted/50">Archived</Badge>
            )}
            {head.isTaxable && (
              <Badge variant="outline" className="text-[8px] h-3.5 py-0 px-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">
                GST {head.taxRate ?? 18}%
              </Badge>
            )}
          </div>
          {/* Description — popover, never dominant */}
          {head.description && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                  aria-label={`Show description for ${head.name}`}
                >
                  <Info className="h-2.5 w-2.5" /> details
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" className="w-64 text-xs leading-relaxed p-3" align="start">
                {head.description}
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Category · Frequency */}
      <div className="flex md:flex-col items-center md:items-start gap-1.5 md:gap-0.5">
        <Badge variant="outline" className={cn('text-[8px] py-0 px-1 h-3.5 gap-0.5', chip)}>{head.type}</Badge>
        <span className="text-[10px] text-muted-foreground">{head.frequency}</span>
      </div>

      {/* Default amount */}
      <div className="md:text-right">
        <span className="inline-flex items-center gap-0.5 text-xs font-bold tabular-nums font-mono text-emerald-700 dark:text-emerald-300">
          <IndianRupee className="h-2.5 w-2.5" />{formatINR(head.defaultAmount, true)}
        </span>
        <p className="text-[9px] text-muted-foreground hidden md:block">{meta.label}</p>
      </div>

      {/* Usage */}
      <div className="md:text-right">
        <p className="text-[11px] tabular-nums text-muted-foreground">
          Used in <span className="font-semibold text-foreground">{usage.structures}</span>{' '}
          structure{usage.structures === 1 ? '' : 's'}
        </p>
        {usage.instances > usage.structures && (
          <p className="text-[9px] text-muted-foreground">{usage.instances} instances</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-0.5 md:justify-end">
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onStartEdit} title="Edit" aria-label={`Edit ${head.name}`}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={cn('h-7 w-7 p-0', head.archived ? 'text-emerald-600' : 'text-amber-600')}
          onClick={onArchive}
          title={head.archived ? 'Restore' : 'Archive'}
          aria-label={`${head.archived ? 'Restore' : 'Archive'} ${head.name}`}
        >
          {head.archived ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  )
}

// ─── New Fee Head — extremely simple creation ───────────────────────────

function NewFeeHeadForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  const store = useSchoolSettingsStore()
  const [name, setName] = useState('')
  const [kind, setKind] = useState<FeeHeadKind>('CORE')
  const [type, setType] = useState<FeeHeadConfig['type']>('Tuition')
  const [amount, setAmount] = useState<number | null>(null)
  const [frequency, setFrequency] = useState<FeeHeadConfig['frequency']>('Monthly')
  const [description, setDescription] = useState('')
  const [active, setActive] = useState(true)

  const trimmedName = name.trim()
  const valid = trimmedName.length > 0 && amount != null && amount > 0

  const submit = () => {
    if (!valid) return
    store.addFeeHead({
      name: trimmedName,
      type,
      kind,
      defaultAmount: amount ?? 0,
      frequency,
      ...(description.trim() ? { description: description.trim() } : {}),
      isTaxable: false,
    })
    toast.success(`Fee head "${trimmedName}" added to the catalogue`, {
      description: `${kindMeta(kind).label} · available when building class fee structures.`,
    })
    onCreated()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-4"
    >
      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-3 flex items-center gap-1.5">
        <Plus className="h-3.5 w-3.5" /> New Fee Head
      </p>

      {/* Kind first — it frames everything else */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        {KIND_OPTIONS.map((k) => {
          const meta = kindMeta(k)
          const selected = kind === k
          return (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(k)
                if (k === 'EXAMINATION' && type !== 'Exam' && type !== 'Board') setType('Exam')
                if (k === 'CORE' && type === 'Exam') setType('Tuition')
              }}
              className={cn(
                'text-left rounded-lg border p-2.5 transition-all',
                selected
                  ? 'border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                  : 'border-border bg-card hover:border-emerald-500/30',
              )}
              aria-pressed={selected}
            >
              <div className="flex items-center justify-between">
                <KindBadge kind={k} />
                {selected && <Check className="h-3.5 w-3.5 text-emerald-600" />}
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug mt-1.5">{meta.hint}</p>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="sm:col-span-2">
          <Label className="text-[10px] font-semibold mb-1 block">Fee Head Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={kind === 'ADDITIONAL' ? 'e.g. Educational Tour' : 'e.g. Sports & Cultural Fee'}
            className="h-8 text-xs"
            autoFocus
          />
        </div>
        <div>
          <Label className="text-[10px] font-semibold mb-1 block">Category</Label>
          <Select value={type} onValueChange={(v) => setType(v as FeeHeadConfig['type'])}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] font-semibold mb-1 block">Default Amount (₹)</Label>
          <MoneyInput
            value={amount}
            onChange={setAmount}
            className="h-8 text-xs"
            ariaLabel="Default amount"
          />
        </div>
        <div>
          <Label className="text-[10px] font-semibold mb-1 block">Frequency</Label>
          <Select value={frequency} onValueChange={(v) => setFrequency(v as FeeHeadConfig['frequency'])}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FREQ_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end pb-1.5">
          <label className="inline-flex items-center gap-2 text-[11px] cursor-pointer select-none">
            <Switch checked={active} onCheckedChange={setActive} />
            {active ? 'Active' : 'Inactive'}
          </label>
        </div>
        <div className="sm:col-span-2">
          <Label className="text-[10px] font-semibold mb-1 block">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this fee cover? When is it charged?"
            className="text-xs min-h-[44px] resize-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-3">
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}>Cancel</Button>
        <Button
          size="sm"
          className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={!valid}
          onClick={submit}
        >
          <Check className="h-3 w-3" /> Create Fee Head
        </Button>
      </div>
    </motion.div>
  )
}
