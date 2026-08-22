'use client'

/**
 * MessagingModule — Messages & Inbox.
 *
 * Layout: Folders sidebar · (Conversation list OR Groups panel) · Active conversation · Reply composer
 *
 * Folder counts (Unread/Starred/Sent/Groups/Drafts/Archive) live in the
 * FoldersSidebar — NOT duplicated in the header here.
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
 *   - Groups folder → opens the GroupsPanel (group management + create group +
 *     manage members + send-to-group via compose preselect)
 */

import { useState, useEffect } from 'react'
import { Send } from 'lucide-react'
import { useMessagingStore } from '@/lib/store/messaging-store'
import { FoldersSidebar } from './folders-sidebar'
import { ConversationList } from './conversation-list'
import { ThreadView } from './thread-view'
import { ComposeModal } from './compose-modal'
import { GroupsPanel } from './groups-panel'
import { cn } from '@/lib/utils'

export function MessagingModule() {
  const activeConversationId = useMessagingStore((s) => s.activeConversationId)
  const activeFolder = useMessagingStore((s) => s.activeFolder)
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeRecipient, setComposeRecipient] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')

  // Switch to thread view on mobile when conversation opened
  useEffect(() => {
    if (activeConversationId) setMobileView('thread')
  }, [activeConversationId])

  const handleCompose = (recipientName?: string) => {
    setComposeRecipient(recipientName ?? null)
    setComposeOpen(true)
  }

  const isGroupsFolder = activeFolder === 'groups'

  return (
    <div className="flex flex-col h-full">
      {/* Header — compact, no giant KPI cards.
          Folder counts live in the FoldersSidebar (one source of truth). */}
      <div className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight">Messages & Inbox</h1>
            </div>
            <button
              onClick={() => handleCompose()}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Send className="h-3.5 w-3.5" /> Compose
            </button>
          </div>
        </div>
      </div>

      {/* Mail client — 3-pane on desktop, stack on mobile */}
      <div className="flex-1 overflow-hidden bg-card border border-border rounded-xl m-4 mt-0 shadow-sm">
        <div className="grid lg:grid-cols-[180px_300px_1fr] h-full">
          {/* Folders sidebar — desktop only */}
          <FoldersSidebar />

          {/* Middle pane — ConversationList OR GroupsPanel */}
          <div className={cn('lg:block min-w-0', mobileView === 'thread' && 'hidden')}>
            {isGroupsFolder ? (
              <GroupsPanel onCompose={handleCompose} />
            ) : (
              <ConversationList onCompose={() => handleCompose()} />
            )}
          </div>

          {/* Thread view — hidden on mobile when in list view */}
          <div className={cn('lg:block flex-1 min-w-0', mobileView === 'list' && 'hidden')}>
            <ThreadView onBack={() => setMobileView('list')} onCompose={() => handleCompose()} />
          </div>
        </div>
      </div>

      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        preselectedRecipient={composeRecipient}
      />
    </div>
  )
}
