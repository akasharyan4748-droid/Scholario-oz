'use client'

import { motion } from 'framer-motion'
import { ChartCard, BarTrend, RadialGauge } from '@/components/shared/charts'
import { GlassCard } from '@/components/shared/ui'
import { weeklyWellness, wellnessStats } from '@/lib/mock/wellness'

export function DashboardTab() {
  return (
    <motion.div key="db" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <ChartCard title="Weekly Steps" subtitle="Daily step count" className="lg:col-span-2">
        <BarTrend data={weeklyWellness} xKey="day" yKey="steps" color="oklch(0.55 0.14 162)" height={240} />
      </ChartCard>
      <GlassCard className="p-3 sm:p-4 lg:p-5 flex flex-col items-center">
        <h3 className="font-semibold text-sm mb-3 self-start">Weekly Sleep Avg</h3>
        <RadialGauge value={Math.round((wellnessStats.weeklyAvg.sleep / 10) * 100)} label={`${wellnessStats.weeklyAvg.sleep}h avg`} size={150} color="oklch(0.6 0.18 300)" />
        <div className="grid grid-cols-2 gap-2 w-full mt-4">
          <div className="rounded-lg bg-emerald-500/10 py-2 text-center">
            <p className="font-display text-lg font-bold text-emerald-600">{wellnessStats.weeklyAvg.water}</p>
            <p className="text-[10px] text-muted-foreground">glasses/day</p>
          </div>
          <div className="rounded-lg bg-amber-500/10 py-2 text-center">
            <p className="font-display text-lg font-bold text-amber-600">{wellnessStats.weeklyAvg.active}</p>
            <p className="text-[10px] text-muted-foreground">active min</p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}
