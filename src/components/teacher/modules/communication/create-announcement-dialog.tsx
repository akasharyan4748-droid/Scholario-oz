'use client'

import { Pin, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import type { AnnouncementForm } from './data'

interface CreateAnnouncementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: AnnouncementForm
  onFormChange: (form: AnnouncementForm) => void
  onCreate: () => void
}

export function CreateAnnouncementDialog({
  open, onOpenChange, form, onFormChange, onCreate,
}: CreateAnnouncementDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Announcement</DialogTitle>
          <DialogDescription>Send a notice to your class or parents. Recipients are notified instantly.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="an-title">Title <span className="text-destructive">*</span></Label>
            <Input id="an-title" value={form.title} onChange={(e) => onFormChange({ ...form, title: e.target.value })} placeholder="e.g. Mathematics Revision Class Schedule" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => onFormChange({ ...form, category: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Event">Event</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="Holiday">Holiday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Audience</Label>
              <Select value={form.audience} onValueChange={(v) => onFormChange({ ...form, audience: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Parents">Parents</SelectItem>
                  <SelectItem value="Students">Students</SelectItem>
                  <SelectItem value="All">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="an-content">Content <span className="text-destructive">*</span></Label>
            <Textarea id="an-content" value={form.content} onChange={(e) => onFormChange({ ...form, content: e.target.value })} placeholder="Write the announcement details…" className="min-h-24" />
            <p className="text-[11px] text-muted-foreground">{form.content.length} / 500 characters</p>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.pin}
              onChange={(e) => onFormChange({ ...form, pin: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <Pin className="h-3.5 w-3.5 text-amber-500" />
            Pin to notice board
          </label>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={onCreate} className="bg-gradient-to-r from-emerald-600 to-teal-600">
            <Send className="h-4 w-4" /> Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
