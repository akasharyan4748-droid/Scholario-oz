'use client'

import { motion } from 'framer-motion'
import { GlassCard, } from '@/components/shared/ui'
import { ChartCard, BarTrend, ProgressBar, RadialGauge } from '@/components/shared/charts'
import { skillRadar, portfolioStats } from '@/lib/mock/portfolio'

export function SkillsTab() {
  return (
    <motion.div key="sk" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <GlassCard className="p-3 sm:p-4 lg:p-5 flex flex-col items-center">
        <h3 className="font-semibold text-sm mb-3 self-start">Overall Skill Score</h3>
        <RadialGauge value={portfolioStats.skillsAvg} label="avg score" size={170} color="oklch(0.6 0.2 300)" />
        <p className="text-xs text-muted-foreground mt-3 text-center">Consistent performer across all subjects</p>
      </GlassCard>

      <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
        <h3 className="font-semibold text-sm mb-4">Subject-wise Skills</h3>
        <div className="space-y-3">
          {skillRadar.map((s, i) => (
            <motion.div key={s.skill} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium">{s.skill}</span>
                <span className="text-muted-foreground tabular-nums">{s.score}/{s.max}</span>
              </div>
              <ProgressBar value={s.score} max={s.max} color={s.score >= 90 ? 'oklch(0.55 0.14 162)' : s.score >= 85 ? 'oklch(0.65 0.16 75)' : 'oklch(0.6 0.18 300)'} height={7} />
            </motion.div>
          ))}
        </div>
      </GlassCard>

      <ChartCard title="Subject Performance Trend" subtitle="Across unit tests" className="lg:col-span-3">
        <BarTrend
          data={portfolioStats.subjectPerformance.map((s) => ({ name: s.subject, ut1: s.ut1, ut2: s.ut2, ut3: s.ut3 }))}
          xKey="name" yKey="ut3" color="oklch(0.6 0.2 300)" height={220}
        />
      </ChartCard>
    </motion.div>
  )
}
