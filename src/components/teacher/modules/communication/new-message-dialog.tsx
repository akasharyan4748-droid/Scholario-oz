'use client'

/**
 * communication/new-message-dialog — the hub's single composer. Recipient
 * type is permission-aware by construction:
 *   · Parent — guardians of students in the teacher's authorized scope
 *     (the server re-validates the scope; students without a guardian
 *     account are listed but disabled).
 *   · Staff — same-school staff (teachers, coordinators, principal,
 *     management) from the server-provided staffDirectory. The composer
 *     never offers audiences the teacher is not authorized to reach — no
 *     school-wide student broadcast, no parent blast.
 * A parent thread that already exists is continued, not duplicated; a new
 * staff message opens the direct thread afterwards.
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import { sendDirectMessage, sendMessageToParent } from './hooks'
import { applyTemplateBody, CATEGORY_OPTIONS, firstName, roleLabel } from './shared'
import type { StaffDirectoryEntry } from './types'

type RecipientType = 'parent' | 'staff'

interface NewMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  students: ParentLinkableStudent[]
  templates: MessageTemplateItem[]
  staffDirectory: StaffDirectoryEntry[]
  teacherName: string
  /** a parent conversation was created (or reused) — open its thread */
  onOpenedParent: (conversationId: string) => void
  /** a staff message was sent — open the direct thread */
  onOpenedDirect: (counterpartId: string) => void
}

/** Staff grouped by role, leadership first — mirrors how a school thinks. */
const ROLE_ORDER = ['PRINCIPAL', 'MANAGEMENT', 'COORDINATOR', 'TEACHER']

export function NewMessageDialog({
  open,
  onOpenChange,
  students,
  templates,
  staffDirectory,
  teacherName,
  onOpenedParent,
  onOpenedDirect,
}: NewMessageDialogProps) {
  const [type, setType] = useState<RecipientType>('parent')
  const [studentId, setStudentId] = useState('')
  const [category, setCategory] = useState<ConversationCategory>('general')
  const [templateId, setTemplateId] = useState<string>('none')
  const [staffId, setStaffId] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  // Fresh form on every open.
  useEffect(() => {
    if (open) {
      setType('parent')
      setStudentId('')
      setCategory('general')
      setTemplateId('none')
      setStaffId('')
      setSubject('')
      setMessage('')
      setSending(false)
    }
  }, [open])

  const selectedStudent = students.find((s) => s.student.id === studentId) ?? null
  const existingId = selectedStudent?.existingConversationId ?? null
  const selectedStaff = staffDirectory.find((s) => s.id === staffId) ?? null

  const staffByRole = ROLE_ORDER.map((role) => ({
    role,
    label: roleLabel(role),
    members: staffDirectory.filter((s) => s.role === role),
  })).filter((g) => g.members.length > 0)

  const canSendParent = type === 'parent' && selectedStudent?.parentUserId != null
  const canSendStaff = type === 'staff' && selectedStaff != null && subject.trim() && message.trim()

  const handleTemplate = (id: string) => {
    setTemplateId(id)
    const t = templates.find((x) => x.id === id)
    if (t) {
      setMessage(
        applyTemplateBody(
          t.body,
          selectedStudent ? firstName(selectedStudent.student.name) : '',
          teacherName,
        ),
      )
    }
  }

  const handleSubmit = async () => {
    if (sending) return
    if (type === 'parent') {
      if (!selectedStudent) {
        toast.error('Select a student first')
        return
      }
      if (!selectedStudent.parentUserId) {
        toast.error('This student has no linked guardian account')
        return
      }
      // A thread already exists for this guardian — continue there instead
      // of posting a second first-message into it.
      if (existingId) {
        onOpenedParent(existingId)
        return
      }
      if (!message.trim()) {
        toast.error('Write a message first')
        return
      }
      setSending(true)
      try {
        const result = await sendMessageToParent({
          studentId: selectedStudent.student.id,
          category,
          message: message.trim(),
        })
        toast.success('Message sent', { description: `To ${result.parentName}` })
        onOpenedParent(result.conversationId)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Message could not be sent')
      } finally {
        setSending(false)
      }
    } else {
      if (!selectedStaff) {
        toast.error('Select a recipient first')
        return
      }
      if (!subject.trim() || !message.trim()) {
        toast.error('Subject and message are required')
        return
      }
      setSending(true)
      try {
        await sendDirectMessage(selectedStaff.id, { subject: subject.trim(), body: message.trim() })
        toast.success('Message sent', { description: `To ${selectedStaff.name}` })
        onOpenedDirect(selectedStaff.id)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Message could not be sent')
      } finally {
        setSending(false)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">New message</DialogTitle>
          <DialogDescription className="text-xs">
            Message a guardian from your class or a colleague.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient type — only the audiences the teacher may reach */}
          <div className="space-y-1.5">
            <Label>To</Label>
            <div
              className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/30 p-1"
              role="group"
              aria-label="Recipient type"
            >
              <button
                type="button"
                onClick={() => setType('parent')}
                aria-pressed={type === 'parent'}
                className={
                  type === 'parent'
                    ? 'rounded-md bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm'
                    : 'rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground'
                }
              >
                Parent
              </button>
              <button
                type="button"
                onClick={() => setType('staff')}
                aria-pressed={type === 'staff'}
                disabled={staffDirectory.length === 0}
                className={
                  type === 'staff'
                    ? 'rounded-md bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm'
                    : 'rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50'
                }
              >
                Staff
              </button>
            </div>
          </div>

          {type === 'parent' ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="nm-student">Student</Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger id="nm-student" className="w-full">
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
                <Label htmlFor="nm-parent-message">
                  Message <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="nm-parent-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write to the guardian…"
                  className="min-h-24 text-sm"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="nm-staff">Recipient</Label>
                <Select value={staffId} onValueChange={setStaffId}>
                  <SelectTrigger id="nm-staff" className="w-full">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffByRole.map((g) => (
                      <SelectGroup key={g.role}>
                        <SelectLabel className="text-[10px] uppercase tracking-wide">
                          {g.label}
                        </SelectLabel>
                        {g.members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nm-subject">
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nm-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What is this about?"
                  maxLength={200}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nm-staff-message">
                  Message <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="nm-staff-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message…"
                  className="min-h-24 text-sm"
                />
              </div>
            </>
          )}
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
            disabled={sending || (type === 'parent' ? !canSendParent : !canSendStaff)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {type === 'parent' && existingId ? 'Open Conversation' : 'Send Message'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
