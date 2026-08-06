'use client'

// Create Exam dialog — form with name, type, classes, dates, and subject count.

import { useState, useEffect } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'
import {
  CreateExamForm, initialCreateExamForm, examTypeOptions, examClassOptions, emeraldGradientBtn,
} from './data'

export function CreateExamDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [form, setForm] = useState<CreateExamForm>(initialCreateExamForm)

  // Reset the form whenever the dialog is closed so the next open starts fresh.
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setForm(initialCreateExamForm), 200)
      return () => clearTimeout(t)
    }
  }, [open])

  const handleCreate = () => {
    if (!form.name.trim() || !form.startDate) {
      toast.error('Please fill all required fields')
      return
    }
    toast.success('Exam created', {
      description: `${form.name} · ${form.type} · Scheduled ${formatDate(form.startDate)}`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Exam</DialogTitle>
          <DialogDescription>Schedule a new examination for selected classes</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ex-name">Exam Name <span className="text-destructive">*</span></Label>
            <Input
              id="ex-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Unit Test 4"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Exam Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as CreateExamForm['type'] })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {examTypeOptions.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Classes</Label>
              <Select value={form.classes} onValueChange={(v) => setForm({ ...form, classes: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {examClassOptions.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ex-start">Start Date <span className="text-destructive">*</span></Label>
              <DatePicker id="ex-start" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} placeholder="Start date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-end">End Date</Label>
              <DatePicker id="ex-end" value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} placeholder="End date" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ex-sub">Number of Subjects</Label>
            <Input
              id="ex-sub"
              type="number"
              min={1}
              max={12}
              value={form.subjects}
              onChange={(e) => setForm({ ...form, subjects: Number(e.target.value) })}
            />
          </div>
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              Hall tickets, seating arrangement & invigilator schedule will be auto-generated once the exam is created.
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleCreate} className={emeraldGradientBtn}>
            <Plus className="h-4 w-4" /> Create Exam
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
