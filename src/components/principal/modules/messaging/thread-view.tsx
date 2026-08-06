'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone, Video, Star, MoreVertical, Circle, CheckCheck, Check,
  Paperclip, Smile, Send,
} from 'lucide-react'
import { GradientAvatar } from '@/components/shared/ui'
import { type Message } from '@/lib/mock/messaging'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ThreadViewProps {
  convo: {
    id: string
    name: string
    avatar: string
    role: string
    online: boolean
    type: string
  }
  thread: Message[]
  draft: string
  setDraft: (s: string) => void
  onSend: () => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}

export function ThreadView({
  convo, thread, draft, setDraft, onSend, messagesEndRef,
}: ThreadViewProps) {
  return (
    <div className="flex flex-col min-h-0">
      {/* Thread header */}
      <div className="flex items-center gap-3 border-b border-border p-3 bg-card/30">
        <GradientAvatar name={convo.name} initials={convo.avatar} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">{convo.name}</p>
            {convo.online && <span className="flex items-center gap-1 text-[10px] text-emerald-600"><Circle className="h-2 w-2 fill-emerald-500" /> Online</span>}
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{convo.role}</p>
        </div>
        <div className="flex items-center gap-1">
          {[Phone, Video, Star, MoreVertical].map((Icon, idx) => (
            <button
              key={idx}
              onClick={() => toast.info(idx === 0 ? 'Call feature' : idx === 1 ? 'Video call' : idx === 2 ? 'Starred' : 'More options')}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-transparent to-muted/20">
        <div className="flex justify-center">
          <span className="rounded-full bg-muted px-3 py-1 text-[10px] text-muted-foreground">Today</span>
        </div>
        <AnimatePresence initial={false}>
          {thread.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={cn('flex', m.sender === 'me' ? 'justify-end' : 'justify-start')}
            >
              <div className={cn(
                'max-w-[75%] rounded-2xl px-3.5 py-2.5',
                m.sender === 'me'
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-br-md shadow-md shadow-emerald-500/20'
                  : 'bg-card border border-border rounded-bl-md'
              )}>
                <p className="text-sm leading-relaxed">{m.text}</p>
                <div className={cn('flex items-center gap-1 mt-1', m.sender === 'me' ? 'justify-end text-emerald-100' : 'text-muted-foreground')}>
                  <span className="text-[10px]">{m.time}</span>
                  {m.sender === 'me' && m.status && (
                    <span className="text-[10px] flex items-center">
                      {m.status === 'read' ? <CheckCheck className="h-3 w-3 text-sky-200" /> : m.status === 'delivered' ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-border p-3 bg-card/30">
        <div className="flex items-end gap-2">
          <button onClick={() => toast.info('Attach file')} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <Paperclip className="h-4 w-4" />
          </button>
          <div className="flex-1 rounded-xl border border-border bg-card/60 px-3 py-2 focus-within:border-primary/50 transition-colors">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
              placeholder={`Reply to ${convo.name}…`}
              rows={1}
              className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/70 max-h-24"
            />
          </div>
          <button onClick={() => toast.info('Emoji picker')} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <Smile className="h-4 w-4" />
          </button>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onSend}
            disabled={!draft.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
        <div className="flex items-center gap-3 mt-2 px-1">
          <span className="text-[10px] text-muted-foreground">Press Enter to send · Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  )
}
