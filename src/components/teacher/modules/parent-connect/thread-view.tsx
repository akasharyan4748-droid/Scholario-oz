'use client'

/**
 * parent-connect/thread-view — the RIGHT pane of the Parent Connect
 * workspace: sticky header (parent, student, category chip, quiet actions),
 * the message stream (day dividers, bubbles, read state on the last teacher
 * message) and the composer (auto-grow textarea, school templates, Enter to
 * send). Sending is optimistic (pending style) and reconciled with the
 * server message; failures roll the optimistic row back.
 */

import { useEffect, useRef, useState } from 'react'
import {
  AlarmClockPlus,
  ArrowLeft,
  Check,
  CheckCheck,
  Phone,
  Pin,
  PinOff,
  Send,
  Sparkles,
  User,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { HubSectionError } from '@/components/teacher/modules/shared/hub-stat-cards'
import { formatDate, formatTime } from '@/lib/format'
import {
  CONVERSATION_CATEGORY_LABELS,
  type ConversationSummary,
  type MessageTemplateItem,
  type ThreadMessage,
  type ThreadPayload,
} from '@/lib/teacher-hub-types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { sendThreadMessage } from './hooks'
import { applyTemplateBody, CATEGORY_TONES, dayKey, dayLabel, firstName } from './shared'

/** A thread message plus the optimistic-send pending flag. */
type PendingMessage = ThreadMessage & { pending?: boolean }

interface ThreadViewProps {
  conversationId: string
  /** live summary from the parent's list state (pin/unread stay in sync) */
  summary: ConversationSummary | null
  thread: ThreadPayload | null
  loading: boolean
  error: string | null
  onRetry: () => void
  onBack: () => void
  onNavigate?: (key: string) => void
  teacherName: string
  templates: MessageTemplateItem[]
  onSent: (conversationId: string, message: ThreadMessage) => void
  onTogglePin: (conversationId: string, pinned: boolean) => void
  onMarkFollowUp: (ctx: { conversationId: string; parentName: string; studentName: string }) => void
}

export function ThreadView({
  conversationId,
  summary,
  thread,
  loading,
  error,
  onRetry,
  onBack,
  onNavigate,
  teacherName,
  templates,
  onSent,
  onTogglePin,
  onMarkFollowUp,
}: ThreadViewProps) {
  const [messages, setMessages] = useState<PendingMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Reset the local stream + composer whenever a (new) thread arrives.
  useEffect(() => {
    setMessages(thread?.messages ?? [])
    setDraft('')
  }, [thread])

  // Keep the stream pinned to the latest message.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loading])

  // Auto-grow the composer (rows=1 → up to max-h-32).
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }, [draft])

  const parentName = thread?.conversation.parent.name ?? summary?.parent.name ?? 'Guardian'
  const parentPhone = thread?.conversation.parent.phone ?? summary?.parent.phone ?? null
  const student = thread?.conversation.student ?? summary?.student ?? null
  const category = thread?.conversation.category ?? summary?.category ?? 'general'
  const pinned = summary?.pinned ?? thread?.conversation.pinned ?? false
  const studentFirst = student ? firstName(student.name) : ''

  const handleSend = async () => {
    const text = draft.trim()
    if (!text || sending) return
    const optimistic: PendingMessage = {
      id: `pending-${Date.now()}`,
      fromTeacher: true,
      senderName: teacherName,
      body: text,
      createdAt: new Date().toISOString(),
      readAt: null,
      pending: true,
    }
    setMessages((prev) => [...prev, optimistic])
    setDraft('')
    setSending(true)
    try {
      const saved = await sendThreadMessage(conversationId, text)
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? saved : m)))
      onSent(conversationId, saved)
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      setDraft(text)
      toast.error('Message could not be sent')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const applyTemplate = (template: MessageTemplateItem) => {
    setDraft(applyTemplateBody(template.body, studentFirst, teacherName))
    setTemplateOpen(false)
    textareaRef.current?.focus()
  }

  // Day dividers + bubbles, derived in one pass.
  const items: { key: string; divider?: string; message?: PendingMessage }[] = []
  let prevDay = ''
  for (const m of messages) {
    const key = dayKey(m.createdAt)
    if (key !== prevDay) {
      items.push({ key: `d-${key}-${m.id}`, divider: dayLabel(key) })
      prevDay = key
    }
    items.push({ key: m.id, message: m })
  }
  const lastTeacherId = [...messages].reverse().find((m) => m.fromTeacher)?.id ?? null

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-card px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            aria-label="Back to conversations"
            title="Back to conversations"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold">{parentName}</p>
              <span
                className={cn(
                  'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                  CATEGORY_TONES[category],
                )}
              >
                {CONVERSATION_CATEGORY_LABELS[category]}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              Parent of {student?.name ?? 'student'} · Roll {student?.rollNo ?? '—'} · {student?.classLabel ?? ''}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={() => onTogglePin(conversationId, !pinned)}
              aria-label={pinned ? 'Unpin conversation' : 'Pin conversation'}
              title={pinned ? 'Unpin conversation' : 'Pin conversation'}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              {pinned ? <PinOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Pin className="h-3.5 w-3.5" aria-hidden="true" />}
            </button>
            <button
              onClick={() =>
                onMarkFollowUp({ conversationId, parentName, studentName: student?.name ?? '' })
              }
              aria-label="Mark for follow-up"
              title="Mark for follow-up"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <AlarmClockPlus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            {parentPhone && (
              <span
                className="hidden items-center gap-1 text-[11px] text-muted-foreground md:flex"
                title="Guardian phone"
              >
                <Phone className="h-3 w-3" aria-hidden="true" />
                {parentPhone}
              </span>
            )}
            <button
              onClick={() => onNavigate?.('students')}
              aria-label="View student"
              title="View student"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground sm:w-auto sm:gap-1.5 sm:px-2.5"
            >
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">View Student</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error ? (
        <div className="flex flex-1 items-center px-4 py-6">
          <HubSectionError message={error} onRetry={onRetry} />
        </div>
      ) : loading ? (
        <div className="flex-1 space-y-3 overflow-hidden px-4 py-4" aria-hidden="true">
          <div className="h-9 w-44 rounded-2xl rounded-bl-md bg-muted/60 animate-pulse" />
          <div className="ml-auto h-9 w-56 rounded-2xl rounded-br-md bg-muted/60 animate-pulse" />
          <div className="h-9 w-36 rounded-2xl rounded-bl-md bg-muted/60 animate-pulse" />
          <div className="ml-auto h-9 w-48 rounded-2xl rounded-br-md bg-muted/60 animate-pulse" />
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
          role="log"
          aria-label={`Conversation with ${parentName}`}
        >
          {items.map(({ key, divider, message }) =>
            divider ? (
              <p key={key} className="text-center text-[10px] text-muted-foreground">
                {divider}
              </p>
            ) : (
              <div key={key} className={cn('flex', message!.fromTeacher ? 'justify-end' : 'justify-start')}>
                <div className="flex max-w-[75%] flex-col">
                  <div
                    title={`${formatDate(message!.createdAt)} · ${formatTime(message!.createdAt)}`}
                    className={cn(
                      'whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm',
                      message!.fromTeacher
                        ? 'rounded-br-md bg-primary text-primary-foreground'
                        : 'rounded-bl-md border border-border bg-card text-foreground',
                      message!.pending && 'opacity-60',
                    )}
                  >
                    {message!.body}
                  </div>
                  {message!.fromTeacher && message!.id === lastTeacherId && !message!.pending && (
                    <p
                      className={cn(
                        'mt-0.5 flex items-center justify-end gap-1 pr-1 text-[10px]',
                        message!.readAt ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
                      )}
                    >
                      {message!.readAt ? (
                        <CheckCheck className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <Check className="h-3 w-3" aria-hidden="true" />
                      )}
                      {message!.readAt ? 'Read' : 'Sent'}
                    </p>
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {/* Composer */}
      {thread && (
        <div className="shrink-0 border-t border-border p-3">
          <div className="flex items-end gap-2">
            <Popover open={templateOpen} onOpenChange={setTemplateOpen}>
              <PopoverTrigger asChild>
                <button
                  disabled={templates.length === 0}
                  aria-label="Insert a school-approved template"
                  title="Insert a school-approved template"
                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card/50 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Template
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 p-1.5">
                <p className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  School templates
                </p>
                <div className="max-h-64 overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(t)}
                      className="flex w-full flex-col gap-0.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/60"
                    >
                      <span className="text-xs font-medium">{t.label}</span>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{t.category}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <textarea
              ref={textareaRef}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a message…"
              aria-label="Message to parent"
              className="min-h-9 max-h-32 w-full resize-none overflow-y-auto rounded-lg border border-border bg-card/50 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
            />
            <button
              onClick={() => void handleSend()}
              disabled={!draft.trim() || sending}
              aria-label="Send message"
              title="Send message (Enter)"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
