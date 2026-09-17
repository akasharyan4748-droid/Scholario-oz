'use client'

/**
 * communication/conversations-preview — the RECENT CONVERSATIONS card: a
 * compact read-only preview of the teacher's own ParentConversation rows
 * (unread counts, last-message preview, activity time). The threads
 * themselves live in the Parent Connect module — every row opens it via
 * onNavigate('parent-connect') instead of duplicating the thread UI here.
 */

import { ArrowUpRight, MessagesSquare, Pin, Send } from 'lucide-react'
import { Avatar } from '@/components/shared/avatar'
import { GlassCard } from '@/components/shared/ui'
import { HubEmptyState } from '@/components/teacher/modules/shared/hub-stat-cards'
import { cn } from '@/lib/utils'
import { categoryLabel, conversationPreview, conversationTime } from './shared'
import type { CommunicationConversation } from './types'

const THIN_SCROLLBAR =
  '[scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5'

interface ConversationsPreviewProps {
  conversations: CommunicationConversation[]
  total: number
  /** opens the Parent Connect module (module-router wires onNavigate) */
  onOpenParentConnect: () => void
  onMessageParent: () => void
}

export function ConversationsPreviewCard({
  conversations,
  total,
  onOpenParentConnect,
  onMessageParent,
}: ConversationsPreviewProps) {
  return (
    <GlassCard className="flex flex-col p-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Conversations
        </p>
        <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums">
          {total} total
        </span>
      </div>

      {conversations.length === 0 ? (
        <HubEmptyState
          icon={MessagesSquare}
          title="No parent conversations yet"
          hint="Start one from Parent Connect — your thread with each guardian of your class lives there."
          action={
            <div className="flex flex-col items-center gap-2 sm:flex-row">
              <button
                onClick={onOpenParentConnect}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <MessagesSquare className="h-3.5 w-3.5" aria-hidden="true" />
                Open Parent Connect
              </button>
              <button
                onClick={onMessageParent}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                Message a Parent
              </button>
            </div>
          }
        />
      ) : (
        <div
          className={cn('max-h-[26rem] divide-y divide-border/50 overflow-y-auto', THIN_SCROLLBAR)}
          role="list"
          aria-label="Recent parent conversations"
        >
          {conversations.map((c) => (
            <ConversationRow key={c.id} c={c} onOpen={onOpenParentConnect} />
          ))}
          {total > conversations.length && (
            <button
              onClick={onOpenParentConnect}
              className="flex w-full items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
            >
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              View all {total} conversations in Parent Connect
            </button>
          )}
        </div>
      )}
    </GlassCard>
  )
}

function ConversationRow({
  c,
  onOpen,
}: {
  c: CommunicationConversation
  onOpen: () => void
}) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary/40"
    >
      <Avatar name={c.parent.name} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{c.parent.name}</p>
          {c.unread > 0 && (
            <span className="shrink-0 rounded-full bg-primary px-1.5 text-[10px] font-semibold leading-4 text-primary-foreground tabular-nums">
              {c.unread}
            </span>
          )}
          {c.pinned && (
            <Pin className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Pinned" />
          )}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          Parent of {c.student.name} · {c.student.classLabel} · {categoryLabel(c.category)}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground/90">
          {conversationPreview(c)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
        <span className="whitespace-nowrap text-[10px] text-muted-foreground tabular-nums">
          {conversationTime(c.lastMessageAt ?? c.lastMessage?.createdAt ?? null)}
        </span>
        {c.awaitingReply ? (
          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
            Reply due
          </span>
        ) : (
          <span className="flex items-center gap-0.5 text-[10px] font-medium text-primary">
            Open Conversation
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </span>
        )}
      </div>
    </button>
  )
}
