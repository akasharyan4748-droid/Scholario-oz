'use client'

/**
 * communication/sent-messages — the SENT MESSAGES card: what THIS teacher
 * has actually sent, merged from two real sources by the server —
 * ParentMessages inside her parent threads ("parent" channel) and
 * direct Message rows to students/colleagues ("direct" channel). Newest
 * first. No delivery rates, no fabricated statuses — just the sent facts.
 */

import { Send } from 'lucide-react'
import { Avatar } from '@/components/shared/avatar'
import { GlassCard } from '@/components/shared/ui'
import { HubEmptyState } from '@/components/teacher/modules/shared/hub-stat-cards'
import { cn } from '@/lib/utils'
import { sentTime } from './shared'
import type { SentMessageItem } from './types'

const THIN_SCROLLBAR =
  '[scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5'

interface SentMessagesProps {
  messages: SentMessageItem[]
  onNewMessage: () => void
}

export function SentMessagesCard({ messages, onNewMessage }: SentMessagesProps) {
  return (
    <GlassCard className="flex flex-col p-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sent Messages
        </p>
        <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums">
          latest {messages.length}
        </span>
      </div>

      {messages.length === 0 ? (
        <HubEmptyState
          icon={Send}
          title="No messages sent yet"
          hint="Messages you send to parents and colleagues will appear here."
          action={
            <button
              onClick={onNewMessage}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              New Message
            </button>
          }
        />
      ) : (
        <div
          className={cn('max-h-80 divide-y divide-border/50 overflow-y-auto', THIN_SCROLLBAR)}
          role="list"
          aria-label="Messages you have sent"
        >
          {messages.map((m) => (
            <div
              key={`${m.channel}-${m.id}`}
              role="listitem"
              className="flex items-start gap-3 px-4 py-3"
            >
              <Avatar name={m.recipientName} size="xs" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <p className="truncate text-sm font-medium">{m.recipientName}</p>
                  <span
                    className={cn(
                      'shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium',
                      m.channel === 'parent'
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-border bg-muted text-muted-foreground',
                    )}
                  >
                    {m.channel === 'parent' ? 'Parent thread' : 'Direct'}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{m.contextLabel}</p>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground/90">{m.preview}</p>
              </div>
              <span className="shrink-0 whitespace-nowrap pt-0.5 text-[10px] text-muted-foreground tabular-nums">
                {sentTime(m.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  )
}
