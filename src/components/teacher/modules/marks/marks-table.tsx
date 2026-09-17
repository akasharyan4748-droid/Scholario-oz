'use client'

/**
 * marks/marks-table — the roster of one exam × class × subject grid.
 *
 * Each row: roll tile + GradientAvatar + name on the left, compact numeric
 * input (h-9, tabular-nums, right-aligned) with its "/ max" suffix, a
 * server-derived grade chip (an em-dash while the row has unsaved edits)
 * and a pass/fail dot on the right. SUBMITTED rows are read-only with a
 * quiet "Submitted" chip — no lock banners. Out-of-range drafts get a red
 * ring, an inline "0–max" hint and a shake; non-numeric characters are
 * rejected outright (they never enter the input). Below sm the controls
 * stack under the student identity.
 */

import { useEffect } from 'react'
import { motion, useAnimate, useReducedMotion } from 'framer-motion'
import { CheckCircle2, Users } from 'lucide-react'
import { GlassCard, GradientAvatar } from '@/components/shared/ui'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { isDraftValid, isRowDirty } from './shared'
import type { GridStudent, MarksGrid } from './types'

/** Shared column template: roll · student · marks · grade · status. */
const ROW_GRID =
  'sm:grid-cols-[2.5rem_minmax(0,1fr)_8.75rem_3.25rem_max-content] sm:items-center sm:gap-3'

const ROSTER_SCROLL =
  'max-h-[30rem] overflow-y-auto pr-0.5 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:transparent'

interface MarksTableProps {
  grid: MarksGrid
  drafts: Record<string, string>
  /** Per-row counter — every increment replays the shake on that row. */
  shakeCounts: Record<string, number>
  onMarkChange: (studentId: string, raw: string) => void
}

export function MarksTable({ grid, drafts, shakeCounts, onMarkChange }: MarksTableProps) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div>
          <h3 className="text-sm font-semibold">Marks roster</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {grid.label} · {grid.subjectName} · out of {grid.maxMarks} · pass mark {grid.passMarks}
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground">Autosaves as you type</p>
      </div>

      {/* Column labels (sm+) — outside the scroll area so they stay pinned. */}
      <div
        className={cn(
          'hidden border-b border-border pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:grid',
          ROW_GRID,
        )}
      >
        <span>Roll</span>
        <span>Student</span>
        <span className="text-right">Marks</span>
        <span>Grade</span>
        <span>Status</span>
      </div>

      {grid.students.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-muted/60">
            <Users className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-foreground">No students in this class yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            The roster will appear once students are enrolled.
          </p>
        </div>
      ) : (
        <div className={ROSTER_SCROLL}>
          {grid.students.map((student, i) => (
            <MarksRow
              key={student.id}
              student={student}
              index={i}
              maxMarks={grid.maxMarks}
              draft={drafts[student.id] ?? ''}
              shake={shakeCounts[student.id] ?? 0}
              gridSubmitted={grid.submitted}
              onMarkChange={onMarkChange}
            />
          ))}
        </div>
      )}
    </GlassCard>
  )
}

// ─── Row ───────────────────────────────────────────────────────────────

interface MarksRowProps {
  student: GridStudent
  index: number
  maxMarks: number
  draft: string
  shake: number
  /** Exam-level lock — once the sheet is submitted every row is read-only. */
  gridSubmitted: boolean
  onMarkChange: (studentId: string, raw: string) => void
}

function MarksRow({ student, index, maxMarks, draft, shake, gridSubmitted, onMarkChange }: MarksRowProps) {
  const [shakeScope, animate] = useAnimate<HTMLDivElement>()
  const reduceMotion = useReducedMotion()

  const locked = gridSubmitted || student.workflowStatus === 'SUBMITTED'
  const invalid = !locked && !isDraftValid(draft, maxMarks)
  const dirty = !locked && isRowDirty(student, draft)

  // Grade chip + pass dot come from the SERVER payload; while the row has
  // unsaved edits they step back to placeholders (no local grade math).
  const grade = dirty ? null : student.grade
  const passed = dirty ? null : student.passed

  // Replay the shake whenever the parent bumps this row's counter
  // (out-of-range value or rejected characters).
  useEffect(() => {
    if (shake === 0 || !shakeScope.current) return
    void animate(shakeScope.current, { x: [0, -4, 4, -3, 3, 0] }, { duration: 0.35 })
  }, [shake, animate, shakeScope])

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(index * 0.02, 0.3), duration: 0.25 }}
      className={cn(
        'grid gap-y-1.5 border-b border-border/50 py-2.5 last:border-0 sm:py-2',
        ROW_GRID,
      )}
    >
      {/* Identity — full width on mobile, columns 1–2 on sm+. */}
      <div className="flex items-center gap-2.5 sm:contents">
        <span className="flex h-7 w-9 shrink-0 items-center justify-center rounded-md bg-muted/60 font-mono text-[11px] font-medium text-muted-foreground">
          {student.rollNo || '—'}
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <GradientAvatar name={student.name} size="sm" />
          <p className="truncate text-sm font-medium" title={student.name}>
            {student.name}
          </p>
        </div>
      </div>

      {/* Controls — stacked under the identity on mobile, columns 3–5 on sm+. */}
      <div className="flex items-center gap-2 pl-[2.875rem] sm:contents sm:pl-0">
        <div ref={shakeScope} className="flex items-center justify-end gap-1.5">
          {locked ? (
            <div className="flex h-9 w-20 items-center justify-end rounded-md px-3 text-sm font-semibold tabular-nums">
              {student.marks != null ? student.marks : '—'}
            </div>
          ) : (
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={draft}
              placeholder="—"
              aria-invalid={invalid || undefined}
              aria-label={`Marks out of ${maxMarks} for ${student.name}`}
              onChange={(e) => onMarkChange(student.id, e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              className={cn(
                'h-9 w-20 border-input text-right font-semibold tabular-nums',
                invalid && 'border-destructive bg-destructive/5 focus-visible:ring-destructive/20',
              )}
            />
          )}
          {invalid ? (
            <span className="text-[10px] font-medium text-destructive">0&ndash;{maxMarks}</span>
          ) : (
            <span className="text-xs text-muted-foreground">/ {maxMarks}</span>
          )}
        </div>

        <span
          className={cn(
            'inline-flex min-w-9 items-center justify-center rounded-md border px-1.5 py-0.5 text-[11px] font-bold tabular-nums',
            grade == null
              ? 'border-dashed border-border text-muted-foreground'
              : 'border-border bg-muted/50 text-foreground',
          )}
          title="Grade (from the school's grade scale)"
        >
          {grade ?? '—'}
        </span>

        {locked ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            Submitted
          </span>
        ) : (
          <span className="flex items-center" title={statusTitle(passed, invalid)}>
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                passed === true && 'bg-emerald-500',
                passed === false && 'bg-rose-500',
                passed == null && 'border border-border bg-transparent',
              )}
              aria-hidden="true"
            />
            <span className="sr-only">{statusTitle(passed, invalid)}</span>
          </span>
        )}
      </div>
    </motion.div>
  )
}

function statusTitle(passed: boolean | null, invalid: boolean): string {
  if (invalid) return 'Mark out of range — not saved'
  if (passed === true) return 'Pass'
  if (passed === false) return 'Fail'
  return 'Not entered'
}
