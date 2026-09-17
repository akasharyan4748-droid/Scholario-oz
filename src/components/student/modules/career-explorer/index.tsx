'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Compass, Rocket, TrendingUp, Target, Sparkles, Bookmark, GraduationCap } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartCard, BarTrend } from '@/components/shared/charts'
import { careerStats, type CareerPath } from '@/lib/mock/career'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { type Tab } from './shared'
import { ExploreTab } from './explore-tab'
import { StreamsTab } from './streams-tab'
import { RoadmapTab } from './roadmap-tab'
import { CareerDetailModal } from './career-detail-modal'

export function CareerExplorerModule() {
  const [tab, setTab] = useState<Tab>('explore')
  const [selected, setSelected] = useState<CareerPath | null>(null)
  const [saved, setSaved] = useState<Set<string>>(new Set(['CP01', 'CP04']))

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        toast.info('Removed from saved')
      } else {
        next.add(id)
        toast.success('Career saved! 🔖', { description: 'Added to your wishlist' })
      }
      return next
    })
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Career Explorer"
        subtitle="Discover careers, explore streams & plan your future"
        icon={<Compass className="h-5 w-5" />}
        action={
          <button
            onClick={() => toast.success('Counselor session booked', { description: `Next: ${careerStats.nextSession}` })}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/20"
          >
            <Sparkles className="h-3.5 w-3.5" /> Book Counselor
          </button>
        }
      />

      {/* Hero aptitude card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 text-white shadow-premium-lg"
      >
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/20 blur-md animate-pulse" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur ring-4 ring-white/30">
                <Rocket className="h-9 w-9" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-violet-50 text-xs font-medium mb-1">
                <Target className="h-3.5 w-3.5 text-amber-300" /> Recommended Stream
              </div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight">{careerStats.streamRecommendation}</h2>
              <p className="text-violet-50/90 text-sm mt-0.5">Aptitude score: {careerStats.aptitudeScore}/100 · {careerStats.confidenceLevel}% confident</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl bg-white/10 backdrop-blur px-5 py-3 text-center">
              <p className="text-2xl font-bold">{careerStats.careersExplored}</p>
              <p className="text-[11px] text-violet-50">Explored</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur px-5 py-3 text-center">
              <p className="text-2xl font-bold">{saved.size}</p>
              <p className="text-[11px] text-violet-50">Saved</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Careers Explored" value={careerStats.careersExplored} icon={<Compass className="h-5 w-5" />} accent="violet" trend={4} trendLabel="this month" delay={0} />
        <KpiCard label="Saved Careers" value={saved.size} icon={<Bookmark className="h-5 w-5" />} accent="amber" trendLabel="your wishlist" delay={0.05} />
        <KpiCard label="Aptitude Score" value={careerStats.aptitudeScore} suffix="/100" icon={<Target className="h-5 w-5" />} accent="emerald" trend={6} trendLabel="strong match" delay={0.1} />
        <KpiCard label="Confidence" value={careerStats.confidenceLevel} suffix="%" icon={<TrendingUp className="h-5 w-5" />} accent="cyan" trend={8} trendLabel="growing!" delay={0.15} />
      </div>

      {/* Interest areas chart */}
      <ChartCard title="Your Interest Areas" subtitle="Based on aptitude test & activities">
        <BarTrend data={careerStats.interestAreas} xKey="name" yKey="value" color="oklch(0.6 0.2 300)" height={200} horizontal />
      </ChartCard>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'explore' as Tab, label: 'Explore Careers', icon: <Compass className="h-3.5 w-3.5" /> },
          { id: 'streams' as Tab, label: 'Stream Guidance', icon: <GraduationCap className="h-3.5 w-3.5" /> },
          { id: 'roadmap' as Tab, label: 'My Roadmap', icon: <Rocket className="h-3.5 w-3.5" /> },
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
        {tab === 'explore' && (
          <ExploreTab saved={saved} onToggleSave={toggleSave} onSelect={setSelected} />
        )}

        {tab === 'streams' && <StreamsTab />}

        {tab === 'roadmap' && <RoadmapTab />}
      </AnimatePresence>

      {/* Career detail modal */}
      <AnimatePresence>
        {selected && (
          <CareerDetailModal
            selected={selected}
            saved={saved}
            onToggleSave={toggleSave}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
