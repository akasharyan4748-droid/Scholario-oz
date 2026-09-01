'use client'

import { useState, useRef, useEffect } from 'react'
import {
  MessageSquare, Send, Circle, CheckCheck, Zap,
} from 'lucide-react'
import { GlassCard, SectionHeading } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartCard, BarTrend, Donut } from '@/components/shared/charts'
import { parentConversations, parentThreads, parentConnectStats, type ParentMessage } from '@/lib/mock/parent-connect'
import { toast } from 'sonner'
import { autoReplies } from './data'
import { ConversationList } from './conversation-list'
import { ThreadView } from './thread-view'

export function ParentConnectModule() {
  const [activeConvo, setActiveConvo] = useState(parentConversations[0].id)
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [showQuickReply, setShowQuickReply] = useState(false)
  const [messages, setMessages] = useState<Record<string, ParentMessage[]>>(parentThreads)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const convo = parentConversations.find((c) => c.id === activeConvo)!
  const thread = messages[activeConvo] ?? [
    { id: 'X1', sender: 'parent', text: convo.lastMessage, time: convo.lastTime },
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread.length, activeConvo])

  const handleSend = (text?: string) => {
    const msgText = text ?? draft
    if (!msgText.trim()) return
    const newMsg: ParentMessage = {
      id: `PM${Date.now()}`,
      sender: 'me',
      text: msgText,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      status: 'sent',
    }
    setMessages((prev) => ({ ...prev, [activeConvo]: [...(prev[activeConvo] ?? []), newMsg] }))
    setDraft('')
    toast.success('Message sent', { description: `To ${convo.parentName}` })

    // Simulate delivered → read
    setTimeout(() => {
      setMessages((prev) => ({ ...prev, [activeConvo]: (prev[activeConvo] ?? []).map((m) => (m.id === newMsg.id ? { ...m, status: 'delivered' } : m)) }))
    }, 800)
    setTimeout(() => {
      setMessages((prev) => ({ ...prev, [activeConvo]: (prev[activeConvo] ?? []).map((m) => (m.id === newMsg.id ? { ...m, status: 'read' } : m)) }))
    }, 2200)

    // Auto-reply
    setTimeout(() => {
      const reply: ParentMessage = {
        id: `PM${Date.now() + 1}`,
        sender: 'parent',
        text: autoReplies[Math.floor(Math.random() * autoReplies.length)],
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      }
      setMessages((prev) => ({ ...prev, [activeConvo]: [...(prev[activeConvo] ?? []), reply] }))
    }, 3800)
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Parent Connect"
        subtitle="Direct messaging with parents of Class 2-A students"
        icon={<MessageSquare className="h-5 w-5" />}
        action={
          <button
            onClick={() => toast.success('Broadcast', { description: 'Message all parents' })}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-amber-500/20"
          >
            <Zap className="h-3.5 w-3.5" /> Broadcast
          </button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Active Chats" value={parentConnectStats.activeChats} icon={<MessageSquare className="h-5 w-5" />} accent="amber" trendLabel={`${parentConnectStats.totalParents} parents`} delay={0} />
        <KpiCard label="Unread" value={parentConnectStats.unreadMessages} icon={<Circle className="h-5 w-5" />} accent="rose" trendLabel="needs reply" delay={0.05} />
        <KpiCard label="Response Rate" value={parentConnectStats.responseRate} suffix="%" icon={<CheckCheck className="h-5 w-5" />} accent="emerald" trend={4} trendLabel={`avg ${parentConnectStats.avgResponseTime}`} delay={0.1} />
        <KpiCard label="Messages Today" value={parentConnectStats.messagesToday} icon={<Send className="h-5 w-5" />} accent="violet" trend={12} trendLabel="vs yesterday" delay={0.15} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <ChartCard title="Weekly Activity" subtitle="Messages per day" className="lg:col-span-2">
          <BarTrend data={parentConnectStats.weeklyActivity} xKey="day" yKey="count" color="oklch(0.65 0.16 75)" height={220} />
        </ChartCard>
        <ChartCard title="By Category" subtitle="Conversation topics">
          <Donut data={parentConnectStats.categoryBreakdown} centerValue={`${parentConnectStats.satisfactionRate}%`} centerLabel="satisfied" height={220} />
        </ChartCard>
      </div>

      {/* Messaging interface */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="grid lg:grid-cols-[340px_1fr] h-[600px]">
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
            showQuickReply={showQuickReply}
            setShowQuickReply={setShowQuickReply}
            messagesEndRef={messagesEndRef}
          />
        </div>
      </GlassCard>
    </div>
  )
}
