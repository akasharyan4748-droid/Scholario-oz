'use client'

/**
 * Mentee detail sheet (TH-FE-3) — the richest view: mentee profile header,
 * quick actions (log session / add goal / cross-module jump / status /
 * archive), the student's goals with inline updates, and a merged timeline
 * (sessions + this student's follow-ups from the aggregate, newest first).
 * Everything is derived from the already-loaded payload — no extra fetch,
 * honest skeletons while it hydrates, NO fabricated history.
 */

import { useEffect, useState } from 'react'
import {
  AlarmClock,
  Archive,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  Plus,
  Shield,
  Target,
} from 'lucide-react'
import { toast } from 'sonner'
import { GradientAvatar } from '@/components/shared/ui'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GOAL_STATUS_LABELS, MENTEE_STATUS_LABELS } from '@/lib/teacher-hub-types'
import type {
  FollowUpItem,
  GoalItem,
  GoalStatus,
  MenteeItem,
  MentoringPayload,
  SessionItem,
  StudentRef,
} from '@/lib/teacher-hub-types'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  dueMeta,
  GOAL_STATUS_OPTIONS,
  GHOST_SM,
  isPastDate,
  MENTEE_STATUS_OPTIONS,
  MENTEE_STATUS_STYLES,
  PRIMARY_SM,
  supportTypeLabel,
} from './shared'
import { GoalStatusBadge } from './goals-tab'
import { SessionTypeChip } from './sessions-tab'
import type { UpdateMenteeInput } from './hooks'

interface MenteeDetailDialogProps {
  studentId: string | null
  payload: MentoringPayload | null
  onClose: () => void
  /** opens the Log Session dialog prefilled with this student */
  onLogSession: (studentId: string) => void
  /** opens the New Goal dialog prefilled with this student */
  onAddGoal: (studentId: string) => void
  onNavigate?: (key: string) => void
  updateMentee: (id: string, patch: UpdateMenteeInput) => Promise<MenteeItem>
  updateGoalStatus: (id: string, status: GoalStatus) => Promise<GoalItem>
}

type TimelineEntry =
  | { key: string; at: number; kind: 'session'; session: SessionItem }
  | { key: string; at: number; kind: 'followUp'; followUp: FollowUpItem }

export function MenteeDetailDialog(props: MenteeDetailDialogProps) {
  const { studentId, payload, onClose } = props
  const open = !!studentId

  const mentee = payload?.assignments.find((a) => a.student.id === studentId) ?? null
  const student = mentee?.student ?? payload?.students.find((s) => s.id === studentId) ?? null

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-lg">
        {studentId && !payload && <SheetSkeleton />}
        {studentId && payload && !student && (
          <div className="flex h-full items-center justify-center px-6">
            <p className="text-xs text-muted-foreground">
              This student is no longer in your mentoring scope.
            </p>
          </div>
        )}
        {student && payload && (
          <MenteeSheet
            payload={payload}
            student={student}
            mentee={mentee}
            onClose={props.onClose}
            onLogSession={props.onLogSession}
            onAddGoal={props.onAddGoal}
            onNavigate={props.onNavigate}
            updateMentee={props.updateMentee}
            updateGoalStatus={props.updateGoalStatus}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

// ─── the sheet body ──────────────────────────────────────────────────

interface MenteeSheetProps {
  payload: MentoringPayload
  student: StudentRef
  mentee: MenteeItem | null
  onClose: () => void
  onLogSession: (studentId: string) => void
  onAddGoal: (studentId: string) => void
  onNavigate?: (key: string) => void
  updateMentee: (id: string, patch: UpdateMenteeInput) => Promise<MenteeItem>
  updateGoalStatus: (id: string, status: GoalStatus) => Promise<GoalItem>
}

function MenteeSheet({
  student,
  mentee,
  payload,
  onClose,
  onLogSession,
  onAddGoal,
  onNavigate,
  updateMentee,
  updateGoalStatus,
}: MenteeSheetProps) {
  const [statusBusy, setStatusBusy] = useState(false)
  const [archiveBusy, setArchiveBusy] = useState(false)
  const [goalOverrides, setGoalOverrides] = useState<Record<string, GoalStatus>>({})
  const [revealedGoal, setRevealedGoal] = useState<string | null>(null)
  const [goalBusy, setGoalBusy] = useState<string | null>(null)

  // Fresh aggregate data supersedes optimistic overrides.
  useEffect(() => {
    setGoalOverrides({})
    setRevealedGoal(null)
  }, [payload])

  const goals = payload.goals.filter((g) => g.student.id === student.id)
  const sessions = payload.sessions.filter((s) => s.student.id === student.id)
  const followUps = payload.followUps.filter((f) => f.student?.id === student.id)

  // Merged timeline: this student's sessions + follow-ups, newest first.
  const timeline: TimelineEntry[] = [
    ...sessions.map(
      (s): TimelineEntry => ({
        key: `session-${s.id}`,
        at: new Date(s.date).getTime(),
        kind: 'session',
        session: s,
      }),
    ),
    ...followUps.map(
      (f): TimelineEntry => ({
        key: `followup-${f.id}`,
        at: new Date(f.createdAt).getTime(),
        kind: 'followUp',
        followUp: f,
      }),
    ),
  ].sort((a, b) => b.at - a.at)

  const changeStatus = async (status: string) => {
    if (!mentee) return
    setStatusBusy(true)
    try {
      await updateMentee(mentee.id, { status: status as UpdateMenteeInput['status'] })
      toast.success('Status updated', {
        description: `${student.name} → ${MENTEE_STATUS_LABELS[status as MenteeItem['status']]}`,
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update the status')
    } finally {
      setStatusBusy(false)
    }
  }

  const toggleArchive = async () => {
    if (!mentee) return
    const next = !mentee.active
    setArchiveBusy(true)
    try {
      await updateMentee(mentee.id, { active: next })
      toast.success(next ? 'Mentoring reactivated' : 'Mentoring archived', {
        description: student.name,
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update mentoring')
    } finally {
      setArchiveBusy(false)
    }
  }

  const applyGoalStatus = async (goalId: string, title: string, status: GoalStatus) => {
    setRevealedGoal(null)
    setGoalOverrides((o) => ({ ...o, [goalId]: status })) // optimistic flip
    setGoalBusy(goalId)
    try {
      await updateGoalStatus(goalId, status)
      toast.success('Goal updated', { description: `${title} → ${GOAL_STATUS_LABELS[status]}` })
    } catch (e) {
      setGoalOverrides((o) => {
        const next = { ...o }
        delete next[goalId]
        return next
      })
      toast.error(e instanceof Error ? e.message : 'Could not update the goal')
    } finally {
      setGoalBusy(null)
    }
  }

  const statusStyle = mentee ? MENTEE_STATUS_STYLES[mentee.status] : null
  const firstName = student.name.split(' ')[0]

  return (
    <>
      {/* header */}
      <SheetHeader className="border-b border-border px-4 pb-4 pt-5 sm:px-5">
        <div className="flex items-start gap-3 pr-6">
          <GradientAvatar name={student.name} size="lg" />
          <div className="min-w-0">
            <SheetTitle className="text-base font-semibold leading-tight">{student.name}</SheetTitle>
            <SheetDescription className="text-xs">
              Roll {student.rollNo ?? '—'} · {student.classLabel}
            </SheetDescription>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              {mentee && statusStyle ? (
                <>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                      statusStyle.badge,
                    )}
                  >
                    <span
                      className={cn('h-1.5 w-1.5 rounded-full', statusStyle.dot)}
                      aria-hidden="true"
                    />
                    {MENTEE_STATUS_LABELS[mentee.status]}
                  </span>
                  <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {supportTypeLabel(mentee.supportType)}
                  </span>
                  {!mentee.active && (
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Archived
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[10px] font-medium text-muted-foreground">
                  Not a mentee yet — logging a session adds them.
                </span>
              )}
            </div>
          </div>
        </div>
        {mentee?.notes && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{mentee.notes}</p>
        )}
      </SheetHeader>

      {/* quick actions */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
        <button type="button" onClick={() => onLogSession(student.id)} className={PRIMARY_SM}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Log Session
        </button>
        <button type="button" onClick={() => onAddGoal(student.id)} className={GHOST_SM}>
          <Target className="h-3.5 w-3.5" aria-hidden="true" />
          Add Goal
        </button>
        <button
          type="button"
          onClick={() => {
            onNavigate?.('behavior')
            onClose()
          }}
          className={GHOST_SM}
        >
          <Shield className="h-3.5 w-3.5" aria-hidden="true" />
          View Behavior
        </button>
        <button
          type="button"
          onClick={() => {
            onNavigate?.('parent-connect')
            onClose()
          }}
          className={GHOST_SM}
        >
          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
          Message Parent
        </button>
      </div>

      {/* status updater + archive toggle */}
      {mentee && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Status
            </span>
            <Select
              value={mentee.status}
              onValueChange={(v) => changeStatus(v)}
              disabled={statusBusy}
            >
              <SelectTrigger
                size="sm"
                className="h-7 w-[140px] rounded-lg text-[11px]"
                aria-label={`Mentoring status for ${student.name}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MENTEE_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {statusBusy && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" aria-hidden="true" />
            )}
          </div>
          <button
            type="button"
            onClick={toggleArchive}
            disabled={archiveBusy}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
          >
            {archiveBusy ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            ) : (
              <Archive className="h-3 w-3" aria-hidden="true" />
            )}
            {mentee.active ? 'Archive mentoring' : 'Reactivate'}
          </button>
        </div>
      )}

      {/* scrollable body */}
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-5">
        {/* goals */}
        <section aria-label="Goals">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Goals
          </h3>
          {goals.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
              No goals yet — add one to track what {firstName} is working towards.
            </p>
          ) : (
            <div className="space-y-2">
              {goals.map((g) => {
                const status = goalOverrides[g.id] ?? g.status
                return (
                  <div key={g.id} className="rounded-xl border border-border bg-card/60 px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                          {status === 'achieved' && (
                            <Check
                              className="h-3.5 w-3.5 shrink-0 text-emerald-500"
                              aria-hidden="true"
                            />
                          )}
                          <span className="truncate">{g.title}</span>
                        </p>
                        {g.target && (
                          <p className="mt-0.5 text-xs text-muted-foreground">Target: {g.target}</p>
                        )}
                        {g.reviewDate && (
                          <p
                            className={cn(
                              'mt-0.5 text-[10px]',
                              isPastDate(g.reviewDate) && status !== 'achieved'
                                ? 'font-medium text-rose-600 dark:text-rose-400'
                                : 'text-muted-foreground',
                            )}
                          >
                            Review {formatDate(g.reviewDate)}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <GoalStatusBadge status={status} />
                        {goalBusy === g.id ? (
                          <Loader2
                            className="h-3 w-3 animate-spin text-muted-foreground"
                            aria-hidden="true"
                          />
                        ) : revealedGoal === g.id ? (
                          <Select
                            value={status}
                            onValueChange={(v) => applyGoalStatus(g.id, g.title, v as GoalStatus)}
                          >
                            <SelectTrigger
                              size="sm"
                              className="h-7 w-[130px] rounded-lg text-[11px]"
                              aria-label={`Update status for ${g.title}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {GOAL_STATUS_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value} className="text-xs">
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRevealedGoal(g.id)}
                            className="rounded-lg px-2 py-0.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                          >
                            Update
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* timeline */}
        <section aria-label="Timeline">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Timeline
          </h3>
          {timeline.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
              No sessions or follow-ups yet — the history builds as you log sessions.
            </p>
          ) : (
            <div className="space-y-2">
              {timeline.map((entry) =>
                entry.kind === 'session' ? (
                  <TimelineSessionRow key={entry.key} session={entry.session} />
                ) : (
                  <TimelineFollowUpRow key={entry.key} followUp={entry.followUp} />
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </>
  )
}

// ─── timeline rows ───────────────────────────────────────────────────

function TimelineSessionRow({ session }: { session: SessionItem }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card/60 px-3 py-2.5">
      <span className="w-16 shrink-0 pt-0.5 text-[10px] leading-tight tabular-nums text-muted-foreground">
        {formatDate(session.date)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <SessionTypeChip type={session.type} />
          {session.durationMinutes != null && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {session.durationMinutes} min
            </span>
          )}
          {session.followUpDate && (
            <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Follow-up {formatDate(session.followUpDate)}
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{session.discussion}</p>
        {session.actionItems.length > 0 && (
          <ul className="mt-1.5 space-y-0.5">
            {session.actionItems.map((item, i) => (
              <li
                key={`${session.id}-item-${i}`}
                className="flex items-start gap-1.5 text-[11px] text-muted-foreground"
              >
                <CheckCircle2
                  className="mt-px h-3 w-3 shrink-0 text-muted-foreground/60"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function TimelineFollowUpRow({ followUp }: { followUp: FollowUpItem }) {
  const due = dueMeta(followUp.dueDate)
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5">
      <AlarmClock
        className={cn(
          'mt-0.5 h-3.5 w-3.5 shrink-0',
          due.state === 'overdue'
            ? 'text-rose-500'
            : due.state === 'today'
              ? 'text-amber-500'
              : 'text-muted-foreground/70',
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground">{followUp.reason}</p>
        {followUp.note && (
          <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{followUp.note}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          {due.state === 'overdue' ? (
            <span className="inline-flex items-center rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
              {due.label}
            </span>
          ) : due.state === 'today' ? (
            <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              Due today
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">
              Due {formatDate(followUp.dueDate)}
            </span>
          )}
          <span className="text-[10px] font-medium text-muted-foreground">Open</span>
        </div>
      </div>
    </div>
  )
}

// ─── hydrating skeleton (aggregate still loading) ────────────────────

function SheetSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b border-border px-4 py-5 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
      <div className="space-y-2 border-b border-border px-4 py-3 sm:px-5">
        <div className="h-7 w-24 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
        <div className="h-2.5 w-14 animate-pulse rounded bg-muted" />
        <div className="h-16 animate-pulse rounded-xl bg-muted" />
        <div className="h-16 animate-pulse rounded-xl bg-muted" />
        <div className="mt-4 h-2.5 w-16 animate-pulse rounded bg-muted" />
        <div className="h-20 animate-pulse rounded-xl bg-muted" />
        <div className="h-20 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  )
}
