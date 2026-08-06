'use client'

import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { cn } from '@/lib/utils'

interface WeekScore {
  week: string
  score: number
  color: string
}

const weekScores: WeekScore[] = [
  { week: 'W1', score: 82, color: 'bg-violet-400' },
  { week: 'W2', score: 85, color: 'bg-violet-500' },
  { week: 'W3', score: 79, color: 'bg-rose-400' },
  { week: 'W4', score: 88, color: 'bg-violet-500' },
  { week: 'W5', score: 90, color: 'bg-violet-600' },
  { week: 'W6', score: 91, color: 'bg-emerald-500' },
]

export function PerformanceTrend() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassCard className="relative overflow-hidden p-4 sm:p-5">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-500/5 blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-display text-sm sm:text-base font-bold tracking-tight">Weekly Performance Trend</h3>
              <p className="text-[11px] text-muted-foreground">Your scores across the last 6 weeks</p>
            </div>
          </div>
          <StatusBadge status="Improving" variant="success" dot />
        </div>

        {/* Mini bar chart */}
        <div className="relative">
          <div className="flex items-end gap-2 sm:gap-3 h-28">
            {weekScores.map((w, i) => (
              <motion.div
                key={w.week}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${w.score}%`, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 flex flex-col items-center gap-1.5 group"
              >
                <div className="relative w-full flex items-end justify-center" style={{ height: '96px' }}>
                  <div className={cn('w-full max-w-8 rounded-t-lg rounded-b-sm transition-colors group-hover:opacity-90', w.color)} style={{ height: `${w.score}%` }}>
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity">{w.score}%</span>
                  </div>
                </div>
                <span className={cn('text-[10px] font-mono', i === 5 ? 'text-emerald-600 font-bold' : 'text-muted-foreground')}>{w.week}</span>
              </motion.div>
            ))}
          </div>
          {/* Average line indicator */}
          <div className="absolute left-0 right-0 border-t border-dashed border-muted-foreground/30" style={{ top: '14px' }}>
            <span className="absolute -top-4 right-0 text-[8px] text-muted-foreground font-mono bg-card/80 px-1 rounded">Avg: 86%</span>
          </div>
        </div>

        {/* Summary */}
        <div className="relative mt-3 pt-3 border-t border-border grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="font-display text-base font-bold text-emerald-600">+9%</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Growth</p>
          </div>
          <div>
            <p className="font-display text-base font-bold text-violet-600">91%</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Latest</p>
          </div>
          <div>
            <p className="font-display text-base font-bold text-amber-600">79%</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Lowest</p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}
