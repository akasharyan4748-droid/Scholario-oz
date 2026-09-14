'use client'

/**
 * student-profile-dialog — one student's behavior profile.
 *
 * A right-side Sheet (full-width on mobile): identity header, four mini
 * count tiles (positive / observation / concern / open), real
 * cross-module actions (Mentoring, Parent Connect — rendered only when
 * the link exists), the full record timeline newest-first with private
 * staff notes, and the student's open follow-ups with Complete.
 *
 * Data is fetched on open (GET /api/teacher/behavior/student/[id]) with
 * an inline skeleton while loading and an honest retry on failure — the
 * sheet itself always stays usable.
 */

import { useState } from 'react'
import { AlarmClock, Bell, Heart, Loader2, Lock, MessageSquare, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { GradientAvatar } from '@/components/shared/ui'
import { HubSectionError } from '@/components/teacher/modules/shared/hub-stat-cards'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { BehaviorRecordItem, FollowUpItem, StudentRef } from '@/lib/teacher-hub-types'
import { completeFollowUp, useStudentBehaviorProfile } from './hooks'
import {
  PRIMARY_ACTION_CLASS,
  STATUS_CONFIG,
  TYPE_CONFIG,
  categoryLabelOf,
  compactDate,
  dueState,
} from './shared'

const THIN_SCROLLBAR =
  '[scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent'

const GHOST_ACTION_CLASS =
  'flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted/50'

// ─── the sheet ───────────────────────────────────────────────────────

interface StudentProfileDialogProps {
  /** null → closed; a value → open and fetch that student's profile */
  studentId: string | null
  onOpenChange: (open: boolean) => void
  /** cross-module navigation from the teacher workspace shell */
  onNavigate?: (key: string) => void
  /** prefill + open the Record Observation dialog for this student */
  onRecordObservation: (student: StudentRef) => void
  /** quiet aggregate reload after a mutation */
  onChanged: () => void
  /** school taxonomy for category labels */
  categories: { key: string; label: string; kind: 'any' | 'positive' | 'concern' }[]
}

export function StudentProfileDialog({
  studentId,
  onOpenChange,
  onNavigate,
  onRecordObservation,
  onChanged,
  categories,
}: StudentProfileDialogProps) {
  const { data, loading, error, reload } = useStudentBehaviorProfile(studentId)
  const [completingId, setCompletingId] = useState<string | null>(null)

  const handleComplete = async (f: FollowUpItem) => {
    setCompletingId(f.id)
    try {
      await completeFollowUp(f.id)
      toast.success('Follow-up completed')
      reload()
      onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not complete the follow-up.')
    } finally {
      setCompletingId(null)
    }
  }

  const showSkeleton = loading && !data
  const body = error && !data ? null : data

  return (
    <Sheet open={!!studentId} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn('w-full gap-0 sm:max-w-lg', THIN_SCROLLBAR)}
      >
        {/* header */}
        <div className="border-b border-border px-4 py-4 sm:px-5">
          {body ? (
            <div className="flex items-center gap-3">
              <GradientAvatar name={body.student.name} size="lg" />
              <div className="min-w-0">
                <SheetTitle className="truncate text-base font-semibold">
                  {body.student.name}
                </SheetTitle>
                <SheetDescription className="mt-0.5 truncate text-xs">
                  Roll {body.student.rollNo ?? '—'} · {body.student.classLabel}
                </SheetDescription>
              </div>
            </div>
          ) : showSkeleton ? (
            <>
              <SheetTitle className="sr-only">Student behavior profile</SheetTitle>
              <SheetDescription className="sr-only">
                Loading the behavior timeline and follow-ups.
              </SheetDescription>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </>
          ) : (
            <SheetTitle className="sr-only">Student behavior profile</SheetTitle>
          )}
        </div>

        {/* body */}
        <div className={cn('flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-5', THIN_SCROLLBAR)}>
          {error && !data ? (
            <HubSectionError message={error} onRetry={reload} />
          ) : showSkeleton ? (
            <ProfileSkeleton />
          ) : body ? (
            <>
              {/* counts strip — small bordered tiles, not cards */}
              <div className="grid grid-cols-4 gap-2">
                <CountTile label="Positive" value={body.counts.positive} className="text-emerald-600 dark:text-emerald-400" />
                <CountTile label="Observation" value={body.counts.observation} className="text-sky-600 dark:text-sky-400" />
                <CountTile label="Concern" value={body.counts.concern} className="text-rose-600 dark:text-rose-400" />
                <CountTile label="Open" value={body.counts.open} className="text-amber-600 dark:text-amber-400" />
              </div>

              {/* cross-module actions — only what really exists */}
              <div className="flex flex-wrap items-center gap-2">
                {body.mentoring.isMentee && (
                  <button
                    type="button"
                    className={GHOST_ACTION_CLASS}
                    onClick={() => {
                      onOpenChange(false)
                      onNavigate?.('mentoring')
                    }}
                  >
                    <Heart className="h-3.5 w-3.5" aria-hidden="true" />
                    Open Mentoring
                  </button>
                )}
                {body.conversationId && (
                  <button
                    type="button"
                    className={GHOST_ACTION_CLASS}
                    onClick={() => {
                      onOpenChange(false)
                      onNavigate?.('parent-connect')
                    }}
                  >
                    <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                    Message Parent
                  </button>
                )}
                <button
                  type="button"
                  className={cn(PRIMARY_ACTION_CLASS, 'ml-auto')}
                  onClick={() => onRecordObservation(body.student)}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Record Observation
                </button>
              </div>

              {/* timeline */}
              <section className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Timeline
                </h3>
                {body.records.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No observations recorded yet.</p>
                ) : (
                  body.records.map((r) => (
                    <TimelineRow key={r.id} record={r} categories={categories} />
                  ))
                )}
              </section>

              {/* open follow-ups */}
              {body.followUps.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Open follow-ups
                  </h3>
                  <div className="space-y-2">
                    {body.followUps.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-foreground">{f.reason}</p>
                          <ProfileDueChip dueDate={f.dueDate} />
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleComplete(f)}
                          disabled={completingId === f.id}
                          className="inline-flex shrink-0 items-center gap-1 rounded text-xs font-semibold text-emerald-600 hover:underline disabled:opacity-60 dark:text-emerald-400"
                        >
                          {completingId === f.id && (
                            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                          )}
                          Complete
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── pieces ──────────────────────────────────────────────────────────

function CountTile({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="rounded-lg border border-border px-2 py-2 text-center">
      <p className={cn('font-display text-lg font-bold tabular-nums', className)}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

function TimelineRow({
  record,
  categories,
}: {
  record: BehaviorRecordItem
  categories: { key: string; label: string; kind: 'any' | 'positive' | 'concern' }[]
}) {
  const type = TYPE_CONFIG[record.type]
  const status = STATUS_CONFIG[record.status]
  const overdue = record.followUpDate ? dueState(record.followUpDate) === 'overdue' : false

  return (
    <div className="flex gap-3">
      {/* date rail */}
      <p className="w-16 shrink-0 pt-0.5 text-[10px] tabular-nums text-muted-foreground">
        {compactDate(record.date)}
      </p>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', type.dot)} aria-hidden="true" />
          <span className="text-xs font-medium text-foreground">
            {categoryLabelOf(categories, record.category)}
          </span>
          <span className={cn('text-[10px] font-medium', status.text)}>
            <span className={cn('mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle', status.dot)} aria-hidden="true" />
            {status.label}
          </span>
        </div>
        <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
          {record.description}
        </p>
        {record.actionTaken && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground/70">Action taken:</span> {record.actionTaken}
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          <span>By {record.recordedBy.name}</span>
          {record.followUpDate && (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-medium tabular-nums',
                overdue
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-amber-600 dark:text-amber-400',
              )}
            >
              <AlarmClock className="h-3 w-3" aria-hidden="true" />
              {overdue ? 'Overdue' : 'Due'} {formatDate(record.followUpDate)}
            </span>
          )}
          {record.parentNotified && (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <Bell className="h-3 w-3" aria-hidden="true" />
              Parent notified
            </span>
          )}
        </div>
        {record.privateNote && (
          <div className="mt-1.5 rounded-lg bg-muted/40 px-3 py-2">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
              Staff note
            </p>
            <p className="mt-0.5 whitespace-pre-line text-xs text-muted-foreground">
              {record.privateNote}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ProfileDueChip({ dueDate }: { dueDate: string }) {
  const state = dueState(dueDate)
  return (
    <p
      className={cn(
        'mt-0.5 text-[11px] font-medium tabular-nums',
        state === 'overdue'
          ? 'text-rose-600 dark:text-rose-400'
          : state === 'today'
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-muted-foreground',
      )}
    >
      {state === 'overdue'
        ? `Overdue · ${formatDate(dueDate)}`
        : state === 'today'
          ? 'Due today'
          : formatDate(dueDate)}
    </p>
  )
}

/** 3-4 pulse rows while the profile loads. */
function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg border border-border bg-muted/40" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex animate-pulse gap-3">
          <div className="h-2.5 w-12 shrink-0 rounded bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-28 rounded bg-muted" />
            <div className="h-2 w-full rounded bg-muted" />
            <div className="h-2 w-2/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
