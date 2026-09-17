'use client'

/**
 * plan-form-dialog — create or edit a lesson plan (FINAL spec §9).
 *
 * Class and subject options come ONLY from the teacher's actual teaching
 * assignments (payload.assignments) — classes/subjects the teacher is not
 * authorized to teach never appear. The optional curriculum link (§24) is
 * filtered to the selected (class, subject)'s topics.
 */

import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { LessonPlanDTO, LessonPlannerPayload } from '@/lib/lesson-planner-types'
import type { PlanFormInput } from './use-lesson-planner'

const PERIODS = ['1', '2', '3', '4', '5', '6', '7', '8']
const DURATIONS = ['30', '45', '60', '90']

function emptyForm(payload: LessonPlannerPayload): PlanFormInput {
  const first = payload.assignments[0]
  return {
    classId: first?.classId ?? '',
    subjectId: first?.subjects[0]?.id ?? '',
    date: payload.today,
    period: '',
    durationMin: '45',
    topic: '',
    objectives: [''],
    activities: [],
    resources: [],
    curriculumTopicId: '',
    homework: '',
    notes: '',
  }
}

function formFromPlan(plan: LessonPlanDTO): PlanFormInput {
  return {
    classId: plan.classId,
    subjectId: plan.subjectId,
    date: plan.date,
    period: plan.period ? String(plan.period) : '',
    durationMin: String(plan.durationMin),
    topic: plan.topic,
    objectives: plan.objectives.length > 0 ? plan.objectives : [''],
    activities: plan.activities,
    resources: plan.resources,
    curriculumTopicId: plan.curriculumTopicId ?? '',
    homework: plan.homework ?? '',
    notes: plan.notes ?? '',
  }
}

/** compact dynamic string list (objectives / activities / resources) */
function ListEditor({
  label,
  items,
  onChange,
  placeholder,
  addLabel,
  max,
}: {
  label: string
  items: string[]
  onChange: (v: string[]) => void
  placeholder: string
  addLabel: string
  max: number
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input
              value={item}
              onChange={(e) => {
                const next = [...items]
                next[i] = e.target.value
                onChange(next)
              }}
              placeholder={placeholder}
              className="h-8 rounded-lg text-xs"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      {items.length < max && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 rounded-lg px-2 text-[11px]"
          onClick={() => onChange([...items, ''])}
        >
          <Plus className="h-3 w-3" /> {addLabel}
        </Button>
      )}
    </div>
  )
}

interface PlanFormDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  payload: LessonPlannerPayload
  plan: LessonPlanDTO | null // null → create
  mutating: boolean
  onSave: (input: PlanFormInput, planId: string | null) => Promise<LessonPlanDTO | null>
}

export function PlanFormDialog({ open, onOpenChange, payload, plan, mutating, onSave }: PlanFormDialogProps) {
  const [form, setForm] = useState<PlanFormInput>(emptyForm(payload))

  useEffect(() => {
    if (open) setForm(plan ? formFromPlan(plan) : emptyForm(payload))
  }, [open, plan, payload])

  const class_ = payload.assignments.find((a) => a.classId === form.classId)
  const subjects = class_?.subjects ?? []
  const curriculum = payload.curricula.find(
    (c) => c.classId === form.classId && c.subjectId === form.subjectId,
  )

  const topics = curriculum?.topics ?? []
  const canSubmit = useMemo(
    () =>
      form.classId !== '' &&
      form.subjectId !== '' &&
      form.date !== '' &&
      form.topic.trim().length > 0 &&
      form.objectives.some((o) => o.trim().length > 0),
    [form],
  )

  const submit = async () => {
    if (!canSubmit) {
      toast.error('Please fill the topic, date and at least one learning objective.')
      return
    }
    const cleaned: PlanFormInput = {
      ...form,
      topic: form.topic.trim(),
      objectives: form.objectives.map((o) => o.trim()).filter(Boolean),
      activities: form.activities.map((a) => a.trim()).filter(Boolean),
      resources: form.resources.map((r) => r.trim()).filter(Boolean),
    }
    const saved = await onSave(cleaned, plan?.id ?? null)
    if (saved) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{plan ? 'Edit Lesson Plan' : 'New Lesson Plan'}</DialogTitle>
          <DialogDescription>
            {plan
              ? 'Update the plan — changes apply to your planner immediately.'
              : 'Plan a lesson for one of your assigned classes.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* class + subject — only from the teacher's teaching assignments */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Class</Label>
              <Select
                value={form.classId}
                onValueChange={(v) => {
                  const cls = payload.assignments.find((a) => a.classId === v)
                  setForm({
                    ...form,
                    classId: v,
                    subjectId: cls?.subjects[0]?.id ?? '',
                    curriculumTopicId: '',
                  })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {payload.assignments.map((a) => (
                    <SelectItem key={a.classId} value={a.classId}>
                      {a.classLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Subject</Label>
              <Select
                value={form.subjectId}
                onValueChange={(v) => setForm({ ...form, subjectId: v, curriculumTopicId: '' })}
                disabled={subjects.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* date / period / duration */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lp-date" className="text-xs">Date <span className="text-destructive">*</span></Label>
              <Input
                id="lp-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="h-9 rounded-lg text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Period</Label>
              <Select value={form.period || undefined} onValueChange={(v) => setForm({ ...form, period: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p} value={p}>
                      Period {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Duration</Label>
              <Select value={form.durationMin} onValueChange={(v) => setForm({ ...form, durationMin: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* topic */}
          <div className="space-y-1.5">
            <Label htmlFor="lp-topic" className="text-xs">Topic <span className="text-destructive">*</span></Label>
            <Input
              id="lp-topic"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              placeholder="e.g. Factorisation of Quadratic Polynomials"
              className="rounded-lg text-xs"
            />
          </div>

          {/* optional curriculum link (§24) */}
          {topics.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Curriculum topic <span className="text-muted-foreground">(optional)</span></Label>
              <Select
                value={form.curriculumTopicId || undefined}
                onValueChange={(v) => setForm({ ...form, curriculumTopicId: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Not linked" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.unit} · {t.topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <ListEditor
            label="Learning Objectives *"
            items={form.objectives}
            onChange={(v) => setForm({ ...form, objectives: v })}
            placeholder="e.g. Solve 2-digit addition problems independently"
            addLabel="Add objective"
            max={12}
          />

          <ListEditor
            label="Teaching Activities"
            items={form.activities}
            onChange={(v) => setForm({ ...form, activities: v })}
            placeholder="e.g. Guided practice — 4 problems (15 min)"
            addLabel="Add activity"
            max={16}
          />

          <ListEditor
            label="Resources"
            items={form.resources}
            onChange={(v) => setForm({ ...form, resources: v })}
            placeholder="e.g. Worksheet 4"
            addLabel="Add resource"
            max={16}
          />

          <div className="space-y-1.5">
            <Label htmlFor="lp-homework" className="text-xs">Homework</Label>
            <Textarea
              id="lp-homework"
              value={form.homework}
              onChange={(e) => setForm({ ...form, homework: e.target.value })}
              placeholder="e.g. Worksheet 4 — Q1 to Q8"
              className="min-h-[60px] rounded-lg text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lp-notes" className="text-xs">Notes</Label>
            <Textarea
              id="lp-notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Private teaching notes…"
              className="min-h-[52px] rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" className="rounded-lg" onClick={() => onOpenChange(false)} disabled={mutating}>
              Cancel
            </Button>
            <Button className="rounded-lg" onClick={submit} disabled={mutating || !canSubmit}>
              {mutating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {plan ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
