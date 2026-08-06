'use client'

import { motion } from 'framer-motion'
import { Search, Pin } from 'lucide-react'
import { GradientAvatar } from '@/components/shared/ui'
import { conversations } from '@/lib/mock/messaging'
import { cn } from '@/lib/utils'

export function ConversationList({
  activeConvo, setActiveConvo, search, setSearch,
}: {
  activeConvo: string
  setActiveConvo: (id: string) => void
  search: string
  setSearch: (s: string) => void
}) {
  const filteredConvos = conversations.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.lastMessage.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col border-r border-border min-h-0">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="w-full rounded-lg border border-border bg-card/50 pl-8 pr-3 py-1.5 text-xs outline-none focus:border-primary/50"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredConvos.map((c, i) => (
          <motion.button
            key={c.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => setActiveConvo(c.id)}
            className={cn(
              'flex w-full items-start gap-2.5 border-b border-border/50 p-3 text-left transition-colors',
              activeConvo === c.id ? 'bg-primary/8' : 'hover:bg-accent/40'
            )}
          >
            <div className="relative shrink-0">
              <GradientAvatar name={c.name} initials={c.avatar} size="md" />
              {c.online && (
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {c.pinned && <Pin className="h-3 w-3 text-muted-foreground shrink-0" />}
                <p className="text-sm font-medium truncate">{c.name}</p>
                {c.unread > 0 && <span className="ml-auto shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">{c.unread}</span>}
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{c.role}</p>
              <p className="text-xs text-muted-foreground/90 truncate mt-0.5">{c.lastMessage}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{c.lastTime}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
