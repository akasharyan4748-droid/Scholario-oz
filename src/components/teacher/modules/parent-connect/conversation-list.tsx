'use client'

/**
 * parent-connect/conversation-list — the LEFT pane of the Parent Connect
 * workspace: search (parent OR student name), filter chips (All / Unread /
 * Needs Follow-up / Recent) and the scrollable conversation rows. Category
 * chips are deliberately NOT repeated on every row — that detail lives in
 * the thread header only.
 */

import { useMemo, useState } from 'react'
import { AlertCircle, MessagesSquare, Pin, Plus, Search } from 'lucide-react'
import { Avatar } from '@/components/shared/avatar'
import { HubEmptyState } from '@/components/teacher/modules/shared/hub-stat-cards'
import { formatRelativeTime } from '@/lib/format'
import type { ConversationSummary } from '@/lib/teacher-hub-types'
import { cn } from '@/lib/utils'
import { conversationPreview, filterConversations, LIST_FILTERS, type ListFilter } from './shared'

interface ConversationListProps {
  conversations: ConversationSummary[]
  activeId: string | null
  onSelect: (id: string) => void
  onNewMessage: () => void
}

export function ConversationList({ conversations, activeId, onSelect, onNewMessage }: ConversationListProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ListFilter>('all')

  const visible = useMemo(
    () => filterConversations(conversations, filter, query),
    [conversations, filter, query],
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-2.5 border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search parent or student…"
            aria-label="Search conversations by parent or student name"
            className="w-full rounded-lg border border-border bg-card/50 py-1.5 pl-8 pr-3 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter conversations">
          {LIST_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                filter === f.value
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
        aria-label="Parent conversations"
      >
        {conversations.length === 0 ? (
          <HubEmptyState
            icon={MessagesSquare}
            title="No parent conversations yet"
            hint="Messages with parents of your class will appear here."
            action={
              <button
                onClick={onNewMessage}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                New Message
              </button>
            }
          />
        ) : visible.length === 0 ? (
          <p className="px-4 py-10 text-center text-xs text-muted-foreground">
            No conversations match your search or filter.
          </p>
        ) : (
          visible.map((c) => (
            <ConversationRow key={c.id} c={c} active={c.id === activeId} onSelect={onSelect} />
          ))
        )}
      </div>
    </div>
  )
}

function ConversationRow({
  c,
  active,
  onSelect,
}: {
  c: ConversationSummary
  active: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      onClick={() => onSelect(c.id)}
      className={cn(
        'flex w-full items-start gap-2.5 border-b border-l-2 border-b-border/60 px-3 py-2.5 text-left transition-colors',
        active ? 'border-l-primary bg-muted/50' : 'border-l-transparent hover:bg-muted/40',
      )}
    >
      <Avatar name={c.parent.name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{c.parent.name}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          Parent of {c.student.name} · {c.student.classLabel}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground/90">{conversationPreview(c)}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
        {c.lastMessageAt && (
          <span className="text-[10px] text-muted-foreground">{formatRelativeTime(c.lastMessageAt)}</span>
        )}
        {c.unread > 0 && (
          <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold leading-4 text-primary-foreground">
            {c.unread}
          </span>
        )}
        {c.pinned && (
          <Pin className="h-3 w-3 text-muted-foreground" aria-label="Pinned" />
        )}
        {c.openFollowUp && (
          <AlertCircle className="h-3 w-3 text-amber-500" aria-label="Needs follow-up" />
        )}
      </div>
    </button>
  )
}
