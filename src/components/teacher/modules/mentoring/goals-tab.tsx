'use client'

/**
 * Goals tab (TH-FE-3) — mentoring goals across all mentees with inline
 * status updates (PATCH → optimistic badge flip + toast). The server list
 * is ordered by updatedAt desc; achieved counts are shown as quiet text,
 * never as fabricated progress bars.
 */

import { useEffect, useState } from 'react'
import { CalendarClock, Check, Loader2, Target } from 'lucide-react'
import { toast } from 'sonner'
import { GlassCard } from '@/components/shared/ui'
import { HubEmptyState } from '@/components/teacher/modules/shared/hub-stat-cards'
import { GOAL_STATUS_LABELS } from '@/lib/teacher-hub-types'
import type { GoalItem, GoalStatus } from '@/lib/teacher-hub-types'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  GOAL_STATUS_OPTIONS,
  GOAL_STATUS_STYLES,
  isPastDate,
  PRIMARY_SM,
} from './shared'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface GoalsTabProps {
  goals: GoalItem[]
  onNewGoal: () => void
  onUpdateStatus: (id: string, status: GoalStatus) => Promise<GoalItem>
}

export function GoalsTab({ goals, onNewGoal, onUpdateStatus }: GoalsTabProps) {
  const [overrides, setOverrides] = useState<Record<string, GoalStatus>>({})
  const [revealed, setRevealed] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  // Fresh server data supersedes any optimistic overrides.
  useEffect(() => {
    setOverrides({})
    setRevealed(null)
  }, [goals])

  const apply = async (goal: GoalItem, status: GoalStatus) => {
    if (status === (overrides[goal.id] ?? goal.status)) {
      setRevealed(null)
      return
    }
    setRevealed(null)
    setOverrides((o) => ({ ...o, [goal.id]: status })) // optimistic flip
    setBusyId(goal.id)
    try {
      await onUpdateStatus(goal.id, status)
      toast.success('Goal updated', {
        description: `${goal.title} → ${GOAL_STATUS_LABELS[status]}`,
      })
    } catch (e) {
      setOverrides((o) => {
        const next = { ...o }
        delete next[goal.id]
        return next
      })
      toast.error(e instanceof Error ? e.message : 'Could not update the goal')
    } finally {
      setBusyId(null)
    }
  }

  const achieved = goals.filter((g) => (overrides[g.id] ?? g.status) === 'achieved').length

  if (goals.length === 0) {
    return (
      <GlassCard className="p-0" hover={false}>
        <HubEmptyState
          icon={Target}
          title="No goals yet"
          hint="Create a goal to track what each mentee is working towards."
          action={
            <button type="button" onClick={onNewGoal} className={PRIMARY_SM}>
              <Target className="h-3.5 w-3.5" aria-hidden="true" />
              New Goal
            </button>
          }
        />
      </GlassCard>
    )
  }

  return (
    <div className="space-y-3">
      {/* tab header area */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          {goals.length} goal{goals.length === 1 ? '' : 's'} · {achieved} achieved
        </p>
        <button type="button" onClick={onNewGoal} className={PRIMARY_SM}>
          <Target className="h-3.5 w-3.5" aria-hidden="true" />
          New Goal
        </button>
      </div>

      <GlassCard className="p-0" hover={false}>
        <div className="divide-y divide-border">
          {goals.map((g) => {
            const status = overrides[g.id] ?? g.status
            return (
              <div key={g.id} className="flex items-start gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">{g.student.name}</p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">{g.title}</p>
                  {g.target && (
                    <p className="mt-0.5 text-xs text-muted-foreground">Target: {g.target}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    {g.reviewDate && (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-[10px]',
                          isPastDate(g.reviewDate) && status !== 'achieved'
                            ? 'font-medium text-rose-600 dark:text-rose-400'
                            : 'text-muted-foreground',
                        )}
                      >
                        <CalendarClock className="h-3 w-3" aria-hidden="true" />
                        {formatDate(g.reviewDate)}
                      </span>
                    )}
                    {busyId === g.id ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                        Saving…
                      </span>
                    ) : revealed === g.id ? (
                      <Select value={status} onValueChange={(v) => apply(g, v as GoalStatus)}>
                        <SelectTrigger
                          size="sm"
                          className="h-7 w-[140px] rounded-lg text-[11px]"
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
                        onClick={() => setRevealed(g.id)}
                        className="rounded-lg px-2 py-0.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                      >
                        Update
                      </button>
                    )}
                  </div>
                </div>
                <GoalStatusBadge status={status} />
              </div>
            )
          })}
        </div>
      </GlassCard>
    </div>
  )
}

export function GoalStatusBadge({ status }: { status: GoalStatus }) {
  const style = GOAL_STATUS_STYLES[status]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
        style.badge,
      )}
    >
      {style.filled && <Check className="h-2.5 w-2.5" aria-hidden="true" />}
      {GOAL_STATUS_LABELS[status]}
    </span>
  )
}
