'use client'

/**
 * fees-normalize-heads — Phase 6 feature.
 *
 * Two surfaces:
 *
 *   1. `FeesNormalizeHeadsBanner` — collapsible amber banner that sits
 *      between the Class Coverage Matrix and the structure grid in
 *      fees-structures.tsx. Auto-hides when 0 uncatalogued heads exist
 *      (so a fully-migrated school never sees it). Shows counts +
 *      "Normalize now" button.
 *
 *   2. `FeesNormalizeHeadsDrawer` — right-side drawer that groups every
 *      uncatalogued per-structure FeeHead by structure name and lets
 *      the principal:
 *        - Pick a master catalogue entry per head (writes through
 *          linkHeadToCatalogue).
 *        - Bulk-link ALL heads with the SAME name across ALL structures
 *          to a single catalogue entry in one click (writes through
 *          bulkLinkHeadsByName).
 *        - Unlink a head (clears catalogueId — the head becomes a
 *          standalone custom head again).
 *
 * Why this exists (brief section 24 — "Remove duplication not
 * functionality"):
 *   - Before Phase 6, a per-structure FeeHead could be created via
 *     the Add-Head form's plain text input — no way to bind it to the
 *     master catalogue post-hoc. So schools with a long history of
 *     hand-typed heads would never converge on a clean catalogue.
 *   - The Normalize tool is the inverse of the Phase 6 catalogue-aware
 *     picker: it surfaces legacy/custom heads and lets the principal
 *     link them in bulk. Pairs naturally with the picker — together
 *     they make the catalogue the single source of truth.
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Search, Link2, Unlink, AlertTriangle, Check, ChevronRight,
  Layers, RefreshCw, Sparkles, AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { formatINR } from '@/lib/format'
import { toast } from 'sonner'
import {
  useFeeStore,
  type FeeStructureConfig,
  type FeeHead,
  type FeeHeadCategory,
} from '@/lib/store/fee-store'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
// PHASE 6 — shared catalogue UI (same chips/badges as the Master
// Catalogue drawer + the new Add-Head picker).
import {
  CATEGORY_ICONS,
  CATEGORY_CHIPS,
  CATEGORY_ORDER,
  CategoryBadge,
  FrequencyBadge,
  GstBadge,
  AmountBadge,
  CatalogueBoundPill,
  CustomHeadPill,
} from './fees-catalogue-shared'

// ─── Helpers ───────────────────────────────────────────────────────────

interface UncataloguedHead {
  structureId: string
  structureName: string
  classLevel: string
  head: FeeHead
}

function collectUncatalogued(structures: FeeStructureConfig[]): UncataloguedHead[] {
  const out: UncataloguedHead[] = []
  for (const s of structures) {
    for (const h of s.components) {
      if (!h.catalogueId) {
        out.push({
          structureId: s.id,
          structureName: s.className,
          classLevel: s.classLevel,
          head: h,
        })
      }
    }
  }
  return out
}

/** Group uncatalogued heads by NAME so the bulk-link action is one click. */
function groupByName(heads: UncataloguedHead[]): Array<{
  name: string
  entries: UncataloguedHead[]
  structures: number
}> {
  const map = new Map<string, UncataloguedHead[]>()
  for (const h of heads) {
    const key = h.head.name.trim().toLowerCase()
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(h)
  }
  return Array.from(map.entries()).map(([key, entries]) => ({
    name: entries[0].head.name, // preserve original casing
    entries,
    structures: new Set(entries.map((e) => e.structureId)).size,
  })).sort((a, b) => b.entries.length - a.entries.length)
}

// ─── Banner ────────────────────────────────────────────────────────────

export function FeesNormalizeHeadsBanner({
  feeStructures,
  onOpen,
}: {
  feeStructures: FeeStructureConfig[]
  onOpen: () => void
}) {
  const uncatalogued = React.useMemo(
    () => collectUncatalogued(feeStructures),
    [feeStructures],
  )
  const structures = React.useMemo(
    () => new Set(uncatalogued.map((u) => u.structureId)).size,
    [uncatalogued],
  )
  // Auto-hide when nothing to normalize — no banner clutter for a
  // fully-migrated school. The brief explicitly says "Remove
  // duplication not functionality" — duplicating an empty state would
  // be visual clutter with zero information value.
  if (uncatalogued.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 flex items-center gap-2"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/15 ring-1 ring-amber-500/30">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-200">
          {uncatalogued.length} uncatalogued fee head{uncatalogued.length === 1 ? '' : 's'} across {structures} structure{structures === 1 ? '' : 's'}
        </p>
        <p className="text-[10px] text-amber-700/80 dark:text-amber-300/80 mt-0.5">
          These heads aren&apos;t linked to the master catalogue — school-wide default edits won&apos;t propagate to them.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-[10px] gap-1 border-amber-500/40 text-amber-800 dark:text-amber-200 hover:bg-amber-500/15 shrink-0"
        onClick={onOpen}
      >
        <Link2 className="h-3 w-3" /> Normalize now
        <ChevronRight className="h-3 w-3" />
      </Button>
    </motion.div>
  )
}

// ─── Drawer ────────────────────────────────────────────────────────────

export function FeesNormalizeHeadsDrawer({
  open,
  onClose,
  feeStructures,
}: {
  open: boolean
  onClose: () => void
  feeStructures: FeeStructureConfig[]
}) {
  const feeHeads = useSchoolSettingsStore((s) => s.fees.feeHeads)
  const linkHeadToCatalogue = useFeeStore((s) => s.linkHeadToCatalogue)
  const bulkLinkHeadsByName = useFeeStore((s) => s.bulkLinkHeadsByName)

  const [search, setSearch] = React.useState('')
  const [tick, setTick] = React.useState(0) // forces recompute after a link

  // Re-collect on every open + after every link (tick). The structures
  // array reference can stay the same across renders — the memo dep on
  // `tick` ensures we re-collect after each mutation.
  const uncatalogued = React.useMemo(
    () => collectUncatalogued(feeStructures),
    [feeStructures, tick],
  )
  const grouped = React.useMemo(
    () => groupByName(uncatalogued.filter((u) => {
      if (!search.trim()) return true
      const q = search.trim().toLowerCase()
      return u.head.name.toLowerCase().includes(q) || u.structureName.toLowerCase().includes(q)
    })),
    [uncatalogued, search],
  )

  // Track which heads are currently being linked (for the spinner state).
  const [linkingHeadIds, setLinkingHeadIds] = React.useState<Set<string>>(new Set())
  const [bulkLinkingNames, setBulkLinkingNames] = React.useState<Set<string>>(new Set())

  const handleLink = (structureId: string, headId: string, catalogueId: string, headName: string) => {
    setLinkingHeadIds((prev) => new Set(prev).add(headId))
    // Derive category from the picked catalogue entry.
    const entry = feeHeads.find((h) => h.id === catalogueId)
    const category: FeeHeadCategory | undefined = entry?.type
    setTimeout(() => {
      const result = linkHeadToCatalogue(structureId, headId, catalogueId, category)
      setLinkingHeadIds((prev) => {
        const next = new Set(prev)
        next.delete(headId)
        return next
      })
      setTick((t) => t + 1)
      if (result.success) {
        toast.success('Linked to catalogue', {
          description: `"${headName}" is now bound to ${entry?.name ?? catalogueId}.`,
        })
      } else {
        toast.error('Failed to link', { description: result.error })
      }
    }, 250) // small delay so the spinner is visible
  }

  const handleUnlink = (structureId: string, headId: string, headName: string) => {
    linkHeadToCatalogue(structureId, headId, '', undefined)
    setTick((t) => t + 1)
    toast.info('Unlinked', {
      description: `"${headName}" is back to a custom head.`,
    })
  }

  const handleBulkLink = (name: string, catalogueId: string, count: number) => {
    setBulkLinkingNames((prev) => new Set(prev).add(name))
    setTimeout(() => {
      const result = bulkLinkHeadsByName(name, catalogueId)
      setBulkLinkingNames((prev) => {
        const next = new Set(prev)
        next.delete(name)
        return next
      })
      setTick((t) => t + 1)
      toast.success('Bulk-linked', {
        description: `Linked ${result.heads} head${result.heads === 1 ? '' : 's'} named "${name}" across ${result.structures} structure${result.structures === 1 ? '' : 's'}.`,
      })
      if (count === uncatalogued.length) {
        // All heads linked — auto-close after a beat so the principal
        // sees the success state.
        setTimeout(() => onClose(), 600)
      }
    }, 350)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            className="fixed top-0 right-0 z-50 h-full w-full sm:w-[520px] bg-card border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-500/15 ring-1 ring-amber-500/30">
                  <Link2 className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">Normalize uncatalogued heads</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Link custom heads to the master catalogue in one click
                  </p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Summary + search */}
            <div className="px-4 py-2 border-b border-border space-y-2">
              <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">
                  {uncatalogued.length} uncatalogued
                </Badge>
                <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4">
                  across {new Set(uncatalogued.map((u) => u.structureId)).size} structures
                </Badge>
                <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4">
                  {grouped.length} unique names
                </Badge>
                {feeHeads.filter((h) => !h.archived).length > 0 && (
                  <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                    {feeHeads.filter((h) => !h.archived).length} catalogue entries available
                  </Badge>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by head or structure name…"
                  className="pl-8 h-8 text-xs bg-card"
                />
              </div>
            </div>

            {/* Body — grouped list */}
            <div className="flex-1 overflow-y-auto">
              {grouped.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30 mb-2">
                    <Check className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold">All heads linked</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Every per-structure fee head is bound to the master catalogue. School-wide defaults will propagate cleanly.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] mt-3 gap-1"
                    onClick={onClose}
                  >
                    <ChevronRight className="h-3 w-3" /> Close
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {grouped.map((group) => {
                    const isBulkLinking = bulkLinkingNames.has(group.name)
                    return (
                      <motion.div
                        key={group.name}
                        layout
                        className="px-4 py-3"
                      >
                        {/* Group header: name + bulk-link popover */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className="text-xs font-semibold truncate">{group.name}</p>
                            <Badge variant="outline" className="text-[8px] py-0 px-1 h-3.5 shrink-0">
                              {group.entries.length}× · {group.structures} struct.
                            </Badge>
                          </div>
                          <BulkLinkPopover
                            feeHeads={feeHeads}
                            disabled={isBulkLinking}
                            onPick={(catalogueId) => handleBulkLink(group.name, catalogueId, group.entries.length)}
                            trigger={
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isBulkLinking}
                                className="h-6 text-[10px] gap-1 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 shrink-0"
                              >
                                {isBulkLinking ? (
                                  <>
                                    <RefreshCw className="h-3 w-3 animate-spin" /> Linking…
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-3 w-3" /> Bulk-link all
                                  </>
                                )}
                              </Button>
                            }
                          />
                        </div>

                        {/* Per-structure entries */}
                        <div className="space-y-1.5">
                          {group.entries.map((entry) => {
                            const isLinking = linkingHeadIds.has(entry.head.id)
                            return (
                              <div
                                key={entry.head.id}
                                className="rounded-md border border-border/60 bg-background/50 px-2.5 py-1.5 flex items-center gap-2"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    <span className="font-medium text-foreground">{entry.structureName}</span>
                                    <span className="text-muted-foreground/70"> · {entry.classLevel}</span>
                                  </p>
                                  <div className="flex items-center gap-1 flex-wrap mt-0.5">
                                    <AmountBadge amount={entry.head.amount} />
                                    <FrequencyBadge frequency={entry.head.frequency} />
                                    {entry.head.mandatory ? (
                                      <Badge variant="outline" className="text-[7px] py-0 px-1 h-3.5">Mandatory</Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[7px] py-0 px-1 h-3.5 text-muted-foreground">Optional</Badge>
                                    )}
                                  </div>
                                </div>
                                <SingleLinkPopover
                                  feeHeads={feeHeads}
                                  disabled={isLinking}
                                  onPick={(catalogueId) => handleLink(entry.structureId, entry.head.id, catalogueId, entry.head.name)}
                                  trigger={
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={isLinking}
                                      className="h-6 text-[10px] gap-1"
                                    >
                                      {isLinking ? (
                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <>
                                          <Link2 className="h-3 w-3" /> Link
                                        </>
                                      )}
                                    </Button>
                                  }
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                                  onClick={() => handleUnlink(entry.structureId, entry.head.id, entry.head.name)}
                                  title="Mark as standalone custom head (clears catalogue binding)"
                                >
                                  <Unlink className="h-3 w-3" />
                                </Button>
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between gap-2">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Linking only updates the catalogue binding — amounts stay as-is on each structure.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] gap-1 shrink-0"
                onClick={onClose}
              >
                Close <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Internal: Bulk Link popover (one name → one catalogue entry) ──────

function BulkLinkPopover({
  feeHeads,
  disabled,
  onPick,
  trigger,
}: {
  feeHeads: ReturnType<typeof useSchoolSettingsStore.getState>['fees']['feeHeads']
  disabled: boolean
  onPick: (catalogueId: string) => void
  trigger: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [filterCat, setFilterCat] = React.useState<FeeHeadCategory | 'all'>('all')

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return feeHeads.filter((h) => {
      if (h.archived) return false
      if (filterCat !== 'all' && h.type !== filterCat) return false
      if (!q) return true
      return h.name.toLowerCase().includes(q) || (h.description ?? '').toLowerCase().includes(q)
    })
  }, [feeHeads, search, filterCat])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span>{trigger}</span>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={4}>
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search catalogue…"
              className="pl-8 h-8 text-xs bg-card"
              autoFocus
            />
          </div>
        </div>
        <div className="px-2 py-1.5 border-b border-border flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterCat('all')}
            className={cn(
              'shrink-0 text-[9px] px-1.5 py-0.5 rounded-full transition-colors',
              filterCat === 'all' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            All
          </button>
          {CATEGORY_ORDER.map((cat) => {
            const Icon = CATEGORY_ICONS[cat]
            const chip = CATEGORY_CHIPS[cat]
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCat(cat)}
                title={`Filter by ${cat}`}
                className={cn(
                  'shrink-0 inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full transition-all',
                  filterCat === cat ? cn(chip, 'ring-1 font-medium') : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                <Icon className="h-2.5 w-2.5" /> {cat}
              </button>
            )
          })}
        </div>
        <div className="max-h-56 overflow-y-auto divide-y divide-border/30">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted-foreground text-center">No catalogue entries match.</p>
          ) : (
            filtered.map((h) => {
              const Icon = CATEGORY_ICONS[h.type] ?? Layers
              const chip = CATEGORY_CHIPS[h.type] ?? CATEGORY_CHIPS.Other
              return (
                <button
                  key={h.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onPick(h.id)
                    setOpen(false)
                    setSearch('')
                  }}
                  className="w-full px-2.5 py-2 flex items-start gap-2 text-left hover:bg-muted/40 transition-colors disabled:opacity-50"
                >
                  <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md ring-1 mt-0.5', chip)}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{h.name}</p>
                    <div className="flex items-center gap-1 flex-wrap mt-0.5">
                      <CategoryBadge category={h.type} withIcon={false} />
                      <FrequencyBadge frequency={h.frequency} />
                      {h.isTaxable && <GstBadge isTaxable taxRate={h.taxRate} />}
                      <AmountBadge amount={h.defaultAmount} />
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
        <div className="border-t border-border bg-muted/30 px-3 py-1.5">
          <p className="text-[9px] text-muted-foreground">
            Picking links every head with this name across all structures. Amounts stay as-is per structure.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── Internal: Single Link popover (one head → one catalogue entry) ───

function SingleLinkPopover({
  feeHeads,
  disabled,
  onPick,
  trigger,
}: {
  feeHeads: ReturnType<typeof useSchoolSettingsStore.getState>['fees']['feeHeads']
  disabled: boolean
  onPick: (catalogueId: string) => void
  trigger: React.ReactNode
}) {
  // Reuse the bulk-link popover — same UX, smaller surface. The trigger
  // is passed in so the parent can show per-row spinner state.
  return (
    <BulkLinkPopover
      feeHeads={feeHeads}
      disabled={disabled}
      onPick={onPick}
      trigger={trigger}
    />
  )
}
