'use client'

/**
 * Add Mentee dialog (TH-FE-3) — POST /api/teacher/mentoring/assignments
 * (upsert: re-selecting an existing mentee updates and reactivates them).
 */

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
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
import type { MenteeItem, StudentRef } from '@/lib/teacher-hub-types'
import { MENTEE_STATUS_OPTIONS, PRIMARY_ACTION, SUPPORT_TYPE_OPTIONS } from './shared'
import type { AddMenteeInput } from './hooks'

interface AddMenteeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  students: StudentRef[]
  assignments: MenteeItem[]
  onAddMentee: (input: AddMenteeInput) => Promise<MenteeItem>
}

const DEFAULT_STATUS = 'on-track'
const DEFAULT_SUPPORT = 'general'

export function AddMenteeDialog({
  open,
  onOpenChange,
  students,
  assignments,
  onAddMentee,
}: AddMenteeDialogProps) {
  const [studentId, setStudentId] = useState('')
  const [status, setStatus] = useState<string>(DEFAULT_STATUS)
  const [supportType, setSupportType] = useState<string>(DEFAULT_SUPPORT)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Students already active mentees get a "Mentee" tag in the picker (still
  // selectable — the POST upserts and updates their details).
  const activeMenteeIds = new Set(
    assignments.filter((a) => a.active).map((a) => a.student.id),
  )

  useEffect(() => {
    if (!open) return
    setStudentId('')
    setStatus(DEFAULT_STATUS)
    setSupportType(DEFAULT_SUPPORT)
    setNotes('')
    setSaving(false)
  }, [open])

  const handleSubmit = async () => {
    if (!studentId) {
      toast.error('Select a student first')
      return
    }
    setSaving(true)
    try {
      const mentee = await onAddMentee({
        studentId,
        status: status as AddMenteeInput['status'],
        supportType: supportType as AddMenteeInput['supportType'],
        notes: notes.trim() || undefined,
      })
      toast.success('Mentee added', {
        description: `${mentee.student.name} · ${mentee.student.classLabel}`,
      })
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add the mentee')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Add Mentee</DialogTitle>
          <DialogDescription className="text-xs">
            Assign a student to you for ongoing mentoring and check-ins.
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
                    <span className="flex items-center gap-2">
                      <span className="truncate">
                        {s.name} · {s.classLabel}
                      </span>
                      {activeMenteeIds.has(s.id) && (
                        <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-px text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Mentee
                        </span>
                      )}
                    </span>
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
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full text-xs">
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
            </div>
            <div className="space-y-1.5">
              <Label>Support type</Label>
              <Select value={supportType} onValueChange={setSupportType}>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORT_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mentee-notes">Notes</Label>
            <Textarea
              id="mentee-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why this student is being mentored — context for future sessions…"
              className="min-h-20 text-xs"
            />
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
            Add Mentee
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
