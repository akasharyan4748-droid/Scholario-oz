'use client'

/**
 * FeesStructuresSection — Versioned Fee Structure admin grid (Phase 8).
 *
 * - Per-class structure cards (5 categories by default, plus any
 *   user-created drafts)
 * - Each card shows: structure name, level, current version, status,
 *   effective date, total, heads count, last updated
 * - Card actions: Open (detail drawer), History, More (dropdown)
 * - Drawer actions: Edit, Duplicate, Create New Version, View History,
 *   Compare Versions, Archive, Restore, Delete (with safeguards)
 * - All actions wire to real store mutations (no toast-only placeholders)
 *
 * Status pills (per card):
 *   CURRENT (emerald) · SCHEDULED (amber) · DRAFT (slate) · ARCHIVED (muted)
 *
 * Versioning note: the "Fee Structure History" banner lives once in
 * Settings (Fees → Settings) to avoid a 4-file verbatim duplication.
 * The structure cards below carry their own v{n} + status badge which
 * conveys the same versioning information.
 */

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers, History, MoreHorizontal, Plus, Users, ChevronRight, Calendar,
  FileText, Sparkles, Archive, Copy, Trash2, AlertTriangle, ShieldAlert,
  BookOpen, GraduationCap, ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useFeeData,
  useFeeStore,
  type FeeStructureConfig,
  type FeeStructureStatus,
} from '@/lib/store/fee-store'
import { useStudentsStore } from '@/lib/store/students-store'
// PHASE 5 — class catalogue (used by Bulk Apply to Level + Coverage Matrix).
import { ACADEMIC_CLASSES } from '@/lib/mock/academic/classes'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { FeesStructuresDetailDrawer } from './fees-structures-detail'
import { FeesStructuresHistoryDialog } from './fees-structures-history'
import { VersionStatusPill, StructureStatusBadge } from './fees-structures-shared'
import { FeesMasterCatalogue } from './fees-master-catalogue'
// PHASE 6 — Normalize Uncatalogued Heads tool. Banner + drawer that
// surface every per-structure FeeHead lacking a catalogueId binding and
// let the principal link it to a master catalogue entry in one click.
import {
  FeesNormalizeHeadsBanner,
  FeesNormalizeHeadsDrawer,
} from './fees-normalize-heads'
import { toast } from 'sonner'

const CATEGORY_COLORS: Record<string, { chip: string; bar: string; dot: string }> = {
  'Pre-Primary': { chip: 'bg-cyan-500/10 text-cyan-600 ring-cyan-500/20', bar: 'oklch(0.7 0.15 200)', dot: 'bg-cyan-500' },
  'Primary': { chip: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20', bar: 'oklch(0.55 0.14 162)', dot: 'bg-emerald-500' },
  'Middle': { chip: 'bg-amber-500/10 text-amber-600 ring-amber-500/20', bar: 'oklch(0.65 0.16 75)', dot: 'bg-amber-500' },
  'Secondary': { chip: 'bg-violet-500/10 text-violet-600 ring-violet-500/20', bar: 'oklch(0.6 0.18 300)', dot: 'bg-violet-500' },
  // FEE-PER-CLASS — the seed now uses 'Senior Secondary' (was 'Senior').
  // Keep 'Senior' as a legacy alias for any user-created structures
  // that may still use it.
  'Senior Secondary': { chip: 'bg-rose-500/10 text-rose-600 ring-rose-500/20', bar: 'oklch(0.62 0.2 25)', dot: 'bg-rose-500' },
  'Senior': { chip: 'bg-rose-500/10 text-rose-600 ring-rose-500/20', bar: 'oklch(0.62 0.2 25)', dot: 'bg-rose-500' },
}

export function FeesStructuresSection({ data, onNavigate }: { data: ReturnType<typeof useFeeData>; onNavigate?: (moduleKey: string) => void }) {
  const { feeStructures, versions } = data
  const students = useStudentsStore((s) => s.students)
  const archiveFeeStructureVersion = useFeeStore((s) => s.archiveFeeStructureVersion)
  const createFeeStructure = useFeeStore((s) => s.createFeeStructure)
  const deleteFeeStructure = useFeeStore((s) => s.deleteFeeStructure)

  const [openStructureId, setOpenStructureId] = useState<string | null>(null)
  const [historyStructure, setHistoryStructure] = useState<FeeStructureConfig | null>(null)
  // Fix 4 (FEE-CORRECT): real delete confirmation dialog state.
  // The previous "Delete" menu item only showed a toast — now we open a
  // proper confirmation dialog (for drafts) or toast the published /
  // financial-record guard error.
  const [deleteTarget, setDeleteTarget] = useState<FeeStructureConfig | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  // PHASE 5 — Master Catalogue drawer state (school-wide fee-head
  // catalogue surfaced directly inside Fee Management).
  const [catalogueOpen, setCatalogueOpen] = useState(false)

  // PHASE 5 — Bulk Apply to Level dialog state. Lets the principal pick
  // a source structure (e.g. Class 2 Primary) and apply it to all OTHER
  // classes in the same level (Class 4 Primary in the seed catalogue)
  // in one click. Each target gets its own draft structure with the
  // target classId/applicableClassIds so it's a true per-class binding.
  const [bulkApplyOpen, setBulkApplyOpen] = useState<FeeStructureConfig | null>(null)
  const [bulkApplySubmitting, setBulkApplySubmitting] = useState(false)

  // PHASE 5 — listen for `fee-open-structure` events from the Coverage
  // Matrix (which uses CustomEvent to ask this parent to open a
  // structure's detail drawer by id). Registering in useEffect keeps the
  // listener stable across renders.
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      if (typeof id === 'string') setOpenStructureId(id)
    }
    window.addEventListener('fee-open-structure', handler)
    return () => window.removeEventListener('fee-open-structure', handler)
  }, [])

  // PHASE 6 — listen for `fee-open-catalogue` events so the Add-Head
  // form (inside the detail drawer) can ask this parent to open the
  // Master Catalogue drawer. The drawer remains the single source of
  // truth for catalogue administration — the Add-Head form never edits
  // the catalogue directly.
  useEffect(() => {
    const handler = () => setCatalogueOpen(true)
    window.addEventListener('fee-open-catalogue', handler)
    return () => window.removeEventListener('fee-open-catalogue', handler)
  }, [])

  // PHASE 6 — Normalize Uncatalogued Heads drawer state. Surfaced as
  // a collapsible amber banner above the structure grid when there are
  // any per-structure heads without a catalogueId binding.
  const [normalizeOpen, setNormalizeOpen] = useState(false)

  // FEE-CREATE-DRAWER — "Create New Structure" now opens the same
  // right-side detail drawer used by existing structures, but in
  // `mode='create'`. The dashed card's onClick toggles `createMode`
  // (no record is written); the drawer handles its own Save Draft /
  // Publish New Version / Cancel flow. On Save Draft (or Publish) the
  // drawer calls `onCreated(id)` which closes create-mode and re-opens
  // the drawer in view mode with the new structure id — exactly the
  // flow the previous modal used, minus the modal.
  const [createMode, setCreateMode] = useState(false)

  const openCreateDrawer = () => {
    setCreateMode(true)
  }

  const closeCreateDrawer = () => {
    setCreateMode(false)
  }

  // FEE-CREATE-DRAWER — when the drawer's own Delete action succeeds,
  // close the drawer if it was showing the deleted structure.
  const handleStructureDeleted = (structureId: string) => {
    if (openStructureId === structureId) setOpenStructureId(null)
  }

  // Compute current status for each structure by looking up its CURRENT
  // version. If no current version exists (e.g. all archived), fall back
  // to the most recent version's status.
  const structureStatus = useMemo(() => {
    const map = new Map<string, FeeStructureStatus>()
    for (const s of feeStructures) {
      const current = versions.find((v) => v.structureId === s.id && v.status === 'current')
      if (current) {
        map.set(s.id, 'current')
        continue
      }
      // If no current, find the most recent version (newest createdAt)
      const recent = versions
        .filter((v) => v.structureId === s.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      map.set(s.id, recent?.status ?? 'current')
    }
    return map
  }, [feeStructures, versions])

  // FEE-PER-CLASS — count students by their EXACT className so each
  // per-class card reports only the students in that specific class
  // (e.g. Class 9 card → 4 students, not 8 Secondary students).
  // `studentsByLevel` is kept as a fallback for structures with a
  // className that no real student has (e.g. custom structures,
  // duplicated drafts whose className is "Class 9 — Draft Copy").
  const studentsByClassName = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of students) {
      if (s.status !== 'Active') continue
      counts[s.className] = (counts[s.className] ?? 0) + 1
    }
    return counts
  }, [students])

  const studentsByLevel = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of students) {
      if (s.status !== 'Active') continue
      const level =
        s.className.includes('11') || s.className.includes('12') ? 'Senior Secondary' :
        s.className.includes('9') || s.className.includes('10') ? 'Secondary' :
        s.className.match(/Class [6-8]/) ? 'Middle' :
        s.className.match(/Class [1-5]/) ? 'Primary' : 'Pre-Primary'
      counts[level] = (counts[level] ?? 0) + 1
    }
    return counts
  }, [students])

  const openStructure = feeStructures.find((s) => s.id === openStructureId) ?? null

  // Per-card actions
  const handleDuplicate = (s: FeeStructureConfig) => {
    const newId = createFeeStructure({
      category: `${s.category} (Copy)`,
      className: `${s.className} — Draft Copy`,
      classLevel: s.classLevel,
      heads: s.components.map((h) => ({ ...h, id: `FH-${Date.now().toString(36)}-${h.id}` })),
      effectiveFrom: new Date().toISOString().split('T')[0],
      notes: `Duplicated from ${s.id} v${s.version}`,
      actor: 'Principal',
    })
    if (newId) toast.success('Structure duplicated as draft', { description: `New structure ${newId} created.` })
  }

  // PHASE 5 — Bulk Apply to Level. Computes the list of OTHER classes in
  // the same level as the source structure (excluding classes already
  // covered by their own per-class structure). Returns the list so the
  // confirmation dialog can show the user exactly which classes will get
  // a new draft structure. The actual mutation runs in `confirmBulkApply`.
  const computeBulkApplyTargets = (source: FeeStructureConfig) => {
    const existingClassIds = new Set<string>()
    for (const fs of feeStructures) {
      if (fs.classId) existingClassIds.add(fs.classId)
      if (fs.applicableClassIds) for (const id of fs.applicableClassIds) existingClassIds.add(id)
    }
    return ACADEMIC_CLASSES
      .filter((c) => c.level === source.classLevel && !existingClassIds.has(c.id))
      .filter((c) => !(source.applicableClassIds ?? []).includes(c.id))
      .map((c) => ({ id: c.id, name: c.name, level: c.level, stream: c.stream }))
  }

  const confirmBulkApply = (source: FeeStructureConfig) => {
    const targets = computeBulkApplyTargets(source)
    if (targets.length === 0) {
      toast.info('No uncovered classes', {
        description: `All classes in the ${source.classLevel} level already have a per-class structure.`,
      })
      setBulkApplyOpen(null)
      return
    }
    setBulkApplySubmitting(true)
    // Slight delay so the user sees the "Working…" state on the dialog.
    setTimeout(() => {
      const created: string[] = []
      for (const t of targets) {
        const newId = createFeeStructure({
          category: source.classLevel,
          className: t.name,
          classLevel: source.classLevel,
          heads: source.components.map((h) => ({ ...h, id: `FH-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}-${h.id}` })),
          effectiveFrom: new Date().toISOString().split('T')[0],
          notes: `Bulk-applied from ${source.id} (${source.className}) via Bulk Apply to Level.`,
          actor: 'Principal',
          classId: t.id,
          applicableClassIds: [t.id],
          ...(source.examFeeSchedule ? { examFeeSchedule: source.examFeeSchedule } : {}),
        })
        if (newId) created.push(newId)
      }
      setBulkApplySubmitting(false)
      setBulkApplyOpen(null)
      toast.success(`Applied to ${created.length} classes`, {
        description: `${source.className}'s structure copied to ${targets.map((t) => t.name).join(', ')} as drafts. Review + publish each to make them live.`,
      })
    }, 350)
  }

  const handleArchive = (s: FeeStructureConfig) => {
    // Find the current version
    const current = versions.find((v) => v.structureId === s.id && v.status === 'current')
    if (!current) {
      toast.error('No current version to archive')
      return
    }
    if (!confirm(`Archive the CURRENT version (v${current.version}) of ${s.className}?\n\nThis will leave the structure with NO current version — only do this if you have published a replacement.`)) return
    archiveFeeStructureVersion(current.id, 'Principal')
    toast.info('Version archived', { description: `v${current.version} of ${s.className} archived.` })
  }

  // Fix 4 (FEE-CORRECT): real delete handler. Decides what to do based on
  // the structure's current version status:
  //   - DRAFT (no published version yet) → open a confirmation dialog
  //   - CURRENT / PUBLISHED → toast "cannot delete, archive instead"
  //   - ARCHIVED + has financial records → toast "financial records depend on it"
  //   - ARCHIVED + no records → open a confirmation dialog
  // The actual mutation runs only after the user confirms.
  const handleDelete = (s: FeeStructureConfig) => {
    const sVersions = versions.filter((v) => v.structureId === s.id)
    const hasCurrent = sVersions.some((v) => v.status === 'current')
    const hasScheduled = sVersions.some((v) => v.status === 'scheduled')
    if (hasCurrent) {
      toast.error('Cannot delete a published structure', {
        description: 'Archive the current version instead — published structures affect live student accounts.',
      })
      return
    }
    if (hasScheduled) {
      toast.error('Cannot delete — scheduled version exists', {
        description: 'Cancel the scheduled version first via the detail drawer.',
      })
      return
    }
    setDeleteTarget(s)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setDeleteSubmitting(true)
    // Slight delay so the user sees the "Working…" state on the dialog.
    setTimeout(() => {
      const result = deleteFeeStructure(deleteTarget.id, 'Principal')
      setDeleteSubmitting(false)
      if (!result.success) {
        toast.error('Delete failed', { description: result.error })
        return
      }
      toast.success('Structure deleted', {
        description: `${deleteTarget.className} was removed. Financial records and audit history preserved.`,
      })
      // If the deleted structure was open in the drawer, close it.
      if (openStructureId === deleteTarget.id) setOpenStructureId(null)
      setDeleteTarget(null)
    }, 250)
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header bar with summary + create button */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-muted/40">
            <Layers className="h-2.5 w-2.5" /> {feeStructures.length} structures
          </Badge>
          <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20">
            {versions.filter((v) => v.status === 'current').length} current
          </Badge>
          {versions.filter((v) => v.status === 'scheduled').length > 0 && (
            <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20">
              <Sparkles className="h-2.5 w-2.5" /> {versions.filter((v) => v.status === 'scheduled').length} scheduled
            </Badge>
          )}
          {versions.filter((v) => v.status === 'draft').length > 0 && (
            <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20">
              {versions.filter((v) => v.status === 'draft').length} draft
            </Badge>
          )}
        </div>
        {/* PHASE 5 — Master Catalogue drawer launcher. Sits next to the
            existing summary chips so the principal sees it as a peer
            action, not buried in a menu. */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px] gap-1 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
            onClick={() => setCatalogueOpen(true)}
            title="Manage the school-wide master fee-head catalogue"
          >
            <BookOpen className="h-3 w-3" /> Master Catalogue
          </Button>
        </div>
      </div>


      {/* PHASE 6 — Normalize Uncatalogued Heads banner. Auto-hides when
          there are no uncatalogued heads (so a school that has fully
          migrated to the master catalogue never sees it). Amber theme
          matches the "needs attention" semantic — distinct from
          emerald (good) and rose (destructive). */}
      <FeesNormalizeHeadsBanner
        feeStructures={feeStructures}
        onOpen={() => setNormalizeOpen(true)}
      />

      {/* Structure grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {feeStructures.map((f, i) => {
          // FEE-PER-CLASS — `category` and `classLevel` are now the same
          // value (the spec says "category can be removed or set to the
          // same value as classLevel"); fall back to `classLevel` when
          // `category` is empty (e.g. a draft created before the
          // FEE-PER-CLASS migration may have an empty category).
          const accentKey = f.category || f.classLevel
          const accent = CATEGORY_COLORS[accentKey] ?? CATEGORY_COLORS['Primary']
          // FEE-PER-CLASS — count students by EXACT className first
          // (e.g. Class 9 card → 4 Class 9 students). Falls back to
          // classLevel substring matching when no student has the
          // exact className (e.g. a duplicated draft with className
          // "Class 9 — Draft Copy").
          const studentsCount =
            studentsByClassName[f.className] ?? studentsByLevel[f.classLevel] ?? 0
          const status = structureStatus.get(f.id) ?? 'current'
          // Find the most recent version to show last-updated info.
          const recentVersion = versions
            .filter((v) => v.structureId === f.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
          const activeHeads = f.components.filter((c) => c.active)
          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border bg-card p-3 hover:border-emerald-500/30 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setOpenStructureId(f.id)}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1', accent.chip)}>
                    <Layers className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    {/* FEE-PER-CLASS — title is the class name (e.g.
                        "Class 9"); subtitle is the level (e.g.
                        "Secondary"). No "Structure Name" — the card
                        title IS the class name. */}
                    <p className="text-xs font-semibold truncate">{f.className}</p>
                    <p className="text-[9px] text-muted-foreground">{f.classLevel}</p>
                  </div>
                </div>
                <StructureStatusBadge status={status} version={f.version} />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                <div className="rounded-md bg-muted/30 px-1.5 py-1">
                  <p className="text-[8px] uppercase text-muted-foreground font-semibold">Annual</p>
                  <p className="text-[11px] font-bold tabular-nums mt-0.5">{formatINR(f.annual, true)}</p>
                </div>
                <div className="rounded-md bg-muted/30 px-1.5 py-1">
                  <p className="text-[8px] uppercase text-muted-foreground font-semibold">Heads</p>
                  <p className="text-[11px] font-bold tabular-nums mt-0.5">{activeHeads.length}</p>
                </div>
                <div className="rounded-md bg-muted/30 px-1.5 py-1">
                  <p className="text-[8px] uppercase text-muted-foreground font-semibold flex items-center gap-0.5"><Users className="h-2 w-2" /> Students</p>
                  <p className="text-[11px] font-bold tabular-nums mt-0.5">{studentsCount}</p>
                </div>
              </div>

              {/* Components preview (top 4) */}
              <div className="space-y-1 mb-2 max-h-24 overflow-hidden">
                {activeHeads.slice(0, 4).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-[10px] rounded-md hover:bg-muted/30 px-1.5 py-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', accent.dot)} />
                      <span className="font-medium truncate">{c.name}</span>
                      {c.mandatory && <Badge variant="outline" className="text-[7px] py-0 px-1 h-3">REQ</Badge>}
                    </div>
                    <span className="font-mono font-semibold tabular-nums shrink-0">{formatINR(c.amount, true)}</span>
                  </div>
                ))}
                {activeHeads.length > 4 && (
                  <p className="text-[9px] text-muted-foreground px-1.5">+ {activeHeads.length - 4} more</p>
                )}
                {activeHeads.length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic px-1.5 py-1">No active heads</p>
                )}
              </div>

              {/* Footer metadata */}
              <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[9px] text-muted-foreground">
                <span className="inline-flex items-center gap-1" title="Effective from">
                  <Calendar className="h-2.5 w-2.5" /> {formatDate(f.effectiveFrom)}
                </span>
                {recentVersion && (
                  <span className="inline-flex items-center gap-1" title={`Last updated by ${recentVersion.createdBy}`}>
                    <History className="h-2.5 w-2.5" /> {formatDate(recentVersion.createdAt)}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 pt-2 mt-2 border-t border-border/40" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="default"
                  className="h-6 text-[9px] gap-1 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setOpenStructureId(f.id)}
                >
                  Open <ChevronRight className="h-2.5 w-2.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[9px] gap-1 px-1.5"
                  onClick={() => setHistoryStructure(f)}
                  title="View history"
                >
                  <History className="h-2.5 w-2.5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" title="More">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setOpenStructureId(f.id)}>
                      <FileText className="h-3 w-3 mr-2" /> Open detail
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setHistoryStructure(f)}>
                      <History className="h-3 w-3 mr-2" /> View history
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(f)}>
                      <Copy className="h-3 w-3 mr-2" /> Duplicate as draft
                    </DropdownMenuItem>
                    {/* PHASE 5 — Bulk Apply to Level. Creates draft
                        structures for every uncovered class in the
                        same level. Confirmation dialog shows the exact
                        list of target classes before any mutation. */}
                    <DropdownMenuItem
                      onClick={() => setBulkApplyOpen(f)}
                      className="text-emerald-700 dark:text-emerald-300 focus:text-emerald-800"
                    >
                      <GraduationCap className="h-3 w-3 mr-2" /> Bulk apply to {f.classLevel} level…
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleArchive(f)}
                      className="text-amber-600 focus:text-amber-700"
                    >
                      <Archive className="h-3 w-3 mr-2" /> Archive current version
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-rose-600 focus:text-rose-700"
                      onClick={() => handleDelete(f)}
                    >
                      <Trash2 className="h-3 w-3 mr-2" /> Delete structure…
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          )
        })}

        {/* "New Structure" card — FEE-CREATE-DRAWER: opens the same
            right-side detail drawer used by existing structures, but in
            `mode='create'`. No record is written on click; the drawer's
            own Save Draft / Publish New Version handle the actual create. */}
        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: feeStructures.length * 0.04 }}
          onClick={openCreateDrawer}
          className="rounded-xl border border-dashed border-border bg-card/50 p-3 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-left"
        >
          <div className="flex flex-col items-center justify-center text-center h-full min-h-[180px] gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <Plus className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Create New Structure</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Fill in the basics, then add fee heads in the next step.</p>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Detail drawer — existing structure */}
      <AnimatePresence>
        {openStructure && (
          <FeesStructuresDetailDrawer
            open={true}
            structure={openStructure}
            onClose={() => setOpenStructureId(null)}
            onStructureDeleted={handleStructureDeleted}
            onNavigate={onNavigate}
          />
        )}
      </AnimatePresence>

      {/* Detail drawer — create mode. The drawer builds a blank
          template internally; on Save Draft / Publish it calls
          `onCreated(id)` which closes create-mode and opens the same
          drawer in view mode with the new structure id (transitioning
          seamlessly from creation to editing/publishing). */}
      <AnimatePresence>
        {createMode && (
          <FeesStructuresDetailDrawer
            open={true}
            mode="create"
            onClose={closeCreateDrawer}
            onCreated={(id) => {
              setCreateMode(false)
              setOpenStructureId(id)
            }}
            onNavigate={onNavigate}
          />
        )}
      </AnimatePresence>

      {/* History dialog (opened from card) */}
      <FeesStructuresHistoryDialog
        open={!!historyStructure}
        structure={historyStructure ?? feeStructures[0]}
        onClose={() => setHistoryStructure(null)}
        onRevert={(targetVersionId) => {
          if (!historyStructure) return
          const target = versions.find((v) => v.id === targetVersionId)
          if (!target) return
          const reason = prompt(`Roll back ${historyStructure.className} to Version ${target.version}?\n\nThis creates a NEW version with the heads from v${target.version}.\n\nReason (required):`)
          if (!reason || reason.trim().length < 5) {
            toast.error('Reason is required (min 5 chars)')
            return
          }
          const newId = useFeeStore.getState().revertFeeStructureVersion(historyStructure.id, targetVersionId, reason.trim(), 'Principal')
          if (newId) {
            toast.success('Rolled back successfully', {
              description: `${historyStructure.className} rolled back to v${target.version}. New version is now current.`,
            })
            setHistoryStructure(null)
          }
        }}
        onArchive={(versionId) => {
          archiveFeeStructureVersion(versionId, 'Principal')
          toast.info('Version archived', { description: `Version archived from ${historyStructure?.className}.` })
        }}
      />

      {/* Delete confirmation dialog (Fix 4 — FEE-CORRECT). */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !deleteSubmitting && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-border bg-rose-500/5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20">
                    <ShieldAlert className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold truncate">Delete Fee Structure</h3>
                    <p className="text-[11px] text-muted-foreground">High-impact, irreversible action</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  You are about to permanently delete the structure
                  <span className="font-semibold text-foreground"> {deleteTarget.className}</span>
                  {' '}({deleteTarget.category} · {deleteTarget.classLevel}). All
                  version snapshots for this structure will be removed.
                </p>
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> What is preserved
                  </p>
                  <ul className="text-[10px] text-muted-foreground space-y-0.5 ml-5 list-disc">
                    <li>Audit log entries (immutable record of the deletion)</li>
                    <li>ChangeLog entries (financial history)</li>
                    <li>Existing transactions, receipts, and concessions</li>
                  </ul>
                </div>
                <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-[11px]">
                  <p className="font-semibold mb-0.5">Annual total at deletion:</p>
                  <p className="font-mono tabular-nums text-rose-700 dark:text-rose-300">
                    {formatINR(deleteTarget.annual, true)} · {deleteTarget.components.filter((c) => c.active).length} active heads
                  </p>
                </div>
              </div>
              <div className="border-t border-border bg-muted/30 px-5 py-3 flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleteSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 text-xs gap-1.5"
                  onClick={confirmDelete}
                  disabled={deleteSubmitting}
                >
                  {deleteSubmitting ? (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" /> Delete Structure
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PHASE 5 — Bulk Apply to Level confirmation dialog. Shows the
          exact list of target classes (uncovered classes in the same
          level as the source structure) before any mutation. */}
      <AnimatePresence>
        {bulkApplyOpen && (() => {
          const targets = computeBulkApplyTargets(bulkApplyOpen)
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => !bulkApplySubmitting && setBulkApplyOpen(null)}
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 8 }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className="bg-card border border-border rounded-xl shadow-2xl max-w-lg w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-5 py-4 border-b border-border bg-emerald-500/5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
                      <GraduationCap className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold truncate">Bulk Apply to {bulkApplyOpen.classLevel} Level</h3>
                      <p className="text-[11px] text-muted-foreground">
                        Copy <span className="font-semibold text-foreground">{bulkApplyOpen.className}</span>'s fee structure to all uncovered classes in the same level
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  {targets.length === 0 ? (
                    <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 flex items-start gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                      <p className="text-[12px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
                        All classes in the <span className="font-semibold">{bulkApplyOpen.classLevel}</span> level
                        already have their own per-class structure. Nothing to apply.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-[12px] leading-relaxed text-muted-foreground">
                        This will create a <span className="font-semibold text-foreground">draft</span> fee structure
                        for each of the following <span className="font-semibold text-foreground">{targets.length}</span> classes,
                        copying heads + amounts + exam-fee schedule from <span className="font-semibold text-foreground">{bulkApplyOpen.className}</span>:
                      </p>
                      <div className="rounded-md border border-border bg-muted/30 px-3 py-2 space-y-1 max-h-44 overflow-y-auto">
                        {targets.map((t) => (
                          <div key={t.id} className="flex items-center justify-between text-[11px]">
                            <span className="font-medium">{t.name}</span>
                            <span className="text-muted-foreground tabular-nums">{t.id}{t.stream ? ` · ${t.stream}` : ''}</span>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1.5 mb-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> What this does NOT do
                        </p>
                        <ul className="text-[10px] text-muted-foreground space-y-0.5 ml-5 list-disc">
                          <li>Does NOT publish — each draft must be reviewed + published separately</li>
                          <li>Does NOT delete or modify existing structures</li>
                          <li>Does NOT touch existing student fee accounts until each draft is published</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
                <div className="border-t border-border bg-muted/30 px-5 py-3 flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setBulkApplyOpen(null)}
                    disabled={bulkApplySubmitting}
                  >
                    {targets.length === 0 ? 'Close' : 'Cancel'}
                  </Button>
                  {targets.length > 0 && (
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => confirmBulkApply(bulkApplyOpen)}
                      disabled={bulkApplySubmitting}
                    >
                      {bulkApplySubmitting ? (
                        <>
                          <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                          Applying…
                        </>
                      ) : (
                        <>
                          <GraduationCap className="h-3.5 w-3.5" /> Apply to {targets.length} classes
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* PHASE 5 — Master Catalogue drawer (school-wide fee-head admin). */}
      <FeesMasterCatalogue open={catalogueOpen} onClose={() => setCatalogueOpen(false)} />

      {/* PHASE 6 — Normalize Uncatalogued Heads drawer. Lets the
          principal link every per-structure FeeHead lacking a
          catalogueId binding to a master catalogue entry in one click.
          Drawer pattern matches the Master Catalogue drawer so the
          UX is consistent. */}
      <FeesNormalizeHeadsDrawer
        open={normalizeOpen}
        onClose={() => setNormalizeOpen(false)}
        feeStructures={feeStructures}
      />
    </div>
  )
}
