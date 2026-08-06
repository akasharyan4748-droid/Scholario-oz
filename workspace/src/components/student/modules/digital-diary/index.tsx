'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { BookHeart, Plus, Calendar, Flame, Smile, PenLine } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { diaryEntries, goals, diaryStats, type DiaryEntry } from '@/lib/mock/diary'
import { toast } from 'sonner'
import { TabBar } from './shared'
import { EntriesTab } from './entries-tab'
import { MoodTab } from './mood-tab'
import { GoalsTab } from './goals-tab'
import { ReflectionsTab } from './reflections-tab'
import { NewEntryModal } from './new-entry-modal'
import type { Tab } from './data'

// Main Digital Diary module entry — wires up state, KPIs, tab bar, tab content, and the new entry modal.
export function DigitalDiaryModule() {
  const [tab, setTab] = useState<Tab>('entries')
  const [showNewEntry, setShowNewEntry] = useState(false)
  const [selectedMood, setSelectedMood] = useState<DiaryEntry['mood']>('good')
  const [entryTitle, setEntryTitle] = useState('')
  const [entryContent, setEntryContent] = useState('')
  const [entries, setEntries] = useState<DiaryEntry[]>(diaryEntries)
  const [goalProgress, setGoalProgress] = useState<Record<string, number>>(
    Object.fromEntries(goals.map((g) => [g.id, g.progress]))
  )

  const handleSaveEntry = () => {
    if (!entryTitle.trim() || !entryContent.trim()) {
      toast.error('Please add a title and content')
      return
    }
    const newEntry: DiaryEntry = {
      id: `DE${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title: entryTitle,
      mood: selectedMood,
      content: entryContent,
      tags: ['new'],
    }
    setEntries((prev) => [newEntry, ...prev])
    setEntryTitle('')
    setEntryContent('')
    setSelectedMood('good')
    setShowNewEntry(false)
    toast.success('Diary entry saved! 📔', { description: '+20 XP for journaling today' })
  }

  const updateGoal = (id: string, delta: number) => {
    setGoalProgress((prev) => {
      const next = Math.max(0, Math.min(100, (prev[id] ?? 0) + delta))
      if (next === 100 && (prev[id] ?? 0) < 100) {
        toast.success('Goal completed! 🎯', { description: '+50 XP earned' })
      }
      return { ...prev, [id]: next }
    })
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        title="My Digital Diary"
        subtitle="Journal your school days, track moods & reflect on your journey"
        icon={<BookHeart className="h-5 w-5" />}
        action={
          <button
            onClick={() => setShowNewEntry(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/20"
          >
            <Plus className="h-3.5 w-3.5" /> New Entry
          </button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Total Entries" value={entries.length} icon={<PenLine className="h-5 w-5" />} accent="violet" trendLabel="this school year" delay={0} />
        <KpiCard label="Writing Streak" value={diaryStats.currentStreak} suffix=" days 🔥" icon={<Flame className="h-5 w-5" />} accent="rose" trendLabel={`best: ${diaryStats.longestStreak} days`} delay={0.05} />
        <KpiCard label="Avg Mood" value={diaryStats.avgMoodScore} decimals={1} suffix="/5" icon={<Smile className="h-5 w-5" />} accent="amber" trendLabel="mostly happy!" delay={0.1} />
        <KpiCard label="This Month" value={diaryStats.entriesThisMonth} icon={<Calendar className="h-5 w-5" />} accent="emerald" trend={12} trendLabel="vs last month" delay={0.15} />
      </div>

      <TabBar tab={tab} onChange={setTab} />

      <AnimatePresence mode="wait">
        {tab === 'entries' && <EntriesTab entries={entries} />}
        {tab === 'mood' && <MoodTab />}
        {tab === 'goals' && <GoalsTab goalProgress={goalProgress} onUpdate={updateGoal} />}
        {tab === 'reflections' && <ReflectionsTab />}
      </AnimatePresence>

      <NewEntryModal
        open={showNewEntry}
        onClose={() => setShowNewEntry(false)}
        onSave={handleSaveEntry}
        selectedMood={selectedMood}
        onSelectMood={setSelectedMood}
        title={entryTitle}
        onTitleChange={setEntryTitle}
        content={entryContent}
        onContentChange={setEntryContent}
      />
    </div>
  )
}
