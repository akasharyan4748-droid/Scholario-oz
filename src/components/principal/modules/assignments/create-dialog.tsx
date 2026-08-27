'use client'

// Create Assignment dialog with a dynamic rubric builder.
//
// Owns its own rubric + form state internally (the parent only controls the
// open/close boolean via the SectionHeading "Create Assignment" button).

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Target, Trash2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { INITIAL_FORM, INITIAL_RUBRIC } from './data'

interface CreateAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAssignmentDialog({ open, onOpenChange }: CreateAssignmentDialogProps) {
  const [rubric, setRubric] = useState<{ name: string; marks: number }[]>(INITIAL_RUBRIC.map((r) => ({ ...r })))
  const [form, setForm] = useState({ ...INITIAL_FORM })

  const handleAddRubric = () => {
    setRubric([...rubric, { name: '', marks: 1 }])
  }
  const handleRemoveRubric = (i: number) => {
    setRubric(rubric.filter((_, idx) => idx !== i))
  }
  const handleRubricChange = (i: number, field: 'name' | 'marks', value: string | number) => {
    setRubric(rubric.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }
  const totalRubricMarks = rubric.reduce((a, r) => a + Number(r.marks || 0), 0)

  const handleCreate = () => {
    if (!form.title.trim() || !form.dueDate) {
      toast.error('Please fill all required fields')
      return
    }
    toast.success('Assignment created', {
      description: `${form.title} · ${form.subject} · ${form.className} · ${totalRubricMarks} marks`,
    })
    onOpenChange(false)
    setForm({ ...INITIAL_FORM })
    setRubric(INITIAL_RUBRIC.map((r) => ({ ...r })))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-lg max-h-[85vh] overflow-y-auto custom-scroll">
        <DialogHeader>
          <DialogTitle>Create New Assignment</DialogTitle>
          <DialogDescription>Build rubric & assign to class</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="asg-title">Title <span className="text-destructive">*</span></Label>
            <Input
              id="asg-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Plant Life Cycle — Project"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="Social Studies">Social Studies</SelectItem>
                  <SelectItem value="Hindi">Hindi</SelectItem>
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
                  <SelectItem value="Class 3-A">Class 3-A</SelectItem>
                  <SelectItem value="Class 4-A">Class 4-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="asg-due">Due Date <span className="text-destructive">*</span></Label>
              <DatePicker
                id="asg-due"
                value={form.dueDate}
                onChange={(v) => setForm({ ...form, dueDate: v })}
                placeholder="Select due date"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="asg-marks">Total Marks</Label>
              <Input
                id="asg-marks"
                type="number"
                value={form.marks}
                onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Dynamic rubric builder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-primary" /> Rubric Criteria
              </Label>
              <Badge variant="secondary" className={cn('text-[10px]', totalRubricMarks !== form.marks && 'bg-amber-500/10 text-amber-600 border-amber-500/20')}>
                Total: {totalRubricMarks} / {form.marks} marks
              </Badge>
            </div>
            <div className="space-y-2">
              {rubric.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-2"
                >
                  <Input
                    value={r.name}
                    onChange={(e) => handleRubricChange(i, 'name', e.target.value)}
                    placeholder={`Criterion ${i + 1} (e.g. Content Knowledge)`}
                    className="flex-1 h-9"
                  />
                  <Input
                    type="number"
                    value={r.marks}
                    onChange={(e) => handleRubricChange(i, 'marks', Number(e.target.value))}
                    className="w-20 h-9 text-center font-display font-semibold"
                    min={1}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveRubric(i)}
                    disabled={rubric.length <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 border-dashed"
              onClick={handleAddRubric}
            >
              <Plus className="h-3.5 w-3.5" /> Add Criterion
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="asg-desc">Description</Label>
            <Textarea
              id="asg-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detailed instructions for students…"
              className="min-h-16"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleCreate} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
            <Plus className="h-4 w-4" /> Create Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
