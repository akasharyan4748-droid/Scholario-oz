'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone, Star, Circle, CheckCheck, Check, Paperclip, Sparkles, Send,
} from 'lucide-react'
import { GradientAvatar } from '@/components/shared/ui'
import { parentConversations, type ParentMessage, quickReplyTemplates } from '@/lib/mock/parent-connect'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { categoryConfig } from './data'

type Conversation = (typeof parentConversations)[number]

interface ThreadViewProps {
  convo: Conversation
  thread: ParentMessage[]
  draft: string
  setDraft: (s: string) => void
  onSend: (text?: string) => void
  showQuickReply: boolean
  setShowQuickReply: React.Dispatch<React.SetStateAction<boolean>>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}

export function ThreadView({
  convo, thread, draft, setDraft, onSend, showQuickReply, setShowQuickReply, messagesEndRef,
}: ThreadViewProps) {
  return (
    <div className="flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border p-3 bg-card/30">
        <GradientAvatar name={convo.parentName} initials={convo.avatar} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">{convo.parentName}</p>
            {convo.online && <span className="flex items-center gap-1 text-[10px] text-emerald-600"><Circle className="h-2 w-2 fill-emerald-500" /> Online</span>}
          </div>
          <p className="text-[11px] text-muted-foreground truncate">Parent of {convo.studentName} (Roll #{convo.rollNo}) · {convo.relationship}</p>
        </div>
        <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-medium', categoryConfig[convo.category].color)}>
          {categoryConfig[convo.category].label}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => toast.info(`Calling ${convo.parentName}`)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <Phone className="h-4 w-4" />
          </button>
          <button onClick={() => toast.info('Starred')} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <Star className="h-4 w-4" />
          </button>
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
                  ? 'bg-gradient-to-br from-amber-600 to-orange-600 text-white rounded-br-md shadow-md shadow-amber-500/20'
                  : 'bg-card border border-border rounded-bl-md'
              )}>
                <p className="text-sm leading-relaxed">{m.text}</p>
                <div className={cn('flex items-center gap-1 mt-1', m.sender === 'me' ? 'justify-end text-amber-50' : 'text-muted-foreground')}>
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
        {/* Quick replies */}
        <AnimatePresence>
          {showQuickReply && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 overflow-hidden"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" /> Quick Replies
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickReplyTemplates.map((qr) => (
                  <button
                    key={qr.id}
                    onClick={() => { onSend(qr.text); setShowQuickReply(false) }}
                    className="rounded-full border border-border bg-card/50 px-2.5 py-1 text-[11px] font-medium hover:bg-accent transition-colors"
                  >
                    {qr.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          <button onClick={() => toast.info('Attach file')} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <Paperclip className="h-4 w-4" />
          </button>
          <div className="flex-1 rounded-xl border border-border bg-card/60 px-3 py-2 focus-within:border-primary/50 transition-colors">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
              placeholder={`Message to ${convo.parentName}…`}
              rows={1}
              className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/70 max-h-24"
            />
          </div>
          <button
            onClick={() => setShowQuickReply((s) => !s)}
            className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors', showQuickReply ? 'bg-amber-500/15 text-amber-600' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}
            title="Quick replies"
          >
            <Sparkles className="h-4 w-4" />
          </button>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onSend()}
            disabled={!draft.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
        <div className="flex items-center gap-3 mt-2 px-1">
          <span className="text-[10px] text-muted-foreground">Press Enter to send · Shift+Enter for new line</span>
          <button onClick={() => setShowQuickReply((s) => !s)} className="ml-auto text-[10px] text-primary font-medium hover:underline">
            Quick replies
          </button>
        </div>
      </div>
    </div>
  )
}
