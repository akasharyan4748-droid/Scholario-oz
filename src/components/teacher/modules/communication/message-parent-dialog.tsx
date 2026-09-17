'use client'

/**
 * communication/message-parent-dialog — message the guardian of an
 * in-scope student. Uses the SAME authorization model and backend tables as
 * Parent Connect: the server re-validates the student scope
 * (assertStudentInScope), resolves the guardian from the student row and
 * upserts the shared conversation — so the thread stays unified and appears
 * in Parent Connect immediately.
 *
 * Real send states only: sending spinner, success toast with the guardian's
 * name, error toast carrying the server's honest message.
 */

import { useEffect, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
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
import { toast } from 'sonner'
import type {
  ConversationCategory,
  MessageTemplateItem,
  ParentLinkableStudent,
} from '@/lib/teacher-hub-types'
import { CONVERSATION_CATEGORY_LABELS } from '@/lib/teacher-hub-types'
import { sendMessageToParent } from './hooks'
import { applyTemplateBody, firstName } from './shared'

interface MessageParentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  students: ParentLinkableStudent[]
  templates: MessageTemplateItem[]
  teacherName: string
  /** called after a successful send so the hub can reload its counts */
  onSent: () => void
}

const CATEGORY_OPTIONS = (Object.keys(CONVERSATION_CATEGORY_LABELS) as ConversationCategory[]).map(
  (value) => ({ value, label: CONVERSATION_CATEGORY_LABELS[value] }),
)

export function MessageParentDialog({
  open,
  onOpenChange,
  students,
  templates,
  teacherName,
  onSent,
}: MessageParentDialogProps) {
  const [studentId, setStudentId] = useState('')
  const [category, setCategory] = useState<ConversationCategory>('general')
  const [templateId, setTemplateId] = useState('none')
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

  const handleTemplate = (id: string) => {
    setTemplateId(id)
    const t = templates.find((x) => x.id === id)
    if (t) {
      setMessage(
        applyTemplateBody(
          t.body,
          selected ? firstName(selected.student.name) : '',
          teacherName,
        ),
      )
    }
  }

  const handleSend = async () => {
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
    setSending(true)
    try {
      const result = await sendMessageToParent({
        studentId: selected.student.id,
        category,
        message: message.trim(),
      })
      toast.success('Message sent', {
        description: `To ${result.parentName} — the conversation continues in Parent Connect.`,
      })
      onOpenChange(false)
      onSent()
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
          <DialogTitle className="text-sm font-semibold">Message a parent</DialogTitle>
          <DialogDescription className="text-xs">
            Send a message to the guardian of a student you teach. Threads live in Parent Connect.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ch-student">Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger id="ch-student" className="w-full">
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
            {students.length === 0 && (
              <p className="text-[11px] text-muted-foreground">
                No students with a linked guardian are in your scope yet.
              </p>
            )}
          </div>

          {selected?.parentUserId && (
            <div className="rounded-xl border border-border bg-muted/30 px-3.5 py-2.5">
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                To
              </p>
              <p className="mt-0.5 text-sm font-medium">
                {selected.guardianName ?? 'Guardian'}
                {selected.guardianPhone ? (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    · {selected.guardianPhone}
                  </span>
                ) : null}
              </p>
              {selected.existingConversationId && (
                <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                  You already have a conversation with this guardian — your message continues that
                  thread.
                </p>
              )}
            </div>
          )}

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
            <Label htmlFor="ch-message">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="ch-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write to the guardian…"
              className="min-h-24 text-sm"
              maxLength={2000}
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
            onClick={() => void handleSend()}
            disabled={sending || !selected?.parentUserId || !message.trim()}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Send Message
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
