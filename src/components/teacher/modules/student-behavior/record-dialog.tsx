'use client'

/**
 * record-dialog — the "Record Observation" workflow.
 *
 * A calm, factual form for documenting a positive moment, a neutral
 * observation or a concern: student (scope-resolved by the server),
 * date, school-configured category, type (segmented, pre-derived from
 * the category kind but always overridable), description, action taken,
 * optional follow-up (date required when toggled — the server
 * auto-creates the follow-up) and a private staff-only note that is
 * never shown to parents or students.
 */

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Lock, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type {
  BehaviorCategoryItem,
  BehaviorRecordItem,
  BehaviorType,
  StudentRef,
} from '@/lib/teacher-hub-types'
import { createBehaviorRecord } from './hooks'
import { PRIMARY_ACTION_CLASS, TYPE_CONFIG, TYPE_ORDER, defaultTypeForKind, toDateInputValue } from './shared'

// ─── form state ──────────────────────────────────────────────────────

interface FormState {
  studentId: string
  date: string
  category: string
  type: BehaviorType
  description: string
  actionTaken: string
  followUpRequired: boolean
  followUpDate: string
  privateNote: string
}

const EMPTY_FORM: FormState = {
  studentId: '',
  date: '',
  category: '',
  type: 'observation',
  description: '',
  actionTaken: '',
  followUpRequired: false,
  followUpDate: '',
  privateNote: '',
}

// ─── the dialog ──────────────────────────────────────────────────────

interface RecordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** students the teacher may record for (server-resolved scope) */
  students: StudentRef[]
  /** school-configurable taxonomy */
  categories: BehaviorCategoryItem[]
  /** student prefilled when opened from a profile sheet */
  prefillStudent?: StudentRef | null
  /** called with the created record — the parent quietly reloads */
  onCreated: (record: BehaviorRecordItem) => void
}

export function RecordDialog({
  open,
  onOpenChange,
  students,
  categories,
  prefillStudent,
  onCreated,
}: RecordDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Fresh form on every open (today's date, optional student prefill).
  useEffect(() => {
    if (!open) return
    setForm({
      ...EMPTY_FORM,
      date: toDateInputValue(new Date()),
      studentId: prefillStudent?.id ?? '',
    })
    setError(null)
  }, [open, prefillStudent])

  // Prefilled student must be selectable even if the aggregate's student
  // list is momentarily stale — union keeps the Select label honest.
  const studentOptions = useMemo(() => {
    if (!prefillStudent || students.some((s) => s.id === prefillStudent.id)) return students
    return [prefillStudent, ...students]
  }, [students, prefillStudent])

  const handleCategory = (key: string) => {
    const category = categories.find((c) => c.key === key)
    setForm((f) => ({
      ...f,
      category: key,
      type: category ? defaultTypeForKind(category.kind) : f.type,
    }))
  }

  const submit = async () => {
    if (saving) return
    if (!form.studentId) return setError('Select a student.')
    if (!form.category) return setError('Select a category.')
    if (!form.description.trim()) return setError('Description is required.')
    if (form.description.trim().length > 2000) return setError('Description must be at most 2000 characters.')
    if (form.followUpRequired && !form.followUpDate) {
      return setError('A follow-up date is required when a follow-up is needed.')
    }
    setSaving(true)
    setError(null)
    try {
      const record = await createBehaviorRecord({
        studentId: form.studentId,
        date: form.date || undefined,
        category: form.category,
        type: form.type,
        description: form.description.trim(),
        actionTaken: form.actionTaken.trim() || undefined,
        followUpRequired: form.followUpRequired,
        followUpDate: form.followUpRequired ? form.followUpDate : undefined,
        privateNote: form.privateNote.trim() || undefined,
      })
      toast.success('Observation recorded', {
        description: `${record.student.name} · ${TYPE_CONFIG[record.type].label}`,
      })
      onCreated(record)
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not record the observation.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Record Observation</DialogTitle>
          <DialogDescription className="text-xs">
            Document a positive moment, a neutral observation or a concern for a student in your scope.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* student */}
          <div className="space-y-1.5">
            <Label>
              Student <span className="text-destructive">*</span>
            </Label>
            {studentOptions.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                No students are in your recording scope yet.
              </p>
            ) : (
              <Select
                value={form.studentId}
                onValueChange={(v) => setForm((f) => ({ ...f, studentId: v }))}
              >
                <SelectTrigger className="w-full" aria-label="Student">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {studentOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} · {s.classLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* date + category */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="beh-date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="beh-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Category <span className="text-destructive">*</span>
              </Label>
              <Select value={form.category} onValueChange={handleCategory}>
                <SelectTrigger className="w-full" aria-label="Category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label}
                      {c.kind !== 'any' && (
                        <span className="ml-1.5 text-[10px] text-muted-foreground">
                          · {c.kind}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* type — segmented */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Observation type">
              {TYPE_ORDER.map((t) => {
                const cfg = TYPE_CONFIG[t]
                const active = form.type === t
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                      active
                        ? cfg.segmentActive
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/50',
                    )}
                  >
                    <span
                      className={cn('h-1.5 w-1.5 rounded-full', active ? cfg.dot : 'bg-muted-foreground/40')}
                      aria-hidden="true"
                    />
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* description */}
          <div className="space-y-1.5">
            <Label htmlFor="beh-description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="beh-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What did you observe? Be factual and specific."
              maxLength={2000}
              className="min-h-24"
            />
          </div>

          {/* action taken */}
          <div className="space-y-1.5">
            <Label htmlFor="beh-action">
              Action taken <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="beh-action"
              value={form.actionTaken}
              onChange={(e) => setForm((f) => ({ ...f, actionTaken: e.target.value }))}
              placeholder="e.g. Spoke with the student after class"
              maxLength={1000}
            />
          </div>

          {/* follow-up */}
          <div className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Label htmlFor="beh-followup" className="text-xs">
                  Follow-up required
                </Label>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Adds this to your open follow-ups.
                </p>
              </div>
              <Switch
                id="beh-followup"
                checked={form.followUpRequired}
                onCheckedChange={(v) => setForm((f) => ({ ...f, followUpRequired: v }))}
              />
            </div>
            {form.followUpRequired && (
              <div className="space-y-1.5">
                <Label htmlFor="beh-followup-date">
                  Follow-up date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="beh-followup-date"
                  type="date"
                  value={form.followUpDate}
                  onChange={(e) => setForm((f) => ({ ...f, followUpDate: e.target.value }))}
                />
              </div>
            )}
          </div>

          {/* private note */}
          <div className="space-y-1.5">
            <Label htmlFor="beh-private">
              Private note <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="beh-private"
              value={form.privateNote}
              onChange={(e) => setForm((f) => ({ ...f, privateNote: e.target.value }))}
              placeholder="Context for staff only…"
              maxLength={2000}
              className="min-h-16"
            />
            <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
              Visible to staff only — never shown to parents or students
            </p>
          </div>
        </div>

        {error && <p className="text-xs font-medium text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving}
            className={cn(PRIMARY_ACTION_CLASS, 'disabled:cursor-not-allowed disabled:opacity-60')}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {saving ? 'Recording…' : 'Record Observation'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
