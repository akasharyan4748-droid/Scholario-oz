'use client'

import { Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'

export interface CreateFormState {
  title: string
  subject: string
  className: string
  dueDate: string
  marks: string
  description: string
  rubric: string[]
}

export const initialCreateForm: CreateFormState = {
  title: '', subject: 'Mathematics', className: 'Class 2-A', dueDate: '',
  marks: '20', description: '', rubric: ['', '', '', ''],
}

interface CreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: CreateFormState
  setForm: (form: CreateFormState) => void
  onCreate: () => void
}

export function CreateAssignmentDialog({ open, onOpenChange, form, setForm, onCreate }: CreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Assignment</DialogTitle>
          <DialogDescription>Define a graded assignment with a detailed rubric.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="asg-title">Title <span className="text-destructive">*</span></Label>
            <Input id="asg-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Numbers 1–100 — Number Line" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Class</Label>
              <Select value={form.className} onValueChange={(v) => setForm({ ...form, className: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Class 2-A">Class 2-A</SelectItem>
                  <SelectItem value="Class 2-B">Class 2-B</SelectItem>
                  <SelectItem value="Class 2-C">Class 2-C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="asg-due">Due Date <span className="text-destructive">*</span></Label>
              <DatePicker id="asg-due" value={form.dueDate} onChange={(v) => setForm({ ...form, dueDate: v })} placeholder="Select due date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="asg-marks">Total Marks</Label>
              <Input id="asg-marks" type="number" value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="asg-desc">Description</Label>
            <Textarea id="asg-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detailed assignment brief…" className="min-h-16" />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-amber-500" /> Rubric Criteria</Label>
            <p className="text-[11px] text-muted-foreground -mt-1">Format: Criterion name (max marks)</p>
            <div className="space-y-2">
              {form.rubric.map((r, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold w-5 text-muted-foreground">{idx + 1}.</span>
                  <Input
                    value={r}
                    onChange={(e) => {
                      const next = [...form.rubric]
                      next[idx] = e.target.value
                      setForm({ ...form, rubric: next })
                    }}
                    placeholder={`e.g. Correct sequence (8)`}
                    className="h-8 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={onCreate} className="bg-gradient-to-r from-emerald-600 to-teal-600">
            <Plus className="h-4 w-4" /> Create Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
