'use client'

import { motion } from 'framer-motion'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { ChartCard, AreaTrend, ProgressBar, RadialGauge } from '@/components/shared/charts'
import { reviewCycles, reviewStats } from '@/lib/mock/reviews'

export function OverviewTab({ scorePct }: { scorePct: number }) {
  return (
    <motion.div key="ov" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Score trend */}
      <ChartCard title="Performance Trend" subtitle="Across review cycles" className="lg:col-span-2">
        <AreaTrend data={reviewStats.scoreTrend} xKey="cycle" yKey="score" color="oklch(0.65 0.16 75)" height={240} gradientId="reviewGrad" />
      </ChartCard>
      {/* Overall gauge */}
      <GlassCard className="p-3 sm:p-4 lg:p-5 flex flex-col items-center justify-center">
        <h3 className="font-semibold text-sm mb-3 self-start">Overall Rating</h3>
        <RadialGauge value={scorePct} label="of max score" size={170} color="oklch(0.65 0.16 75)" />
        <p className="text-xs text-muted-foreground mt-3 text-center">Consistent improvement over 4 cycles</p>
      </GlassCard>

      {/* Category scores */}
      <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
        <h3 className="font-semibold text-sm mb-4">Category-wise Scores</h3>
        <div className="space-y-3">
          {reviewStats.categoryScores.map((c, i) => (
            <motion.div key={c.category} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium">{c.category}</span>
                <span className="text-muted-foreground tabular-nums">{c.score.toFixed(1)} / 5.0</span>
              </div>
              <ProgressBar value={c.score} max={5} color={c.score >= 4.5 ? 'oklch(0.55 0.14 162)' : c.score >= 4 ? 'oklch(0.65 0.16 75)' : 'oklch(0.62 0.2 25)'} height={7} />
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Review cycles */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4">Review Cycles</h3>
        <div className="space-y-2.5">
          {reviewCycles.map((rc, i) => (
            <motion.div key={rc.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="rounded-xl border border-border bg-card/40 p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs font-semibold truncate">{rc.name}</p>
                <StatusBadge status={rc.status} variant={rc.status === 'Active' ? 'success' : rc.status === 'Completed' ? 'neutral' : 'info'} />
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">{rc.period}</p>
              {rc.status !== 'Upcoming' && (
                <div className="flex items-center gap-2">
                  <ProgressBar value={rc.completed} max={rc.participants} color="oklch(0.65 0.16 75)" height={4} />
                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{rc.completed}/{rc.participants}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  )
}
