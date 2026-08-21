'use client'

/**
 * FoldersSidebar — folder navigation + label filters.
 *
 * Folders: Inbox · Starred · Sent · Drafts · Archive (counts from real store)
 * Labels: Staff · Parents · Groups · Urgent (functional filters)
 *
 * NO Smart Replies / AI gimmicks.
 */

import { Inbox as InboxIcon, Star, Send, FileText, Archive, Users, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMessagingStore, type Folder, type Label } from '@/lib/store/messaging-store'

export function FoldersSidebar() {
  const activeFolder = useMessagingStore((s) => s.activeFolder)
  const setActiveFolder = useMessagingStore((s) => s.setActiveFolder)
  const activeLabel = useMessagingStore((s) => s.activeLabel)
  const setActiveLabel = useMessagingStore((s) => s.setActiveLabel)
  const conversations = useMessagingStore((s) => s.conversations)
  const drafts = useMessagingStore((s) => s.drafts)
  const messages = useMessagingStore((s) => s.messages)

  // Real counts from store
  const inboxCount = conversations.filter((c) => !c.archived && c.unread > 0).length
  const starredCount = conversations.filter((c) => c.starred && !c.archived).length
  const sentCount = conversations.filter((c) => {
    const msgs = messages[c.id] ?? []
    return msgs.length > 0 && msgs[msgs.length - 1].sender === 'me' && !c.archived
  }).length
  const draftCount = drafts.length
  const archiveCount = conversations.filter((c) => c.archived).length

  // Label counts
  const staffCount = conversations.filter((c) => c.type === 'staff' && !c.archived).length
  const parentCount = conversations.filter((c) => c.type === 'parent' && !c.archived).length
  const groupCount = conversations.filter((c) => c.type === 'group' && !c.archived).length
  const urgentCount = conversations.filter((c) => c.urgent && !c.archived).length

  const folders: Array<{ id: Folder; label: string; icon: React.ReactNode; count: number }> = [
    { id: 'inbox', label: 'Inbox', icon: <InboxIcon className="h-4 w-4" />, count: inboxCount },
    { id: 'starred', label: 'Starred', icon: <Star className="h-4 w-4" />, count: starredCount },
    { id: 'sent', label: 'Sent', icon: <Send className="h-4 w-4" />, count: sentCount },
    { id: 'drafts', label: 'Drafts', icon: <FileText className="h-4 w-4" />, count: draftCount },
    { id: 'archive', label: 'Archive', icon: <Archive className="h-4 w-4" />, count: archiveCount },
  ]

  const labels: Array<{ id: Label; label: string; color: string; count: number }> = [
    { id: 'Staff', label: 'Staff', color: 'bg-emerald-500', count: staffCount },
    { id: 'Parents', label: 'Parents', color: 'bg-amber-500', count: parentCount },
    { id: 'Groups', label: 'Groups', color: 'bg-violet-500', count: groupCount },
    { id: 'Urgent', label: 'Urgent', color: 'bg-rose-500', count: urgentCount },
  ]

  return (
    <div className="hidden lg:flex flex-col border-r border-border bg-card/30 p-3 gap-0.5">
      <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Folders</p>
      {folders.map((f) => (
        <button
          key={f.id}
          onClick={() => setActiveFolder(f.id)}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
            activeFolder === f.id && !activeLabel ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          {f.icon}
          <span className="flex-1 text-left">{f.label}</span>
          {f.count > 0 && (
            <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
              activeFolder === f.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
              {f.count}
            </span>
          )}
        </button>
      ))}

      <p className="px-2 py-1.5 mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Labels</p>
      {labels.map((l) => (
        <button
          key={l.id}
          onClick={() => setActiveLabel(activeLabel === l.id ? null : l.id)}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
            activeLabel === l.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          <span className={cn('h-2 w-2 rounded-full', l.color)} />
          <span className="flex-1 text-left">{l.label}</span>
          {l.count > 0 && (
            <span className="text-[10px] font-medium tabular-nums text-muted-foreground">{l.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}
