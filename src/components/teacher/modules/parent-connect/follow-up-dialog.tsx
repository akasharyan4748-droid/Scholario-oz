'use client'

/**
 * parent-connect/follow-up-dialog — mark a parent conversation for
 * follow-up. Reason is prefilled from the thread context, the due date
 * defaults to +3 days, priority defaults to normal, note is optional.
 */

import { useEffect, useState } from 'react'
import { AlarmClockPlus, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/format'
import type { FollowUpPriority } from '@/lib/teacher-hub-types'
import { toast } from 'sonner'
import { createParentConnectFollowUp } from './hooks'
import { dateInputValue, PRIORITY_OPTIONS } from './shared'

export interface FollowUpContext {
  conversationId: string
  parentName: string
  studentName: string
}

interface FollowUpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: FollowUpContext | null
  onCreated: () => void
}

export function FollowUpDialog({ open, onOpenChange, context, onCreated }: FollowUpDialogProps) {
  const [reason, setReason] = useState('')
  const [dueDate, setDueDate] = useState(dateInputValue(3))
  const [priority, setPriority] = useState<string>('normal')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)

  // Prefill from the thread that opened the dialog.
  useEffect(() => {
    if (open && context) {
      setReason(`Follow up with ${context.parentName} about ${context.studentName}`)
      setDueDate(dateInputValue(3))
      setPriority('normal')
      setNote('')
      setSending(false)
    }
  }, [open, context])

  const handleSubmit = async () => {
    if (!context) return
    if (!reason.trim()) {
      toast.error('A reason is required')
      return
    }
    if (!dueDate) {
      toast.error('Pick a due date')
      return
    }
    setSending(true)
    try {
      await createParentConnectFollowUp({
        conversationId: context.conversationId,
        reason: reason.trim(),
        dueDate,
        priority: priority as FollowUpPriority,
        note: note.trim() ? note.trim() : undefined,
      })
      toast.success('Follow-up scheduled', { description: `Due ${formatDate(dueDate)}` })
      onCreated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Follow-up could not be created')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Mark for follow-up</DialogTitle>
          <DialogDescription className="text-xs">
            Set a reminder to return to this parent conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fu-reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fu-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why does this need a follow-up?"
              maxLength={300}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fu-date">
                Due date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fu-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fu-note">Note (optional)</Label>
            <Textarea
              id="fu-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything you want to remember when you return to this…"
              className="min-h-20 text-sm"
              maxLength={1000}
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={() => onOpenChange(false)}
            disabled={sending}
            className="rounded-xl px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={sending}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <AlarmClockPlus className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Schedule Follow-up
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
