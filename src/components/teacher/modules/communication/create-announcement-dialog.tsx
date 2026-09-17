'use client'

/**
 * communication/create-announcement-dialog — publish a school announcement
 * (a real Notification row) to a whitelisted audience. Rendered ONLY when
 * the teacher's active position permissions include 'announcements' (the
 * same teachers-store permission system that gates the teacher nav) —
 * normal teachers never see this control. The server independently scopes
 * the row to the session school and re-validates the audience (school-wide
 * groups or one of the teacher's OWN class-teacher classes).
 */

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Megaphone } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { publishAnnouncement } from './hooks'

interface CreateAnnouncementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** labels of the teacher's own class-teacher classes (server-derived) */
  classLabels: string[]
  onPublished: () => void
}

const SCHOOL_AUDIENCES = ['All Teachers', 'All Parents', 'All Staff', 'Whole School']
const PRIORITIES = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
]

export function CreateAnnouncementDialog({
  open,
  onOpenChange,
  classLabels,
  onPublished,
}: CreateAnnouncementDialogProps) {
  const [title, setTitle] = useState('')
  const [audience, setAudience] = useState('All Teachers')
  const [priority, setPriority] = useState('NORMAL')
  const [message, setMessage] = useState('')
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    if (open) {
      setTitle('')
      setAudience('All Teachers')
      setPriority('NORMAL')
      setMessage('')
      setPublishing(false)
    }
  }, [open])

  const audiences = useMemo(
    () => [
      ...SCHOOL_AUDIENCES.map((label) => ({ value: label, label })),
      ...classLabels.map((label) => ({ value: label, label: `My class · ${label}` })),
    ],
    [classLabels],
  )

  const handlePublish = async () => {
    if (title.trim().length < 3) {
      toast.error('Title must be at least 3 characters')
      return
    }
    if (message.trim().length < 3) {
      toast.error('Message must be at least 3 characters')
      return
    }
    setPublishing(true)
    try {
      const result = await publishAnnouncement({
        title: title.trim(),
        message: message.trim(),
        audience,
        priority,
      })
      toast.success('Announcement published', {
        description:
          result.audience === 'TEACHERS'
            ? 'Visible to the teachers of your school.'
            : result.audience === 'PARENTS'
              ? 'Sent to all parents — it will not appear in your own teacher feed.'
              : `Audience: ${result.audience}`,
      })
      onOpenChange(false)
      onPublished()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Announcement could not be published')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">New announcement</DialogTitle>
          <DialogDescription className="text-xs">
            Publish a school announcement from your classroom. It appears in the recipients&apos;
            notification feed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ch-ann-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ch-ann-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Science fair — volunteers needed"
              maxLength={120}
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Audience</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {audiences.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ch-ann-message">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="ch-ann-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write the announcement…"
              className="min-h-28 text-sm"
              maxLength={2000}
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={() => onOpenChange(false)}
            disabled={publishing}
            className="rounded-xl px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void handlePublish()}
            disabled={publishing || title.trim().length < 3 || message.trim().length < 3}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {publishing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Publish
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
