'use client'

/**
 * marks/index — the Marks Entry module composition (TWC-FE-3).
 *
 * `teacher-panel/module-router.tsx` imports the named `MarksEntryModule`
 * and renders it with no props:
 *   import { MarksEntryModule } from '../modules/marks'
 *
 * Everything on screen comes from the four /api/teacher/marks-entry*
 * routes (built in TWC-2, curl-verified): the picker payload selects
 * exam → class → subject (defaulting to the first of each), the grid
 * payload drives the roster, and edits autosave as DRAFTs — debounced
 * 800ms, validated client-side before anything is sent (empty or a whole
 * number 0..maxMarks), re-validated server-side. Submission is an
 * explicit confirm-dialog step that locks the rows (SUBMITTED). No mock
 * data, no auto-fill.
 *
 * This index owns the state machine: selection, per-student drafts, the
 * pending-save queue + debounce timer, the autosave indicator states and
 * the submit flow. Sub-components are presentational.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ClipboardList, Send } from 'lucide-react'
import { toast } from 'sonner'
import { GlassCard, PageTransition, StatusBadge } from '@/components/shared/ui'
import { ModuleToolbar } from '../../teacher-panel/module-toolbar'
import { Button } from '@/components/ui/button'
import { HubEmptyState, HubSectionError } from '../shared/hub-stat-cards'
import {
  gridKeyOf,
  saveMarksEntries,
  submitMarksSelection,
  useMarksExams,
  useMarksGrid,
} from './hooks'
import { MarksTable } from './marks-table'
import { SubmitMarksDialog, type SubmitSummary } from './publish-dialog'
import { SaveIndicator, type SaveState } from './save-indicator'
import { SelectorsBar } from './selectors-bar'
import { StatStrip } from './stat-strip'
import {
  computeStats,
  initialDrafts,
  invalidDraftIds,
  isDraftValid,
  parseDraft,
  resolveSelection,
  sanitizeDraftInput,
} from './shared'
import type { GridSelection, MarksGrid, SaveEntry } from './types'

const AUTOSAVE_DELAY_MS = 800
/** Minimum gap between "Marks must be between 0 and N" toasts. */
const INVALID_TOAST_COOLDOWN_MS = 1500

export function MarksEntryModule() {
  const exams = useMarksExams()
  const [selection, setSelection] = useState<GridSelection | null>(null)
  const grid = useMarksGrid(selection)

  // Input values per student ('' = not entered). Seeded from each fresh
  // grid payload; local edits accumulate on top until saved.
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [shakeCounts, setShakeCounts] = useState<Record<string, number>>({})
  const [submitOpen, setSubmitOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // ── Refs (event/timeout contexts always read the latest values) ──────
  const pendingRef = useRef<Map<string, SaveEntry>>(new Map())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightRef = useRef(0)
  const selectionRef = useRef<GridSelection | null>(null)
  const gridRef = useRef<MarksGrid | null>(null)
  const draftsRef = useRef<Record<string, string>>({})
  const submittingRef = useRef(false)
  const lastInvalidToastAtRef = useRef(0)

  useEffect(() => {
    selectionRef.current = selection
  }, [selection])
  useEffect(() => {
    gridRef.current = grid.data
  }, [grid.data])
  useEffect(() => {
    draftsRef.current = drafts
  }, [drafts])

  // Leaving the module with queued edits: fire the last save so the work
  // survives an SPA navigation (the fetch resolves after unmount).
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      const sel = selectionRef.current
      if (sel && pendingRef.current.size > 0) {
        void saveMarksEntries(sel, [...pendingRef.current.values()])
      }
    }
  }, [])

  // ── Selection: default to first exam → first class → first subject ──
  const applySelection = useCallback((next: GridSelection | null) => {
    selectionRef.current = next
    setSelection(next)
  }, [])

  useEffect(() => {
    applySelection(resolveSelection(exams.data?.exams ?? [], selectionRef.current))
  }, [exams.data, applySelection])

  // ── Drafts: re-seed on every fresh grid, never stomp unsaved edits ──
  useEffect(() => {
    const data = grid.data
    if (!data) return
    const sameGrid =
      grid.key != null && selection != null && grid.key === gridKeyOf(selection)
    if (sameGrid && (pendingRef.current.size > 0 || inFlightRef.current > 0)) return
    setDrafts(initialDrafts(data))
    if (inFlightRef.current === 0 && pendingRef.current.size === 0) setSaveState('saved')
  }, [grid.data, grid.key, selection])

  // ── Autosave machinery ────────────────────────────────────────────────
  const takePending = useCallback((): SaveEntry[] => {
    const entries = [...pendingRef.current.values()]
    pendingRef.current.clear()
    return entries
  }, [])

  const runSave = useCallback(
    async (sel: GridSelection, entries: SaveEntry[]): Promise<boolean> => {
      if (entries.length === 0) return true
      // Final gate — the server rejects anything outside 0..maxMarks, so
      // nothing out of range is ever sent.
      const max = gridRef.current?.maxMarks
      if (max == null) return false
      if (entries.some((e) => e.marks != null && (e.marks < 0 || e.marks > max))) {
        setSaveState('error')
        return false
      }
      inFlightRef.current += 1
      setSaveState('saving')
      try {
        await saveMarksEntries(sel, entries)
        // Quiet refresh: server-derived grade chips and workflow flags
        // catch up. Drafts are only re-seeded when nothing is pending.
        if (selectionRef.current && gridKeyOf(selectionRef.current) === gridKeyOf(sel)) {
          grid.reload(true)
        }
        return true
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Could not save marks'
        // Re-queue only while this grid is still on screen — a batch for a
        // grid the teacher already left must not leak into another subject.
        if (selectionRef.current && gridKeyOf(selectionRef.current) === gridKeyOf(sel)) {
          for (const entry of entries) {
            if (!pendingRef.current.has(entry.studentId)) {
              pendingRef.current.set(entry.studentId, entry)
            }
          }
        }
        setSaveState('error')
        toast.error(message, {
          description: 'Your entries are still on screen — retry when you are ready.',
        })
        return false
      } finally {
        inFlightRef.current -= 1
        if (inFlightRef.current === 0 && pendingRef.current.size === 0) {
          setSaveState((prev) => (prev === 'saving' ? 'saved' : prev))
        }
      }
    },
    [grid],
  )

  const scheduleAutosave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      const sel = selectionRef.current
      if (!sel) return
      const entries = takePending()
      if (entries.length === 0) return // nothing valid to save — keep 'idle'
      void runSave(sel, entries)
    }, AUTOSAVE_DELAY_MS)
  }, [runSave, takePending])

  const notifyInvalid = useCallback((maxMarks: number) => {
    const now = Date.now()
    if (now - lastInvalidToastAtRef.current < INVALID_TOAST_COOLDOWN_MS) return
    lastInvalidToastAtRef.current = now
    toast.error(`Marks must be between 0 and ${maxMarks}`)
  }, [])

  const bumpShake = useCallback((studentId: string) => {
    setShakeCounts((prev) => ({ ...prev, [studentId]: (prev[studentId] ?? 0) + 1 }))
  }, [])

  const handleMarkChange = useCallback(
    (studentId: string, raw: string) => {
      const currentGrid = gridRef.current
      if (!currentGrid) return
      const max = currentGrid.maxMarks

      // Reject non-numeric characters (e.g. a pasted "-1") outright.
      const cleaned = sanitizeDraftInput(raw)
      if (cleaned !== raw && raw.trim() !== '') {
        bumpShake(studentId)
        notifyInvalid(max)
      }

      const nextValue = parseDraft(cleaned)
      const nowInvalid = nextValue != null && nextValue > max
      const wasInvalid = !isDraftValid(draftsRef.current[studentId] ?? '', max)
      if (nowInvalid && !wasInvalid) {
        bumpShake(studentId)
        notifyInvalid(max)
      }

      setDrafts((prev) => ({ ...prev, [studentId]: cleaned }))
      if (nowInvalid) {
        // Out-of-range values are never queued for saving.
        pendingRef.current.delete(studentId)
        setSaveState('idle')
        return
      }
      pendingRef.current.set(studentId, { studentId, marks: nextValue })
      setSaveState('idle')
      scheduleAutosave()
    },
    [bumpShake, notifyInvalid, scheduleAutosave],
  )

  const retrySave = useCallback(() => {
    const sel = selectionRef.current
    if (!sel || pendingRef.current.size === 0) {
      setSaveState('saved')
      return
    }
    void runSave(sel, takePending())
  }, [runSave, takePending])

  // ── Selection change: flush the old grid's pending edits first ───────
  const changeSelection = useCallback(
    (next: GridSelection) => {
      const prev = selectionRef.current
      if (
        prev &&
        prev.examId === next.examId &&
        prev.classId === next.classId &&
        prev.subjectId === next.subjectId
      ) {
        return
      }
      if (prev && pendingRef.current.size > 0) {
        void runSave(prev, takePending())
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      setShakeCounts({})
      applySelection(next)
    },
    [applySelection, runSave, takePending],
  )

  // ── Derived values ────────────────────────────────────────────────────
  const stats = useMemo(
    () => (grid.data ? computeStats(grid.data, drafts) : null),
    [grid.data, drafts],
  )
  const invalidCount = useMemo(
    () => (grid.data ? invalidDraftIds(grid.data, drafts).length : 0),
    [grid.data, drafts],
  )

  const toolbarContext = useMemo(() => {
    if (grid.data) {
      return `${grid.data.label} · ${grid.data.subjectName} · ${grid.data.exam.name}`
    }
    if (selection && exams.data) {
      const exam = exams.data.exams.find((e) => e.id === selection.examId)
      const cls = exam?.classes.find((c) => c.classId === selection.classId)
      const subject = cls?.subjects.find((s) => s.id === selection.subjectId)
      if (exam && cls && subject) return `${cls.label} · ${subject.name} · ${exam.name}`
    }
    return 'Enter marks for your classes'
  }, [grid.data, selection, exams.data])

  const submitted = grid.data?.submitted ?? false
  const canSubmit = grid.data != null && grid.data.students.length > 0 && !submitted

  const submitSummary: SubmitSummary | null =
    grid.data && stats ? { grid: grid.data, stats, invalidCount } : null

  // ── Submit flow ───────────────────────────────────────────────────────
  const confirmSubmit = useCallback(async () => {
    const sel = selectionRef.current
    const currentGrid = gridRef.current
    if (!sel || !currentGrid || submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    try {
      // Flush any pending autosave edits first so the submission is complete.
      if (pendingRef.current.size > 0) {
        const ok = await runSave(sel, takePending())
        if (!ok) {
          toast.error('Unsaved marks could not be saved — please retry')
          return
        }
      }
      await submitMarksSelection(sel)
      toast.success('Marks submitted', {
        description: `${currentGrid.subjectName} · ${currentGrid.label} · ${currentGrid.exam.name}`,
      })
      setSubmitOpen(false)
      grid.reload() // rows arrive read-only (SUBMITTED)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not submit marks')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }, [grid, runSave, takePending])

  // ── Render ────────────────────────────────────────────────────────────
  const examList = exams.data?.exams ?? []

  if (exams.loading) {
    return (
      <PageTransition className="space-y-4" >
        <div className="flex items-center justify-between" aria-busy="true">
          <div className="h-3 w-48 animate-pulse rounded bg-muted" />
          <div className="h-9 w-44 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
                <div className="h-9 animate-pulse rounded-md bg-muted" />
              </div>
            ))}
          </div>
        </div>
        <GridSkeleton />
      </PageTransition>
    )
  }

  if (exams.error) {
    return (
      <PageTransition>
        <HubSectionError
          message={exams.error}
          onRetry={exams.reload}
        />
      </PageTransition>
    )
  }

  if (exams.data && examList.length === 0) {
    return (
      <PageTransition>
        <GlassCard className="p-3 sm:p-4">
          <HubEmptyState
            icon={ClipboardList}
            title="No exams to enter marks for yet."
            hint="Exams configured for the classes and subjects you teach will appear here."
          />
        </GlassCard>
      </PageTransition>
    )
  }

  return (
    <PageTransition className="space-y-4 sm:space-y-5">
      <ModuleToolbar
        context={toolbarContext}
        action={
          submitted ? (
            <StatusBadge status="Marks submitted" variant="success" dot />
          ) : (
            <>
              <SaveIndicator state={saveState} onRetry={retrySave} />
              <Button size="sm" onClick={() => setSubmitOpen(true)} disabled={!canSubmit}>
                <Send className="h-4 w-4" aria-hidden="true" /> Submit marks
              </Button>
            </>
          )
        }
      />

      <SelectorsBar exams={examList} selection={selection} onSelectionChange={changeSelection} />

      {grid.error ? (
        <HubSectionError
          message={grid.error}
          onRetry={() => grid.reload()}
        />
      ) : grid.loading || !grid.data ? (
        <GridSkeleton />
      ) : (
        <>
          <StatStrip
            stats={stats}
            maxMarks={grid.data.maxMarks}
            passMarks={grid.data.passMarks}
          />
          <MarksTable
            grid={grid.data}
            drafts={drafts}
            shakeCounts={shakeCounts}
            onMarkChange={handleMarkChange}
          />
        </>
      )}

      <SubmitMarksDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        summary={submitSummary}
        submitting={submitting}
        onConfirm={() => void confirmSubmit()}
      />
    </PageTransition>
  )
}

/** Stat tiles + roster skeleton shown while a grid loads. */
function GridSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="h-2.5 w-16 rounded bg-muted" />
              <div className="h-3.5 w-3.5 rounded bg-muted" />
            </div>
            <div className="mt-0.5 h-7 w-16 rounded bg-muted" />
            <div className="mt-2 h-2.5 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs sm:p-4 lg:p-5">
        <div className="mb-4 space-y-1.5">
          <div className="h-4 w-36 animate-pulse rounded bg-muted" />
          <div className="h-3 w-56 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-7 w-9 shrink-0 animate-pulse rounded-md bg-muted" />
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
              <div className="ml-auto h-9 w-20 animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
