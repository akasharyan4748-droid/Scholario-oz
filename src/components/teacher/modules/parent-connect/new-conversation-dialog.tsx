'use client'

/**
 * parent-connect/new-conversation-dialog — start a conversation with the
 * guardian of an in-scope student. Students without a guardian account are
 * listed but disabled ("No guardian account"). If a conversation already
 * exists for the chosen student, submitting simply navigates to it (the
 * server route would reuse it anyway).
 */

import { useEffect, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type {
  ConversationCategory,
  MessageTemplateItem,
  ParentLinkableStudent,
} from '@/lib/teacher-hub-types'
import { toast } from 'sonner'
import { startParentConversation } from './hooks'
import { applyTemplateBody, CATEGORY_OPTIONS, firstName } from './shared'

interface NewConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  students: ParentLinkableStudent[]
  templates: MessageTemplateItem[]
  teacherName: string
  /** the chosen student already has a thread — just open it */
  onSelectExisting: (conversationId: string) => void
  /** a brand-new conversation was created (message sent) */
  onCreated: (conversationId: string) => void
}

export function NewConversationDialog({
  open,
  onOpenChange,
  students,
  templates,
  teacherName,
  onSelectExisting,
  onCreated,
}: NewConversationDialogProps) {
  const [studentId, setStudentId] = useState('')
  const [category, setCategory] = useState<ConversationCategory>('general')
  const [templateId, setTemplateId] = useState<string>('none')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  // Fresh form on every open.
  useEffect(() => {
    if (open) {
      setStudentId('')
      setCategory('general')
      setTemplateId('none')
      setMessage('')
      setSending(false)
    }
  }, [open])

  const selected = students.find((s) => s.student.id === studentId) ?? null
  const existingId = selected?.existingConversationId ?? null

  const handleTemplate = (id: string) => {
    setTemplateId(id)
    const t = templates.find((x) => x.id === id)
    if (t) {
      setMessage(applyTemplateBody(t.body, selected ? firstName(selected.student.name) : '', teacherName))
    }
  }

  const handleSubmit = async () => {
    if (!selected) {
      toast.error('Select a student first')
      return
    }
    if (!selected.parentUserId) {
      toast.error('This student has no linked guardian account')
      return
    }
    if (!message.trim()) {
      toast.error('Write a message first')
      return
    }
    // A thread already exists for this guardian — continue there instead of
    // posting a second first-message into it.
    if (existingId) {
      onSelectExisting(existingId)
      return
    }
    setSending(true)
    try {
      const conversationId = await startParentConversation({
        studentId: selected.student.id,
        category,
        message: message.trim(),
      })
      toast.success('Message sent', { description: `To ${selected.guardianName ?? 'the guardian'}` })
      onCreated(conversationId)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Message could not be sent')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">New parent message</DialogTitle>
          <DialogDescription className="text-xs">
            Start a conversation with a guardian from your class.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pc-student">Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger id="pc-student" className="w-full">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.student.id} value={s.student.id} disabled={!s.parentUserId}>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">
                        {s.student.name} · {s.student.classLabel}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {s.parentUserId
                          ? `Guardian: ${s.guardianName ?? 'Guardian'}`
                          : 'No guardian account'}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {existingId && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                A conversation with this guardian already exists — you will continue in it.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ConversationCategory)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Template</Label>
              <Select value={templateId} onValueChange={handleTemplate}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate">{t.label}</span>
                        <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {t.category}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pc-message">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="pc-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write to the guardian…"
              className="min-h-24 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={() => onOpenChange(false)}
            disabled={sending}
            className="rounded-xl px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={sending}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {existingId ? 'Open Conversation' : 'Send Message'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
