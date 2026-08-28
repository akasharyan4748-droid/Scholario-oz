'use client'

/**
 * FeesStructuresSection — Versioned Fee Structure admin grid (Phase 8).
 *
 * - Per-class structure cards (one per canonical class, plus any
 *   user-created drafts) on the Salary-structures card benchmark:
 *   md:grid-cols-2 xl:grid-cols-3 grid of rounded-xl bg-card p-4 cards.
 * - Each card shows: level-toned icon chip, class name (2-line wrap),
 *   StructureStatusBadge + v{n}, 3 mini-stats (Annual — BASE total
 *   excluding opt-in Transport — / active heads / students), a top-3
 *   non-transport fee-heads preview line (monthly heads read "₹X/mo"),
 *   effective-from meta, and a session-exam-fee line ('Not configured'
 *   only for intentionally unconfigured schedules, e.g. Class 6/7).
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
  Layers, History, MoreHorizontal, Plus, ChevronRight, Calendar,
  FileText, Archive, Copy, Trash2, AlertTriangle, ShieldAlert,
  GraduationCap, ShieldCheck,
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
  computeExamFeeTotal,
  FREQUENCY_MULTIPLIER,
  CURRENT_ACADEMIC_YEAR,
  type FeeStructureConfig,
  type FeeStructureStatus,
  type StructureRevision,
} from '@/lib/store/fee-store'
import { useStudentsStore } from '@/lib/store/students-store'
// PHASE 5 — class catalogue (used by Bulk Apply to Level + Coverage Matrix).
import { ACADEMIC_CLASSES } from '@/lib/mock/academic/classes'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { FeesStructuresDetailDrawer } from './fees-structures-detail'
import { FeesStructuresHistoryDialog } from './fees-structures-history'
import { VersionStatusPill, StructureStatusBadge } from './fees-structures-shared'
import { toast } from 'sonner'

// TASK 2-c — flattened to chip tones only (the old `bar`/`dot` fields
// were legacy-seed helpers that no renderer consumed anymore).
// Tones follow the shared card recipe: bg-{tone}-500/15 text-{tone}-600.
// Beyond the five levels we register head-category fallbacks so custom
// drafts keyed by a fee-head category ('Management & Maintenance',
// 'Registration Fee', practical 'Lab') resolve to a sensible hue.
const CATEGORY_COLORS: Record<string, string> = {
  'Pre-Primary': 'bg-cyan-500/15 text-cyan-600',
  'Primary': 'bg-emerald-500/15 text-emerald-600',
  'Middle': 'bg-amber-500/15 text-amber-600',
  'Secondary': 'bg-violet-500/15 text-violet-600',
  // FEE-PER-CLASS — the seed now uses 'Senior Secondary' (was 'Senior').
  // Keep 'Senior' as a legacy alias for any user-created structures
  // that may still use it.
  'Senior Secondary': 'bg-rose-500/15 text-rose-600',
  'Senior': 'bg-rose-500/15 text-rose-600',
  // Head-category fallbacks (user-created drafts whose category is a
  // fee-head category rather than an academic level).
  'Management & Maintenance': 'bg-violet-500/15 text-violet-600',
  'Registration Fee': 'bg-cyan-500/15 text-cyan-600',
  'Lab': 'bg-rose-500/15 text-rose-600',
}

export function FeesStructuresSection({ data, onNavigate }: { data: ReturnType<typeof useFeeData>; onNavigate?: (moduleKey: string) => void }) {
  const { feeStructures, versions, structureRevisions } = data
  const students = useStudentsStore((s) => s.students)
  const archiveFeeStructureVersion = useFeeStore((s) => s.archiveFeeStructureVersion)
  const createFeeStructure = useFeeStore((s) => s.createFeeStructure)
  const deleteFeeStructure = useFeeStore((s) => s.deleteFeeStructure)
  const syncFeeStructuresForSession = useFeeStore((s) => s.syncFeeStructuresForSession)

  const [openStructureId, setOpenStructureId] = useState<string | null>(null)
  const [historyStructure, setHistoryStructure] = useState<FeeStructureConfig | null>(null)
  // Fix 4 (FEE-CORRECT): real delete confirmation dialog state.
  // The previous "Delete" menu item only showed a toast — now we open a
  // proper confirmation dialog (for drafts) or toast the published /
  // financial-record guard error.
  const [deleteTarget, setDeleteTarget] = useState<FeeStructureConfig | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)


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

  // STRUCT-SESSION — header chip: how many of the school's active
  // academic classes have a fee structure bound for the CURRENT session.
  const activeClassCount = useMemo(() => {
    const sessionStructs = feeStructures.filter(
      (s) => (s.academicYear ?? CURRENT_ACADEMIC_YEAR) === CURRENT_ACADEMIC_YEAR,
    )
    const ids = new Set<string>()
    for (const s of sessionStructs) {
      if (s.classId) ids.add(s.classId)
      if (s.applicableClassIds) for (const id of s.applicableClassIds) ids.add(id)
    }
    return ids.size
  }, [feeStructures])

  // STRUCT-REV — the live revision for each structure (Pending Approval or
  // Threshold Reached) so cards can carry a progress pill.
  const activeRevisionByStructure = useMemo(() => {
    const m = new Map<string, StructureRevision>()
    for (const r of structureRevisions) {
      if (r.status === 'Pending Approval' || r.status === 'Threshold Reached') {
        m.set(r.structureId, r)
      }
    }
    return m
  }, [structureRevisions])

  // STRUCT-SESSION — auto-sync: ensure every active class of the CURRENT
  // session has a fee structure (Draft / Not Configured). Idempotent —
  // runs on mount and only fills gaps (new classes included, PART 23).
  useEffect(() => {
    const r = syncFeeStructuresForSession('System')
    if (r.created > 0) {
      toast.info(`${r.created} class structure${r.created === 1 ? '' : 's'} auto-created for ${CURRENT_ACADEMIC_YEAR}`, {
        description: 'Open each Not configured card to set amounts, then publish.',
      })
    }
    // Run once on mount — the sync is idempotent and only fills gaps.
  }, [syncFeeStructuresForSession])

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
      {/* TASK 2-c — benchmark header pair (icon-title h2 + subtitle;
          right actions) with exactly THREE inline elements: Structures
          chip, Bound-classes chip, Master Catalogue outline launcher. */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" /> Fee Structures
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {CURRENT_ACADEMIC_YEAR} &middot; Per-class fee plans, versions and schedules. One structure
            per active class &mdash; auto-created, configured, then published.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-muted/40">
            <Layers className="h-2.5 w-2.5" /> {feeStructures.length} structure{feeStructures.length === 1 ? '' : 's'}
          </Badge>
          <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-muted/40">
            <GraduationCap className="h-2.5 w-2.5" /> {activeClassCount} active class{activeClassCount === 1 ? '' : 'es'}
          </Badge>
        </div>
      </div>


      {/* Structure grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {feeStructures.map((f, i) => {
          // FEE-PER-CLASS — `category` and `classLevel` are now the same
          // value (the spec says "category can be removed or set to the
          // same value as classLevel"); fall back to `classLevel` when
          // `category` is empty (e.g. a draft created before the
          // FEE-PER-CLASS migration may have an empty category). Strip
          // the ' (Copy)' suffix that Duplicate-as-draft appends so
          // copies keep the parent's tone.
          const accentKey = (f.category || f.classLevel).replace(' (Copy)', '')
          const accent = CATEGORY_COLORS[accentKey] ?? CATEGORY_COLORS['Primary']
          // FEE-PER-CLASS — count students by EXACT className first
          // (e.g. Class 9 card → 4 Class 9 students). Falls back to
          // classLevel substring matching when no student has the
          // exact className (e.g. a duplicated draft with className
          // "Class 9 — Draft Copy").
          const studentsCount =
            studentsByClassName[f.className] ?? studentsByLevel[f.classLevel] ?? 0
          const status = structureStatus.get(f.id) ?? 'current'
          const activeHeads = f.components.filter((c) => c.active)
          // TASK 2-c — main fee-heads preview: top 3 ACTIVE non-transport
          // heads ranked by annual contribution (amount × frequency
          // multiplier). Monthly heads read "{amount}/mo" so frequency
          // semantics stay visible on the card; everything else shows the
          // annualised figure. Opt-in Transport is excluded — it never
          // contributes to the base annual total.
          const rankedPreviewHeads = activeHeads
            .filter((h) => h.category !== 'Transport')
            .sort((a, b) =>
              (b.amount * (FREQUENCY_MULTIPLIER[b.frequency] ?? 1)) -
              (a.amount * (FREQUENCY_MULTIPLIER[a.frequency] ?? 1)))
          const headsPreview = rankedPreviewHeads
            .slice(0, 3)
            .map((h) => h.frequency === 'Monthly'
              ? `${h.name} ${formatINR(h.amount)}/mo`
              : `${h.name} ${formatINR(h.amount * (FREQUENCY_MULTIPLIER[h.frequency] ?? 1))}`)
            .join(' · ')
          // TASK 2-c — session exam fees summed across planned
          // examinations. An EMPTY examFeeSchedule (seeded on Class 6/7)
          // means intentionally unconfigured → muted "Not configured".
          const examTotal = computeExamFeeTotal(f.examFeeSchedule)
          const examItems = (f.examFeeSchedule ?? []).length
          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border bg-card p-4 flex flex-col gap-2.5 hover:border-emerald-500/30 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setOpenStructureId(f.id)}
            >
              {/* Top row — level-toned icon chip + class name + status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', accent)}>
                    <Layers className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    {/* FEE-PER-CLASS — title is the class name (stream
                        labels wrap onto two lines instead of clipping);
                        subtitle is the academic level. No "Structure
                        Name" — the card title IS the class name. */}
                    <p className="text-sm font-bold leading-snug line-clamp-2">{f.className}</p>
                    <p className="text-xs text-muted-foreground truncate">{f.classLevel}</p>
                  </div>
                </div>
                <StructureStatusBadge status={status} version={f.version} />
              </div>

              {/* STRUCT-REV — live mid-session revision progress pill. */}
              {activeRevisionByStructure.get(f.id) && (
                <RevisionPill revision={activeRevisionByStructure.get(f.id)!} />
              )}
              {f.notConfigured && f.components.length === 0 && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 -mt-1">
                  <AlertTriangle className="h-3 w-3" /> Not configured — set amounts, then publish.
                </p>
              )}

              {/* Mini-stat tiles (Salary-benchmark recipe) — Annual shows
                  the BASE total (excludes opt-in Transport). */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-muted/40 px-2.5 py-1.5" title="Excludes opt-in Transport">
                  <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">Annual</p>
                  <p className="text-sm font-bold tabular-nums mt-0.5">{formatINR(f.annual)}</p>
                  <p className="text-[8px] text-muted-foreground/80 mt-0.5">excl. transport</p>
                </div>
                <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
                  <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">Heads</p>
                  <p className="text-sm font-bold tabular-nums mt-0.5">{activeHeads.length}</p>
                </div>
                <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
                  <p className="text-[9px] uppercase font-semibold tracking-wider text-muted-foreground">Students</p>
                  <p className="text-sm font-bold tabular-nums mt-0.5">{studentsCount}</p>
                </div>
              </div>

              {/* Main fee heads preview — top 3 non-transport heads by
                  annual contribution; Monthly heads read "₹X/mo". */}
              <p className="text-[11px] text-muted-foreground truncate min-h-[16px]" title={headsPreview || undefined}>
                {headsPreview || '—'}
              </p>

              {/* Meta: effective-from + session exam fees (TASK 2-c) */}
              <div className="space-y-0.5">
                <p className="flex items-center gap-1 text-[10px] text-muted-foreground" title="Effective from">
                  <Calendar className="h-3 w-3 shrink-0" /> Effective {formatDate(f.effectiveFrom)}
                </p>
                <p className={examTotal > 0 ? 'text-[10px] text-muted-foreground' : 'text-[10px] italic text-muted-foreground'}>
                  Session exams:{' '}
                  {examTotal > 0
                    ? `${formatINR(examTotal)} · ${examItems} planned`
                    : 'Not configured'}
                </p>
              </div>

              {/* Actions — Open / History / dropdown (TASK 2-c benchmark
                  ghost-button sizing; wiring unchanged) */}
              <div className="flex items-center gap-1.5 pt-2 mt-auto border-t border-border/40" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-[11px] gap-1 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setOpenStructureId(f.id)}
                >
                  Open <ChevronRight className="h-2.5 w-2.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[11px] gap-1"
                  onClick={() => setHistoryStructure(f)}
                  title="View version history"
                >
                  <History className="h-3 w-3" /> History
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="More">
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
          className="rounded-xl border border-dashed border-border bg-card/50 p-4 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-left"
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

      
    </div>
  )
}

// ─── STRUCT-REV — revision progress pill (PART 12) ─────────────────────

export function RevisionPill({ revision }: { revision: StructureRevision }) {
  const approved = Object.values(revision.responses).filter((v) => v === 'Approved').length
  const declined = Object.values(revision.responses).filter((v) => v === 'Declined').length
  const pct = revision.affectedStudentIds.length > 0
    ? Math.round((approved / revision.affectedStudentIds.length) * 1000) / 10
    : 0
  const reached = revision.status === 'Threshold Reached'
  return (
    <div
      className={cn(
        'rounded-lg border px-2.5 py-1.5 text-[10px] flex items-center justify-between gap-2',
        reached
          ? 'border-emerald-500/30 bg-emerald-500/[0.07]'
          : 'border-amber-500/30 bg-amber-500/[0.06]',
      )}
      title={`Revision v${revision.toVersion} — ${approved}/${revision.affectedStudentIds.length} approved · ${declined} declined · 60% threshold required`}
    >
      <span className={cn('font-semibold', reached ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300')}>
        Revision v{revision.toVersion} · {revision.status}
      </span>
      <span className="tabular-nums text-muted-foreground">
        {approved}/{revision.affectedStudentIds.length} · {pct}%
      </span>
    </div>
  )
}
