'use client'

/**
 * MessagingModule — Messages & Inbox.
 *
 * Layout: Folders sidebar · (Conversation list OR Groups panel) · Active conversation · Reply composer
 *
 * Converged to the Academics shell pattern as far as a 3-pane mail client
 * allows: NO sticky header, NO eyebrow, NO h1 (sidebar already says
 * "Messages"). One compact row at the top carries only the primary
 * Compose action on the right; the 3-pane mail layout fills the rest of
 * the viewport with `h-full` so the inner panes can scroll independently.
 *
 * Folder counts (Unread/Starred/Sent/Groups/Drafts/Archive) live in the
 * FoldersSidebar — NOT duplicated in the shell.
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

import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { useMessagingStore } from '@/lib/store/messaging-store'
import { useFocusStore } from '@/lib/store/focus-store'
import { toast } from 'sonner'
import { FoldersSidebar } from './folders-sidebar'
import { ConversationList } from './conversation-list'
import { ThreadView } from './thread-view'
import { ComposeModal } from './compose-modal'
import { GroupsPanel } from './groups-panel'
import { cn } from '@/lib/utils'

export function MessagingModule() {
  const activeConversationId = useMessagingStore((s) => s.activeConversationId)
  const activeFolder = useMessagingStore((s) => s.activeFolder)
  const conversations = useMessagingStore((s) => s.conversations)
  const openConversation = useMessagingStore((s) => s.openConversation)
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeRecipient, setComposeRecipient] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')

  // Parent deep-link from the command palette: focus.type 'parent' carries
  // the guardian's name. If a parent conversation already exists for that
  // guardian (matched by name — exact → prefix → contains), open it
  // directly; otherwise pre-address a fresh compose so the principal can
  // reach out without hunting for the thread. Cleared after handling so
  // re-mounts never replay the request.
  const focus = useFocusStore((s) => s.focus)
  const handledParentTs = useRef<number | null>(null)
  useEffect(() => {
    if (!focus || focus.type !== 'parent' || handledParentTs.current === focus.ts) return
    handledParentTs.current = focus.ts
    const name = focus.title.toLowerCase().trim()
    if (!name) return
    const parents = conversations.filter((c) => c.type === 'parent')
    const match =
      parents.find((c) => c.name.toLowerCase().trim() === name) ??
      parents.find((c) => name.startsWith(c.name.toLowerCase().trim())) ??
      parents.find((c) => c.name.toLowerCase().includes(name) || name.includes(c.name.toLowerCase().trim()))
    if (match) {
      openConversation(match.id)
      toast.success(`Opened ${match.name}'s conversation`, { description: 'Deep-linked from global search' })
    } else {
      setComposeRecipient(focus.title)
      setComposeOpen(true)
      toast.info(`New message to ${focus.title}`, {
        description: 'No existing conversation with this guardian yet — compose pre-addressed.',
      })
    }
    useFocusStore.getState().clearFocus()
  }, [focus?.ts, focus?.type, focus?.title, conversations, openConversation])

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
    <PageTransition className="flex flex-col h-full gap-3">
      {/* Compact action row — Compose primary on the right.
          No h1 (sidebar already names the module), no KPI cards.
          `justify-end` keeps the button right-aligned without an
          explicit empty div. */}
      <div className="flex items-center justify-end gap-3 flex-wrap shrink-0">
        <button
          onClick={() => handleCompose()}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        >
          <Send className="h-3.5 w-3.5" /> Compose
        </button>
      </div>

      {/* 3-pane mail client — flat card surface fills the remaining viewport. */}
      <div className="flex-1 min-h-0 overflow-hidden bg-card border border-border rounded-xl shadow-sm">
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
    </PageTransition>
  )
}
