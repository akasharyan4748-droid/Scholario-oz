'use client'

/**
 * MessagingModule — Messages & Inbox.
 *
 * Layout: Folders sidebar · Conversation list · Active conversation · Reply composer
 *
 * Compact summary row (Unread + Drafts count) — NOT giant KPI cards.
 *
 * NO fake "online" status, NO fake "typing" indicators, NO fake "read" receipts.
 * NO dead Call/Video buttons.
 * NO "Smart Replies" / AI gimmicks.
 * NO "Response Rate" analytics card (fake metric).
 *
 * State mutations all functional:
 *   - Send message → appears in conversation + Sent folder
 *   - Star/unstar → appears/disappears from Starred
 *   - Archive → removed from Inbox, appears in Archive, can Unarchive
 *   - Drafts → auto-saved, restored on re-open, removed on send
 *   - Search → filters by name + message content (not just titles)
 *   - Labels (Staff/Parents/Groups/Urgent) → all functional filters
 */

import { useState, useEffect } from 'react'
import { MessageSquare, Send, Mail, FileText, Star } from 'lucide-react'
import { useMessagingStore } from '@/lib/store/messaging-store'
import { FoldersSidebar } from './folders-sidebar'
import { ConversationList } from './conversation-list'
import { ThreadView } from './thread-view'
import { ComposeModal } from './compose-modal'
import { cn } from '@/lib/utils'

export function MessagingModule() {
  const conversations = useMessagingStore((s) => s.conversations)
  const drafts = useMessagingStore((s) => s.drafts)
  const activeConversationId = useMessagingStore((s) => s.activeConversationId)
  const [composeOpen, setComposeOpen] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')

  // Real unread count from store
  const unreadCount = conversations.filter((c) => !c.archived && c.unread > 0).length
  const draftCount = drafts.length
  const starredCount = conversations.filter((c) => c.starred && !c.archived).length

  // Switch to thread view on mobile when conversation opened
  useEffect(() => {
    if (activeConversationId) setMobileView('thread')
  }, [activeConversationId])

  return (
    <div className="flex flex-col h-full">
      {/* Header — compact, no giant KPI cards */}
      <div className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight">Messages & Inbox</h1>
            </div>
            <button
              onClick={() => setComposeOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Send className="h-3.5 w-3.5" /> Compose
            </button>
          </div>
          {/* Compact summary row */}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold tabular-nums">
              <Mail className="h-2.5 w-2.5" /> {unreadCount} unread
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold tabular-nums">
              <Star className="h-2.5 w-2.5" /> {starredCount} starred
            </span>
            {draftCount > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold tabular-nums">
                <FileText className="h-2.5 w-2.5" /> {draftCount} drafts
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mail client — 3-pane on desktop, stack on mobile */}
      <div className="flex-1 overflow-hidden bg-card border border-border rounded-xl m-4 mt-0 shadow-sm">
        <div className="grid lg:grid-cols-[180px_300px_1fr] h-full">
          {/* Folders sidebar — desktop only */}
          <FoldersSidebar />

          {/* Conversation list — hidden on mobile when in thread view */}
          <div className={cn('lg:block', mobileView === 'thread' && 'hidden')}>
            <ConversationList onCompose={() => setComposeOpen(true)} />
          </div>

          {/* Thread view — hidden on mobile when in list view */}
          <div className={cn('lg:block flex-1 min-w-0', mobileView === 'list' && 'hidden')}>
            <ThreadView onBack={() => setMobileView('list')} onCompose={() => setComposeOpen(true)} />
          </div>
        </div>
      </div>

      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} />
    </div>
  )
}
