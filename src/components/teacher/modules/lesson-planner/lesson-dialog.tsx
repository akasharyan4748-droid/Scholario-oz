'use client'

/**
 * lesson-dialog — the single topic-detail dialog, reused from the hero
 * (future "also today" flows), the curriculum map and the upcoming rail.
 * Read-only details plus status-appropriate actions: TODAY/IN_PROGRESS
 * can be started, completed and flagged; NEEDS_RESCHEDULING can be
 * completed or unflagged; UPCOMING is informational; COMPLETED shows the
 * taught date with a quiet inline-confirmed undo. Never a nested dialog —
 * the flag reason is an inline mode swap.
 */

import { useEffect, useState } from 'react'
import {
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  Clock,
  History,
  Loader2,
  PlayCircle,
  Undo2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { LessonIntent, ScheduledTopicDTO } from '@/lib/lesson-planner-types'
import {
  LESSON_ACTION_PRIMARY,
  LESSON_ACTION_SECONDARY,
  LessonStatusBadge,
  formatLessonDate,
  formatMinutes,
  periodsLabel,
} from './vocabulary'

interface LessonDialogProps {
  topic: ScheduledTopicDTO | null
  /** curriculum version line, e.g. "CBSE (NCERT) · Grade 10 Mathematics · 2026–27" */
  versionLabel: string
  acting: LessonIntent | null
  onIntent: (
    topicId: string,
    intent: LessonIntent,
    reason?: string,
  ) => Promise<boolean>
  onClose: () => void
}

export function LessonDialog({
  topic,
  versionLabel,
  acting,
  onIntent,
  onClose,
}: LessonDialogProps) {
  const [flagMode, setFlagMode] = useState(false)
  const [reason, setReason] = useState('')
  const [confirmUndo, setConfirmUndo] = useState(false)

  const topicId = topic?.id ?? null
  const topicStatus = topic?.status ?? null

  // Reset transient modes whenever the dialog changes topic — or the open
  // topic's status flips after a successful intent (the shell replaces the
  // topic object with the server's fresh one).
  useEffect(() => {
    setFlagMode(false)
    setReason('')
    setConfirmUndo(false)
  }, [topicId, topicStatus])

  const busy = acting !== null

  const submitFlag = async () => {
    if (!topic || busy) return
    const ok = await onIntent(topic.id, 'flag', reason.trim() || undefined)
    if (ok) {
      setFlagMode(false)
      setReason('')
    }
  }

  return (
    <Dialog open={topic !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25">
        {topic ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-left text-sm font-semibold leading-snug">
                {topic.topicName}
              </DialogTitle>
              <DialogDescription className="text-left text-xs">
                {versionLabel}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <LessonStatusBadge status={topic.status} />
                <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Unit {topic.unitOrder} · {topic.unitName}
                </span>
              </div>

              {topic.description ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {topic.description}
                </p>
              ) : (
                <p className="text-xs italic text-muted-foreground">
                  No description provided for this topic.
                </p>
              )}

              <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3 text-xs">
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="text-foreground/80">Estimated:</span>{' '}
                  {periodsLabel(topic.estimatedMinutes)} ·{' '}
                  {formatMinutes(topic.estimatedMinutes)} min
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="text-foreground/80">Planned:</span>{' '}
                  {formatLessonDate(topic.plannedDate)}
                </p>
                {topic.rescheduledFrom ? (
                  <p className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <History className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Rescheduled from {formatLessonDate(topic.rescheduledFrom)}
                  </p>
                ) : null}
              </div>

              {topic.flagReason ? (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Flag reason
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-rose-700 dark:text-rose-300">
                    {topic.flagReason}
                  </p>
                </div>
              ) : null}

              {flagMode ? (
                <div className="space-y-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                  <Label htmlFor="lp-dialog-flag-reason" className="text-xs">
                    Reason (optional)
                  </Label>
                  <Textarea
                    id="lp-dialog-flag-reason"
                    rows={2}
                    maxLength={500}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Lab period was taken for exam prep"
                  />
                </div>
              ) : null}
            </div>

            {/* ── actions by status ── */}
            {flagMode ? (
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl px-4 text-xs"
                  onClick={() => setFlagMode(false)}
                  disabled={busy}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="h-11 rounded-xl bg-rose-600 px-4 text-xs font-semibold text-white hover:bg-rose-700"
                  onClick={() => void submitFlag()}
                  disabled={busy}
                >
                  {acting === 'flag' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <CalendarX2 className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  Flag for rescheduling
                </Button>
              </DialogFooter>
            ) : confirmUndo && topic.status === 'COMPLETED' ? (
              <DialogFooter className="sm:justify-between">
                <p className="text-xs text-muted-foreground">Reopen this lesson?</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl px-4 text-xs"
                    onClick={() => setConfirmUndo(false)}
                    disabled={busy}
                  >
                    Keep as taught
                  </Button>
                  <Button
                    type="button"
                    className="h-11 rounded-xl bg-rose-600 px-4 text-xs font-semibold text-white hover:bg-rose-700"
                    onClick={() => void onIntent(topic.id, 'undo')}
                    disabled={busy}
                  >
                    {acting === 'undo' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    Undo completion
                  </Button>
                </div>
              </DialogFooter>
            ) : topic.status === 'COMPLETED' ? (
              <DialogFooter className="sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Taught on {formatLessonDate(topic.completedOn ?? topic.plannedDate)}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 rounded-xl px-4 text-xs font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setConfirmUndo(true)}
                  disabled={busy}
                >
                  <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Undo
                </Button>
              </DialogFooter>
            ) : topic.status === 'UPCOMING' ? (
              <DialogFooter className="sm:justify-start">
                <p className="text-xs text-muted-foreground">
                  Scheduled for {formatLessonDate(topic.plannedDate)} — no actions
                  available until it reaches its day.
                </p>
              </DialogFooter>
            ) : (
              <DialogFooter>
                {topic.status === 'TODAY' || topic.status === 'IN_PROGRESS' ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="mr-auto h-11 rounded-xl px-3 text-xs font-medium text-rose-600 hover:bg-rose-500/5 hover:text-rose-700 dark:text-rose-400"
                    onClick={() => setFlagMode(true)}
                    disabled={busy}
                  >
                    <CalendarX2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Needs rescheduling
                  </Button>
                ) : null}

                {topic.status === 'TODAY' ? (
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(LESSON_ACTION_SECONDARY, 'px-4')}
                    disabled={busy}
                    onClick={() => void onIntent(topic.id, 'start')}
                  >
                    {acting === 'start' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    Start lesson
                  </Button>
                ) : null}

                {topic.status === 'NEEDS_RESCHEDULING' ? (
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(LESSON_ACTION_SECONDARY, 'px-4')}
                    disabled={busy}
                    onClick={() => void onIntent(topic.id, 'unflag')}
                  >
                    {acting === 'unflag' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <History className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    Clear flag
                  </Button>
                ) : null}

                <Button
                  type="button"
                  className={cn(LESSON_ACTION_PRIMARY, 'px-4')}
                  disabled={busy}
                  onClick={() => void onIntent(topic.id, 'complete')}
                >
                  {acting === 'complete' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  Mark completed
                </Button>
              </DialogFooter>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
