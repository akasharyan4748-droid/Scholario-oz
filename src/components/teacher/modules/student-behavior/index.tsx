'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Award, MessageSquare, Plus, Users } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { behaviorRecords, behaviorSummary, type BehaviorRecord } from '@/lib/mock/behavior'
import { cn } from '@/lib/utils'
import { type Tab } from './data'
import { BehaviorKpis } from './kpi-cards'
import { BehaviorCharts } from './charts-row'
import { RecordsTab } from './records-tab'
import { LeaderboardTab } from './leaderboard-tab'
import { NewRecordModal } from './new-record-modal'

export function StudentBehaviorModule() {
  const [tab, setTab] = useState<Tab>('records')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'positive' | 'concern' | 'incident'>('all')
  const [showNew, setShowNew] = useState(false)
  const [records] = useState<BehaviorRecord[]>(behaviorRecords)

  const filtered = records.filter((r) => {
    const matchSearch = r.studentName.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || r.type === filterType
    return matchSearch && matchType
  })

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Student Behavior"
        subtitle="Track conduct, record incidents & celebrate positive behavior"
        icon={<Users className="h-5 w-5" />}
        action={
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-amber-500/20"
          >
            <Plus className="h-3.5 w-3.5" /> Record Behavior
          </button>
        }
      />

      {/* KPI cards */}
      <BehaviorKpis />

      {/* Charts */}
      <BehaviorCharts />

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'records' as Tab, label: 'Behavior Records', icon: <MessageSquare className="h-3.5 w-3.5" />, count: records.length },
          { id: 'leaderboard' as Tab, label: 'Conduct Leaderboard', icon: <Award className="h-3.5 w-3.5" />, count: behaviorSummary.length },
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
        {tab === 'records' && (
          <RecordsTab
            search={search}
            onSearchChange={setSearch}
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            filtered={filtered}
          />
        )}

        {tab === 'leaderboard' && <LeaderboardTab />}
      </AnimatePresence>

      {/* New behavior record modal */}
      <AnimatePresence>
        {showNew && <NewRecordModal onClose={() => setShowNew(false)} />}
      </AnimatePresence>
    </div>
  )
}
