'use client'

/**
 * ConversationList — search + compact, scannable conversation rows.
 *
 * Row anatomy (two lines, consistent):
 *   [avatar]  Name · urgent/starred marks        time
 *             message preview…            unread badge
 *
 * Role/relationship and every other detail are intentionally NOT shown
 * here — they are disclosed through the chat header and contact sheet.
 * Hover reveals quiet star / archive actions (desktop only); mobile
 * users reach the same actions from the chat's menu.
 */

import { useMemo } from 'react'
import { Search, Star, Archive, RotateCcw, PenSquare, Menu, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMessagingStore, formatListTime } from '@/lib/store/messaging-store'
import { ConversationAvatar } from './shared'

const FOLDER_TITLES: Record<string, string> = {
  inbox: 'Inbox',
  starred: 'Starred',
  sent: 'Sent',
  groups: 'Groups',
  drafts: 'Drafts',
  archive: 'Archive',
}

interface Props {
  onCompose: () => void
  onOpenFolders: () => void
}

export function ConversationList({ onCompose, onOpenFolders }: Props) {
  const searchQuery = useMessagingStore((s) => s.searchQuery)
  const setSearchQuery = useMessagingStore((s) => s.setSearchQuery)
  const getFilteredConversations = useMessagingStore((s) => s.getFilteredConversations)
  const openConversation = useMessagingStore((s) => s.openConversation)
  const activeConversationId = useMessagingStore((s) => s.activeConversationId)
  const activeFolder = useMessagingStore((s) => s.activeFolder)
  const activeLabel = useMessagingStore((s) => s.activeLabel)
  const setActiveLabel = useMessagingStore((s) => s.setActiveLabel)
  const starConversation = useMessagingStore((s) => s.starConversation)
  const archiveConversation = useMessagingStore((s) => s.archiveConversation)
  const unarchiveConversation = useMessagingStore((s) => s.unarchiveConversation)
  const conversations = useMessagingStore((s) => s.conversations)
  const messages = useMessagingStore((s) => s.messages)

  // `getFilteredConversations` reads store state non-reactively — subscribe
  // to every input it derives from so the list stays live.
  const filtered = useMemo(
    () => getFilteredConversations(),
    [getFilteredConversations, searchQuery, activeFolder, activeLabel, conversations, messages],
  )
  const unreadTotal = useMemo(
    () => conversations.filter((c) => !c.archived).reduce((sum, c) => sum + c.unread, 0),
    [conversations],
  )

  const title = FOLDER_TITLES[activeFolder] ?? 'Inbox'

  return (
    <div className="flex h-full min-w-0 flex-col bg-card">
      {/* Header — hamburger (<lg, opens folder drawer) · folder title · compose */}
      <div className="shrink-0 space-y-2.5 border-b border-border px-3 pb-2.5 pt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenFolders}
            aria-label="Open folders"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground xl:hidden"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <h2 className="truncate text-[13px] font-semibold text-foreground">{title}</h2>
            {activeFolder === 'inbox' && unreadTotal > 0 && (
              <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold tabular-nums text-primary">
                {unreadTotal > 99 ? '99+' : unreadTotal}
              </span>
            )}
            {activeLabel && (
              <button
                onClick={() => setActiveLabel(null)}
                className="inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {activeLabel}
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>

          <button
            onClick={onCompose}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 xl:hidden"
          >
            <PenSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Compose</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations…"
            aria-label="Search conversations"
            className="h-9 w-full rounded-lg border border-border bg-card pl-8 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Rows */}
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        {filtered.length > 0 ? (
          filtered.map((c) => (
            <ConversationRow
              key={c.id}
              convo={c}
              active={activeConversationId === c.id}
              showRestore={activeFolder === 'archive'}
              onOpen={() => openConversation(c.id)}
              onToggleStar={() => starConversation(c.id)}
              onArchive={() => archiveConversation(c.id)}
              onRestore={() => unarchiveConversation(c.id)}
            />
          ))
        ) : (
          <EmptyState folder={activeFolder} searching={!!searchQuery.trim()} onCompose={onCompose} />
        )}
      </div>
    </div>
  )
}

// ─── Row ─────────────────────────────────────────────────────────────

function ConversationRow({
  convo, active, showRestore, onOpen, onToggleStar, onArchive, onRestore,
}: {
  convo: ReturnType<typeof useMessagingStore.getState>['conversations'][number]
  active: boolean
  showRestore: boolean
  onOpen: () => void
  onToggleStar: () => void
  onArchive: () => void
  onRestore: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } }}
      className={cn(
        'group relative cursor-pointer border-b border-border/40 px-3 py-2.5 outline-none transition-colors',
        'focus-visible:bg-muted/40',
        active ? 'bg-primary/[0.07]' : 'hover:bg-muted/40',
      )}
    >
      {active && <span className="absolute inset-y-1 left-0 w-[3px] rounded-r-full bg-primary" aria-hidden="true" />}

      <div className="flex items-start gap-2.5">
        <ConversationAvatar avatar={convo.avatar} type={convo.type} />

        <div className="min-w-0 flex-1">
          {/* Line 1 — name + marks · time (hover: actions) */}
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                'flex min-w-0 items-center gap-1 truncate text-[13px]',
                convo.unread > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground/85',
              )}
            >
              <span className="truncate">{convo.name}</span>
              {convo.urgent && (
                <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" aria-label="Urgent" />
              )}
              {convo.starred && (
                <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" aria-label="Starred" />
              )}
            </p>

            <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/80 group-hover:hidden">
              {formatListTime(convo.lastTimestamp)}
            </span>

            {/* Hover actions (desktop) */}
            <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
              <button
                onClick={(e) => { e.stopPropagation(); onToggleStar() }}
                aria-label={convo.starred ? 'Unstar' : 'Star'}
                title={convo.starred ? 'Unstar' : 'Star'}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-amber-500"
              >
                <Star className={cn('h-3 w-3', convo.starred && 'fill-amber-400 text-amber-400')} />
              </button>
              {showRestore ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onRestore() }}
                  aria-label="Restore to Inbox"
                  title="Restore to Inbox"
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-emerald-600"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onArchive() }}
                  aria-label="Archive"
                  title="Archive"
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-rose-500"
                >
                  <Archive className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Line 2 — preview · unread */}
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <p
              className={cn(
                'truncate text-[11.5px] leading-snug',
                convo.unread > 0 ? 'text-foreground/75' : 'text-muted-foreground',
              )}
            >
              {convo.lastMessage}
            </p>
            {convo.unread > 0 && (
              <span
                title={`${convo.unread} unread`}
                className="inline-flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[9px] font-bold tabular-nums text-primary-foreground"
              >
                {convo.unread > 9 ? '9+' : convo.unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────

function EmptyState({
  folder, searching, onCompose,
}: {
  folder: string
  searching: boolean
  onCompose: () => void
}) {
  let icon = <Search className="h-7 w-7" />
  let title = 'No conversations found'
  let hint = 'Try a different search term.'
  if (!searching) {
    switch (folder) {
      case 'starred':
        icon = <Star className="h-7 w-7" />
        title = 'No starred conversations'
        hint = 'Star a conversation to keep it here.'
        break
      case 'sent':
        title = 'Nothing sent yet'
        hint = 'Messages you send will appear here.'
        break
      case 'archive':
        icon = <Archive className="h-7 w-7" />
        title = 'Archive is empty'
        hint = 'Archived conversations stay here and can be restored anytime.'
        break
      case 'inbox':
      default:
        icon = <Search className="h-7 w-7" />
        title = searching ? 'No conversations found' : 'Inbox is clear'
        hint = searching ? 'Try a different search term.' : 'New conversations will appear here.'
        break
    }
  }

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/50">
        {icon}
      </div>
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground/70">{hint}</p>
      {folder === 'inbox' && !searching && (
        <button
          onClick={onCompose}
          className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <PenSquare className="h-3.5 w-3.5" /> Compose
        </button>
      )}
    </div>
  )
}
