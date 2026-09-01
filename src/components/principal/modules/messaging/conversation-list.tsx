'use client'

/**
 * ConversationList — search + filtered conversation list.
 *
 * Each conversation shows: avatar, name, role, last message, time, unread count, starred state.
 * Search filters by name, last message, AND message content (not just titles).
 */

import { useState, useMemo } from 'react'
import { Search, Star, AlertCircle, Archive, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMessagingStore, formatTimeAgo } from '@/lib/store/messaging-store'
import { toast } from 'sonner'

export function ConversationList({ onCompose }: { onCompose: () => void }) {
  const searchQuery = useMessagingStore((s) => s.searchQuery)
  const setSearchQuery = useMessagingStore((s) => s.setSearchQuery)
  const getFilteredConversations = useMessagingStore((s) => s.getFilteredConversations)
  const openConversation = useMessagingStore((s) => s.openConversation)
  const activeConversationId = useMessagingStore((s) => s.activeConversationId)
  const activeFolder = useMessagingStore((s) => s.activeFolder)
  const starConversation = useMessagingStore((s) => s.starConversation)
  const archiveConversation = useMessagingStore((s) => s.archiveConversation)
  const unarchiveConversation = useMessagingStore((s) => s.unarchiveConversation)

  const conversations = getFilteredConversations()
  const [showActions, setShowActions] = useState<string | null>(null)

  return (
    <div className="flex flex-col border-r border-border bg-card min-w-0">
      {/* Search bar */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages…"
            className="w-full h-8 pl-8 pr-8 text-xs rounded-md border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length > 0 ? (
          conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => openConversation(c.id)}
              onMouseEnter={() => setShowActions(c.id)}
              onMouseLeave={() => setShowActions(null)}
              className={cn(
                'relative cursor-pointer px-3 py-2.5 border-b border-border/30 transition-colors group',
                activeConversationId === c.id ? 'bg-primary/5' : 'hover:bg-muted/30',
                c.unread > 0 && 'bg-muted/20',
              )}
            >
              <div className="flex items-start gap-2.5">
                {/* Avatar */}
                <div className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-semibold',
                  c.type === 'staff' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                  c.type === 'parent' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                  'bg-gradient-to-br from-violet-500 to-purple-600',
                )}>
                  {c.avatar}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className={cn('text-xs truncate', c.unread > 0 ? 'font-bold text-foreground' : 'font-medium text-foreground/80')}>
                      {c.name}
                      {c.urgent && <AlertCircle className="inline-block ml-1 h-2.5 w-2.5 text-rose-600" />}
                    </p>
                    <span className="text-[9px] text-muted-foreground shrink-0">{formatTimeAgo(c.lastTimestamp)}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground truncate">{c.role}</p>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <p className={cn('text-[10px] truncate flex-1', c.unread > 0 ? 'font-medium text-foreground/90' : 'text-muted-foreground')}>
                      {c.lastMessage}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      {c.starred && <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />}
                      {c.unread > 0 && (
                        <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[8px] font-bold tabular-nums">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hover actions */}
              {showActions === c.id && (
                <div className="absolute right-2 top-2 flex items-center gap-0.5 bg-card border border-border rounded-md shadow-sm p-0.5 z-10">
                  <button
                    onClick={(e) => { e.stopPropagation(); starConversation(c.id); toast.success(c.starred ? 'Unstarred' : 'Starred') }}
                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-amber-500"
                    title={c.starred ? 'Unstar' : 'Star'}
                  >
                    <Star className={cn('h-3 w-3', c.starred && 'fill-amber-500 text-amber-500')} />
                  </button>
                  {activeFolder === 'archive' ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); unarchiveConversation(c.id); toast.success('Restored to Inbox') }}
                      className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-emerald-500"
                      title="Restore"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); archiveConversation(c.id); toast.success('Archived') }}
                      className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-rose-500"
                      title="Archive"
                    >
                      <Archive className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            {searchQuery ? (
              <>
                <Search className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs font-medium text-muted-foreground">No messages found</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">Try a different search term.</p>
              </>
            ) : activeFolder === 'starred' ? (
              <>
                <Star className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs font-medium text-muted-foreground">No starred conversations</p>
              </>
            ) : activeFolder === 'sent' ? (
              <>
                <p className="text-xs font-medium text-muted-foreground">No sent messages</p>
              </>
            ) : activeFolder === 'drafts' ? (
              <>
                <p className="text-xs font-medium text-muted-foreground">No saved drafts</p>
              </>
            ) : activeFolder === 'archive' ? (
              <>
                <Archive className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs font-medium text-muted-foreground">No archived conversations</p>
              </>
            ) : (
              <p className="text-xs font-medium text-muted-foreground">No messages</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
