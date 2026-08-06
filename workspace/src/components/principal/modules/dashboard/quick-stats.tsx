'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Zap, Sparkles } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { MiniLine } from '@/components/shared/charts'
import { cn } from '@/lib/utils'
import { weeklyTrends } from './data'

// Quick Stats — Week-over-Week Trends Widget.
// Renders 4 trend cards (Attendance Rate, Fee Collected, Homework Submitted,
// Late Arrivals) each with a delta pill and a 4-point sparkline.
export function QuickStats() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassCard className="relative overflow-hidden p-4 sm:p-5 lg:p-6">
        {/* Decorative gradient header */}
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
                Quick Stats
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  WoW
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Week-over-week deltas · last 4 weeks
              </p>
            </div>
          </div>
          <StatusBadge status="3 of 4 trending positive" variant="success" dot />
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {weeklyTrends.map((t, i) => {
            const delta = t.thisWeek - t.lastWeek
            const pct = t.lastWeek === 0 ? 0 : (delta / Math.abs(t.lastWeek)) * 100
            const isGood = t.invertTrend ? delta <= 0 : delta >= 0
            const TrendIcon = delta >= 0 ? TrendingUp : TrendingDown
            return (
              <motion.div
                key={t.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                className="group relative rounded-2xl border border-border bg-card/50 p-4 hover:shadow-premium hover:border-primary/30 transition-all overflow-hidden"
              >
                {/* accent left bar */}
                <div
                  className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
                  style={{ background: t.color }}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `color-mix(in oklch, ${t.color} 12%, transparent)`, color: t.color }}
                    >
                      {t.icon}
                    </span>
                    <span className="leading-tight">{t.label}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-end justify-between gap-2">
                  <div>
                    <p className="font-display text-xl sm:text-2xl font-bold tracking-tight">
                      {t.thisWeek < 10 && t.label !== 'Fee Collected' ? t.thisWeek : t.thisWeek.toFixed(t.label === 'Attendance Rate' ? 1 : 0)}
                      {t.label === 'Attendance Rate' && <span className="text-base text-muted-foreground">%</span>}
                      {t.label === 'Fee Collected' && <span className="text-base text-muted-foreground">L</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">prev: {t.lastWeek}{t.label === 'Attendance Rate' ? '%' : t.label === 'Fee Collected' ? 'L' : ''}</p>
                  </div>
                  <div
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                      isGood ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    )}
                  >
                    <TrendIcon className="h-3 w-3" />
                    {Math.abs(pct).toFixed(1)}%
                  </div>
                </div>
                {/* Sparkline */}
                <div className="mt-3 -mx-1 h-8 opacity-80">
                  <MiniLine data={t.history} xKey="w" yKey="v" color={t.color} height={32} />
                </div>
              </motion.div>
            )
          })}
        </div>
      </GlassCard>
    </motion.div>
  )
}
