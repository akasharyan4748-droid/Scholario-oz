'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
  Heart, Users, Calendar, Plus, TrendingUp, Sparkles, MessageSquare,
} from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartCard, AreaTrend, Donut } from '@/components/shared/charts'
import { mentorGroups, mentees, sessionLogs, mentoringStats, type Mentee } from '@/lib/mock/mentoring'
import { cn } from '@/lib/utils'
import { type Tab } from './data'
import { MenteesTab } from './mentees-tab'
import { GroupsTab } from './groups-tab'
import { SessionsTab } from './sessions-tab'
import { MenteeDetailDialog } from './mentee-detail-dialog'
import { LogSessionDialog } from './log-session-dialog'

// Teacher Student Mentoring module entry point.
//
// `teacher-panel/module-router.tsx` imports the named `MentoringModule`:
//   import { MentoringModule } from '../modules/mentoring'
//
// This index owns the page-level state (active tab, selected mentee, log
// session dialog open state) and composes: KPI cards, charts, the three tab
// views (MenteesTab, GroupsTab, SessionsTab), and two modals (MenteeDetail
// Dialog + LogSessionDialog).
export function MentoringModule() {
  const [tab, setTab] = useState<Tab>('mentees')
  const [selectedMentee, setSelectedMentee] = useState<Mentee | null>(null)
  const [showLogSession, setShowLogSession] = useState(false)

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Student Mentoring"
        subtitle="Guide, support & track your mentee's growth journey"
        icon={<Heart className="h-5 w-5" />}
        action={
          <button
            onClick={() => setShowLogSession(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-amber-500/20"
          >
            <Plus className="h-3.5 w-3.5" /> Log Session
          </button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Active Mentees" value={mentoringStats.totalMentees} icon={<Users className="h-5 w-5" />} accent="amber" trendLabel="Class 2-A" delay={0} />
        <KpiCard label="Sessions This Month" value={mentoringStats.sessionsThisMonth} icon={<Calendar className="h-5 w-5" />} accent="emerald" trend={9} trendLabel="vs last month" delay={0.05} />
        <KpiCard label="Avg Progress" value={mentoringStats.avgProgress} suffix="%" icon={<TrendingUp className="h-5 w-5" />} accent="violet" trend={6} trendLabel="mentee growth" delay={0.1} />
        <KpiCard label="Needs Support" value={mentoringStats.needsSupportCount} icon={<Heart className="h-5 w-5" />} accent="rose" trendLabel="priority attention" delay={0.15} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <ChartCard title="Sessions Trend" subtitle="Monthly mentoring sessions" className="lg:col-span-2">
          <AreaTrend data={mentoringStats.monthlySessions} xKey="month" yKey="count" color="oklch(0.65 0.16 75)" height={240} gradientId="mentorGrad" />
        </ChartCard>
        <ChartCard title="Mentee Wellbeing" subtitle="Current status distribution">
          <Donut data={mentoringStats.progressDistribution} centerValue={`${mentoringStats.totalMentees}`} centerLabel="mentees" height={240} />
        </ChartCard>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'mentees' as Tab, label: 'My Mentees', icon: <Users className="h-3.5 w-3.5" />, count: mentees.length },
          { id: 'groups' as Tab, label: 'Mentor Groups', icon: <Sparkles className="h-3.5 w-3.5" />, count: mentorGroups.length },
          { id: 'sessions' as Tab, label: 'Session Logs', icon: <MessageSquare className="h-3.5 w-3.5" />, count: sessionLogs.length },
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
        {tab === 'mentees' && <MenteesTab onSelect={setSelectedMentee} />}
        {tab === 'groups' && <GroupsTab />}
        {tab === 'sessions' && <SessionsTab />}
      </AnimatePresence>

      <MenteeDetailDialog mentee={selectedMentee} onClose={() => setSelectedMentee(null)} />
      <LogSessionDialog open={showLogSession} onClose={() => setShowLogSession(false)} />
    </div>
  )
}
