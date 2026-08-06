'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Star, Mail, CheckCheck } from 'lucide-react'
import { GlassCard, SectionHeading } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { conversations, messageThread, messageStats, type Message } from '@/lib/mock/messaging'
import { toast } from 'sonner'
import { autoReplies } from './data'
import { FoldersSidebar } from './folders-sidebar'
import { ConversationList } from './conversation-list'
import { ThreadView } from './thread-view'

export function MessagingModule() {
  const [activeConvo, setActiveConvo] = useState(conversations[0].id)
  const [activeFolder, setActiveFolder] = useState('inbox')
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [localMessages, setLocalMessages] = useState<Record<string, Message[]>>(messageThread)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const convo = conversations.find((c) => c.id === activeConvo)!
  const thread = localMessages[activeConvo] ?? [
    { id: 'X1', sender: 'them', text: convo.lastMessage, time: convo.lastTime, },
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread.length, activeConvo])

  const handleSend = () => {
    if (!draft.trim()) return
    const newMsg: Message = {
      id: `M${Date.now()}`,
      sender: 'me',
      text: draft,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      status: 'sent',
    }
    setLocalMessages((prev) => ({
      ...prev,
      [activeConvo]: [...(prev[activeConvo] ?? []), newMsg],
    }))
    setDraft('')
    toast.success('Message sent', { description: `To ${convo.name}` })

    // Simulate delivered → read + auto-reply for staff
    setTimeout(() => {
      setLocalMessages((prev) => ({
        ...prev,
        [activeConvo]: (prev[activeConvo] ?? []).map((m) => (m.id === newMsg.id ? { ...m, status: 'delivered' } : m)),
      }))
    }, 800)
    setTimeout(() => {
      setLocalMessages((prev) => ({
        ...prev,
        [activeConvo]: (prev[activeConvo] ?? []).map((m) => (m.id === newMsg.id ? { ...m, status: 'read' } : m)),
      }))
    }, 2000)

    if (convo.type === 'staff' || convo.type === 'parent') {
      setTimeout(() => {
        const reply: Message = {
          id: `M${Date.now() + 1}`,
          sender: 'them',
          text: autoReplies[Math.floor(Math.random() * autoReplies.length)],
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        }
        setLocalMessages((prev) => ({
          ...prev,
          [activeConvo]: [...(prev[activeConvo] ?? []), reply],
        }))
      }, 3500)
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Messages & Inbox"
        subtitle="Internal staff and parent communication"
        icon={<MessageSquare className="h-5 w-5" />}
        action={
          <button
            onClick={() => toast.success('New message', { description: 'Compose dialog would open here' })}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/20"
          >
            <Send className="h-3.5 w-3.5" /> Compose
          </button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Unread Messages" value={messageStats.unread} icon={<Mail className="h-5 w-5" />} accent="emerald" trendLabel="8 new today" delay={0} />
        <KpiCard label="Sent Today" value={messageStats.sentToday} icon={<Send className="h-5 w-5" />} accent="cyan" trend={12} trendLabel="vs yesterday" delay={0.05} />
        <KpiCard label="Response Rate" value={messageStats.responseRate} suffix="%" icon={<CheckCheck className="h-5 w-5" />} accent="amber" trend={2.4} trendLabel="avg 12 min" delay={0.1} />
        <KpiCard label="Starred" value={messageStats.starred} icon={<Star className="h-5 w-5" />} accent="violet" trendLabel="pinned conversations" delay={0.15} />
      </div>

      {/* Mail client */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="grid lg:grid-cols-[200px_320px_1fr] h-[640px]">
          <FoldersSidebar activeFolder={activeFolder} setActiveFolder={setActiveFolder} />
          <ConversationList
            activeConvo={activeConvo}
            setActiveConvo={setActiveConvo}
            search={search}
            setSearch={setSearch}
          />
          <ThreadView
            convo={convo}
            thread={thread}
            draft={draft}
            setDraft={setDraft}
            onSend={handleSend}
            messagesEndRef={messagesEndRef}
          />
        </div>
      </GlassCard>
    </div>
  )
}
