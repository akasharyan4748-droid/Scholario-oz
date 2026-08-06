'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { MessageCircle, Plus, Share2, Users } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { qaItems, sharedResources, studyGroups, type QAItem } from '@/lib/mock/peer-collab'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { type Tab } from './data'
import { PeerKpis } from './kpi-cards'
import { HeroCard } from './hero-card'
import { GroupsTab } from './groups-tab'
import { QaTab } from './qa-tab'
import { SharesTab } from './shares-tab'
import { ActivityChart } from './activity-chart'
import { NewQuestionModal } from './new-question-modal'

export function PeerCollaborationModule() {
  const [tab, setTab] = useState<Tab>('groups')
  const [showNewQ, setShowNewQ] = useState(false)
  const [questions, setQuestions] = useState<QAItem[]>(qaItems)

  const handlePostQuestion = (newQ: QAItem) => {
    setQuestions((prev) => [newQ, ...prev])
  }

  const upvote = (id: string) => {
    setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, upvotes: q.upvotes + 1 } : q))
    toast.success('Upvoted!', { description: '+1 to your helpfulness score' })
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Peer Collaboration"
        subtitle="Study groups, Q&A forum & resource sharing with classmates"
        icon={<Users className="h-5 w-5" />}
        action={
          <button
            onClick={() => setShowNewQ(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/20"
          >
            <Plus className="h-3.5 w-3.5" /> Ask Question
          </button>
        }
      />

      {/* KPI cards */}
      <PeerKpis />

      {/* Hero helpfulness card */}
      <HeroCard />

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'groups' as Tab, label: 'Study Groups', icon: <Users className="h-3.5 w-3.5" />, count: studyGroups.length },
          { id: 'qa' as Tab, label: 'Q&A Forum', icon: <MessageCircle className="h-3.5 w-3.5" />, count: questions.length },
          { id: 'shares' as Tab, label: 'Shared Resources', icon: <Share2 className="h-3.5 w-3.5" />, count: sharedResources.length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all',
              tab === t.id ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'glass text-muted-foreground hover:text-foreground'
            )}
          >
            {t.icon}
            {t.label}
            <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-bold', tab === t.id ? 'bg-primary-foreground/20' : 'bg-muted')}>{t.count}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'groups' && <GroupsTab />}
        {tab === 'qa' && <QaTab questions={questions} onUpvote={upvote} />}
        {tab === 'shares' && <SharesTab />}
      </AnimatePresence>

      {/* Activity chart */}
      <ActivityChart />

      {/* New question modal */}
      <AnimatePresence>
        {showNewQ && (
          <NewQuestionModal
            onClose={() => setShowNewQ(false)}
            onPost={handlePostQuestion}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
