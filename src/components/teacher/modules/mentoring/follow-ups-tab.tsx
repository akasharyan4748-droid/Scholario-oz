'use client'

/**
 * Follow-ups tab (TH-FE-3) — the dedicated mentoring follow-up view.
 * Rows show the student, reason, due state, priority and source; each can
 * be completed, rescheduled (inline date popover) or deep-linked to the
 * student's mentee sheet. Overdue rows sort first. All follow-ups here are
 * kind=mentoring from the server aggregate.
 */

import { useState } from 'react'
import { AlarmClock, CalendarClock, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { GlassCard } from '@/components/shared/ui'
import { HubEmptyState } from '@/components/teacher/modules/shared/hub-stat-cards'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { FollowUpItem } from '@/lib/teacher-hub-types'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { dueMeta, priorityMeta, toInputDate } from './shared'
import type { UpdateFollowUpInput } from './hooks'

interface FollowUpsTabProps {
  followUps: FollowUpItem[]
  updateFollowUp: (id: string, patch: UpdateFollowUpInput) => Promise<FollowUpItem>
  onOpenStudent: (studentId: string) => void
}

export function FollowUpsTab({ followUps, updateFollowUp, onOpenStudent }: FollowUpsTabProps) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [newDate, setNewDate] = useState('')

  // Overdue first, then due today, then upcoming — each by due date asc.
  const rank = (state: 'overdue' | 'today' | 'later') =>
    state === 'overdue' ? 0 : state === 'today' ? 1 : 2
  const sorted = [...followUps].sort((a, b) => {
    const da = dueMeta(a.dueDate)
    const db = dueMeta(b.dueDate)
    if (rank(da.state) !== rank(db.state)) return rank(da.state) - rank(db.state)
    return a.dueDate.localeCompare(b.dueDate)
  })

  const complete = async (f: FollowUpItem) => {
    setBusyId(f.id)
    try {
      await updateFollowUp(f.id, { status: 'done' })
      toast.success('Follow-up completed')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not complete the follow-up')
    } finally {
      setBusyId(null)
    }
  }

  const reschedule = async (f: FollowUpItem) => {
    if (!newDate) {
      toast.error('Pick a new due date')
      return
    }
    setBusyId(f.id)
    try {
      await updateFollowUp(f.id, { dueDate: newDate })
      toast.success('Follow-up rescheduled', {
        description: `${f.reason} → ${formatDate(newDate)}`,
      })
      setRescheduleId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not reschedule the follow-up')
    } finally {
      setBusyId(null)
    }
  }

  if (followUps.length === 0) {
    return (
      <GlassCard className="p-0" hover={false}>
        <HubEmptyState
          icon={CheckCircle2}
          title="No open follow-ups"
          hint="Follow-ups you schedule in sessions will appear here."
        />
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-0" hover={false}>
      <div className="divide-y divide-border">
        {sorted.map((f) => {
          const due = dueMeta(f.dueDate)
          const priority = priorityMeta(f.priority)
          const busy = busyId === f.id
          return (
            <div key={f.id} className="px-4 py-3.5">
              <div className="flex items-start gap-3">
                <AlarmClock
                  className={cn(
                    'mt-0.5 h-4 w-4 shrink-0',
                    due.state === 'overdue'
                      ? 'text-rose-500'
                      : due.state === 'today'
                        ? 'text-amber-500'
                        : 'text-muted-foreground/60',
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {f.student ? f.student.name : 'Unlinked student'}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">{f.reason}</p>
                  {f.note && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{f.note}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    {due.state === 'overdue' ? (
                      <span className="inline-flex items-center rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                        {due.label}
                      </span>
                    ) : due.state === 'today' ? (
                      <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        Due today
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <CalendarClock className="h-3 w-3" aria-hidden="true" />
                        {formatDate(f.dueDate)}
                      </span>
                    )}
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 text-[10px] font-medium',
                        priority.className,
                      )}
                    >
                      {f.priority === 'high' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden="true" />
                      )}
                      {priority.label} priority
                    </span>
                    <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Mentoring
                    </span>
                  </div>

                  {/* row actions */}
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => complete(f)}
                      disabled={busy}
                      className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/10 disabled:opacity-50 dark:text-emerald-400"
                    >
                      {busy && rescheduleId !== f.id ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                          Completing…
                        </span>
                      ) : (
                        'Complete'
                      )}
                    </button>
                    <Popover
                      open={rescheduleId === f.id}
                      onOpenChange={(o) => {
                        if (o) {
                          setRescheduleId(f.id)
                          setNewDate(toInputDate(f.dueDate))
                        } else {
                          setRescheduleId(null)
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          disabled={busy}
                          className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
                        >
                          Reschedule
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-3" align="start">
                        <p className="mb-2 text-xs font-semibold text-foreground">
                          Reschedule follow-up
                        </p>
                        <div className="space-y-1.5">
                          <Label htmlFor={`fu-date-${f.id}`} className="text-[11px]">
                            New due date
                          </Label>
                          <Input
                            id={`fu-date-${f.id}`}
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="mt-3 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setRescheduleId(null)}
                            className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted/50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => reschedule(f)}
                            disabled={busy || !newDate}
                            className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
                          >
                            {busy && rescheduleId === f.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                            ) : null}
                            Save
                          </button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <button
                      type="button"
                      onClick={() => f.student && onOpenStudent(f.student.id)}
                      disabled={!f.student}
                      className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
                    >
                      Open Student
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
