'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Award, Star, TrendingUp, Target, MessageSquare, Eye, ClipboardCheck,
  Briefcase,
} from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { selfEvaluation, observations, feedback, reviewStats } from '@/lib/mock/reviews'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { type Tab } from './data'
import { OverviewTab } from './overview-tab'
import { SelfEvalTab } from './self-eval-tab'
import { ObservationsTab } from './observations-tab'
import { FeedbackTab } from './feedback-tab'

export function PerformanceReviewsModule() {
  const [tab, setTab] = useState<Tab>('overview')

  const scorePct = (reviewStats.overallScore / reviewStats.maxScore) * 100
  const avgSelf = (selfEvaluation.reduce((a, b) => a + b.selfRating, 0) / selfEvaluation.length).toFixed(1)
  const avgSupervisor = (selfEvaluation.reduce((a, b) => a + b.supervisorRating, 0) / selfEvaluation.length).toFixed(1)

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Performance Reviews"
        subtitle="Self-evaluation, observations, feedback & professional growth"
        icon={<Award className="h-5 w-5" />}
        action={
          <button
            onClick={() => toast.success('Self-evaluation submitted', { description: 'Your review has been shared with the supervisor' })}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-amber-500/20"
          >
            <ClipboardCheck className="h-3.5 w-3.5" /> Submit Review
          </button>
        }
      />

      {/* Hero score card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-6 sm:p-8 text-white shadow-premium-lg"
      >
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/20 blur-md" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur ring-4 ring-white/30">
                <span className="font-display text-3xl font-extrabold">{reviewStats.grade}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-xs font-bold shadow-lg ring-2 ring-white/40">
                #{reviewStats.percentile}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-amber-50 text-xs font-medium mb-1">
                <TrendingUp className="h-3.5 w-3.5" /> Performance Score · Annual 2024
              </div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight">
                <AnimatedCounter value={reviewStats.overallScore} decimals={1} /> / {reviewStats.maxScore}
              </h2>
              <p className="text-amber-50/90 text-sm mt-0.5">Grade {reviewStats.grade} · Top {100 - reviewStats.percentile}% of faculty</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl bg-white/10 backdrop-blur px-5 py-3 text-center">
              <p className="text-2xl font-bold">{reviewStats.goalsAchieved}/{reviewStats.goalsTotal}</p>
              <p className="text-[11px] text-amber-50">Goals Done</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur px-5 py-3 text-center">
              <p className="text-2xl font-bold">{reviewStats.trainingCompleted}/{reviewStats.trainingTotal}</p>
              <p className="text-[11px] text-amber-50">Trainings</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Overall Score" value={reviewStats.overallScore} decimals={1} suffix={`/ ${reviewStats.maxScore}`} icon={<Star className="h-5 w-5" />} accent="amber" trend={5} trendLabel="vs last cycle" delay={0} />
        <KpiCard label="Goals Achieved" value={reviewStats.goalsAchieved} suffix={`/${reviewStats.goalsTotal}`} icon={<Target className="h-5 w-5" />} accent="emerald" trendLabel={`${Math.round((reviewStats.goalsAchieved / reviewStats.goalsTotal) * 100)}% success`} delay={0.05} />
        <KpiCard label="Observations" value={observations.filter((o) => o.status === 'Completed').length} icon={<Eye className="h-5 w-5" />} accent="violet" trendLabel={`${observations.length} total`} delay={0.1} />
        <KpiCard label="Trainings" value={reviewStats.trainingCompleted} suffix={`/${reviewStats.trainingTotal}`} icon={<Briefcase className="h-5 w-5" />} accent="cyan" trend={2} trendLabel="this year" delay={0.15} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'overview' as Tab, label: 'Overview', icon: <TrendingUp className="h-3.5 w-3.5" /> },
          { id: 'self-eval' as Tab, label: 'Self-Evaluation', icon: <ClipboardCheck className="h-3.5 w-3.5" /> },
          { id: 'observations' as Tab, label: 'Observations', icon: <Eye className="h-3.5 w-3.5" /> },
          { id: 'feedback' as Tab, label: 'Feedback', icon: <MessageSquare className="h-3.5 w-3.5" /> },
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
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'overview' && <OverviewTab scorePct={scorePct} />}
        {tab === 'self-eval' && <SelfEvalTab avgSelf={avgSelf} avgSupervisor={avgSupervisor} />}
        {tab === 'observations' && <ObservationsTab />}
        {tab === 'feedback' && <FeedbackTab />}
      </AnimatePresence>
    </div>
  )
}
