'use client'

import { Sparkles, Inbox as InboxIcon, Star, Send, FileText, Archive } from 'lucide-react'
import { cn } from '@/lib/utils'
import { messageStats } from '@/lib/mock/messaging'

export function FoldersSidebar({
  activeFolder, setActiveFolder,
}: {
  activeFolder: string
  setActiveFolder: (f: string) => void
}) {
  return (
    <div className="hidden lg:flex flex-col border-r border-border bg-card/30 p-3 gap-1">
      <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Folders</p>
      {[
        { id: 'inbox', label: 'Inbox', icon: <InboxIcon className="h-4 w-4" />, count: messageStats.unread },
        { id: 'starred', label: 'Starred', icon: <Star className="h-4 w-4" />, count: messageStats.starred },
        { id: 'sent', label: 'Sent', icon: <Send className="h-4 w-4" />, count: 0 },
        { id: 'drafts', label: 'Drafts', icon: <FileText className="h-4 w-4" />, count: 3 },
        { id: 'archive', label: 'Archive', icon: <Archive className="h-4 w-4" />, count: 0 },
      ].map((f) => (
        <button
          key={f.id}
          onClick={() => setActiveFolder(f.id)}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
            activeFolder === f.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          {f.icon}
          <span className="flex-1 text-left">{f.label}</span>
          {f.count > 0 && (
            <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', activeFolder === f.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
              {f.count}
            </span>
          )}
        </button>
      ))}

      <p className="px-2 py-1.5 mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Labels</p>
      {[
        { label: 'Staff', color: 'bg-emerald-500' },
        { label: 'Parents', color: 'bg-amber-500' },
        { label: 'Groups', color: 'bg-violet-500' },
        { label: 'Urgent', color: 'bg-rose-500' },
      ].map((l) => (
        <button key={l.label} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
          <span className={cn('h-2 w-2 rounded-full', l.color)} />
          <span className="flex-1 text-left">{l.label}</span>
        </button>
      ))}

      <div className="mt-auto rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <p className="text-xs font-semibold">Smart Replies</p>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">AI suggests quick responses based on context.</p>
      </div>
    </div>
  )
}
