'use client'

/**
 * marks/publish-dialog — the "Submit marks" confirmation dialog.
 *
 * Follows the old publish-dialog pattern (icon header, summary panel,
 * Cancel/Confirm footer) but on the real submission contract: exam, class,
 * subject, entered count, class average and pass count from the live
 * drafts. Confirm is blocked while nothing is entered or any draft is out
 * of range — the same rules the server enforces.
 */

import { AlertTriangle, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatAverage, type MarksStats } from './shared'
import type { MarksGrid } from './types'

export interface SubmitSummary {
  grid: MarksGrid
  stats: MarksStats
  /** Drafts currently out of 0..maxMarks — must be fixed before submitting. */
  invalidCount: number
}

export function SubmitMarksDialog({
  open,
  onOpenChange,
  summary,
  submitting,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  summary: SubmitSummary | null
  submitting: boolean
  onConfirm: () => void
}) {
  const nothingEntered = summary != null && summary.stats.entered === 0
  const hasInvalid = summary != null && summary.invalidCount > 0
  const blocked = summary == null || nothingEntered || hasInvalid

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Send className="h-5 w-5" aria-hidden="true" />
          </div>
          <DialogTitle>Submit marks?</DialogTitle>
          <DialogDescription>
            Marks for this class and subject are sent for verification and locked for editing.
            Corrections after submission flow through the exam office.
          </DialogDescription>
        </DialogHeader>

        {summary && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <SummaryRow label="Examination" value={summary.grid.exam.name} />
            <SummaryRow label="Class" value={summary.grid.label} />
            <SummaryRow label="Subject" value={summary.grid.subjectName} />
            <SummaryRow
              label="Entered"
              value={`${summary.stats.entered} of ${summary.stats.total} students`}
            />
            <SummaryRow
              label="Class average"
              value={
                formatAverage(summary.stats.average) != null
                  ? `${formatAverage(summary.stats.average)} / ${summary.grid.maxMarks}`
                  : '—'
              }
            />
            <SummaryRow
              label="Pass count"
              value={
                summary.stats.passCount != null
                  ? `${summary.stats.passCount} of ${summary.stats.entered}`
                  : '—'
              }
            />
          </div>
        )}

        {hasInvalid && summary && (
          <p className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {summary.invalidCount} mark{summary.invalidCount === 1 ? '' : 's'} outside 0&ndash;
            {summary.grid.maxMarks}. Fix {summary.invalidCount === 1 ? 'it' : 'them'} before
            submitting.
          </p>
        )}
        {!hasInvalid && nothingEntered && (
          <p className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Enter marks before submitting.
          </p>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={submitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={onConfirm} disabled={blocked || submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Submitting…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden="true" /> Confirm submission
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right font-medium text-foreground">{value}</span>
    </div>
  )
}
