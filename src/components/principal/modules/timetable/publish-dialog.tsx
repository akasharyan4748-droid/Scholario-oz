'use client'

/**
 * PublishDialog — compact confirmation surface for publishing timetable changes.
 *
 * Brief section 13: "Keep it short. No giant confirmation modal."
 * Brief section 14: Show a compact summary of what will be published.
 * Brief section 15: After publish, show subtle success feedback.
 * Brief section 27: Publish disappears after successful publication.
 * Brief section 33: Disabled if conflicts exist.
 */
import { Upload, AlertTriangle, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { TimetableChange } from './timetable-store'

export function PublishDialog({
  open,
  onOpenChange,
  changes,
  conflictCount,
  onPublish,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  changes: TimetableChange[]
  conflictCount: number
  onPublish: () => void
}) {
  const canPublish = conflictCount === 0 && changes.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Upload className="h-4 w-4 text-emerald-600" />
            Publish timetable update?
          </DialogTitle>
          <DialogDescription className="text-[10px]">
            {changes.length} change{changes.length === 1 ? '' : 's'} will be shared with affected students and teachers.
          </DialogDescription>
        </DialogHeader>

        {/* Conflict guard (Brief section 33) */}
        {conflictCount > 0 && (
          <div className="mx-4 mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 flex items-start gap-2 text-rose-700 dark:text-rose-300">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <div className="text-[10px]">
              <p className="font-bold">{conflictCount} conflict{conflictCount === 1 ? '' : 's'} must be resolved before publishing.</p>
              <p className="text-muted-foreground mt-0.5">Fix the scheduling conflicts, then publish.</p>
            </div>
          </div>
        )}

        {/* Change summary (Brief section 14) */}
        <div className="p-4 max-h-64 overflow-y-auto">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {changes.length} timetable change{changes.length === 1 ? '' : 's'}
          </p>
          <div className="space-y-1.5">
            {changes.map((change) => (
              <div key={change.id} className="rounded-lg border border-border/60 bg-card p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-muted-foreground">{change.context}</span>
                  <ChangeTypeBadge type={change.type} />
                </div>
                <p className="text-xs text-foreground mt-0.5">{change.summary}</p>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="px-4 py-3 border-t border-border">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={onPublish}
            disabled={!canPublish}
          >
            <Upload className="h-3.5 w-3.5" /> Publish Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* ChangeTypeBadge — small colored badge per change type              */
/* ------------------------------------------------------------------ */
function ChangeTypeBadge({ type }: { type: TimetableChange['type'] }) {
  const config: Record<TimetableChange['type'], { label: string; className: string }> = {
    teacher_changed: { label: 'Teacher', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-300' },
    room_changed: { label: 'Room', className: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300' },
    period_changed: { label: 'Period', className: 'bg-violet-500/10 text-violet-700 dark:text-violet-300' },
    subject_changed: { label: 'Subject', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
    class_changed: { label: 'Class', className: 'bg-teal-500/10 text-teal-700 dark:text-teal-300' },
    slot_added: { label: 'Added', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
    slot_removed: { label: 'Removed', className: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' },
  }
  const c = config[type]
  return (
    <Badge variant="secondary" className={`text-[8px] px-1 py-0 font-medium ${c.className}`}>
      {c.label}
    </Badge>
  )
}
