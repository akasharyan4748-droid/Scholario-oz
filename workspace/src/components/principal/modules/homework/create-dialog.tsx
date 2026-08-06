'use client'

import { Plus, Paperclip, X } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { formatDate } from '@/lib/format'

export interface HomeworkForm {
  title: string
  subject: string
  className: string
  description: string
  dueDate: string
  attachment: string
}

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  form: HomeworkForm
  setForm: (f: HomeworkForm) => void
  uniqueSubjects: string[]
}

export function CreateHomeworkDialog({ open, onOpenChange, form, setForm, uniqueSubjects }: Props) {
  const handleCreate = () => {
    if (!form.title.trim() || !form.description.trim() || !form.dueDate) {
      toast.error('Please fill all required fields')
      return
    }
    toast.success('Homework assigned', {
      description: `${form.title} · ${form.subject} · ${form.className} · Due ${formatDate(form.dueDate)}`,
    })
    onOpenChange(false)
    setForm({ title: '', subject: 'Mathematics', className: 'Class 2-A', description: '', dueDate: '', attachment: '' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign New Homework</DialogTitle>
          <DialogDescription>Notify students instantly across selected class</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="hw-title">Title <span className="text-destructive">*</span></Label>
            <Input
              id="hw-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Multiplication Tables — Practice"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {uniqueSubjects.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Social Studies">Social Studies</SelectItem>
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
          <div className="space-y-1.5">
            <Label htmlFor="hw-desc">Description <span className="text-destructive">*</span></Label>
            <Textarea
              id="hw-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detailed instructions for students…"
              className="min-h-20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="hw-due">Due Date <span className="text-destructive">*</span></Label>
              <DatePicker
                id="hw-due"
                value={form.dueDate}
                onChange={(v) => setForm({ ...form, dueDate: v })}
                placeholder="Select due date"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Attachment</Label>
              <button
                onClick={() => {
                  setForm({ ...form, attachment: 'worksheet_4.pdf' })
                  toast.success('File attached', { description: 'worksheet_4.pdf · 240 KB' })
                }}
                className="flex h-9 w-full items-center gap-2 rounded-md border border-dashed border-border px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Paperclip className="h-3.5 w-3.5" />
                {form.attachment || 'Choose file (mock)'}
                {form.attachment && (
                  <X className="h-3 w-3 ml-auto" onClick={(e) => { e.stopPropagation(); setForm({ ...form, attachment: '' }) }} />
                )}
              </button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleCreate} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
            <Plus className="h-4 w-4" /> Assign Homework
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
