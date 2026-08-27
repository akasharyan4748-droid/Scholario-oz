'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Award, Star, TrendingUp, Target, Share2, Palette,
  Crown,
} from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { portfolioStats, type PortfolioAchievement } from '@/lib/mock/portfolio'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { type Tab } from './data'
import { ShowcaseTab } from './showcase-tab'
import { SkillsTab } from './skills-tab'
import { JourneyTab } from './journey-tab'
import { ActivitiesTab } from './activities-tab'
import { AchievementModal } from './achievement-modal'

export function PortfolioModule() {
  const [tab, setTab] = useState<Tab>('showcase')
  const [selected, setSelected] = useState<PortfolioAchievement | null>(null)

  return (
    <div className="space-y-5">
      <SectionHeading
        title="My Portfolio"
        subtitle="Your achievements, skills & growth journey — all in one place"
        icon={<Trophy className="h-5 w-5" />}
        action={
          <button
            onClick={() => toast.success('Portfolio shared', { description: 'Shareable link copied to clipboard' })}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/20"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
        }
      />

      {/* Hero portfolio card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 sm:p-8 text-white shadow-premium-lg"
      >
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/20 blur-md animate-pulse" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur text-2xl font-display font-bold ring-4 ring-white/30">
                AS
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold shadow-lg ring-2 ring-white/40">
                #{portfolioStats.rankInClass}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-violet-100 text-xs font-medium mb-1">
                <Crown className="h-3.5 w-3.5 text-amber-300" />
                Grade {portfolioStats.overallGrade} · Rank #{portfolioStats.rankInClass} of {portfolioStats.totalStudents}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">Aarav Sharma</h2>
              <p className="text-violet-100/90 text-sm mt-0.5">Class 2-A · Demo School of Scholario</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="rounded-md bg-white/15 backdrop-blur px-2 py-0.5 text-[10px] font-medium">🌟 {portfolioStats.totalAchievements} Achievements</span>
                <span className="rounded-md bg-white/15 backdrop-blur px-2 py-0.5 text-[10px] font-medium">🏅 {portfolioStats.badges} Badges</span>
                <span className="rounded-md bg-white/15 backdrop-blur px-2 py-0.5 text-[10px] font-medium">🎨 {portfolioStats.extracurriculars} Activities</span>
              </div>
            </div>
          </div>
          {/* Portfolio score gauge */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                <motion.circle
                  cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - portfolioStats.portfolioScore / portfolioStats.maxScore) }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl font-bold">{portfolioStats.portfolioScore}</span>
                <span className="text-[9px] text-violet-100">/ {portfolioStats.maxScore}</span>
              </div>
            </div>
            <p className="text-[10px] text-violet-100/80 mt-1">Portfolio Score</p>
          </div>
        </div>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Achievements" value={portfolioStats.totalAchievements} icon={<Trophy className="h-5 w-5" />} accent="amber" trend={25} trendLabel="this year" delay={0} />
        <KpiCard label="Certificates" value={portfolioStats.certificates} icon={<Award className="h-5 w-5" />} accent="violet" trendLabel="earned" delay={0.05} />
        <KpiCard label="Skills Avg" value={portfolioStats.skillsAvg} suffix="/100" icon={<Target className="h-5 w-5" />} accent="emerald" trend={6} trendLabel="across 8 skills" delay={0.1} />
        <KpiCard label="Growth Score" value={portfolioStats.growthScore} suffix="/100" icon={<TrendingUp className="h-5 w-5" />} accent="cyan" trend={4} trendLabel="vs last year" delay={0.15} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'showcase' as Tab, label: 'Achievement Showcase', icon: <Trophy className="h-3.5 w-3.5" /> },
          { id: 'skills' as Tab, label: 'Skills & Aptitude', icon: <Target className="h-3.5 w-3.5" /> },
          { id: 'journey' as Tab, label: 'Growth Journey', icon: <TrendingUp className="h-3.5 w-3.5" /> },
          { id: 'activities' as Tab, label: 'Extracurriculars', icon: <Palette className="h-3.5 w-3.5" /> },
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
        {tab === 'showcase' && <ShowcaseTab onSelect={setSelected} />}
        {tab === 'skills' && <SkillsTab />}
        {tab === 'journey' && <JourneyTab />}
        {tab === 'activities' && <ActivitiesTab />}
      </AnimatePresence>

      {/* Achievement detail modal */}
      <AnimatePresence>
        {selected && <AchievementModal selected={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  )
}
