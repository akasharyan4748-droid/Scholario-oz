'use client'

/**
 * ThreadView — active conversation + reply composer.
 *
 * - Conversation header: avatar, name, role/relationship (NO fake "online" status)
 * - Message bubbles: incoming (white/light) + outgoing (Scholario green)
 * - Reply composer: textarea with Enter→send, Shift+Enter→newline
 * - Single "More" dropdown menu containing Star, Archive, Mark unread, Urgent
 *
 * NO Call/Video buttons (not supported).
 * NO fake typing indicators.
 * NO fake read receipts — just "sent" and "delivered" states.
 */

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Send, Star, Archive, MoreHorizontal, AlertCircle, ArrowLeft,
  Check, CheckCheck, MailX,
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useMessagingStore, formatMessageTime, type Message } from '@/lib/store/messaging-store'
import { toast } from 'sonner'

export function ThreadView({ onBack, onCompose }: { onBack: () => void; onCompose: () => void }) {
  const activeId = useMessagingStore((s) => s.activeConversationId)
  const conversations = useMessagingStore((s) => s.conversations)
  const messages = useMessagingStore((s) => s.messages)
  const sendMessage = useMessagingStore((s) => s.sendMessage)
  const starConversation = useMessagingStore((s) => s.starConversation)
  const archiveConversation = useMessagingStore((s) => s.archiveConversation)
  const markUrgent = useMessagingStore((s) => s.markUrgent)
  const openConversation = useMessagingStore((s) => s.openConversation)
  const saveDraft = useMessagingStore((s) => s.saveDraft)
  const drafts = useMessagingStore((s) => s.drafts)

  const [text, setText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const convo = conversations.find((c) => c.id === activeId)
  const thread = activeId ? (messages[activeId] ?? []) : []
  const existingDraft = drafts.find((d) => d.conversationId === activeId)

  // Load draft text when switching conversations
  useEffect(() => {
    setText(existingDraft?.text ?? '')
  }, [activeId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread.length, activeId])

  // Save draft when leaving (typing debounce)
  useEffect(() => {
    if (!activeId || !text.trim()) return
    const timer = setTimeout(() => saveDraft(activeId, text), 1500)
    return () => clearTimeout(timer)
  }, [text, activeId])

  const handleSend = () => {
    if (!text.trim() || !activeId) return
    sendMessage(activeId, text)
    setText('')
    toast.success('Message sent')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!convo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/10">
        <div className="text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-muted/40 mb-3">
            <Send className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Select a conversation</p>
          <p className="text-[10px] text-muted-foreground/70 mt-1">Or compose a new message</p>
          <button
            onClick={onCompose}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white"
          >
            <Send className="h-3 w-3" /> Compose
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-w-0 flex-1 bg-muted/10">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border bg-card">
        {/* Back button (mobile) */}
        <button onClick={onBack} className="lg:hidden p-1 -ml-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>

        {/* Avatar */}
        <div className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-semibold',
          convo.type === 'staff' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
          convo.type === 'parent' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
          'bg-gradient-to-br from-violet-500 to-purple-600',
        )}>
          {convo.avatar}
        </div>

        {/* Name + role */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold truncate">{convo.name}</p>
            {convo.urgent && <AlertCircle className="h-3 w-3 text-rose-500 shrink-0" />}
          </div>
          <p className="text-[10px] text-muted-foreground truncate">{convo.role}</p>
        </div>

        {/* Actions — single More dropdown (Star + Archive + Mark unread + Urgent) */}
        <div className="flex items-center gap-0.5 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1.5 rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                title="More actions"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => { starConversation(convo.id); toast.success(convo.starred ? 'Unstarred' : 'Starred') }}
              >
                <Star className={cn('h-3.5 w-3.5', convo.starred && 'fill-amber-500 text-amber-500')} />
                {convo.starred ? 'Unstar' : 'Star'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { archiveConversation(convo.id); toast.success('Archived') }}
              >
                <Archive className="h-3.5 w-3.5" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  // Mark unread by setting unread count back
                  const store = useMessagingStore.getState()
                  if (store.conversations.find((c) => c.id === convo.id)) {
                    useMessagingStore.setState({
                      conversations: store.conversations.map((c) => c.id === convo.id ? { ...c, unread: 1 } : c),
                    })
                  }
                  toast.success('Marked as unread')
                }}
              >
                <MailX className="h-3.5 w-3.5" />
                Mark as unread
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-rose-600 focus:text-rose-600"
                onClick={() => { markUrgent(convo.id); toast.success(convo.urgent ? 'Marked as normal' : 'Marked as urgent') }}
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {convo.urgent ? 'Remove urgent' : 'Mark as urgent'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {thread.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-card p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${convo.name}…`}
            rows={1}
            className="flex-1 min-w-0 text-xs rounded-lg border border-border bg-card px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-24"
            style={{ minHeight: '36px' }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-sm hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Send (Enter)"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[9px] text-muted-foreground/60 mt-1.5 text-center">
          Enter to send · Shift+Enter for new line {existingDraft && '· Draft saved'}
        </p>
      </div>
    </div>
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  const isMe = msg.sender === 'me'
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
    >
      <div className={cn(
        'max-w-[80%] sm:max-w-[70%] rounded-xl px-3 py-2',
        isMe
          ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-br-sm'
          : 'bg-card border border-border text-foreground rounded-bl-sm',
      )}>
        {/* Sender name for group messages */}
        {!isMe && msg.senderName && (
          <p className="text-[9px] font-semibold text-violet-600 dark:text-violet-400 mb-0.5">{msg.senderName}</p>
        )}
        <p className="text-xs whitespace-pre-wrap">{msg.text}</p>
        <div className={cn('flex items-center justify-end gap-1 mt-0.5', isMe ? 'text-white/70' : 'text-muted-foreground')}>
          <span className="text-[9px]">{formatMessageTime(msg.timestamp)}</span>
          {isMe && msg.status === 'sent' && <Check className="h-2.5 w-2.5" />}
          {isMe && msg.status === 'delivered' && <CheckCheck className="h-2.5 w-2.5" />}
        </div>
      </div>
    </motion.div>
  )
}
