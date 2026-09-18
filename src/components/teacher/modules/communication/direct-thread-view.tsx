'use client'

/**
 * communication/direct-thread-view — the RIGHT pane of the Communication
 * Hub for a DIRECT staff thread (Message rows between the teacher and one
 * counterpart — a colleague, the principal, management). Same visual
 * language as the parent thread view: sticky header with the participant +
 * role chip, day-divider message stream, read state, auto-grow composer
 * (Enter to send). Replies continue the last subject; sending is optimistic
 * and reconciled with the server row.
 */

import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Send,
} from 'lucide-react'
import { HubSectionError } from '@/components/teacher/modules/shared/hub-stat-cards'
import { formatDate, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { sendDirectMessage } from './hooks'
import { audienceTone, dayKey, dayLabel, roleLabel } from './shared'
import type { DirectThreadMessage, DirectThreadPayload } from './types'

type PendingMessage = DirectThreadMessage & { pending?: boolean }

interface DirectThreadViewProps {
  thread: DirectThreadPayload | null
  loading: boolean
  error: string | null
  onRetry: () => void
  onBack: () => void
  onSent: (counterpartId: string, message: DirectThreadMessage) => void
}

/** Derive the reply subject from the thread: "Re: <last subject>" (or a
 *  neutral default for brand-new threads opened from the directory). */
function replySubject(thread: DirectThreadPayload | null): string {
  const last = thread?.messages[thread.messages.length - 1]
  if (!last) return 'Message'
  return last.subject.startsWith('Re:') ? last.subject : `Re: ${last.subject}`
}

export function DirectThreadView({
  thread,
  loading,
  error,
  onRetry,
  onBack,
  onSent,
}: DirectThreadViewProps) {
  const [messages, setMessages] = useState<PendingMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
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

  const counterpart = thread?.counterpart ?? null
  const lastSubject = replySubject(thread)

  const handleSend = async () => {
    const text = draft.trim()
    if (!text || !counterpart || sending) return
    const optimistic: PendingMessage = {
      id: `pending-${Date.now()}`,
      subject: lastSubject,
      body: text,
      fromMe: true,
      senderName: 'You',
      read: false,
      createdAt: new Date().toISOString(),
      pending: true,
    }
    setMessages((prev) => [...prev, optimistic])
    setDraft('')
    setSending(true)
    try {
      const saved = await sendDirectMessage(counterpart.id, {
        subject: lastSubject,
        body: text,
      })
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? saved : m)))
      onSent(counterpart.id, saved)
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

  // Day dividers + bubbles, derived in one pass. A subject line opens each
  // new subject group so long threads stay readable.
  const items: {
    key: string
    divider?: string
    subject?: string
    message?: PendingMessage
  }[] = []
  let prevDay = ''
  let prevSubject = ''
  for (const m of messages) {
    const key = dayKey(m.createdAt)
    if (key !== prevDay) {
      items.push({ key: `d-${key}-${m.id}`, divider: dayLabel(key) })
      prevDay = key
      prevSubject = ''
    }
    if (m.subject !== prevSubject) {
      items.push({ key: `s-${m.id}`, subject: m.subject })
      prevSubject = m.subject
    }
    items.push({ key: m.id, message: m })
  }
  const lastMineId = [...messages].reverse().find((m) => m.fromMe)?.id ?? null

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
              <p className="truncate text-sm font-semibold">
                {counterpart?.name ?? 'Conversation'}
              </p>
              {counterpart && (
                <span
                  className={cn(
                    'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                    audienceTone(counterpart.role),
                  )}
                >
                  {roleLabel(counterpart.role)}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {counterpart ? 'Direct message' : 'Staff conversation'}
            </p>
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
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
          role="log"
          aria-label={`Conversation with ${counterpart?.name ?? 'staff member'}`}
        >
          {messages.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">
              No messages in this conversation yet.
            </p>
          )}
          {items.map(({ key, divider, subject, message }) =>
            divider ? (
              <p key={key} className="text-center text-[10px] text-muted-foreground">
                {divider}
              </p>
            ) : subject != null ? (
              <p
                key={key}
                className="pt-1 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70"
              >
                {subject}
              </p>
            ) : (
              <div key={key} className={cn('flex', message!.fromMe ? 'justify-end' : 'justify-start')}>
                <div className="flex max-w-[75%] flex-col">
                  <div
                    title={`${formatDate(message!.createdAt)} · ${formatTime(message!.createdAt)}`}
                    className={cn(
                      'whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm',
                      message!.fromMe
                        ? 'rounded-br-md bg-primary text-primary-foreground'
                        : 'rounded-bl-md border border-border bg-card text-foreground',
                      message!.pending && 'opacity-60',
                    )}
                  >
                    {message!.body}
                  </div>
                  {message!.fromMe && message!.id === lastMineId && !message!.pending && (
                    <p
                      className={cn(
                        'mt-0.5 flex items-center justify-end gap-1 pr-1 text-[10px]',
                        message!.read ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
                      )}
                    >
                      {message!.read ? (
                        <CheckCheck className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <Check className="h-3 w-3" aria-hidden="true" />
                      )}
                      {message!.read ? 'Read' : 'Sent'}
                    </p>
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {/* Composer */}
      {counterpart && (
        <div className="shrink-0 border-t border-border p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${counterpart.name.split(' ')[0]}…`}
              aria-label={`Message to ${counterpart.name}`}
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
          <p className="mt-1.5 truncate pl-1 text-[10px] text-muted-foreground">
            Replying as {lastSubject}
          </p>
        </div>
      )}
    </div>
  )
}
