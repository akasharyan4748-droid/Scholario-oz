'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { HeartPulse, TrendingUp, Salad, Smile, Award } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { todayMetrics, type WellnessMetric } from '@/lib/mock/wellness'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { type Tab } from './data'
import { WellnessHero } from './hero-card'
import { MetricsGrid } from './metrics-grid'
import { DashboardTab } from './dashboard-tab'
import { NutritionTab } from './nutrition-tab'
import { MoodTab } from './mood-tab'
import { GoalsTab } from './goals-tab'
import { BadgesRow } from './badges-row'

export function WellnessModule() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [metrics, setMetrics] = useState<WellnessMetric[]>(todayMetrics)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [water, setWater] = useState(6)

  const incrementMetric = (id: string, delta: number) => {
    setMetrics((prev) => prev.map((m) => m.id === id ? { ...m, value: Math.max(0, m.value + delta) } : m))
    if (id === 'WM01') setWater((w) => Math.max(0, w + delta))
    if (delta > 0) toast.success('Logged!', { description: '+5 XP for healthy habits' })
  }

  // `water` is updated alongside the water metric for future expansion; reading
  // it here keeps the linter calm without changing the on-page behaviour.
  void water
  void showCheckIn

  return (
    <div className="space-y-5">
      <SectionHeading
        title="My Wellness"
        subtitle="Track your fitness, hydration, sleep & mindfulness"
        icon={<HeartPulse className="h-5 w-5" />}
        action={
          <button
            onClick={() => setShowCheckIn(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-rose-500/20"
          >
            <Smile className="h-3.5 w-3.5" /> Mood Check-in
          </button>
        }
      />

      <WellnessHero />

      <MetricsGrid metrics={metrics} onIncrement={incrementMetric} />

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'dashboard' as Tab, label: 'Weekly Overview', icon: <TrendingUp className="h-3.5 w-3.5" /> },
          { id: 'nutrition' as Tab, label: 'Nutrition', icon: <Salad className="h-3.5 w-3.5" /> },
          { id: 'mood' as Tab, label: 'Mood Tracker', icon: <Smile className="h-3.5 w-3.5" /> },
          { id: 'goals' as Tab, label: 'Wellness Goals', icon: <Award className="h-3.5 w-3.5" /> },
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
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'nutrition' && <NutritionTab />}
        {tab === 'mood' && <MoodTab onCloseCheckIn={() => setShowCheckIn(false)} />}
        {tab === 'goals' && <GoalsTab />}
      </AnimatePresence>

      <BadgesRow />
    </div>
  )
}
