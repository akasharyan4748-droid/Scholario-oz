'use client'

/**
 * communication/follow-ups-card — the open parent-communication follow-ups
 * list (TeacherFollowUp rows, kind parent-connect, status open). Each row
 * deep-links to its conversation, can be completed (persisted) or
 * rescheduled (persisted). Ported from the former Parent Connect module
 * when its follow-up management was absorbed into the Communication Hub.
 */

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GlassCard } from '@/components/shared/ui'
import { formatDate } from '@/lib/format'
import type { FollowUpItem } from '@/lib/teacher-hub-types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { updateFollowUp } from './hooks'
import { dateInputValue, dueChip, PRIORITY_DOT } from './shared'

interface FollowUpsCardProps {
  followUps: FollowUpItem[]
  onOpenConversation: (conversationId: string) => void
  onChanged: () => void
}

export function FollowUpsCard({ followUps, onOpenConversation, onChanged }: FollowUpsCardProps) {
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<FollowUpItem | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduling, setRescheduling] = useState(false)

  if (followUps.length === 0) return null

  const handleComplete = async (followUp: FollowUpItem) => {
    setCompletingId(followUp.id)
    try {
      await updateFollowUp(followUp.id, { status: 'done' })
      toast.success('Follow-up completed', { description: followUp.reason })
      onChanged()
    } catch (e) {
      toast.error('Could not complete the follow-up', {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setCompletingId(null)
    }
  }

  const openReschedule = (followUp: FollowUpItem) => {
    setRescheduleTarget(followUp)
    setRescheduleDate(followUp.dueDate.slice(0, 10))
  }

  const handleReschedule = async () => {
    if (!rescheduleTarget || !rescheduleDate) return
    setRescheduling(true)
    try {
      await updateFollowUp(rescheduleTarget.id, { dueDate: rescheduleDate })
      toast.success('Follow-up rescheduled', { description: `Due ${formatDate(rescheduleDate)}` })
      setRescheduleTarget(null)
      onChanged()
    } catch (e) {
      toast.error('Could not reschedule the follow-up', {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setRescheduling(false)
    }
  }

  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="border-b border-border bg-muted/30 px-4 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Follow-ups
        </p>
      </div>
      <div className="divide-y divide-border/60">
        {followUps.map((f) => {
          const chip = dueChip(f.dueDate)
          const threadId = f.conversationId
          return (
            <div
              key={f.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                {threadId ? (
                  <button
                    onClick={() => onOpenConversation(threadId)}
                    className="max-w-full text-left"
                    title="Open conversation"
                  >
                    <p className="truncate text-sm font-medium hover:text-primary">
                      {f.student?.name ?? 'Follow-up'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{f.reason}</p>
                  </button>
                ) : (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{f.student?.name ?? 'Follow-up'}</p>
                    <p className="truncate text-xs text-muted-foreground">{f.reason}</p>
                  </div>
                )}
              </div>
              <span className={chip.className}>{chip.label}</span>
              <span
                className={cn('h-2 w-2 shrink-0 rounded-full', PRIORITY_DOT[f.priority])}
                title={`${f.priority} priority`}
              />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => void handleComplete(f)}
                  disabled={completingId === f.id}
                  className="rounded-lg px-2 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10 disabled:opacity-50 dark:text-emerald-400"
                >
                  {completingId === f.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    'Complete'
                  )}
                </button>
                <button
                  onClick={() => openReschedule(f)}
                  className="rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  Reschedule
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <Dialog
        open={rescheduleTarget != null}
        onOpenChange={(o) => {
          if (!o) setRescheduleTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Reschedule follow-up</DialogTitle>
            <DialogDescription className="text-xs">
              {rescheduleTarget?.reason}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="fu-reschedule-date">New due date</Label>
            <Input
              id="fu-reschedule-date"
              type="date"
              value={rescheduleDate}
              min={dateInputValue(0)}
              onChange={(e) => setRescheduleDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={() => setRescheduleTarget(null)}
              disabled={rescheduling}
              className="rounded-xl px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleReschedule()}
              disabled={!rescheduleDate || rescheduling}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {rescheduling && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              Save Date
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </GlassCard>
  )
}
