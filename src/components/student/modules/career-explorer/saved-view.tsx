'use client'

/**
 * SavedView — the student's own shortlist: saved careers with notes,
 * a "still exploring" toggle, two-step remove, and (from 2 saved
 * careers) the COMPARE flow. Everything persists in the tenant-scoped
 * career store — notes and exploring state survive tab switches.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Bookmark, Eye, NotebookPen, GitCompare, X, Check, Trash2, Compass } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '@/components/student/shell/page-header'
import { toast } from 'sonner'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  careerById,
  useStudentCareerStore,
  type CareerEntry,
} from '@/lib/store/student-career-store'
import { CareerEmptyState, FieldChip, FieldTile, BTN_OUTLINE, TEXTAREA_CLASSES } from './shared'
import { CompareDialog } from './compare-dialog'

interface SavedViewProps {
  onOpen: (career: CareerEntry) => void
}

export function SavedView({ onOpen }: SavedViewProps) {
  const saved = useStudentCareerStore((s) => s.saved)
  const removeSaved = useStudentCareerStore((s) => s.removeSaved)
  const setNote = useStudentCareerStore((s) => s.setNote)
  const toggleExploring = useStudentCareerStore((s) => s.toggleExploring)

  const [removingId, setRemovingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [compareMode, setCompareMode] = useState(false)
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null)
  const [picked, setPicked] = useState<string[]>([])

  // Resolve the saved rows against the catalog, newest saved first.
  const rows = useMemo(
    () =>
      saved
        .map((entry) => ({ entry, career: careerById(entry.careerId) }))
        .filter((r): r is { entry: (typeof saved)[number]; career: CareerEntry } => r.career != null)
        .sort((x, y) => (x.entry.savedOn < y.entry.savedOn ? 1 : -1)),
    [saved],
  )

  function handleRemove(careerId: string) {
    const career = careerById(careerId)
    removeSaved(careerId)
    setRemovingId(null)
    // Keep the compare selection consistent with the store.
    setPicked((p) => p.filter((id) => id !== careerId))
    if (career) toast(`${career.title} removed from saved`)
  }

  function startEdit(careerId: string, currentNote?: string) {
    setEditingId(careerId)
    setNoteDraft(currentNote ?? '')
  }

  function saveNote(careerId: string) {
    setNote(careerId, noteDraft)
    setEditingId(null)
    toast.success('Note saved', {
      description: noteDraft.trim() ? undefined : 'The note was cleared.',
    })
  }

  function togglePicked(careerId: string) {
    if (picked.includes(careerId)) {
      setPicked(picked.filter((id) => id !== careerId))
      return
    }
    if (picked.length >= 2) {
      toast('Pick two careers', { description: 'Deselect one first.' })
      return
    }
    const next = [...picked, careerId]
    setPicked(next)
    // Two picked → open the side-by-side comparison straight away.
    if (next.length === 2) setCompareIds([next[0], next[1]])
  }

  function exitCompareMode() {
    setCompareMode(false)
    setPicked([])
  }

  if (rows.length === 0) {
    return (
      <GlassCard hover={false} className="on-card">
        <CareerEmptyState
          icon={Bookmark}
          title="Save careers that interest you to compare them here."
          note="Tap Save on any career while exploring."
        />
      </GlassCard>
    )
  }

  return (
    <div className="space-y-3">
      <SectionLabel hint={`${rows.length} ${rows.length === 1 ? 'career' : 'careers'}`}>
        Saved careers
      </SectionLabel>

      {/* The compare affordance — only with a real choice to make */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {compareMode ? (
          <>
            <span className="text-[11px] text-muted-foreground">Pick two careers to compare</span>
            <button type="button" onClick={exitCompareMode} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <X className="h-3.5 w-3.5" aria-hidden />
              Exit compare
            </button>
          </>
        ) : rows.length >= 2 ? (
          <button type="button" onClick={() => setCompareMode(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-violet-500/25 bg-violet-500/[0.06] px-3 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-500/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-violet-300">
            <GitCompare className="h-3.5 w-3.5" aria-hidden />
            Compare
          </button>
        ) : null}
      </div>

      <div className="space-y-2.5">
        {rows.map(({ entry, career }, i) => {
          const isPicked = picked.includes(career.id)
          return (
            <motion.div
              key={entry.careerId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.04, 0.16) }}
            >
              <GlassCard className="on-card space-y-3 p-4">
                <div className="flex items-start gap-3">
                  <FieldTile field={career.field} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="text-sm font-semibold text-foreground">{career.title}</h3>
                      <FieldChip field={career.field} />
                      <span className="text-[11px] text-muted-foreground/80">Saved on {formatDate(entry.savedOn)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">{career.whatTheyDo}</p>
                  </div>
                </div>

                {/* The student's own note — click to edit */}
                {editingId === career.id ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <NotebookPen className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" aria-hidden />
                      <textarea
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        rows={2}
                        placeholder="Why does this career interest you?"
                        aria-label={`Your note about ${career.title}`}
                        className={cn(TEXTAREA_CLASSES, 'pl-9')}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveNote(career.id)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/[0.06] px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden />
                        Save note
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {entry.note ? (
                      <button
                        type="button"
                        onClick={() => startEdit(career.id, entry.note)}
                        className="max-w-full rounded-lg border border-dashed border-border bg-background px-2.5 py-1.5 text-left text-xs italic text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        “{entry.note}”
                        <span className="ml-1.5 not-italic text-[10px] font-semibold text-violet-600 dark:text-violet-400">Edit</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(career.id)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-border bg-background px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <NotebookPen className="h-3.5 w-3.5" aria-hidden />
                        Add a note
                      </button>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Still exploring — an honest, reversible pill */}
                  <button
                    type="button"
                    onClick={() => toggleExploring(career.id)}
                    aria-pressed={entry.exploring}
                    className={cn(
                      'inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      entry.exploring
                        ? 'border-violet-500/35 bg-violet-500/[0.08] text-violet-700 dark:text-violet-300'
                        : 'border-border bg-background text-muted-foreground hover:bg-accent',
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', entry.exploring ? 'bg-violet-500' : 'bg-muted-foreground/50')} aria-hidden />
                    Still exploring
                  </button>

                  {compareMode && (
                    <button
                      type="button"
                      onClick={() => togglePicked(career.id)}
                      aria-pressed={isPicked}
                      className={cn(
                        'inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isPicked
                          ? 'border-violet-500/40 bg-violet-500/[0.1] text-violet-700 dark:text-violet-300'
                          : 'border-border bg-background text-muted-foreground hover:bg-accent',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-3.5 w-3.5 items-center justify-center rounded-[4px] border',
                          isPicked ? 'border-violet-600 bg-violet-600 text-white' : 'border-muted-foreground/40',
                        )}
                        aria-hidden
                      >
                        {isPicked && <Check className="h-2.5 w-2.5" />}
                      </span>
                      Compare
                    </button>
                  )}

                  <div className="ml-auto flex items-center gap-2">
                    <button type="button" onClick={() => onOpen(career)} className={cn(BTN_OUTLINE, 'h-11 px-3 text-xs sm:h-9 sm:w-auto')}>
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      View
                    </button>
                    {removingId === career.id ? (
                      <span className="inline-flex items-center gap-1.5" role="group" aria-label={`Confirm removing ${career.title}`}>
                        <button
                          type="button"
                          onClick={() => handleRemove(career.id)}
                          className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/[0.06] px-3 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          Remove
                        </button>
                        <button
                          type="button"
                          onClick={() => setRemovingId(null)}
                          aria-label={`Keep ${career.title}`}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9 sm:w-9"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRemovingId(career.id)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/[0.08] hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9 sm:w-9"
                        aria-label={`Remove ${career.title} from saved`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>

      {/* Nothing here pretends to be a choice — keep exploring */}
      <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[11px] text-muted-foreground/70">
        <Compass className="h-3 w-3 shrink-0" aria-hidden />
        Saved careers are just the ones you're curious about right now.
      </p>

      <CompareDialog careerIds={compareIds} onClose={() => setCompareIds(null)} />
    </div>
  )
}
