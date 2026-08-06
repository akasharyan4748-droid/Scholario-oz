'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus, Briefcase, Users, Calendar, Clock, Plus,
} from 'lucide-react'
import { SectionHeading, PageTransition } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartCard, AreaTrend, Donut } from '@/components/shared/charts'
import { jobPostings, candidates, interviews, recruitmentStats, hrStats, type Candidate } from '@/lib/mock/recruitment'
import { school } from '@/lib/mock/school'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { type Tab } from './data'
import { PostingsTab } from './postings-tab'
import { CandidatesTab } from './candidates-tab'
import { InterviewsTab } from './interviews-tab'
import { CandidateModal } from './candidate-modal'

export function RecruitmentModule() {
  const [tab, setTab] = useState<Tab>('postings')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)

  return (
    <PageTransition className="space-y-5">
      <SectionHeading
        title="Recruitment & HR"
        subtitle={`${school.name} · Job postings, candidate pipeline & interview management`}
        icon={<UserPlus className="h-5 w-5" />}
        action={
          <button
            onClick={() => toast.success('Job posted', { description: 'New position published to career portal' })}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/20"
          >
            <Plus className="h-3.5 w-3.5" /> Post Job
          </button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Open Positions" value={recruitmentStats.openPositions} icon={<Briefcase className="h-5 w-5" />} accent="emerald" trendLabel={`${jobPostings.filter((j) => j.status === 'Open').length} active`} delay={0} />
        <KpiCard label="Total Applicants" value={recruitmentStats.totalApplicants} icon={<Users className="h-5 w-5" />} accent="violet" trend={18} trendLabel="this month" delay={0.05} />
        <KpiCard label="Interviews This Week" value={recruitmentStats.interviewsThisWeek} icon={<Calendar className="h-5 w-5" />} accent="amber" trendLabel={`${recruitmentStats.offersExtended} offer extended`} delay={0.1} />
        <KpiCard label="Avg Time to Hire" value={18} suffix=" days" icon={<Clock className="h-5 w-5" />} accent="cyan" trend={-12} trendLabel="faster than last qtr" delay={0.15} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <ChartCard title="Applicants Trend" subtitle="Monthly applications" className="lg:col-span-2">
          <AreaTrend data={recruitmentStats.monthlyApplicants} xKey="month" yKey="count" color="oklch(0.55 0.14 162)" height={240} gradientId="recruitGrad" />
        </ChartCard>
        <ChartCard title="Hiring Pipeline" subtitle="Candidate stages">
          <Donut data={recruitmentStats.pipelineStages} centerValue={`${recruitmentStats.totalApplicants}`} centerLabel="applicants" height={240} />
        </ChartCard>
      </div>

      {/* HR stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Employees', value: hrStats.totalEmployees, icon: '👥' },
          { label: 'On Leave', value: hrStats.onLeave, icon: '🌴' },
          { label: 'New Hires', value: hrStats.newHiresThisMonth, icon: '✨' },
          { label: 'Attrition', value: `${hrStats.attritionRate}%`, icon: '📉' },
          { label: 'Avg Tenure', value: hrStats.avgTenure, icon: '⏱️' },
          { label: 'Satisfaction', value: `${hrStats.satisfactionScore}/5`, icon: '😊' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass rounded-xl p-3 text-center">
            <span className="text-xl block mb-1">{s.icon}</span>
            <p className="font-display text-lg font-bold">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'postings' as Tab, label: 'Job Postings', icon: <Briefcase className="h-3.5 w-3.5" />, count: jobPostings.length },
          { id: 'candidates' as Tab, label: 'Candidates', icon: <Users className="h-3.5 w-3.5" />, count: candidates.length },
          { id: 'interviews' as Tab, label: 'Interviews', icon: <Calendar className="h-3.5 w-3.5" />, count: interviews.length },
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
        {tab === 'postings' && <PostingsTab />}
        {tab === 'candidates' && <CandidatesTab onSelect={setSelectedCandidate} />}
        {tab === 'interviews' && <InterviewsTab />}
      </AnimatePresence>

      {/* Candidate detail modal */}
      <AnimatePresence>
        {selectedCandidate && <CandidateModal selectedCandidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />}
      </AnimatePresence>
    </PageTransition>
  )
}
