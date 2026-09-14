'use client'

/**
 * Log Session dialog (TH-FE-3) — logs a real mentoring session via
 * POST /api/teacher/mentoring/sessions. The server auto-creates the mentee
 * assignment when the student is not yet assigned, and auto-creates a
 * follow-up when a follow-up date is set — the dialog just gathers input.
 */

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { SessionItem, StudentRef } from '@/lib/teacher-hub-types'
import { PRIMARY_ACTION, SESSION_TYPE_OPTIONS, todayInputDate } from './shared'
import type { LogSessionInput } from './hooks'

interface LogSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** students the teacher may log sessions for (server-scoped) */
  students: StudentRef[]
  /** prefills the student when opened from a mentee */
  defaultStudentId?: string
  onLogSession: (input: LogSessionInput) => Promise<SessionItem>
}

const DEFAULT_TYPE = 'general'

export function LogSessionDialog({
  open,
  onOpenChange,
  students,
  defaultStudentId,
  onLogSession,
}: LogSessionDialogProps) {
  const [studentId, setStudentId] = useState('')
  const [date, setDate] = useState(todayInputDate())
  const [type, setType] = useState<string>(DEFAULT_TYPE)
  const [discussion, setDiscussion] = useState('')
  const [actionItems, setActionItems] = useState('')
  const [duration, setDuration] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [saving, setSaving] = useState(false)

  // Fresh defaults each time the dialog opens (prefill honours the mentee).
  useEffect(() => {
    if (!open) return
    setStudentId(defaultStudentId ?? '')
    setDate(todayInputDate())
    setType(DEFAULT_TYPE)
    setDiscussion('')
    setActionItems('')
    setDuration('')
    setFollowUpDate('')
    setSaving(false)
  }, [open, defaultStudentId])

  const handleSubmit = async () => {
    if (!studentId) {
      toast.error('Select a student first')
      return
    }
    if (!discussion.trim()) {
      toast.error('Add a note of what was discussed')
      return
    }
    const items = actionItems
      .split('\n')
      .map((i) => i.trim())
      .filter(Boolean)
    const minutes = Math.round(Number(duration))
    setSaving(true)
    try {
      await onLogSession({
        studentId,
        date: date || undefined,
        type: type as LogSessionInput['type'],
        discussion: discussion.trim(),
        actionItems: items.length ? items : undefined,
        durationMinutes:
          duration !== '' && Number.isFinite(minutes) && minutes > 0 ? minutes : undefined,
        followUpDate: followUpDate || undefined,
      })
      toast.success('Session logged')
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not log the session')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Log Mentoring Session</DialogTitle>
          <DialogDescription className="text-xs">
            A first session for a new student adds them to your mentees automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="w-full text-xs">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.name} · {s.classLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {students.length === 0 && (
              <p className="text-[11px] text-muted-foreground">
                No students are in your mentoring scope yet.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ms-date">Date</Label>
              <Input
                id="ms-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Session type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ms-discussion">
              Discussion <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="ms-discussion"
              value={discussion}
              onChange={(e) => setDiscussion(e.target.value)}
              placeholder="What was discussed and observed…"
              className="min-h-24 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ms-actions">Action items</Label>
            <Textarea
              id="ms-actions"
              value={actionItems}
              onChange={(e) => setActionItems(e.target.value)}
              placeholder="One per line, e.g. Share practice set by Friday"
              className="min-h-16 text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              Optional — one action item per line.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ms-duration">Duration (min)</Label>
              <Input
                id="ms-duration"
                type="number"
                min={5}
                max={240}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="20"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ms-followup">Follow-up date</Label>
              <Input
                id="ms-followup"
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className={`${PRIMARY_ACTION} disabled:opacity-60`}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : null}
            Log Session
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
