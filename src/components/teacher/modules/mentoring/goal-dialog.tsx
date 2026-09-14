'use client'

/**
 * Goal dialog (TH-FE-3) — creates a mentoring goal via
 * POST /api/teacher/mentoring/goals (the server get-or-creates the mentee
 * assignment: a goal implies a mentoring relationship).
 */

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
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
import type { GoalItem, StudentRef } from '@/lib/teacher-hub-types'
import { GOAL_STATUS_OPTIONS, PRIMARY_ACTION } from './shared'
import type { AddGoalInput } from './hooks'

interface GoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  students: StudentRef[]
  /** prefills the student when opened from a mentee */
  defaultStudentId?: string
  onAddGoal: (input: AddGoalInput) => Promise<GoalItem>
}

const DEFAULT_STATUS = 'in-progress'

export function GoalDialog({
  open,
  onOpenChange,
  students,
  defaultStudentId,
  onAddGoal,
}: GoalDialogProps) {
  const [studentId, setStudentId] = useState('')
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('')
  const [reviewDate, setReviewDate] = useState('')
  const [status, setStatus] = useState<string>(DEFAULT_STATUS)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setStudentId(defaultStudentId ?? '')
    setTitle('')
    setTarget('')
    setReviewDate('')
    setStatus(DEFAULT_STATUS)
    setSaving(false)
  }, [open, defaultStudentId])

  const handleSubmit = async () => {
    if (!studentId) {
      toast.error('Select a student first')
      return
    }
    if (!title.trim()) {
      toast.error('Give the goal a title')
      return
    }
    setSaving(true)
    try {
      await onAddGoal({
        studentId,
        title: title.trim(),
        target: target.trim() || undefined,
        reviewDate: reviewDate || undefined,
        status: status as AddGoalInput['status'],
      })
      toast.success('Goal created')
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create the goal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">New Mentoring Goal</DialogTitle>
          <DialogDescription className="text-xs">
            Track what the student is working towards between sessions.
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

          <div className="space-y-1.5">
            <Label htmlFor="goal-title">
              Goal <span className="text-destructive">*</span>
            </Label>
            <Input
              id="goal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Improve Mathematics performance"
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal-target">Target</Label>
            <Input
              id="goal-target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. 80% average"
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="goal-review">Review date</Label>
              <Input
                id="goal-review"
                type="date"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full text-xs">
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
            Create Goal
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
